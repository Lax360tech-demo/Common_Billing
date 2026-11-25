import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from app.core.database import get_database
from app.core.security import get_current_user
from app.models.schemas import ProductCreateRequest, ProductUpdateRequest

router = APIRouter(prefix="/products", tags=["Product & Inventory Management"])

def is_super_admin_user(user: dict) -> bool:
    if not user:
        return False
    return (
        user.get("is_super_admin") is True
        or user.get("role") == "super_admin"
        or user.get("email", "").lower().strip() == "admin@gmail.com"
    )

@router.get("")
def list_products(
    search: Optional[str] = None,
    category: Optional[str] = None,
    business_id: Optional[str] = None,
    low_stock: Optional[bool] = None,
    sort_by: Optional[str] = Query("category", description="Field to sort by (category, name, created_at, etc.)"),
    sort_order: int = Query(1, description="1 for ascending, -1 for descending"),
    page: int = Query(1, ge=1),
    limit: int = Query(200, ge=1, le=500),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    is_super = is_super_admin_user(current_user)
    query = {}

    if not is_super:
        query["business_id"] = current_user["business_id"]
    elif business_id and business_id != "all" and business_id != "All":
        query["business_id"] = business_id

    if search:
        search_regex = {"$regex": search.strip(), "$options": "i"}
        query["$or"] = [
            {"name": search_regex},
            {"code": search_regex},
            {"barcode": search_regex},
            {"brand": search_regex},
            {"category": search_regex}
        ]

    if category and category != "All":
        query["category"] = category

    total = db.products.count_documents(query)
    skip = (page - 1) * limit

    if sort_by == "category":
        sort_fields = [("category", sort_order), ("name", 1)]
    elif sort_by == "name":
        sort_fields = [("name", sort_order)]
    elif sort_by == "created_at":
        sort_fields = [("created_at", sort_order)]
    elif sort_by:
        sort_fields = [(sort_by, sort_order)]
    else:
        sort_fields = [("category", 1), ("name", 1)]

    cursor = db.products.find(query).sort(sort_fields).skip(skip).limit(limit)

    items = list(cursor)
    biz_map = {b["id"]: b.get("name", "Store") for b in db.businesses.find({}, {"id": 1, "name": 1})}
    for p in items:
        p.pop("_id", None)
        p["business_name"] = biz_map.get(p.get("business_id"), "Store")

    if low_stock:
        items = [p for p in items if float(p.get("stock", 0.0)) <= float(p.get("min_stock_level", 5.0))]

    return {"items": items, "total": total, "page": page, "limit": limit}

@router.get("/categories")
def get_categories(business_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    db = get_database()
    is_super = is_super_admin_user(current_user)
    cat_query = {}
    if not is_super:
        cat_query["business_id"] = current_user["business_id"]
    elif business_id and business_id != "all" and business_id != "All":
        cat_query["business_id"] = business_id

    categories = db.products.distinct("category", cat_query)
    cleaned = [c.strip() for c in categories if c and isinstance(c, str) and c.strip()]
    return sorted(list(set(cleaned)), key=lambda s: s.lower())

@router.get("/barcode/{barcode}")
def get_by_barcode(barcode: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    business_id = current_user["business_id"]
    code_clean = barcode.strip()

    product = db.products.find_one({
        "business_id": business_id,
        "$or": [
            {"barcode": code_clean},
            {"code": code_clean}
        ]
    })
    if not product:
        raise HTTPException(status_code=404, detail="Product not found with this barcode")
    product.pop("_id", None)
    return product

@router.get("/{product_id}")
def get_product(product_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    product = db.products.find_one({"business_id": current_user["business_id"], "id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    product.pop("_id", None)
    return product

@router.post("")
def create_product(payload: ProductCreateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    business_id = current_user["business_id"]
    now_iso = datetime.now(timezone.utc).isoformat()
    product_id = str(uuid.uuid4())

    # Generate sequential code or barcode if missing
    code = payload.code
    if not code:
        count = db.products.count_documents({"business_id": business_id}) + 1
        code = f"PRD-{count:04d}"

    barcode = payload.barcode or code

    # Check duplicate barcode within business
    if db.products.find_one({"business_id": business_id, "barcode": barcode}):
        # append random digits if collision
        barcode = f"{barcode}-{uuid.uuid4().hex[:4].upper()}"

    doc = {
        "id": product_id,
        "business_id": business_id,
        "name": payload.name,
        "code": code,
        "barcode": barcode,
        "category": payload.category or "General",
        "brand": payload.brand or "",
        "description": payload.description or "",
        "purchase_price": float(payload.purchase_price),
        "selling_price": float(payload.selling_price),
        "mrp": float(payload.mrp) if payload.mrp is not None else float(payload.selling_price),
        "tax_rate": float(payload.tax_rate),
        "unit": payload.unit or "pcs",
        "stock": float(payload.stock),
        "min_stock_level": float(payload.min_stock_level),
        "hsn": payload.hsn or "",
        "image_url": payload.image_url or "",
        "attributes": payload.attributes or {},
        "created_at": now_iso,
        "updated_at": now_iso
    }
    db.products.insert_one(doc)

    # Initial stock movement log if stock > 0
    if float(payload.stock) > 0:
        db.stock_movements.insert_one({
            "id": str(uuid.uuid4()),
            "business_id": business_id,
            "product_id": product_id,
            "product_name": payload.name,
            "movement_type": "INITIAL_STOCK",
            "quantity": float(payload.stock),
            "reason": "Opening Inventory Entry",
            "reference_id": product_id,
            "created_at": now_iso
        })

    doc.pop("_id", None)
    return doc

@router.put("/{product_id}")
def update_product(product_id: str, payload: ProductUpdateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    business_id = current_user["business_id"]
    product = db.products.find_one({"business_id": business_id, "id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_fields = {}
    for k, v in payload.model_dump(exclude_unset=True).items():
        if v is not None:
            update_fields[k] = v

    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    db.products.update_one({"business_id": business_id, "id": product_id}, {"$set": update_fields})

    updated = db.products.find_one({"business_id": business_id, "id": product_id})
    updated.pop("_id", None)
    return updated

@router.delete("/{product_id}")
def delete_product(product_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    res = db.products.delete_one({"business_id": current_user["business_id"], "id": product_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}
