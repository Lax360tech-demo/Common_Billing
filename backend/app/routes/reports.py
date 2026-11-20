from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, Query, Response
from app.core.database import get_database
from app.core.security import get_current_user

router = APIRouter(prefix="/reports", tags=["Reports & Analytics"])

def get_date_range_for_period(period: str):
    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    if period == "today":
        return today_str, today_str
    elif period == "week":
        return (now - timedelta(days=7)).strftime("%Y-%m-%d"), today_str
    elif period == "month":
        return (now - timedelta(days=30)).strftime("%Y-%m-%d"), today_str
    elif period == "year":
        return (now - timedelta(days=365)).strftime("%Y-%m-%d"), today_str
    return None, None

@router.get("/sales")
def get_sales_report(
    period: str = Query("month"),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    business_id = current_user["business_id"]
    start_date, end_date = get_date_range_for_period(period)

    query = {"business_id": business_id, "status": {"$ne": "cancelled"}}
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}

    invoices = list(db.invoices.find(query))
    total_sales = sum(float(inv.get("grand_total", 0.0)) for inv in invoices)
    invoice_count = len(invoices)
    avg_order = round(total_sales / invoice_count, 2) if invoice_count > 0 else 0.0

    # Payment Breakdown
    payment_breakdown = {}
    for inv in invoices:
        pm = inv.get("payment_method", "Cash")
        amt = float(inv.get("grand_total", 0.0))
        payment_breakdown[pm] = payment_breakdown.get(pm, 0.0) + amt

    # Top Products
    product_sales = {}
    for inv in invoices:
        for it in inv.get("items", []):
            name = it.get("name", "Item")
            qty = float(it.get("quantity", 0.0))
            price = float(it.get("unit_price", 0.0))
            if name not in product_sales:
                product_sales[name] = {"quantity": 0.0, "revenue": 0.0}
            product_sales[name]["quantity"] += qty
            product_sales[name]["revenue"] += qty * price

    top_products = [
        {"name": k, "quantity": v["quantity"], "revenue": round(v["revenue"], 2)}
        for k, v in sorted(product_sales.items(), key=lambda x: x[1]["revenue"], reverse=True)[:5]
    ]

    return {
        "period": period,
        "total_sales": round(total_sales, 2),
        "invoice_count": invoice_count,
        "average_order_value": avg_order,
        "payment_breakdown": payment_breakdown,
        "top_products": top_products
    }

