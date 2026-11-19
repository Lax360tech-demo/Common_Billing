import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from app.core.database import get_database
from app.core.security import get_current_user
from app.models.schemas import SupplierCreateRequest, SupplierUpdateRequest

router = APIRouter(prefix="/suppliers", tags=["Supplier Management"])

@router.get("")
def list_suppliers(
    search: Optional[str] = None,
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
            {"name": search_regex},
            {"contact_person": search_regex},
            {"phone": search_regex},
            {"gstin": search_regex}
        ]

    total = db.suppliers.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.suppliers.find(query).sort("created_at", -1).skip(skip).limit(limit)

    items = list(cursor)
    for it in items:
        it.pop("_id", None)

    return {"items": items, "total": total, "page": page, "limit": limit}

@router.get("/{supplier_id}")
def get_supplier(supplier_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    business_id = current_user["business_id"]
    supplier = db.suppliers.find_one({"business_id": business_id, "id": supplier_id})
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    supplier.pop("_id", None)

    purchases = list(db.purchases.find({"business_id": business_id, "supplier_id": supplier_id}).sort("created_at", -1).limit(50))
    for p in purchases:
        p.pop("_id", None)

    return {"supplier": supplier, "purchases": purchases}

@router.post("")
def create_supplier(payload: SupplierCreateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    business_id = current_user["business_id"]
    phone_clean = payload.phone.strip()

    supplier_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    doc = {
        "id": supplier_id,
        "business_id": business_id,
        "name": payload.name.strip(),
        "contact_person": payload.contact_person or "",
        "phone": phone_clean,
        "email": payload.email.strip() if payload.email else "",
        "address": payload.address or "",
        "gstin": payload.gstin or "",
        "total_purchases": 0.0,
        "outstanding_payables": float(payload.opening_balance or 0.0),
        "created_at": now_iso
    }
    db.suppliers.insert_one(doc)
    doc.pop("_id", None)
    return doc

@router.put("/{supplier_id}")
def update_supplier(supplier_id: str, payload: SupplierUpdateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    business_id = current_user["business_id"]

    update_fields = {}
    for k, v in payload.model_dump(exclude_unset=True).items():
        if v is not None:
            update_fields[k] = v

    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = db.suppliers.update_one({"business_id": business_id, "id": supplier_id}, {"$set": update_fields})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")

    updated = db.suppliers.find_one({"business_id": business_id, "id": supplier_id})
    updated.pop("_id", None)
    return updated

@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    res = db.suppliers.delete_one({"business_id": current_user["business_id"], "id": supplier_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return {"message": "Supplier deleted successfully"}
