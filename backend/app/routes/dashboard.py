from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query
from app.core.database import get_database
from app.core.security import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

def is_super_admin_user(user: dict) -> bool:
    if not user:
        return False
    return (
        user.get("is_super_admin") is True
        or user.get("role") == "super_admin"
        or user.get("email", "").lower().strip() == "admin@gmail.com"
    )

@router.get("/metrics")
def get_dashboard_metrics(
    period: str = Query("today"), # today, yesterday, week, month, year, all, custom
    business_id: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    is_super = is_super_admin_user(current_user)
    
    target_business_id = None
    if not is_super:
        target_business_id = current_user["business_id"]
    elif business_id and business_id != "all" and business_id != "All":
        target_business_id = business_id

    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")

    # Date boundary filter
    query_invoices = {"status": {"$ne": "cancelled"}}
    if target_business_id:
        query_invoices["business_id"] = target_business_id

    if period == "today":
        query_invoices["date"] = today_str
    elif period == "yesterday":
        yesterday_str = (now - timedelta(days=1)).strftime("%Y-%m-%d")
        query_invoices["date"] = yesterday_str
    elif period == "week":
        week_ago_str = (now - timedelta(days=7)).strftime("%Y-%m-%d")
        query_invoices["date"] = {"$gte": week_ago_str, "$lte": today_str}
    elif period == "month":
        month_ago_str = (now - timedelta(days=30)).strftime("%Y-%m-%d")
        query_invoices["date"] = {"$gte": month_ago_str, "$lte": today_str}
    elif period == "custom" and start_date and end_date:
        query_invoices["date"] = {"$gte": start_date, "$lte": end_date}

    # Invoices for period
    invoices = list(db.invoices.find(query_invoices))
    
    # All time invoices
    all_time_query = {"status": {"$ne": "cancelled"}}
    if target_business_id:
        all_time_query["business_id"] = target_business_id
    all_invoices = list(db.invoices.find(all_time_query))
    total_sales_all_time = sum(float(inv.get("grand_total", 0.0)) for inv in all_invoices)
    
    period_sales = sum(float(inv.get("grand_total", 0.0)) for inv in invoices)
    period_bills = len(invoices)
    avg_bill_value = round(period_sales / period_bills, 2) if period_bills > 0 else 0.0

    # Today specific
    today_invoices = [inv for inv in all_invoices if inv.get("date") == today_str]
    today_sales = sum(float(inv.get("grand_total", 0.0)) for inv in today_invoices)

    # Products & Low stock
    prod_query = {"business_id": target_business_id} if target_business_id else {}
    all_products = list(db.products.find(prod_query))
    total_products = len(all_products)
    low_stock_products = [
        p for p in all_products 
        if float(p.get("stock", 0.0)) <= float(p.get("min_stock_level", 5.0))
    ]
    low_stock_count = len(low_stock_products)

    # Customers & Suppliers
    cust_query = {"business_id": target_business_id} if target_business_id else {}
    supp_query = {"business_id": target_business_id} if target_business_id else {}
    total_customers = db.customers.count_documents(cust_query)
    total_suppliers = db.suppliers.count_documents(supp_query)

    # Pending Payments (Customer balances)
    customers = list(db.customers.find(cust_query))
    pending_payments = sum(float(c.get("outstanding_balance", 0.0)) for c in customers)

    # Payment Method Breakdown
    payment_methods = {"Cash": 0.0, "UPI": 0.0, "Card": 0.0, "Bank Transfer": 0.0, "Other": 0.0}
    for inv in (invoices if invoices else all_invoices):
        method = inv.get("payment_method", "Cash")
        amt = float(inv.get("grand_total", 0.0))
        if method in payment_methods:
            payment_methods[method] += amt
        elif method == "Split":
            split_details = inv.get("split_details", {})
            for sm, sa in split_details.items():
                if sm in payment_methods:
                    payment_methods[sm] += float(sa)
                else:
                    payment_methods["Other"] += float(sa)
        else:
            payment_methods["Other"] += amt

    payment_breakdown = [
        {"name": k, "value": round(v, 2), "color": col}
        for k, v, col in [
            ("UPI", payment_methods["UPI"], "#6366f1"),
            ("Cash", payment_methods["Cash"], "#10b981"),
            ("Card", payment_methods["Card"], "#f59e0b"),
            ("Bank Transfer", payment_methods["Bank Transfer"], "#06b6d4"),
            ("Other", payment_methods["Other"], "#8b5cf6")
        ]
        if v > 0 or k in ["UPI", "Cash", "Card"]
    ]

    # Sales Trend past 7 days
    sales_trend = []
    for i in range(6, -1, -1):
        day_date = now - timedelta(days=i)
        day_key = day_date.strftime("%Y-%m-%d")
        day_label = "Today" if i == 0 else day_date.strftime("%a")
        day_invoices = [inv for inv in all_invoices if inv.get("date") == day_key]
        day_tot = sum(float(inv.get("grand_total", 0.0)) for inv in day_invoices)
        sales_trend.append({
            "date": day_label,
            "full_date": day_key,
            "sales": round(day_tot, 2),
            "count": len(day_invoices)
        })

    # Top Selling Products
    product_sales_map = {}
    for inv in all_invoices:
        for item in inv.get("items", []):
            name = item.get("name", "Product")
            qty = float(item.get("quantity", 0.0))
            tot = float(item.get("line_total", 0.0))
            if name not in product_sales_map:
                product_sales_map[name] = {"name": name, "quantity": 0.0, "total": 0.0, "category": item.get("category", "")}
            product_sales_map[name]["quantity"] += qty
            product_sales_map[name]["total"] += tot

    top_products = sorted(product_sales_map.values(), key=lambda x: x["total"], reverse=True)[:5]
    for tp in top_products:
        tp["total"] = round(tp["total"], 2)

    # Recent Invoices
    rec_query = {"business_id": target_business_id} if target_business_id else {}
    recent_invoices = list(db.invoices.find(rec_query).sort("created_at", -1).limit(6))
    biz_map = {b["id"]: b for b in db.businesses.find({}, {"id": 1, "name": 1, "category": 1, "category_name": 1})}
    for r in recent_invoices:
        r.pop("_id", None)
        b_info = biz_map.get(r.get("business_id"), {})
        r["business_name"] = b_info.get("name", "Store")
        r["business_category"] = b_info.get("category_name", b_info.get("category", "General"))

    # Per-business breakdown if super admin in collective view
    business_breakdown = []
    if is_super and not target_business_id:
        for b_id, b_info in biz_map.items():
            b_invs = [inv for inv in all_invoices if inv.get("business_id") == b_id]
            b_rev = sum(float(inv.get("grand_total", 0.0)) for inv in b_invs)
            business_breakdown.append({
                "id": b_id,
                "name": b_info.get("name", "Store"),
                "category": b_info.get("category", "General"),
                "category_name": b_info.get("category_name", b_info.get("category", "General")),
                "invoices_count": len(b_invs),
                "revenue": round(b_rev, 2)
            })

    return {
        "total_sales": round(total_sales_all_time, 2),
        "period_sales": round(period_sales, 2),
        "today_revenue": round(today_sales, 2),
        "total_bills": period_bills,
        "avg_bill_value": avg_bill_value,
        "total_products": total_products,
        "total_customers": total_customers,
        "total_suppliers": total_suppliers,
        "low_stock_count": low_stock_count,
        "pending_payments": round(pending_payments, 2),
        "sales_trend": sales_trend,
        "payment_breakdown": payment_breakdown,
        "top_selling_products": top_products,
        "recent_invoices": recent_invoices,
        "is_super_admin": is_super,
        "is_collective_view": is_super and not target_business_id,
        "business_breakdown": business_breakdown
    }
