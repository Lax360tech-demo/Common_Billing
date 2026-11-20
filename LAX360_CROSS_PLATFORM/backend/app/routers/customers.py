from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerResponse
from app.core.security import get_current_user_payload
from app.database.mongodb import db_manager
import uuid
from datetime import datetime, timezone

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("", response_model=List[CustomerResponse])
async def list_customers(
    search: Optional[str] = Query(None),
    token_payload: dict = Depends(get_current_user_payload)
):
    store_id = token_payload.get("store_id", "6afe8821f89f056877145cb7")
    customers_col = db_manager.get_collection("customers")
    docs = await customers_col.find({"store_id": store_id})
    if not docs:
        docs = await customers_col.find()

    results = []
    s = search.strip().lower() if search else None

    for doc in docs:
        if s:
            name_m = s in str(doc.get("name", "")).lower()
            phone_m = s in str(doc.get("phone", "")).lower()
            city_m = s in str(doc.get("city", "")).lower()
            gst_m = s in str(doc.get("gstin", "")).lower()
            if not (name_m or phone_m or city_m or gst_m):
                continue
        doc["id"] = str(doc.get("_id") or doc.get("id"))
        results.append(CustomerResponse(**doc))
    return results

@router.post("", response_model=CustomerResponse)
async def create_customer(
    payload: CustomerCreate,
    token_payload: dict = Depends(get_current_user_payload)
):
    store_id = token_payload.get("store_id", "6afe8821f89f056877145cb7")
    customers_col = db_manager.get_collection("customers")
    
    # Check if existing customer with same phone exists
    phone = payload.phone.strip()
    existing = await customers_col.find_one({"phone": phone, "store_id": store_id})
    if existing:
        existing["id"] = str(existing.get("_id") or existing.get("id"))
        return CustomerResponse(**existing)
        
    c_id = f"cust-{uuid.uuid4().hex[:8]}"
    doc = {
        "_id": c_id,
        "id": c_id,
        "store_id": store_id,
        "name": payload.name,
        "phone": phone,
        "email": payload.email or "",
        "city": payload.city or "Local",
        "state": payload.state or "Tamil Nadu",
        "address": payload.address or "",
        "gstin": payload.gstin or "",
        "type": payload.type or "Retail",
        "totalPurchases": 0.0,
        "totalBills": 0,
        "lastPurchaseDate": None,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await customers_col.insert_one(doc)
    return CustomerResponse(**doc)

@router.get("/{customer_id}", response_model=CustomerResponse)
async def get_customer(customer_id: str, token_payload: dict = Depends(get_current_user_payload)):
    customers_col = db_manager.get_collection("customers")
    doc = await customers_col.find_one({"id": customer_id})
    if not doc:
        doc = await customers_col.find_one({"_id": customer_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Customer not found")
    doc["id"] = str(doc.get("_id") or doc.get("id"))
    return CustomerResponse(**doc)

@router.put("/{customer_id}", response_model=CustomerResponse)
async def update_customer(
    customer_id: str,
    payload: CustomerUpdate,
    token_payload: dict = Depends(get_current_user_payload)
):
    customers_col = db_manager.get_collection("customers")
    doc = await customers_col.find_one({"id": customer_id})
    if not doc:
        doc = await customers_col.find_one({"_id": customer_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    update_data = {k: v for k, v in payload.model_dump().items() if v is not None}
    await customers_col.update_one({"_id": doc["_id"]}, {"$set": update_data})
    doc.update(update_data)
    doc["id"] = str(doc.get("_id") or doc.get("id"))
    return CustomerResponse(**doc)

@router.delete("/{customer_id}")
async def delete_customer(customer_id: str, token_payload: dict = Depends(get_current_user_payload)):
    customers_col = db_manager.get_collection("customers")
    deleted = await customers_col.delete_one({"id": customer_id})
    if not deleted:
        deleted = await customers_col.delete_one({"_id": customer_id})
    if not deleted:
        raise HTTPException(status_code=404, detail="Customer not found")
    return {"message": "Customer deleted successfully", "id": customer_id}

@router.get("/{customer_id}/history")
async def get_customer_history(customer_id: str, token_payload: dict = Depends(get_current_user_payload)):
    invoices_col = db_manager.get_collection("invoices")
    invoices = await invoices_col.find()
    
    matched = []
    total_spent = 0.0
    for inv in invoices:
        cust = inv.get("customer") or {}
        if str(cust.get("id")) == customer_id or str(cust.get("phone")) == customer_id:
            inv["id"] = str(inv.get("_id") or inv.get("id"))
            matched.append(inv)
            total_spent += float(inv.get("summary", {}).get("netPayable") or 0.0)
            
    return {
        "customerId": customer_id,
        "totalBills": len(matched),
        "totalSpent": round(total_spent, 2),
        "invoices": matched
    }
