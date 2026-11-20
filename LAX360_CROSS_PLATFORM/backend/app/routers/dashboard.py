from fastapi import APIRouter, Depends
from typing import Dict, Any, List
from app.core.security import get_current_user_payload
from app.database.mongodb import db_manager
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/metrics")
async def get_dashboard_metrics(token_payload: dict = Depends(get_current_user_payload)):
    store_id = token_payload.get("store_id", "6afe8821f89f056877145cb7")
    invoices_col = db_manager.get_collection("invoices")
    invoices = await invoices_col.find({"store_id": store_id})
    if not invoices:
        invoices = await invoices_col.find()

    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")

    today_sales = 0.0
    today_invoice_count = 0
    cash_coll = 0.0
    upi_coll = 0.0
    card_coll = 0.0

    # 7-day trend map
    trend_map = {}
    for i in range(6, -1, -1):
        d = now - timedelta(days=i)
        d_key = d.strftime("%Y-%m-%d")
        d_label = d.strftime("%d %b")
        trend_map[d_key] = {"date": d_label, "sales": 0.0, "count": 0}

    product_sales_map = {}
    recent_invoices = []

    for inv in invoices:
        inv_id = str(inv.get("_id") or inv.get("id"))
        inv["id"] = inv_id
        inv_date = str(inv.get("date", ""))
        net_payable = float(inv.get("summary", {}).get("netPayable") or 0.0)
        pay_info = inv.get("payment") or {}
        pay_method = pay_info.get("method", "Cash")

        # Today check
        if inv_date.startswith(today_str):
            today_sales += net_payable
            today_invoice_count += 1

            if pay_method == "Cash":
                cash_coll += net_payable
            elif pay_method == "UPI":
                upi_coll += net_payable
            elif pay_method == "Card":
                card_coll += net_payable
            elif pay_method == "Split":
                splits = pay_info.get("splitDetails") or {}
                cash_coll += float(splits.get("cash") or 0.0)
                upi_coll += float(splits.get("upi") or 0.0)
                card_coll += float(splits.get("card") or 0.0)

        # 7-day trend
        date_prefix = inv_date[:10]
        if date_prefix in trend_map:
            trend_map[date_prefix]["sales"] = round(trend_map[date_prefix]["sales"] + net_payable, 2)
            trend_map[date_prefix]["count"] += 1

        # Product sales tracking
        for it in inv.get("items", []):
            p_name = it.get("name", "Product")
            p_qty = int(it.get("quantity") or 1)
            p_gross = float(it.get("lineTotal") or it.get("grossAmount") or 0.0)
            if p_name not in product_sales_map:
                product_sales_map[p_name] = {
                    "name": p_name,
                    "category": it.get("category", "General"),
                    "fabric": it.get("fabric", ""),
                    "quantity": 0,
                    "sales": 0.0
                }
            product_sales_map[p_name]["quantity"] += p_qty
            product_sales_map[p_name]["sales"] = round(product_sales_map[p_name]["sales"] + p_gross, 2)

    avg_bill = round(today_sales / today_invoice_count, 2) if today_invoice_count > 0 else 0.0

    # Sort recent invoices
    sorted_inv = sorted(invoices, key=lambda x: str(x.get("date", "")), reverse=True)
    recent_invoices = sorted_inv[:5]

    # Top selling products
    top_selling = sorted(product_sales_map.values(), key=lambda x: x["quantity"], reverse=True)[:5]

    total_coll = cash_coll + upi_coll + card_coll
    payment_breakdown = [
        {"name": "UPI", "value": round(upi_coll, 2), "color": "#4f46e5"},
        {"name": "Cash", "value": round(cash_coll, 2), "color": "#10b981"},
        {"name": "Card", "value": round(card_coll, 2), "color": "#f59e0b"}
    ]

    return {
        "todaySales": round(today_sales, 2),
        "todayInvoiceCount": today_invoice_count,
        "avgBillValue": avg_bill,
        "cashCollection": round(cash_coll, 2),
        "upiCollection": round(upi_coll, 2),
        "cardCollection": round(card_coll, 2),
        "salesTrend": list(trend_map.values()),
        "paymentBreakdown": payment_breakdown,
        "topSellingProducts": top_selling,
        "recentInvoices": recent_invoices
    }
