from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.schemas.invoice import InvoiceCreate, InvoiceResponse, InvoiceSummary, InvoicePayment
from app.core.security import get_current_user_payload
from app.database.mongodb import db_manager
from app.services.billing_service import (
    calculate_invoice_totals, validate_payment, generate_invoice_number, round_2
)
import uuid
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/invoices", tags=["Invoices"])

@router.get("", response_model=List[InvoiceResponse])
async def list_invoices(
    period: Optional[str] = Query("all"),
    search: Optional[str] = Query(None),
    token_payload: dict = Depends(get_current_user_payload)
):
    store_id = token_payload.get("store_id", "6afe8821f89f056877145cb7")
    invoices_col = db_manager.get_collection("invoices")
    docs = await invoices_col.find({"store_id": store_id})
    if not docs:
        docs = await invoices_col.find()

    results = []
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    yesterday_str = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    seven_days_ago = (now - timedelta(days=7)).isoformat()
    month_start = now.replace(day=1, hour=0, minute=0, second=0).isoformat()

    s_query = search.strip().lower() if search else None

    for doc in reversed(docs):
        inv_date = str(doc.get("date", ""))
        
        # Period filter
        if period == "today" and not inv_date.startswith(today_str):
            continue
        elif period == "yesterday" and not inv_date.startswith(yesterday_str):
            continue
        elif period == "7days" and inv_date < seven_days_ago:
            continue
        elif period == "month" and inv_date < month_start:
            continue

        if s_query:
            inv_num_m = s_query in str(doc.get("invoiceNumber", "")).lower()
            cust = doc.get("customer") or {}
            cust_name_m = s_query in str(cust.get("name", "")).lower()
            cust_phone_m = s_query in str(cust.get("phone", "")).lower()
            if not (inv_num_m or cust_name_m or cust_phone_m):
                continue

        doc["id"] = str(doc.get("_id") or doc.get("id"))
        results.append(InvoiceResponse(**doc))

    return results

