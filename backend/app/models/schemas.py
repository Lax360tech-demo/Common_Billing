from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, EmailStr

# Auth Schemas
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=2)
    email: EmailStr
    phone: str = Field(..., min_length=8)
    password: str = Field(..., min_length=4)
    business_name: str = Field(..., min_length=2)
    business_category: str = Field(default="retail_store")
    address: Optional[str] = ""
    gstin: Optional[str] = ""

class LoginRequest(BaseModel):
    identifier: str # Email or Phone
    password: str

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    token: str
    new_password: str

# Product Schemas
class ProductCreateRequest(BaseModel):
    name: str
    code: Optional[str] = None
    barcode: Optional[str] = None
    category: str = "General"
    brand: Optional[str] = ""
    description: Optional[str] = ""
    purchase_price: float = 0.0
    selling_price: float
    mrp: Optional[float] = None
    tax_rate: float = 0.0 # 0, 5, 12, 18, 28
    unit: str = "pcs"
    stock: float = 0.0
    min_stock_level: float = 5.0
    hsn: Optional[str] = ""
    image_url: Optional[str] = ""
    attributes: Optional[Dict[str, Any]] = Field(default_factory=dict)

class ProductUpdateRequest(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    barcode: Optional[str] = None
    category: Optional[str] = None
    brand: Optional[str] = None
    description: Optional[str] = None
    purchase_price: Optional[float] = None
    selling_price: Optional[float] = None
    mrp: Optional[float] = None
    tax_rate: Optional[float] = None
    unit: Optional[str] = None
    stock: Optional[float] = None
    min_stock_level: Optional[float] = None
    hsn: Optional[str] = None
    image_url: Optional[str] = None
    attributes: Optional[Dict[str, Any]] = None

# Stock Adjustment
class StockAdjustmentRequest(BaseModel):
    product_id: str
    adjustment_type: str # INWARD, OUTWARD, CORRECTION, DAMAGE, RETURN
    quantity: float
    reason: Optional[str] = ""

# Customer Schemas
class CustomerCreateRequest(BaseModel):
    name: str
    phone: str
    email: Optional[str] = ""
    address: Optional[str] = ""
    gstin: Optional[str] = ""
    opening_balance: Optional[float] = 0.0

class CustomerUpdateRequest(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None

# Supplier Schemas
class SupplierCreateRequest(BaseModel):
    name: str
    contact_person: Optional[str] = ""
    phone: str
    email: Optional[str] = ""
    address: Optional[str] = ""
    gstin: Optional[str] = ""
    opening_balance: Optional[float] = 0.0

class SupplierUpdateRequest(BaseModel):
    name: Optional[str] = None
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None

# Purchase Schemas
class PurchaseItem(BaseModel):
    product_id: Optional[str] = None
    name: str
    quantity: float
    unit_cost: float
    tax_rate: float = 0.0
    unit: str = "pcs"
    batch_number: Optional[str] = ""
    expiry_date: Optional[str] = ""

class PurchaseCreateRequest(BaseModel):
    supplier_id: str
    supplier_invoice_no: Optional[str] = ""
    purchase_date: Optional[str] = ""
    items: List[PurchaseItem]
    paid_amount: float = 0.0
    payment_method: str = "Bank Transfer"
    notes: Optional[str] = ""

# Expense Schemas
class ExpenseCreateRequest(BaseModel):
    category: str # Rent, Utilities, Salaries, Marketing, Maintenance, Office Supplies, Transport, Other
    description: str
    amount: float
    date: str
    payment_method: str = "Cash"
    reference: Optional[str] = ""

# Invoice / POS Sale Schemas
class SaleCartItem(BaseModel):
    product_id: Optional[str] = None
    name: str
    code: Optional[str] = ""
    barcode: Optional[str] = ""
    unit: str = "pcs"
    unit_price: float
    quantity: float
    discount_percent: float = 0.0
    tax_rate: float = 0.0
    hsn: Optional[str] = ""
    attributes: Optional[Dict[str, Any]] = None

class InvoiceCreateRequest(BaseModel):
    customer: Optional[Dict[str, Any]] = None # {name, phone, gstin, address}
    items: List[SaleCartItem]
    pricing_mode: str = "inclusive" # inclusive | exclusive
    cart_discount_percent: float = 0.0
    cart_discount_amount: float = 0.0
    round_off: float = 0.0
    payment_method: str = "Cash" # Cash, UPI, Card, Bank Transfer, Split
    split_details: Optional[Dict[str, float]] = None # e.g. {"Cash": 500, "UPI": 250}
    paid_amount: float
    notes: Optional[str] = ""

# Business Settings Schemas
class BusinessSettingsUpdateRequest(BaseModel):
    business_name: Optional[str] = None
    business_category: Optional[str] = None
    tagline: Optional[str] = None
    logo_url: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    pincode: Optional[str] = None
    gstin: Optional[str] = None
    currency: Optional[str] = "₹"
    timezone: Optional[str] = "Asia/Kolkata"
    invoice_prefix: Optional[str] = None
    next_sequence: Optional[int] = None
    tax_mode: Optional[str] = None # inclusive / exclusive
    default_gst_rate: Optional[float] = None
    default_discount: Optional[float] = None
    invoice_footer: Optional[str] = None
    default_paper_size: Optional[str] = "80mm" # 80mm | 58mm | A4
    default_payment_method: Optional[str] = "Cash"
    theme: Optional[str] = "indigo"
