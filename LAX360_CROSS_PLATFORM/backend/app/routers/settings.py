from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from app.schemas.settings import SettingsUpdate
from app.core.security import get_current_user_payload
from app.database.mongodb import db_manager
from app.database.seed_data import (
    DEFAULT_SETTINGS, load_seed_products, DEFAULT_COUPONS, DEFAULT_FESTIVALS
)
from datetime import datetime, timezone

router = APIRouter(prefix="/settings", tags=["Settings"])

@router.get("")
async def get_settings(token_payload: dict = Depends(get_current_user_payload)):
    store_id = token_payload.get("store_id", "6afe8821f89f056877145cb7")
    settings_col = db_manager.get_collection("settings")
    doc = await settings_col.find_one({"store_id": store_id})
    if not doc:
        doc = await settings_col.find_one()
    if not doc:
        doc = DEFAULT_SETTINGS
    doc["id"] = str(doc.get("_id") or doc.get("id"))
    return doc

@router.put("")
async def update_settings(
    payload: SettingsUpdate,
    token_payload: dict = Depends(get_current_user_payload)
):
    store_id = token_payload.get("store_id", "6afe8821f89f056877145cb7")
    settings_col = db_manager.get_collection("settings")
    doc = await settings_col.find_one({"store_id": store_id})
    if not doc:
        doc = await settings_col.find_one()
        
    update_dict = {}
    if payload.store:
        update_dict["store"] = payload.store.model_dump()
    if payload.billing:
        update_dict["billing"] = payload.billing.model_dump()
    if payload.appearance:
        update_dict["appearance"] = payload.appearance

    if doc:
        await settings_col.update_one({"_id": doc["_id"]}, {"$set": update_dict})
        doc.update(update_dict)
    else:
        doc = dict(DEFAULT_SETTINGS)
        doc.update(update_dict)
        await settings_col.insert_one(doc)

    doc["id"] = str(doc.get("_id") or doc.get("id"))
    return doc

@router.post("/reset-demo")
async def reset_demo_data(token_payload: dict = Depends(get_current_user_payload)):
    store_id = token_payload.get("store_id", "6afe8821f89f056877145cb7")
    products_col = db_manager.get_collection("products")
    settings_col = db_manager.get_collection("settings")
    coupons_col = db_manager.get_collection("coupons")
    festivals_col = db_manager.get_collection("festival_offers")

    # Clear products and reload 40 seed products
    if hasattr(products_col, "documents"):
        products_col.documents.clear()
        products_col._save()
    elif hasattr(products_col, "delete_many"):
        await products_col.delete_many({})

    seed_prods = load_seed_products()
    for p in seed_prods:
        await products_col.insert_one(p)

    # Reset settings
    await settings_col.update_one(
        {"store_id": store_id},
        {"$set": DEFAULT_SETTINGS}
    )

    # Re-seed coupons
    for c in DEFAULT_COUPONS:
        await coupons_col.insert_one(c)

    # Re-seed festivals
    for f in DEFAULT_FESTIVALS:
        await festivals_col.insert_one(f)

    return {
        "status": "success",
        "message": f"Successfully restored {len(seed_prods)} textile catalog products and demo showroom configuration.",
        "products_count": len(seed_prods)
    }