@router.get("/profit-loss")
def get_profit_loss_report(
    period: str = Query("month"),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    business_id = current_user["business_id"]
    start_date, end_date = get_date_range_for_period(period)

    query_inv = {"business_id": business_id, "status": {"$ne": "cancelled"}}
    query_exp = {"business_id": business_id}
    if start_date and end_date:
        query_inv["date"] = {"$gte": start_date, "$lte": end_date}
        query_exp["date"] = {"$gte": start_date, "$lte": end_date}

    invoices = list(db.invoices.find(query_inv))
    expenses = list(db.expenses.find(query_exp))

    total_revenue = sum(float(inv.get("subtotal", inv.get("grand_total", 0.0))) for inv in invoices)
    total_expenses = sum(float(e.get("amount", 0.0)) for e in expenses)

    # Cost of goods sold
    products_map = {p["id"]: float(p.get("purchase_price", 0.0)) for p in db.products.find({"business_id": business_id})}
    cogs = 0.0
    for inv in invoices:
        for it in inv.get("items", []):
            pid = it.get("product_id")
            unit_cost = products_map.get(pid, 0.0)
            cogs += unit_cost * float(it.get("quantity", 0.0))

    gross_profit = total_revenue - cogs
    net_profit = gross_profit - total_expenses

    return {
        "total_revenue": round(total_revenue, 2),
        "cogs": round(cogs, 2),
        "gross_profit": round(gross_profit, 2),
        "total_expenses": round(total_expenses, 2),
        "net_profit": round(net_profit, 2)
    }

@router.get("/gst")
def get_gst_report(
    period: str = Query("month"),
    current_user: dict = Depends(get_current_user)
):
    db = get_database()
    business_id = current_user["business_id"]
    start_date, end_date = get_date_range_for_period(period)

    query = {"business_id": business_id, "status": {"$ne": "cancelled"}}
    if start_date and end_date:
        query["date"] = {"$gte": start_date, "$lte": end_date}

    invoices = list(db.invoices.find(query))
    taxable_value = sum(float(inv.get("subtotal", 0.0)) for inv in invoices)
    cgst = sum(float(inv.get("cgst", 0.0)) for inv in invoices)
    sgst = sum(float(inv.get("sgst", 0.0)) for inv in invoices)
    igst = sum(float(inv.get("igst", 0.0)) for inv in invoices)
    total_tax = sum(float(inv.get("tax_amount", 0.0)) for inv in invoices)

    # Rate-wise breakdown
    rates_map = {}
    for inv in invoices:
        for it in inv.get("items", []):
            rate = float(it.get("tax_rate", 18.0))
            qty = float(it.get("quantity", 0.0))
            price = float(it.get("unit_price", 0.0))
            line_val = qty * price
            line_tax = line_val * (rate / 100.0)

            if rate not in rates_map:
                rates_map[rate] = {"taxable_value": 0.0, "cgst": 0.0, "sgst": 0.0, "igst": 0.0, "total_tax": 0.0}
            rates_map[rate]["taxable_value"] += line_val
            rates_map[rate]["cgst"] += line_tax / 2.0
            rates_map[rate]["sgst"] += line_tax / 2.0
            rates_map[rate]["total_tax"] += line_tax

    gstr1_summary = [
        {
            "rate": r,
            "taxable_value": round(v["taxable_value"], 2),
            "cgst": round(v["cgst"], 2),
            "sgst": round(v["sgst"], 2),
            "igst": round(v["igst"], 2),
            "total_tax": round(v["total_tax"], 2)
        }
        for r, v in sorted(rates_map.items())
    ]

    return {
        "taxable_value": round(taxable_value, 2),
        "cgst": round(cgst, 2),
        "sgst": round(sgst, 2),
        "igst": round(igst, 2),
        "total_tax": round(total_tax, 2),
        "gstr1_summary": gstr1_summary
    }

@router.get("/inventory-valuation")
def get_inventory_valuation(current_user: dict = Depends(get_current_user)):
    db = get_database()
    business_id = current_user["business_id"]
    products = list(db.products.find({"business_id": business_id}))

    total_items = len(products)
    total_cost_value = 0.0
    total_retail_value = 0.0
    low_stock_items = []

    for p in products:
        qty = float(p.get("stock", 0.0))
        cost = float(p.get("purchase_price", 0.0))
        price = float(p.get("selling_price", 0.0))
        min_stock = float(p.get("min_stock_level", 5.0))

        total_cost_value += qty * cost
        total_retail_value += qty * price

        if qty <= min_stock:
            low_stock_items.append({
                "name": p.get("name", ""),
                "sku": p.get("barcode") or p.get("code") or "N/A",
                "stock_quantity": qty,
                "low_stock_alert": min_stock
            })

    potential_profit = total_retail_value - total_cost_value

    return {
        "total_items": total_items,
        "total_cost_value": round(total_cost_value, 2),
        "total_retail_value": round(total_retail_value, 2),
        "potential_profit": round(potential_profit, 2),
        "low_stock_items": low_stock_items
    }

@router.get("/summary")
def get_reports_summary(
    period: str = Query("month"),
    current_user: dict = Depends(get_current_user)
):
    sales_rep = get_sales_report(period, current_user)
    pl_rep = get_profit_loss_report(period, current_user)
    gst_rep = get_gst_report(period, current_user)
    return {
        "period": period,
        "sales": sales_rep,
        "profit_and_loss": pl_rep,
        "gst_summary": gst_rep
    }

@router.get("/export/excel")
def export_excel(
    period: str = Query("month"),
    current_user: dict = Depends(get_current_user)
):
    from app.services.excel_service import generate_excel_report
    db = get_database()
    business_id = current_user["business_id"]
    invoices = list(db.invoices.find({"business_id": business_id}))
    products = list(db.products.find({"business_id": business_id}))
    purchases = list(db.purchases.find({"business_id": business_id}))
    expenses = list(db.expenses.find({"business_id": business_id}))

    excel_bytes = generate_excel_report(invoices, products, purchases, expenses)
    return Response(
        content=excel_bytes,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=Lax360_Business_Report.xlsx"}
    )
