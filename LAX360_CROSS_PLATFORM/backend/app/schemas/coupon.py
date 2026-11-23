from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class CouponCreate(BaseModel):
    code: str
    name: str
    description: Optional[str] = ""
    discount_type: str = "percent"  # "percent" or "fixed"
    discount_value: float
    min_purchase: Optional[float] = 0.0
    min_bill_amount: Optional[float] = 0.0
    max_discount: Optional[float] = 0.0
    max_discount_amount: Optional[float] = 0.0
    start_date: Optional[str] = None
    expiry_date: Optional[str] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    usage_limit: Optional[int] = 100
    max_uses: Optional[int] = 100
    applicable_categories: Optional[List[str]] = []
    active: Optional[bool] = True
    is_active: Optional[bool] = True
    customer_id: Optional[str] = None
    is_auto_generated: Optional[bool] = False

class CouponUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_purchase: Optional[float] = None
    min_bill_amount: Optional[float] = None
    max_discount: Optional[float] = None
    max_discount_amount: Optional[float] = None
    start_date: Optional[str] = None
    expiry_date: Optional[str] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    usage_limit: Optional[int] = None
    max_uses: Optional[int] = None
    applicable_categories: Optional[List[str]] = None
    active: Optional[bool] = None
    is_active: Optional[bool] = None

class CouponResponse(BaseModel):
    id: str
    store_id: str
    code: str
    name: str
    description: Optional[str] = ""
    discount_type: str = "percent"
    discount_value: float
    min_purchase: float = 0.0
    min_bill_amount: float = 0.0
    max_discount: float = 0.0
    max_discount_amount: float = 0.0
    start_date: Optional[str] = None
    expiry_date: Optional[str] = None
    valid_from: Optional[str] = None
    valid_until: Optional[str] = None
    usage_limit: int = 100
    max_uses: int = 100
    times_used: int = 0
    active: bool = True
    is_active: bool = True
    is_auto_generated: bool = False
    customer_id: Optional[str] = None
    created_at: Optional[str] = None

class CouponValidateRequest(BaseModel):
    code: str
    cart_total: float
    customer_id: Optional[str] = None
    categories: Optional[List[str]] = []

class FestivalOfferCreate(BaseModel):
    festival_name: str
    description: Optional[str] = ""
    discount_type: str = "percent"
    discount_value: float
    min_bill_amount: Optional[float] = 0.0
    max_discount: Optional[float] = 0.0
    start_date: str
    end_date: str
    applicable_categories: Optional[List[str]] = []
    priority: Optional[int] = 1
    active: Optional[bool] = True

class FestivalOfferUpdate(BaseModel):
    festival_name: Optional[str] = None
    description: Optional[str] = None
    discount_type: Optional[str] = None
    discount_value: Optional[float] = None
    min_bill_amount: Optional[float] = None
    max_discount: Optional[float] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    applicable_categories: Optional[List[str]] = None
    priority: Optional[int] = None
    active: Optional[bool] = None

class FestivalOfferResponse(BaseModel):
    id: str
    store_id: str
    festival_name: str
    description: Optional[str] = ""
    discount_type: str = "percent"
    discount_value: float
    min_bill_amount: float = 0.0
    max_discount: float = 0.0
    start_date: str
    end_date: str
    applicable_categories: List[str] = []
    priority: int = 1
    active: bool = True
    created_at: Optional[str] = None
