from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class InvoiceLineItem(BaseModel):
    id: Optional[str] = None
    productId: Optional[str] = None
    name: str
    sku: Optional[str] = ""
    barcode: Optional[str] = ""
    size: Optional[str] = ""
    color: Optional[str] = ""
    fabric: Optional[str] = ""
    quantity: int = 1
    unitPrice: float
    grossAmount: Optional[float] = 0.0
    discountType: Optional[str] = "fixed"
    discountValue: Optional[float] = 0.0
    itemDiscountAmount: Optional[float] = 0.0
    gstRate: Optional[float] = 5.0
    taxableAmount: Optional[float] = 0.0
    taxAmount: Optional[float] = 0.0
    cgstRate: Optional[float] = 2.5
    cgstAmount: Optional[float] = 0.0
    sgstRate: Optional[float] = 2.5
    sgstAmount: Optional[float] = 0.0
    lineTotal: Optional[float] = 0.0

class InvoicePayment(BaseModel):
    method: str = "Cash"
    reference: Optional[str] = ""
    amountReceived: Optional[float] = 0.0
    changeReturned: Optional[float] = 0.0
    splitDetails: Optional[Dict[str, float]] = None

class InvoiceSummary(BaseModel):
    totalItems: int = 0
    totalQuantity: int = 0
    grossSubtotal: float = 0.0
    totalItemDiscount: float = 0.0
    billDiscountAmount: float = 0.0
    couponDiscountAmount: float = 0.0
    festivalDiscountAmount: float = 0.0
    totalDiscount: float = 0.0
    taxableSubtotal: float = 0.0
    totalTax: float = 0.0
    totalCGST: float = 0.0
    totalSGST: float = 0.0
    grandTotal: float = 0.0
    roundOff: float = 0.0
    netPayable: float = 0.0
    taxBreakup: Optional[List[Dict[str, Any]]] = []

class InvoiceCreate(BaseModel):
    customer: Optional[Dict[str, Any]] = None
    items: List[Dict[str, Any]]
    billDiscount: Optional[Dict[str, Any]] = None
    coupon_code: Optional[str] = None
    payment: InvoicePayment
    notes: Optional[str] = ""

class InvoiceResponse(BaseModel):
    id: str
    store_id: str
    invoiceNumber: str
    date: str
    customer: Optional[Dict[str, Any]] = None
    items: List[Dict[str, Any]]
    summary: InvoiceSummary
    payment: InvoicePayment
    applied_coupon: Optional[Dict[str, Any]] = None
    applied_festival: Optional[Dict[str, Any]] = None
    generated_coupon: Optional[Dict[str, Any]] = None
    cashier: Optional[str] = ""
    notes: Optional[str] = ""
    status: str = "completed"
    created_at: Optional[str] = None
