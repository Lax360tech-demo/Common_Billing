import io
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side

def generate_excel_report(invoices, products, purchases, expenses) -> bytes:
    wb = openpyxl.Workbook()

    # Sheet 1: Sales Invoices
    ws_sales = wb.active
    ws_sales.title = "Sales Invoices"
    headers = ["Invoice #", "Date", "Customer Name", "Customer Phone", "Payment Method", "Items Count", "Subtotal", "Tax Amount", "Grand Total", "Status"]
    ws_sales.append(headers)

    header_fill = PatternFill(start_color="4F46E5", end_color="4F46E5", fill_type="solid")
    header_font = Font(name="Calibri", size=11, bold=True, color="FFFFFF")

    for col_num in range(1, len(headers) + 1):
        cell = ws_sales.cell(row=1, column=col_num)
        cell.fill = header_fill
        cell.font = header_font

    for inv in invoices:
        cust = inv.get("customer", {})
        ws_sales.append([
            inv.get("invoice_number", ""),
            inv.get("date", ""),
            cust.get("name", "Walk-in"),
            cust.get("phone", ""),
            inv.get("payment_method", "Cash"),
            inv.get("item_count", len(inv.get("items", []))),
            inv.get("subtotal", 0.0),
            inv.get("tax_amount", 0.0),
            inv.get("grand_total", 0.0),
            inv.get("payment_status", "Paid")
        ])

    # Sheet 2: Inventory Valuation
    ws_inv = wb.create_sheet(title="Product Inventory")
    inv_headers = ["Code", "Product Name", "Category", "Brand", "Unit", "Purchase Cost", "Selling Price", "In Stock", "Stock Cost Value", "Stock Retail Value"]
    ws_inv.append(inv_headers)
    for col_num in range(1, len(inv_headers) + 1):
        cell = ws_inv.cell(row=1, column=col_num)
        cell.fill = header_fill
        cell.font = header_font

    for p in products:
        qty = float(p.get("stock", 0.0))
        cost = float(p.get("purchase_price", 0.0))
        sell = float(p.get("selling_price", 0.0))
        ws_inv.append([
            p.get("code", ""),
            p.get("name", ""),
            p.get("category", "General"),
            p.get("brand", ""),
            p.get("unit", "pcs"),
            cost,
            sell,
            qty,
            round(qty * cost, 2),
            round(qty * sell, 2)
        ])

    # Sheet 3: Purchases
    ws_purch = wb.create_sheet(title="Purchases")
    purch_headers = ["PO Number", "Purchase Date", "Supplier", "Invoice Ref", "Payment Status", "Taxable Amount", "Tax Amount", "Total Amount"]
    ws_purch.append(purch_headers)
    for col_num in range(1, len(purch_headers) + 1):
        cell = ws_purch.cell(row=1, column=col_num)
        cell.fill = header_fill
        cell.font = header_font

    for pr in purchases:
        ws_purch.append([
            pr.get("purchase_number", ""),
            pr.get("purchase_date", ""),
            pr.get("supplier_name", ""),
            pr.get("supplier_invoice_no", ""),
            pr.get("payment_status", "Paid"),
            pr.get("taxable_amount", 0.0),
            pr.get("tax_amount", 0.0),
            pr.get("total_amount", 0.0)
        ])

    # Sheet 4: Expenses
    ws_exp = wb.create_sheet(title="Expenses")
    exp_headers = ["Date", "Category", "Description", "Payment Method", "Amount", "Reference"]
    ws_exp.append(exp_headers)
    for col_num in range(1, len(exp_headers) + 1):
        cell = ws_exp.cell(row=1, column=col_num)
        cell.fill = header_fill
        cell.font = header_font

    for ex in expenses:
        ws_exp.append([
            ex.get("date", ""),
            ex.get("category", "Other"),
            ex.get("description", ""),
            ex.get("payment_method", "Cash"),
            ex.get("amount", 0.0),
            ex.get("reference", "")
        ])

    buffer = io.BytesIO()
    wb.save(buffer)
    buffer.seek(0)
    return buffer.getvalue()
