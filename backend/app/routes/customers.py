import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from app.core.database import get_database
from app.core.security import get_current_user
from app.models.schemas import CustomerCreateRequest, CustomerUpdateRequest

router = APIRouter(prefix="/customers", tags=["Customer Management"])

@router.get("")
def list_customers(
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
            {"phone": search_regex},
            {"email": search_regex},
            {"gstin": search_regex}
        ]

    total = db.customers.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.customers.find(query).sort("created_at", -1).skip(skip).limit(limit)

    items = list(cursor)
    for it in items:
        it.pop("_id", None)

    return {"items": items, "total": total, "page": page, "limit": limit}

@router.get("/{customer_id}")
def get_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    business_id = current_user["business_id"]
    customer = db.customers.find_one({"business_id": business_id, "id": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    customer.pop("_id", None)

    # Invoices history
    invoices = list(db.invoices.find({"business_id": business_id, "customer.phone": customer.get("phone")}).sort("created_at", -1).limit(50))
    for inv in invoices:
        inv.pop("_id", None)

    return {"customer": customer, "invoices": invoices}

@router.post("")
def create_customer(payload: CustomerCreateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    business_id = current_user["business_id"]
    phone_clean = payload.phone.strip()

    if db.customers.find_one({"business_id": business_id, "phone": phone_clean}):
        raise HTTPException(status_code=400, detail="Customer with this phone number already exists.")

    customer_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    doc = {
        "id": customer_id,
        "business_id": business_id,
        "name": payload.name.strip(),
        "phone": phone_clean,
        "email": payload.email.strip() if payload.email else "",
        "address": payload.address or "",
        "gstin": payload.gstin or "",
        "total_purchases": 0.0,
        "outstanding_balance": float(payload.opening_balance or 0.0),
        "created_at": now_iso
    }
    db.customers.insert_one(doc)
    doc.pop("_id", None)
    return doc

@router.put("/{customer_id}")
def update_customer(customer_id: str, payload: CustomerUpdateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    business_id = current_user["business_id"]

    update_fields = {}
    for k, v in payload.model_dump(exclude_unset=True).items():
        if v is not None:
            update_fields[k] = v

    update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
    res = db.customers.update_one({"business_id": business_id, "id": customer_id}, {"$set": update_fields})
    if res.matched_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")

    updated = db.customers.find_one({"business_id": business_id, "id": customer_id})
    updated.pop("_id", None)
    return updated

@router.delete("/{customer_id}")
def delete_customer(customer_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    res = db.customers.delete_one({"business_id": current_user["business_id"], "id": customer_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully"}
