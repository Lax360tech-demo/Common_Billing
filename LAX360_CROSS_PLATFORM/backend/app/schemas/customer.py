from pydantic import BaseModel
from typing import Optional

class CustomerCreate(BaseModel):
    name: str
    phone: str
    email: Optional[str] = ""
    city: Optional[str] = "Local"
    state: Optional[str] = "Tamil Nadu"
    address: Optional[str] = ""
    gstin: Optional[str] = ""
    type: Optional[str] = "Retail"

class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    city: Optional[str] = None
    state: Optional[str] = None
    address: Optional[str] = None
    gstin: Optional[str] = None
    type: Optional[str] = None

class CustomerResponse(BaseModel):
    id: str
    store_id: str
    name: str
    phone: str
    email: Optional[str] = ""
    city: Optional[str] = ""
    state: Optional[str] = ""
    address: Optional[str] = ""
    gstin: Optional[str] = ""
    type: str = "Retail"
    totalPurchases: Optional[float] = 0.0
    totalBills: Optional[int] = 0
    lastPurchaseDate: Optional[str] = None
    created_at: Optional[str] = None