@router.post("", response_model=InvoiceResponse)
async def create_invoice(
    payload: InvoiceCreate,
    token_payload: dict = Depends(get_current_user_payload)
):
    store_id = token_payload.get("store_id", "6afe8821f89f056877145cb7")
    invoices_col = db_manager.get_collection("invoices")
    settings_col = db_manager.get_collection("settings")
    customers_col = db_manager.get_collection("customers")
    coupons_col = db_manager.get_collection("coupons")
    festivals_col = db_manager.get_collection("festival_offers")

    # Fetch store settings
    store_settings = await settings_col.find_one({"store_id": store_id})
    if not store_settings:
        store_settings = await settings_col.find_one()
    billing_cfg = store_settings.get("billing", {}) if store_settings else {}

    prefix = billing_cfg.get("invoicePrefix", "TEX-2026-")
    seq = int(billing_cfg.get("nextSequence", 1001))
    pricing_mode = billing_cfg.get("pricingMode", "inclusive")
    is_inclusive = (pricing_mode == "inclusive")
    cashier_name = billing_cfg.get("cashierName", "Admin Manager")

    invoice_number = generate_invoice_number(prefix, seq)

    # Validate coupon if provided
    applied_coupon = None
    coupon_discount = 0.0
    if payload.coupon_code:
        cpn = await coupons_col.find_one({"code": payload.coupon_code.strip().upper(), "active": True})
        if cpn:
            applied_coupon = cpn
            d_type = cpn.get("discount_type", "percent")
            d_val = float(cpn.get("discount_value") or 0.0)
            max_d = float(cpn.get("max_discount") or cpn.get("max_discount_amount") or 999999.0)
            # Rough initial discount, will be bounded by totals
            if d_type == "percent":
                coupon_discount = max_d
            else:
                coupon_discount = d_val

    # Check active festival offer
    applied_festival = None
    festival_discount = 0.0
    active_fests = await festivals_col.find({"active": True})
    now_date_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    for f in active_fests:
        if str(f.get("start_date", "")) <= now_date_str <= str(f.get("end_date", "")):
            applied_festival = f
            f_type = f.get("discount_type", "percent")
            f_val = float(f.get("discount_value") or 0.0)
            f_max = float(f.get("max_discount") or 999999.0)
            if f_type == "percent":
                festival_discount = f_max
            else:
                festival_discount = f_val
            break

    # Calculate totals
    summary_data, processed_items = calculate_invoice_totals(
        items=payload.items,
        bill_discount=payload.billDiscount,
        inclusive=is_inclusive,
        coupon_discount=coupon_discount,
        festival_discount=festival_discount
    )

    # Validate payment
    payment_dict = payload.payment.model_dump()
    valid_pay, pay_err, pay_meta = validate_payment(summary_data["netPayable"], payment_dict)
    if not valid_pay:
        raise HTTPException(status_code=400, detail=pay_err)
    payment_dict.update(pay_meta)

    # Customer assignment
    cust_data = payload.customer
    if not cust_data or not cust_data.get("name"):
        cust_data = {
            "id": "walk-in",
            "name": "Walk-in Customer",
            "phone": "9840000000",
            "city": "Local",
            "state": "Tamil Nadu",
            "gstin": "",
            "address": ""
        }
    else:
        # Update customer in DB
        cust_phone = cust_data.get("phone")
        if cust_phone and cust_phone != "9840000000":
            c_doc = await customers_col.find_one({"phone": cust_phone})
            if c_doc:
                await customers_col.update_one(
                    {"_id": c_doc["_id"]},
                    {"$set": {
                        "totalPurchases": round_2(float(c_doc.get("totalPurchases") or 0.0) + summary_data["netPayable"]),
                        "totalBills": int(c_doc.get("totalBills") or 0) + 1,
                        "lastPurchaseDate": datetime.now(timezone.utc).isoformat()
                    }}
                )

    # Auto-generate loyalty coupon if threshold met
    generated_coupon = None
    if billing_cfg.get("enableAutoCoupons", True):
        threshold = float(billing_cfg.get("autoCouponThreshold") or 2000.0)
        disc_val = float(billing_cfg.get("autoCouponDiscount") or 100.0)
        min_p = float(billing_cfg.get("autoCouponMinPurchase") or 1000.0)
        if summary_data["netPayable"] >= threshold:
            auto_code = f"LOYAL-{uuid.uuid4().hex[:6].upper()}"
            gen_cpn_doc = {
                "_id": f"cpn-{auto_code.lower()}",
                "id": f"cpn-{auto_code.lower()}",
                "store_id": store_id,
                "code": auto_code,
                "name": "Loyalty Thank You Voucher",
                "description": f"₹{disc_val} off on your next visit (Min Bill: ₹{min_p})",
                "discount_type": "fixed",
                "discount_value": disc_val,
                "min_purchase": min_p,
                "min_bill_amount": min_p,
                "max_discount": disc_val,
                "max_discount_amount": disc_val,
                "expiry_date": (datetime.now(timezone.utc) + timedelta(days=60)).strftime("%Y-%m-%d"),
                "usage_limit": 1,
                "times_used": 0,
                "active": True,
                "is_active": True,
                "is_auto_generated": True,
                "customer_id": cust_data.get("id"),
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await coupons_col.insert_one(gen_cpn_doc)
            generated_coupon = gen_cpn_doc

    inv_id = f"inv-{uuid.uuid4().hex[:12]}"
    now_iso = datetime.now(timezone.utc).isoformat()

    invoice_doc = {
        "_id": inv_id,
        "id": inv_id,
        "store_id": store_id,
        "invoiceNumber": invoice_number,
        "date": now_iso,
        "customer": cust_data,
        "items": processed_items,
        "summary": summary_data,
        "payment": payment_dict,
        "applied_coupon": applied_coupon,
        "applied_festival": applied_festival,
        "generated_coupon": generated_coupon,
        "cashier": cashier_name,
        "notes": payload.notes or "",
        "status": "completed",
        "created_at": now_iso
    }

    await invoices_col.insert_one(invoice_doc)

    # Increment sequence
    if store_settings:
        await settings_col.update_one(
            {"_id": store_settings["_id"]},
            {"$set": {"billing.nextSequence": seq + 1}}
        )

    return InvoiceResponse(**invoice_doc)

@router.get("/{invoice_id}", response_model=InvoiceResponse)
async def get_invoice(invoice_id: str, token_payload: dict = Depends(get_current_user_payload)):
    invoices_col = db_manager.get_collection("invoices")
    doc = await invoices_col.find_one({"id": invoice_id})
    if not doc:
        doc = await invoices_col.find_one({"_id": invoice_id})
    if not doc:
        doc = await invoices_col.find_one({"invoiceNumber": invoice_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Invoice not found")
    doc["id"] = str(doc.get("_id") or doc.get("id"))
    return InvoiceResponse(**doc)
