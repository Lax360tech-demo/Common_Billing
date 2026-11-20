from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.schemas.coupon import (
    CouponCreate, CouponUpdate, CouponResponse, CouponValidateRequest
)
from app.core.security import get_current_user_payload
from app.database.mongodb import db_manager
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/coupons", tags=["Coupons"])

@router.get("", response_model=List[CouponResponse])
async def list_coupons(
    active_only: Optional[bool] = Query(False),
    token_payload: dict = Depends(get_current_user_payload)
):
    store_id = token_payload.get("store_id", "6afe8821f89f056877145cb7")
    coupons_col = db_manager.get_collection("coupons")
    query = {"store_id": store_id}
    if active_only:
        query["active"] = True
    docs = await coupons_col.find(query)
    if not docs and not active_only:
        docs = await coupons_col.find()

    results = []
    for doc in docs:
        doc["id"] = str(doc.get("_id") or doc.get("id"))
        results.append(CouponResponse(**doc))
    return results

@router.post("", response_model=CouponResponse)
async def create_coupon(
    payload: CouponCreate,
    token_payload: dict = Depends(get_current_user_payload)
):
    store_id = token_payload.get("store_id", "6afe8821f89f056877145cb7")
    coupons_col = db_manager.get_collection("coupons")
    
    code = payload.code.strip().upper()
    existing = await coupons_col.find_one({"code": code, "store_id": store_id})
    if existing:
        raise HTTPException(status_code=400, detail="A coupon with this code already exists.")
        
    c_id = f"cpn-{uuid.uuid4().hex[:8]}"
    doc = {
        "_id": c_id,
        "id": c_id,
        "store_id": store_id,
        "code": code,
        "name": payload.name,
        "description": payload.description or "",
        "discount_type": payload.discount_type,
        "discount_value": float(payload.discount_value),
        "min_purchase": float(payload.min_purchase or payload.min_bill_amount or 0.0),
        "min_bill_amount": float(payload.min_purchase or payload.min_bill_amount or 0.0),
        "max_discount": float(payload.max_discount or payload.max_discount_amount or 0.0),
        "max_discount_amount": float(payload.max_discount or payload.max_discount_amount or 0.0),
        "start_date": payload.start_date or payload.valid_from,
        "expiry_date": payload.expiry_date or payload.valid_until or "2026-12-31",
        "valid_from": payload.start_date or payload.valid_from,
        "valid_until": payload.expiry_date or payload.valid_until or "2026-12-31",
        "usage_limit": payload.usage_limit or payload.max_uses or 100,
        "max_uses": payload.usage_limit or payload.max_uses or 100,
        "times_used": 0,
        "active": payload.active if payload.active is not None else True,
        "is_active": payload.is_active if payload.is_active is not None else True,
        "applicable_categories": payload.applicable_categories or [],
        "customer_id": payload.customer_id,
        "is_auto_generated": payload.is_auto_generated or False,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await coupons_col.insert_one(doc)
    return CouponResponse(**doc)

@router.post("/validate")
async def validate_coupon(
    payload: CouponValidateRequest,
    token_payload: dict = Depends(get_current_user_payload)
):
    coupons_col = db_manager.get_collection("coupons")
    code = payload.code.strip().upper()
    cpn = await coupons_col.find_one({"code": code, "active": True})
    if not cpn:
        return {"valid": False, "message": f"Coupon '{code}' is invalid or expired."}

    min_p = float(cpn.get("min_purchase") or cpn.get("min_bill_amount") or 0.0)
    if payload.cart_total < min_p:
        return {"valid": False, "message": f"Minimum bill amount of ₹{min_p} required for coupon '{code}'."}

    d_type = cpn.get("discount_type", "percent")
    d_val = float(cpn.get("discount_value") or 0.0)
    max_d = float(cpn.get("max_discount") or cpn.get("max_discount_amount") or 999999.0)

    if d_type == "percent":
        calc_discount = round(payload.cart_total * min(100.0, d_val) / 100.0, 2)
        if max_d > 0:
            calc_discount = min(calc_discount, max_d)
    else:
        calc_discount = min(payload.cart_total, d_val)

    return {
        "valid": True,
        "code": code,
        "discount_type": d_type,
        "discount_value": d_val,
        "discount_amount": calc_discount,
        "coupon": cpn
    }

@router.get("/redemptions")
async def list_redemptions(token_payload: dict = Depends(get_current_user_payload)):
    invoices_col = db_manager.get_collection("invoices")
    invoices = await invoices_col.find()
    redemptions = []
    for inv in invoices:
        if inv.get("applied_coupon"):
            redemptions.append({
                "invoiceNumber": inv.get("invoiceNumber"),
                "date": inv.get("date"),
                "coupon": inv.get("applied_coupon"),
                "customer": inv.get("customer")
            })
    return redemptions

@router.put("/{coupon_id}", response_model=CouponResponse)
async def update_coupon(
    coupon_id: str,
    payload: CouponUpdate,
    token_payload: dict = Depends(get_current_user_payload)
):
    coupons_col = db_manager.get_collection("coupons")
    doc = await coupons_col.find_one({"id": coupon_id})
    if not doc:
        doc = await coupons_col.find_one({"_id": coupon_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Coupon not found")
        
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    await coupons_col.update_one({"_id": doc["_id"]}, {"$set": update_data})
    doc.update(update_data)
    doc["id"] = str(doc.get("_id") or doc.get("id"))
    return CouponResponse(**doc)

@router.delete("/{coupon_id}")
async def delete_coupon(coupon_id: str, token_payload: dict = Depends(get_current_user_payload)):
    coupons_col = db_manager.get_collection("coupons")
    deleted = await coupons_col.delete_one({"id": coupon_id})
    if not deleted:
        deleted = await coupons_col.delete_one({"_id": coupon_id})
    if not deleted:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return {"message": "Coupon deleted successfully", "id": coupon_id}
