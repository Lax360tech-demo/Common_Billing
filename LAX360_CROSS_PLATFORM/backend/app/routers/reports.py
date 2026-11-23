from fastapi import APIRouter, Depends, Query
from typing import Optional, Dict, Any, List
from app.core.security import get_current_user_payload
from app.database.mongodb import db_manager
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/sales")
async def get_sales_report(
    period: str = Query("this_month"),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    token_payload: dict = Depends(get_current_user_payload)
):
    store_id = token_payload.get("store_id", "6afe8821f89f056877145cb7")
    invoices_col = db_manager.get_collection("invoices")
    invoices = await invoices_col.find({"store_id": store_id})
    if not invoices:
        invoices = await invoices_col.find()

    now = datetime.now(timezone.utc)
    today_str = now.strftime("%Y-%m-%d")
    yesterday_str = (now - timedelta(days=1)).strftime("%Y-%m-%d")
    seven_days_ago = (now - timedelta(days=7)).strftime("%Y-%m-%d")
    month_start = now.replace(day=1).strftime("%Y-%m-%d")

    filtered_invoices = []
    for inv in invoices:
        inv_date = str(inv.get("date", ""))[:10]
        if period == "today" and inv_date != today_str:
            continue
        elif period == "yesterday" and inv_date != yesterday_str:
            continue
        elif period == "7days" and inv_date < seven_days_ago:
            continue
        elif period == "this_month" and inv_date < month_start:
            continue
        elif period == "custom":
            if start_date and inv_date < start_date[:10]:
                continue
            if end_date and inv_date > end_date[:10]:
                continue
        filtered_invoices.append(inv)

    gross = 0.0
    discount = 0.0
    taxable = 0.0
    cgst = 0.0
    sgst = 0.0
    total_tax = 0.0
    net_rev = 0.0
    items_sold = 0

    gst_slabs = {
        0.0: {"rate": 0.0, "taxable": 0.0, "cgst": 0.0, "sgst": 0.0, "totalTax": 0.0},
        5.0: {"rate": 5.0, "taxable": 0.0, "cgst": 0.0, "sgst": 0.0, "totalTax": 0.0},
        12.0: {"rate": 12.0, "taxable": 0.0, "cgst": 0.0, "sgst": 0.0, "totalTax": 0.0},
        18.0: {"rate": 18.0, "taxable": 0.0, "cgst": 0.0, "sgst": 0.0, "totalTax": 0.0},
        28.0: {"rate": 28.0, "taxable": 0.0, "cgst": 0.0, "sgst": 0.0, "totalTax": 0.0}
    }

    prod_map = {}
    daily_sales = {}

    for inv in filtered_invoices:
        s = inv.get("summary") or {}
        gross += float(s.get("grossSubtotal") or 0.0)
        discount += float(s.get("totalDiscount") or 0.0)
        taxable += float(s.get("taxableSubtotal") or 0.0)
        cgst += float(s.get("totalCGST") or 0.0)
        sgst += float(s.get("totalSGST") or 0.0)
        total_tax += float(s.get("totalTax") or 0.0)
        net_rev += float(s.get("netPayable") or 0.0)
        items_sold += int(s.get("totalQuantity") or 0)

        # Tax slabs
        for tb in s.get("taxBreakup") or []:
            r = float(tb.get("rate") or 5.0)
            if r not in gst_slabs:
                gst_slabs[r] = {"rate": r, "taxable": 0.0, "cgst": 0.0, "sgst": 0.0, "totalTax": 0.0}
            gst_slabs[r]["taxable"] = round(gst_slabs[r]["taxable"] + float(tb.get("taxable") or 0.0), 2)
            gst_slabs[r]["cgst"] = round(gst_slabs[r]["cgst"] + float(tb.get("cgst") or 0.0), 2)
            gst_slabs[r]["sgst"] = round(gst_slabs[r]["sgst"] + float(tb.get("sgst") or 0.0), 2)
            gst_slabs[r]["totalTax"] = round(gst_slabs[r]["totalTax"] + float(tb.get("totalTax") or 0.0), 2)

        # Items ranking
        for it in inv.get("items") or []:
            name = it.get("name", "Product")
            q = int(it.get("quantity") or 1)
            amt = float(it.get("lineTotal") or 0.0)
            if name not in prod_map:
                prod_map[name] = {"name": name, "fabric": it.get("fabric", ""), "quantity": 0, "sales": 0.0}
            prod_map[name]["quantity"] += q
            prod_map[name]["sales"] = round(prod_map[name]["sales"] + amt, 2)

        d_str = str(inv.get("date", ""))[:10]
        daily_sales[d_str] = round(daily_sales.get(d_str, 0.0) + float(s.get("netPayable") or 0.0), 2)

    top_products = sorted(prod_map.values(), key=lambda x: x["quantity"], reverse=True)
    for i, p in enumerate(top_products):
        p["rank"] = i + 1

    return {
        "period": period,
        "totalInvoices": len(filtered_invoices),
        "totalItemsSold": items_sold,
        "grossSubtotal": round(gross, 2),
        "totalDiscount": round(discount, 2),
        "taxableSubtotal": round(taxable, 2),
        "totalCGST": round(cgst, 2),
        "totalSGST": round(sgst, 2),
        "totalTax": round(total_tax, 2),
        "netRevenue": round(net_rev, 2),
        "gstBreakdown": list(gst_slabs.values()),
        "topProducts": top_products[:10],
        "dailySales": daily_sales
    }
