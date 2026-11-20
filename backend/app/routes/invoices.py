import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query, Response
from app.core.database import get_database
from app.core.security import get_current_user
from app.models.schemas import InvoiceCreateRequest

router = APIRouter(prefix="/invoices", tags=["Invoicing & POS Billing"])

@router.get("")
def list_invoices(
    search: Optional[str] = None,
    status: Optional[str] = None,
    payment_method: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    business_id = current_user["business_id"]
    query = {"business_id": business_id}

    if search:
        search_regex = {"$regex": search.strip(), "$options": "i"}
        query["$or"] = [
            {"invoice_number": search_regex},
            {"customer.name": search_regex},
            {"customer.phone": search_regex}
        ]

    if status and status != "All":
        query["status"] = status

    if payment_method and payment_method != "All":
        query["payment_method"] = payment_method

    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    elif start_date:
        query["date"] = {"$gte": start_date}

    total = db.invoices.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.invoices.find(query).sort("created_at", -1).skip(skip).limit(limit)

    items = list(cursor)
    for it in items:
        it.pop("_id", None)

    return {"items": items, "total": total, "page": page, "limit": limit}

@router.get("/{invoice_id}")
def get_invoice(invoice_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    invoice = db.invoices.find_one({"business_id": current_user["business_id"], "$or": [{"id": invoice_id}, {"invoice_number": invoice_id}]})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    invoice.pop("_id", None)
    return invoice

@router.post("")
def create_invoice(payload: InvoiceCreateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    business_id = current_user["business_id"]
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    date_str = now.strftime("%Y-%m-%d")
    time_str = now.strftime("%H:%M:%S")
    invoice_id = str(uuid.uuid4())

    # Fetch business settings for invoice prefix & numbering
    settings_doc = db.business_settings.find_one({"business_id": business_id}) or {}
    billing_cfg = settings_doc.get("billing", {})
    prefix = billing_cfg.get("invoice_prefix", "LAX-2026-")

    # Atomic Sequence Generation
    counter_id = f"invoice_seq_{business_id}"
    counter = db.counters.find_one_and_update(
        {"_id": counter_id},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    # Default start at 1001
    seq_number = 1000 + counter.get("seq", 1)
    invoice_number = f"{prefix}{seq_number:04d}"

    # Calculate item totals, taxes, and stock decrements
    subtotal = 0.0
    total_tax = 0.0
    total_cgst = 0.0
    total_sgst = 0.0
    total_igst = 0.0
    total_discount = 0.0
    processed_items = []

    for item in payload.items:
        qty = float(item.quantity)
        price = float(item.unit_price)
        disc_pct = float(item.discount_percent)
        tax_pct = float(item.tax_rate)

        line_gross = qty * price
        item_disc = line_gross * (disc_pct / 100.0)
        line_taxable = line_gross - item_disc

        if payload.pricing_mode == "inclusive":
            # Price includes GST
            tax_amount = line_taxable - (line_taxable / (1.0 + (tax_pct / 100.0)))
            taxable_amount = line_taxable - tax_amount
            line_total = line_taxable
        else:
            # Price excludes GST
            taxable_amount = line_taxable
            tax_amount = line_taxable * (tax_pct / 100.0)
            line_total = taxable_amount + tax_amount

        cgst = tax_amount / 2.0
        sgst = tax_amount / 2.0
        igst = 0.0

        subtotal += taxable_amount
        total_tax += tax_amount
        total_cgst += cgst
        total_sgst += sgst
        total_discount += item_disc

        processed_items.append({
            "product_id": item.product_id,
            "name": item.name,
            "code": item.code or "",
            "barcode": item.barcode or "",
            "unit": item.unit or "pcs",
            "quantity": qty,
            "unit_price": round(price, 2),
            "discount_percent": disc_pct,
            "discount_amount": round(item_disc, 2),
            "tax_rate": tax_pct,
            "taxable_amount": round(taxable_amount, 2),
            "tax_amount": round(tax_amount, 2),
            "cgst": round(cgst, 2),
            "sgst": round(sgst, 2),
            "igst": round(igst, 2),
            "hsn": item.hsn or "",
            "line_total": round(line_total, 2),
            "attributes": item.attributes or {}
        })

        # Decrement stock in database
        if item.product_id:
            db.products.update_one(
                {"business_id": business_id, "id": item.product_id},
                {"$inc": {"stock": -qty}}
            )
            # Log stock movement
            db.stock_movements.insert_one({
                "id": str(uuid.uuid4()),
                "business_id": business_id,
                "product_id": item.product_id,
                "product_name": item.name,
                "movement_type": "SALE_OUTWARD",
                "quantity": qty,
                "reference_id": invoice_id,
                "reference_no": invoice_number,
                "reason": f"POS Sale Invoice #{invoice_number}",
                "created_at": now_iso
            })

    # Cart level discount
    cart_disc = float(payload.cart_discount_amount)
    if payload.cart_discount_percent > 0:
        cart_disc += (subtotal * (float(payload.cart_discount_percent) / 100.0))
    total_discount += cart_disc

    grand_total = subtotal + total_tax - cart_disc + float(payload.round_off)
    grand_total = round(max(0.0, grand_total), 2)
    paid = round(float(payload.paid_amount), 2)
    balance_due = round(max(0.0, grand_total - paid), 2)

    payment_status = "Paid" if balance_due <= 0.0 else ("Partial" if paid > 0 else "Pending")

    # Fetch store details for receipt header
    business_doc = db.businesses.find_one({"id": business_id}) or {}

    invoice_doc = {
        "id": invoice_id,
        "business_id": business_id,
        "invoice_number": invoice_number,
        "date": date_str,
        "time": time_str,
        "cashier_name": current_user.get("name", "Store Staff"),
        "business_info": {
            "name": business_doc.get("name", "Lax360 Store"),
            "category": business_doc.get("category_name", "Universal Store"),
            "address": business_doc.get("address", ""),
            "phone": business_doc.get("phone", ""),
            "email": business_doc.get("email", ""),
            "gstin": business_doc.get("gstin", ""),
            "currency": business_doc.get("currency", "₹")
        },
        "customer": payload.customer or {"name": "Walk-in Customer", "phone": "", "gstin": "", "address": ""},
        "items": processed_items,
        "item_count": len(processed_items),
        "total_quantity": sum(it["quantity"] for it in processed_items),
        "subtotal": round(subtotal, 2),
        "tax_amount": round(total_tax, 2),
        "cgst": round(total_cgst, 2),
        "sgst": round(total_sgst, 2),
        "igst": round(total_igst, 2),
        "discount_amount": round(total_discount, 2),
        "round_off": round(payload.round_off, 2),
        "grand_total": grand_total,
        "paid_amount": paid,
        "balance_due": balance_due,
        "payment_method": payload.payment_method,
        "split_details": payload.split_details or {},
        "payment_status": payment_status,
        "status": "completed",
        "notes": payload.notes or "",
        "created_at": now_iso
    }
    db.invoices.insert_one(invoice_doc)

    # Customer updates (Ledger & balance)
    customer_data = payload.customer
    if customer_data and customer_data.get("phone"):
        c_phone = customer_data["phone"].strip()
        cust = db.customers.find_one({"business_id": business_id, "phone": c_phone})
        if cust:
            db.customers.update_one(
                {"business_id": business_id, "phone": c_phone},
                {
                    "$inc": {"total_purchases": grand_total, "outstanding_balance": balance_due},
                    "$set": {"last_visit": date_str}
                }
            )
        else:
            db.customers.insert_one({
                "id": str(uuid.uuid4()),
                "business_id": business_id,
                "name": customer_data.get("name") or "Walk-in Customer",
                "phone": c_phone,
                "email": customer_data.get("email") or "",
                "address": customer_data.get("address") or "",
                "gstin": customer_data.get("gstin") or "",
                "total_purchases": grand_total,
                "outstanding_balance": balance_due,
                "last_visit": date_str,
                "created_at": now_iso
            })

    invoice_doc.pop("_id", None)
    return invoice_doc

@router.get("/{invoice_id}/pdf")
def download_invoice_pdf(invoice_id: str, current_user: dict = Depends(get_current_user)):
    from app.services.pdf_service import generate_invoice_pdf
    db = get_database()
    invoice = db.invoices.find_one({"business_id": current_user["business_id"], "$or": [{"id": invoice_id}, {"invoice_number": invoice_id}]})
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    
    pdf_bytes = generate_invoice_pdf(invoice)
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=Invoice_{invoice['invoice_number']}.pdf"}
    )
