import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from app.core.database import get_database
from app.core.security import get_current_user
from app.models.schemas import StockAdjustmentRequest

router = APIRouter(prefix="/inventory", tags=["Inventory Management"])

@router.get("/alerts")
def get_stock_alerts(current_user: dict = Depends(get_current_user)):
    db = get_database()
    business_id = current_user["business_id"]
    all_products = list(db.products.find({"business_id": business_id}))
    alerts = []
    for p in all_products:
        p.pop("_id", None)
        stock = float(p.get("stock", 0.0))
        min_level = float(p.get("min_stock_level", 5.0))
        if stock <= min_level:
            alerts.append({
                "product_id": p["id"],
                "name": p["name"],
                "code": p.get("code", ""),
                "barcode": p.get("barcode", ""),
                "current_stock": stock,
                "min_stock_level": min_level,
                "unit": p.get("unit", "pcs"),
                "status": "Out of Stock" if stock <= 0 else "Low Stock"
            })
    return {"alerts": alerts, "total": len(alerts)}

@router.post("/adjust")
def adjust_stock(payload: StockAdjustmentRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    business_id = current_user["business_id"]
    product = db.products.find_one({"business_id": business_id, "id": payload.product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    qty = float(payload.quantity)
    adj_type = payload.adjustment_type.upper()
    current_stock = float(product.get("stock", 0.0))

    if adj_type in ["INWARD", "RETURN"]:
        new_stock = current_stock + qty
    elif adj_type in ["OUTWARD", "DAMAGE"]:
        new_stock = max(0.0, current_stock - qty)
    elif adj_type == "CORRECTION":
        new_stock = max(0.0, qty)
    else:
        new_stock = current_stock + qty

    now_iso = datetime.now(timezone.utc).isoformat()
    db.products.update_one({"business_id": business_id, "id": payload.product_id}, {"$set": {"stock": new_stock, "updated_at": now_iso}})

    # Record Movement
    db.stock_movements.insert_one({
        "id": str(uuid.uuid4()),
        "business_id": business_id,
        "product_id": payload.product_id,
        "product_name": product["name"],
        "movement_type": adj_type,
        "quantity": qty,
        "previous_stock": current_stock,
        "new_stock": new_stock,
        "reason": payload.reason or f"Stock adjustment: {adj_type}",
        "created_at": now_iso
    })

    return {"message": "Stock adjusted successfully", "previous_stock": current_stock, "new_stock": new_stock}

@router.get("/movements")
def get_stock_movements(
    product_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    business_id = current_user["business_id"]
    query = {"business_id": business_id}
    if product_id:
        query["product_id"] = product_id

    total = db.stock_movements.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.stock_movements.find(query).sort("created_at", -1).skip(skip).limit(limit)

    items = list(cursor)
    for it in items:
        it.pop("_id", None)

    return {"items": items, "total": total, "page": page, "limit": limit}
