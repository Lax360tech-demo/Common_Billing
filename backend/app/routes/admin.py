import uuid
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Query
from app.core.database import get_database
from app.core.security import get_current_user

router = APIRouter(prefix="/admin", tags=["Super Admin Management"])

def check_super_admin(current_user: dict):
    if not (
        current_user.get("is_super_admin") is True
        or current_user.get("role") == "super_admin"
        or current_user.get("email", "").lower().strip() == "admin@gmail.com"
    ):
        raise HTTPException(
            status_code=403,
            detail="Access forbidden: Super Admin privileges required to view all business module records."
        )

@router.get("/businesses")
def list_all_businesses(current_user: dict = Depends(get_current_user)):
    check_super_admin(current_user)
    db = get_database()
    
    businesses = list(db.businesses.find())
    results = []
    
    for b in businesses:
        b.pop("_id", None)
        biz_id = b.get("id")
        
        # Aggregate statistics for this business
        invoices = list(db.invoices.find({"business_id": biz_id, "status": {"$ne": "cancelled"}}))
        total_revenue = sum(float(inv.get("grand_total", 0.0)) for inv in invoices)
        invoices_count = len(invoices)
        products_count = db.products.count_documents({"business_id": biz_id})
        customers_count = db.customers.count_documents({"business_id": biz_id})
        
        # Find owner/staff emails for this business
        users = list(db.users.find({"business_id": biz_id}, {"email": 1, "name": 1, "role": 1}))
        for u in users:
            u.pop("_id", None)
            
        results.append({
            **b,
            "invoices_count": invoices_count,
            "total_revenue": round(total_revenue, 2),
            "products_count": products_count,
            "customers_count": customers_count,
            "users": users
        })
        
    return {"businesses": results, "total": len(results)}

@router.get("/audit-logs")
def get_audit_logs(
    search: Optional[str] = None,
    email: Optional[str] = None,
    action: Optional[str] = None, # LOGIN, LOGOUT, LOGIN_FAILED, All
    business_id: Optional[str] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=200),
    current_user: dict = Depends(get_current_user)
):
    check_super_admin(current_user)
    db = get_database()
    query = {}
    
    if search:
        s_regex = {"$regex": search.strip(), "$options": "i"}
        query["$or"] = [
            {"email": s_regex},
            {"name": s_regex},
            {"business_name": s_regex},
            {"business_category": s_regex},
            {"ip_address": s_regex}
        ]
        
    if email and email != "All":
        query["email"] = {"$regex": f"^{email.strip()}$", "$options": "i"}
        
    if action and action != "All":
        query["action"] = action
        
    if business_id and business_id != "All" and business_id != "all":
        query["business_id"] = business_id

    total = db.auth_audit_logs.count_documents(query)
    skip = (page - 1) * limit
    cursor = db.auth_audit_logs.find(query).sort("timestamp", -1).skip(skip).limit(limit)
    
    items = list(cursor)
    for it in items:
        it.pop("_id", None)
        
    # Get distinct mail IDs for filtering
    distinct_emails = db.auth_audit_logs.distinct("email")
    distinct_emails = sorted([e for e in distinct_emails if e])
    
    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "distinct_emails": distinct_emails
    }

@router.get("/overview")
def get_admin_overview(current_user: dict = Depends(get_current_user)):
    check_super_admin(current_user)
    db = get_database()
    
    businesses = list(db.businesses.find())
    all_invoices = list(db.invoices.find({"status": {"$ne": "cancelled"}}))
    total_platform_revenue = sum(float(inv.get("grand_total", 0.0)) for inv in all_invoices)
    
    total_products = db.products.count_documents({})
    total_customers = db.customers.count_documents({})
    total_users = db.users.count_documents({})
    
    # Audit stats
    total_login_events = db.auth_audit_logs.count_documents({"action": "LOGIN"})
    total_logout_events = db.auth_audit_logs.count_documents({"action": "LOGOUT"})
    
    # Recent 10 audit entries
    recent_logs = list(db.auth_audit_logs.find().sort("timestamp", -1).limit(10))
    for l in recent_logs:
        l.pop("_id", None)
        
    # Per-business summary
    biz_summaries = []
    for b in businesses:
        b_id = b.get("id")
        b_invoices = [inv for inv in all_invoices if inv.get("business_id") == b_id]
        b_rev = sum(float(inv.get("grand_total", 0.0)) for inv in b_invoices)
        biz_summaries.append({
            "id": b_id,
            "name": b.get("name"),
            "category": b.get("category"),
            "category_name": b.get("category_name", b.get("category")),
            "email": b.get("email"),
            "invoices_count": len(b_invoices),
            "revenue": round(b_rev, 2)
        })
        
    return {
        "total_businesses": len(businesses),
        "total_users": total_users,
        "total_invoices": len(all_invoices),
        "total_platform_revenue": round(total_platform_revenue, 2),
        "total_products": total_products,
        "total_customers": total_customers,
        "total_login_events": total_login_events,
        "total_logout_events": total_logout_events,
        "businesses": biz_summaries,
        "recent_audit_logs": recent_logs
    }
