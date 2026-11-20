import math
from typing import List, Dict, Any, Tuple

def round_2(val: float) -> float:
    # 2 decimal places with float epsilon
    return round(float(val) + 1e-12, 2)

def calculate_line_item(item: dict, inclusive: bool = True) -> dict:
    quantity = int(item.get("quantity") or 1)
    unit_price = float(item.get("unitPrice") or 0.0)
    gst_rate = float(item.get("gstRate") or 5.0)
    gross_amount = round_2(quantity * unit_price)

    discount_type = item.get("discountType", "fixed")
    discount_val = float(item.get("discountValue") or 0.0)

    if discount_type == "percent":
        item_discount = round_2(gross_amount * min(100.0, max(0.0, discount_val)) / 100.0)
    else:
        item_discount = round_2(min(gross_amount, max(0.0, discount_val)))

    taxable_base = max(0.0, gross_amount - item_discount)

    if inclusive:
        taxable_amount = round_2(taxable_base / (1.0 + (gst_rate / 100.0)))
        tax_amount = round_2(taxable_base - taxable_amount)
        line_total = round_2(taxable_base)
    else:
        taxable_amount = round_2(taxable_base)
        tax_amount = round_2(taxable_amount * gst_rate / 100.0)
        line_total = round_2(taxable_amount + tax_amount)

    cgst_rate = round_2(gst_rate / 2.0)
    sgst_rate = round_2(gst_rate / 2.0)
    cgst_amount = round_2(tax_amount / 2.0)
    sgst_amount = round_2(tax_amount - cgst_amount)

    res = dict(item)
    res.update({
        "grossAmount": gross_amount,
        "itemDiscountAmount": item_discount,
        "taxableAmount": taxable_amount,
        "taxAmount": tax_amount,
        "cgstRate": cgst_rate,
        "cgstAmount": cgst_amount,
        "sgstRate": sgst_rate,
        "sgstAmount": sgst_amount,
        "lineTotal": line_total
    })
    return res

