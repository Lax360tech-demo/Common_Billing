from pydantic import BaseModel
from typing import Optional, Dict, Any

class StoreProfile(BaseModel):
    storeName: str = "Lady Avenue Showroom"
    tagline: Optional[str] = "Authentic Textile & Apparel Store"
    address: Optional[str] = "124, Usman Road, T. Nagar"
    city: Optional[str] = "Salem"
    state: Optional[str] = "Tamil Nadu"
    stateCode: Optional[str] = "33"
    pincode: Optional[str] = "600017"
    phone: Optional[str] = "9876543210"
    email: Optional[str] = "admin@gmail.com"
    gstin: Optional[str] = "33AABCS8899K1ZM"
    pan: Optional[str] = ""

class BillingConfig(BaseModel):
    invoicePrefix: str = "TEX-2026-"
    nextSequence: int = 1001
    defaultGSTRate: float = 5.0
    pricingMode: str = "inclusive"  # "inclusive" or "exclusive"
    defaultPaperSize: str = "80mm"  # "80mm", "58mm", "A4"
    defaultPaymentMethod: str = "Cash"
    enableRounding: bool = True
    cashierName: str = "Admin Manager"
    enableAutoCoupons: bool = True
    autoCouponThreshold: float = 2000.0
    autoCouponDiscount: float = 100.0
    autoCouponMinPurchase: float = 1000.0
    termsAndConditions: Optional[str] = (
        "1. Goods once sold can be exchanged within 7 days with original bill.\n"
        "2. Cut-length fabrics & pure silk sarees are non-returnable.\n"
        "Thank you for shopping with us!"
    )

class SettingsUpdate(BaseModel):
    store: Optional[StoreProfile] = None
    billing: Optional[BillingConfig] = None
    appearance: Optional[Dict[str, Any]] = None
