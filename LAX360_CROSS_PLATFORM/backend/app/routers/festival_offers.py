from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from app.schemas.coupon import (
    FestivalOfferCreate, FestivalOfferUpdate, FestivalOfferResponse
)
from app.core.security import get_current_user_payload
from app.database.mongodb import db_manager
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/festival-offers", tags=["Festival Offers"])

@router.get("", response_model=List[FestivalOfferResponse])
async def list_festival_offers(token_payload: dict = Depends(get_current_user_payload)):
    store_id = token_payload.get("store_id", "6afe8821f89f056877145cb7")
    festivals_col = db_manager.get_collection("festival_offers")
    docs = await festivals_col.find({"store_id": store_id})
    if not docs:
        docs = await festivals_col.find()

    results = []
    for doc in docs:
        doc["id"] = str(doc.get("_id") or doc.get("id"))
        results.append(FestivalOfferResponse(**doc))
    return results

@router.post("", response_model=FestivalOfferResponse)
async def create_festival_offer(
    payload: FestivalOfferCreate,
    token_payload: dict = Depends(get_current_user_payload)
):
    store_id = token_payload.get("store_id", "6afe8821f89f056877145cb7")
    festivals_col = db_manager.get_collection("festival_offers")
    
    f_id = f"fest-{uuid.uuid4().hex[:8]}"
    doc = {
        "_id": f_id,
        "id": f_id,
        "store_id": store_id,
        "festival_name": payload.festival_name,
        "description": payload.description or "",
        "discount_type": payload.discount_type,
        "discount_value": float(payload.discount_value),
        "min_bill_amount": float(payload.min_bill_amount or 0.0),
        "max_discount": float(payload.max_discount or 0.0),
        "start_date": payload.start_date,
        "end_date": payload.end_date,
        "applicable_categories": payload.applicable_categories or [],
        "priority": payload.priority or 1,
        "active": payload.active if payload.active is not None else True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await festivals_col.insert_one(doc)
    return FestivalOfferResponse(**doc)

@router.get("/active-check")
async def get_active_festival_offer(token_payload: dict = Depends(get_current_user_payload)):
    festivals_col = db_manager.get_collection("festival_offers")
    now_date = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    offers = await festivals_col.find({"active": True})
    
    for off in sorted(offers, key=lambda x: int(x.get("priority", 1))):
        start = str(off.get("start_date", ""))
        end = str(off.get("end_date", ""))
        if start <= now_date <= end:
            off["id"] = str(off.get("_id") or off.get("id"))
            return {"active": True, "offer": off}
            
    return {"active": False, "offer": None}

@router.put("/{offer_id}", response_model=FestivalOfferResponse)
async def update_festival_offer(
    offer_id: str,
    payload: FestivalOfferUpdate,
    token_payload: dict = Depends(get_current_user_payload)
):
    festivals_col = db_manager.get_collection("festival_offers")
    doc = await festivals_col.find_one({"id": offer_id})
    if not doc:
        doc = await festivals_col.find_one({"_id": offer_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Festival offer not found")
        
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    await festivals_col.update_one({"_id": doc["_id"]}, {"$set": update_data})
    doc.update(update_data)
    doc["id"] = str(doc.get("_id") or doc.get("id"))
    return FestivalOfferResponse(**doc)

@router.delete("/{offer_id}")
async def delete_festival_offer(offer_id: str, token_payload: dict = Depends(get_current_user_payload)):
    festivals_col = db_manager.get_collection("festival_offers")
    deleted = await festivals_col.delete_one({"id": offer_id})
    if not deleted:
        deleted = await festivals_col.delete_one({"_id": offer_id})
    if not deleted:
        raise HTTPException(status_code=404, detail="Festival offer not found")
    return {"message": "Festival offer removed successfully", "id": offer_id}
