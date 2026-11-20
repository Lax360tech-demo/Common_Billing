import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from app.core.database import get_database
from app.core.security import get_current_user
from app.models.schemas import PurchaseCreateRequest

router = APIRouter(prefix="/purchases", tags=["Purchase Management"])

@router.get("")
def list_purchases(
    search: Optional[str] = None,
    supplier_id: Optional[str] = None,
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
            {"purchase_number": search_regex},
            {"supplier_invoice_no": search_regex},
            {"supplier_name": search_regex}
        ]

    if supplier_id:
        query["supplier_id"] = supplier_id

    if start_date and end_date:
        query["purchase_date"] = {"$gte": start_date, "$lte": end_date}

    total = db.purchases.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.purchases.find(query).sort("created_at", -1).skip(skip).limit(limit)

    items = list(cursor)
    for it in items:
        it.pop("_id", None)

    return {"items": items, "total": total, "page": page, "limit": limit}

@router.get("/{purchase_id}")
def get_purchase(purchase_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    p = db.purchases.find_one({"business_id": current_user["business_id"], "$or": [{"id": purchase_id}, {"purchase_number": purchase_id}]})
    if not p:
        raise HTTPException(status_code=404, detail="Purchase entry not found")
    p.pop("_id", None)
    return p

@router.post("")
def record_purchase(payload: PurchaseCreateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    business_id = current_user["business_id"]

    supplier = db.suppliers.find_one({"business_id": business_id, "id": payload.supplier_id})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    purchase_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc)
    now_iso = now.isoformat()
    current_year = now.year

    # Sequential purchase number
    counter_id = f"po_seq_{business_id}_{current_year}"
    counter = db.counters.find_one_and_update(
        {"_id": counter_id},
        {"$inc": {"seq": 1}},
        upsert=True,
        return_document=True
    )
    seq = counter.get("seq", 1)
    purchase_number = f"PO-{current_year}-{seq:04d}"

    # Calculate item totals & inward stock
    total_taxable = 0.0
    total_tax = 0.0
    total_amount = 0.0
    processed_items = []

    for item in payload.items:
        qty = float(item.quantity)
        cost = float(item.unit_cost)
        tax_pct = float(item.tax_rate)

        line_taxable = qty * cost
        tax_amt = line_taxable * (tax_pct / 100.0)
        line_total = line_taxable + tax_amt

        total_taxable += line_taxable
        total_tax += tax_amt
        total_amount += line_total

        processed_items.append({
            "product_id": item.product_id,
            "name": item.name,
            "quantity": qty,
            "unit": item.unit or "pcs",
            "unit_cost": cost,
            "tax_rate": tax_pct,
            "tax_amount": round(tax_amt, 2),
            "line_total": round(line_total, 2),
            "batch_number": item.batch_number or "",
            "expiry_date": item.expiry_date or ""
        })

        # Automatic Inventory Replenishment!
        if item.product_id:
            db.products.update_one(
                {"business_id": business_id, "id": item.product_id},
                {
                    "$inc": {"stock": qty},
                    "$set": {"purchase_price": cost, "updated_at": now_iso}
                }
            )
            # Record inward stock movement
            db.stock_movements.insert_one({
                "id": str(uuid.uuid4()),
                "business_id": business_id,
                "product_id": item.product_id,
                "product_name": item.name,
                "movement_type": "PURCHASE_INWARD",
                "quantity": qty,
                "reference_id": purchase_id,
                "reference_no": purchase_number,
                "reason": f"Inward stock via Purchase Bill {purchase_number}",
                "created_at": now_iso
            })

    total_amount = round(total_amount, 2)
    paid = round(float(payload.paid_amount), 2)
    balance_due = round(max(0.0, total_amount - paid), 2)
    payment_status = "Paid" if balance_due <= 0.0 else ("Partial" if paid > 0.0 else "Unpaid")

    doc = {
        "id": purchase_id,
        "business_id": business_id,
        "purchase_number": purchase_number,
        "supplier_id": payload.supplier_id,
        "supplier_name": supplier["name"],
        "supplier_invoice_no": payload.supplier_invoice_no or "",
        "purchase_date": payload.purchase_date or now.strftime("%Y-%m-%d"),
        "items": processed_items,
        "taxable_amount": round(total_taxable, 2),
        "tax_amount": round(total_tax, 2),
        "total_amount": total_amount,
        "paid_amount": paid,
        "balance_due": balance_due,
        "payment_method": payload.payment_method,
        "payment_status": payment_status,
        "notes": payload.notes or "",
        "created_at": now_iso
    }
    db.purchases.insert_one(doc)

    # Update supplier ledger
    db.suppliers.update_one(
        {"business_id": business_id, "id": payload.supplier_id},
        {
            "$inc": {"total_purchases": total_amount, "outstanding_payables": balance_due},
            "$set": {"last_purchase_date": doc["purchase_date"]}
        }
    )

    doc.pop("_id", None)
    return doc