def calculate_invoice_totals(
    items: List[dict],
    bill_discount: dict = None,
    inclusive: bool = True,
    coupon_discount: float = 0.0,
    festival_discount: float = 0.0
) -> Tuple[dict, List[dict]]:
    if not items:
        empty_summary = {
            "totalItems": 0,
            "totalQuantity": 0,
            "grossSubtotal": 0.0,
            "totalItemDiscount": 0.0,
            "billDiscountAmount": 0.0,
            "couponDiscountAmount": 0.0,
            "festivalDiscountAmount": 0.0,
            "totalDiscount": 0.0,
            "taxableSubtotal": 0.0,
            "totalTax": 0.0,
            "totalCGST": 0.0,
            "totalSGST": 0.0,
            "grandTotal": 0.0,
            "roundOff": 0.0,
            "netPayable": 0.0,
            "taxBreakup": []
        }
        return empty_summary, []

    total_qty = 0
    total_gross = 0.0
    total_item_discount = 0.0
    processed_items = []

    for it in items:
        processed = calculate_line_item(it, inclusive)
        total_qty += int(processed["quantity"])
        total_gross += float(processed["grossAmount"])
        total_item_discount += float(processed["itemDiscountAmount"])
        processed_items.append(processed)

    net_after_item_disc = max(0.0, total_gross - total_item_discount)

    # Bill-level discount
    bill_disc_val = 0.0
    if bill_discount:
        b_type = bill_discount.get("type", "fixed")
        b_val = float(bill_discount.get("value") or 0.0)
        if b_type == "percent":
            bill_disc_val = round_2(net_after_item_disc * min(100.0, max(0.0, b_val)) / 100.0)
        else:
            bill_disc_val = round_2(min(net_after_item_disc, max(0.0, b_val)))

    coupon_disc_val = round_2(min(max(0.0, net_after_item_disc - bill_disc_val), float(coupon_discount or 0.0)))
    fest_disc_val = round_2(min(max(0.0, net_after_item_disc - bill_disc_val - coupon_disc_val), float(festival_discount or 0.0)))

    total_basket_discounts = bill_disc_val + coupon_disc_val + fest_disc_val
    multiplier = max(0.0, net_after_item_disc - total_basket_discounts) / net_after_item_disc if net_after_item_disc > 0 else 1.0

    sum_taxable = 0.0
    sum_cgst = 0.0
    sum_sgst = 0.0
    sum_tax = 0.0
    tax_breakup_dict = {}

    for it in processed_items:
        eff_line = round_2(it["grossAmount"] - it["itemDiscountAmount"]) * multiplier
        rate = float(it.get("gstRate") or 5.0)

        if inclusive:
            taxable_val = round_2(eff_line / (1.0 + (rate / 100.0)))
            tax_val = round_2(eff_line - taxable_val)
        else:
            taxable_val = round_2(eff_line)
            tax_val = round_2(taxable_val * rate / 100.0)

        cgst_val = round_2(tax_val / 2.0)
        sgst_val = round_2(tax_val - cgst_val)

        sum_taxable += taxable_val
        sum_cgst += cgst_val
        sum_sgst += sgst_val
        sum_tax += tax_val

        if rate not in tax_breakup_dict:
            tax_breakup_dict[rate] = {
                "rate": rate,
                "taxable": 0.0,
                "cgst": 0.0,
                "sgst": 0.0,
                "totalTax": 0.0
            }
        tax_breakup_dict[rate]["taxable"] = round_2(tax_breakup_dict[rate]["taxable"] + taxable_val)
        tax_breakup_dict[rate]["cgst"] = round_2(tax_breakup_dict[rate]["cgst"] + cgst_val)
        tax_breakup_dict[rate]["sgst"] = round_2(tax_breakup_dict[rate]["sgst"] + sgst_val)
        tax_breakup_dict[rate]["totalTax"] = round_2(tax_breakup_dict[rate]["totalTax"] + tax_val)

    sum_taxable = round_2(sum_taxable)
    sum_cgst = round_2(sum_cgst)
    sum_sgst = round_2(sum_sgst)
    sum_tax = round_2(sum_tax)

    if inclusive:
        grand_total = round_2(net_after_item_disc - total_basket_discounts)
    else:
        grand_total = round_2(sum_taxable + sum_tax)

    net_payable = max(0.0, float(round(grand_total)))
    round_off = round_2(net_payable - grand_total)

    summary = {
        "totalItems": len(items),
        "totalQuantity": total_qty,
        "grossSubtotal": round_2(total_gross),
        "totalItemDiscount": round_2(total_item_discount),
        "billDiscountAmount": bill_disc_val,
        "couponDiscountAmount": coupon_disc_val,
        "festivalDiscountAmount": fest_disc_val,
        "totalDiscount": round_2(total_item_discount + total_basket_discounts),
        "taxableSubtotal": sum_taxable,
        "totalTax": sum_tax,
        "totalCGST": sum_cgst,
        "totalSGST": sum_sgst,
        "grandTotal": grand_total,
        "roundOff": round_off,
        "netPayable": net_payable,
        "taxBreakup": list(tax_breakup_dict.values())
    }

    return summary, processed_items

def validate_payment(net_payable: float, payment: dict) -> Tuple[bool, str, dict]:
    method = payment.get("method", "Cash")
    r_payable = round_2(net_payable)

    if method == "Cash":
        tendered = float(payment.get("amountReceived") or 0.0)
        if tendered < r_payable:
            return False, f"Tendered amount (₹{tendered}) cannot be less than total payable (₹{r_payable}).", {}
        change_returned = round_2(tendered - r_payable)
        return True, "", {"changeReturned": change_returned, "reference": payment.get("reference", "")}

    elif method == "UPI":
        ref = payment.get("reference") or f"UPI/POS/{int(round_2(net_payable))}"
        return True, "", {"changeReturned": 0.0, "reference": ref}

    elif method == "Card":
        ref = payment.get("reference") or f"CARD/APPR/{int(round_2(net_payable))}"
        return True, "", {"changeReturned": 0.0, "reference": ref}

    elif method == "Split":
        splits = payment.get("splitDetails") or {}
        tot = round_2(float(splits.get("cash") or 0.0) + float(splits.get("upi") or 0.0) + float(splits.get("card") or 0.0))
        if abs(tot - r_payable) > 0.5:
            return False, f"Sum of split payments (₹{tot}) must match net payable (₹{r_payable}).", {}
        return True, "", {"changeReturned": 0.0, "reference": payment.get("reference", ""), "splitDetails": splits}

    return True, "", {"changeReturned": 0.0, "reference": ""}

def generate_invoice_number(prefix: str = "TEX-2026-", seq: int = 1001) -> str:
    return f"{prefix}{str(seq).zfill(4)}"
