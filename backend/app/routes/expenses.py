import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from app.core.database import get_database
from app.core.security import get_current_user
from app.models.schemas import ExpenseCreateRequest

router = APIRouter(prefix="/expenses", tags=["Expense Management"])

@router.get("")
def list_expenses(
    category: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    business_id = current_user["business_id"]
    query = {"business_id": business_id}

    if category and category != "All":
        query["category"] = category

    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}
    elif start_date:
        query["date"] = {"$gte": start_date}

    total = db.expenses.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.expenses.find(query).sort("date", -1).skip(skip).limit(limit)

    items = list(cursor)
    for it in items:
        it.pop("_id", None)

    # Category summaries
    all_expenses = list(db.expenses.find({"business_id": business_id}))
    total_expense_amount = sum(float(e.get("amount", 0.0)) for e in all_expenses)

    category_totals = {}
    for e in all_expenses:
        c = e.get("category", "Other")
        category_totals[c] = category_totals.get(c, 0.0) + float(e.get("amount", 0.0))

    category_breakdown = [{"category": k, "amount": round(v, 2)} for k, v in category_totals.items()]

    return {
        "items": items,
        "total": total,
        "total_amount": round(total_expense_amount, 2),
        "category_breakdown": category_breakdown,
        "page": page,
        "limit": limit
    }

@router.post("")
def record_expense(payload: ExpenseCreateRequest, current_user: dict = Depends(get_current_user)):
    db = get_database()
    business_id = current_user["business_id"]
    expense_id = str(uuid.uuid4())
    now_iso = datetime.now(timezone.utc).isoformat()

    doc = {
        "id": expense_id,
        "business_id": business_id,
        "category": payload.category,
        "description": payload.description,
        "amount": round(float(payload.amount), 2),
        "date": payload.date,
        "payment_method": payload.payment_method,
        "reference": payload.reference or "",
        "created_by": current_user.get("name", "Staff"),
        "created_at": now_iso
    }
    db.expenses.insert_one(doc)
    doc.pop("_id", None)
    return doc

@router.delete("/{expense_id}")
def delete_expense(expense_id: str, current_user: dict = Depends(get_current_user)):
    db = get_database()
    res = db.expenses.delete_one({"business_id": current_user["business_id"], "id": expense_id})
    if res.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    return {"message": "Expense deleted successfully"}
