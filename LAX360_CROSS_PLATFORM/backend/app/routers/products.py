from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.schemas.product import ProductCreate, ProductUpdate, ProductResponse, VariantModel
from app.core.security import get_current_user_payload
from app.database.mongodb import db_manager
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/products", tags=["Products"])

@router.get("", response_model=List[ProductResponse])
async def list_products(
    category: Optional[str] = Query(None),
    fabric: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    token_payload: dict = Depends(get_current_user_payload)
):
    store_id = token_payload.get("store_id", "6afe8821f89f056877145cb7")
    products_col = db_manager.get_collection("products")
    
    docs = await products_col.find({"store_id": store_id})
    if not docs:
        docs = await products_col.find()

    results = []
    s_query = search.strip().lower() if search else None

    for doc in docs:
        if category and category != "All" and doc.get("category") != category:
            continue
        if fabric and fabric != "All" and doc.get("fabric") != fabric:
            continue
            
        if s_query:
            name_match = s_query in str(doc.get("name", "")).lower()
            brand_match = s_query in str(doc.get("brand", "")).lower()
            fabric_match = s_query in str(doc.get("fabric", "")).lower()
            hsn_match = s_query in str(doc.get("hsn", "")).lower()
            variants = doc.get("variants") or []
            sku_match = any(s_query in str(v.get("sku", "")).lower() or s_query in str(v.get("barcode", "")).lower() for v in variants)
            
            if not (name_match or brand_match or fabric_match or hsn_match or sku_match):
                continue
                
        doc_id = str(doc.get("_id") or doc.get("id"))
        doc["id"] = doc_id
        results.append(ProductResponse(**doc))
        
    return results

@router.post("", response_model=ProductResponse)
async def create_product(
    payload: ProductCreate,
    token_payload: dict = Depends(get_current_user_payload)
):
    store_id = token_payload.get("store_id", "6afe8821f89f056877145cb7")
    products_col = db_manager.get_collection("products")
    
    prod_id = payload.id or f"prod-{uuid.uuid4().hex[:8]}"
    now_iso = datetime.now(timezone.utc).isoformat()
    
    # Process variants
    variants_data = []
    for i, v in enumerate(payload.variants or []):
        v_dict = v.model_dump() if hasattr(v, "model_dump") else dict(v)
        if not v_dict.get("id"):
            v_dict["id"] = f"v-{prod_id}-{i+1}"
        if not v_dict.get("sku"):
            v_dict["sku"] = f"SKU-{prod_id[:4]}-{v_dict.get('size', 'FS')}".upper()
        if not v_dict.get("barcode"):
            v_dict["barcode"] = f"890{uuid.uuid4().int % 100000000:09d}"
        if v_dict.get("price") is None:
            v_dict["price"] = payload.price
        if v_dict.get("mrp") is None:
            v_dict["mrp"] = payload.mrp
        variants_data.append(v_dict)
        
    if not variants_data:
        variants_data.append({
            "id": f"v-{prod_id}-1",
            "size": "Standard",
            "color": "Standard",
            "hex": "#000000",
            "sku": f"SKU-{prod_id[:6].upper()}",
            "barcode": f"890{uuid.uuid4().int % 100000000:09d}",
            "price": payload.price,
            "mrp": payload.mrp,
            "priceOverride": False,
            "mrpOverride": False
        })
        
    doc = {
        "_id": prod_id,
        "id": prod_id,
        "store_id": store_id,
        "name": payload.name,
        "category": payload.category,
        "fabric": payload.fabric or "",
        "brand": payload.brand or "",
        "hsn": payload.hsn or "",
        "price": float(payload.price),
        "mrp": float(payload.mrp),
        "gstRate": float(payload.gstRate or 5.0),
        "description": payload.description or "",
        "image_url": payload.image_url or "",
        "status": payload.status or "active",
        "variants": variants_data,
        "created_at": now_iso,
        "updated_at": now_iso
    }
    
    await products_col.insert_one(doc)
    return ProductResponse(**doc)

@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: str, token_payload: dict = Depends(get_current_user_payload)):
    products_col = db_manager.get_collection("products")
    doc = await products_col.find_one({"id": product_id})
    if not doc:
        doc = await products_col.find_one({"_id": product_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
    doc["id"] = str(doc.get("_id") or doc.get("id"))
    return ProductResponse(**doc)

@router.put("/{product_id}", response_model=ProductResponse)
async def update_product(
    product_id: str,
    payload: ProductUpdate,
    token_payload: dict = Depends(get_current_user_payload)
):
    products_col = db_manager.get_collection("products")
    doc = await products_col.find_one({"id": product_id})
    if not doc:
        doc = await products_col.find_one({"_id": product_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Product not found")
        
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    if "variants" in update_data and update_data["variants"]:
        update_data["variants"] = [v.model_dump() if hasattr(v, "model_dump") else v for v in update_data["variants"]]
        
    await products_col.update_one({"_id": doc["_id"]}, {"$set": update_data})
    doc.update(update_data)
    doc["id"] = str(doc.get("_id") or doc.get("id"))
    return ProductResponse(**doc)

@router.delete("/{product_id}")
async def delete_product(product_id: str, token_payload: dict = Depends(get_current_user_payload)):
    products_col = db_manager.get_collection("products")
    deleted = await products_col.delete_one({"id": product_id})
    if not deleted:
        deleted = await products_col.delete_one({"_id": product_id})
    if not deleted:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product removed successfully", "id": product_id}
