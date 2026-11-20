from pydantic import BaseModel
from typing import Optional, List, Any

class VariantModel(BaseModel):
    id: Optional[str] = None
    size: str
    color: str
    hex: Optional[str] = "#000000"
    sku: Optional[str] = ""
    barcode: Optional[str] = ""
    price: Optional[float] = None
    mrp: Optional[float] = None
    priceOverride: Optional[bool] = False
    mrpOverride: Optional[bool] = False

class ProductCreate(BaseModel):
    id: Optional[str] = None
    name: str
    category: str
    fabric: Optional[str] = ""
    brand: Optional[str] = ""
    hsn: Optional[str] = ""
    price: float
    mrp: float
    gstRate: Optional[float] = 5.0
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    status: Optional[str] = "active"
    variants: Optional[List[VariantModel]] = []

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    fabric: Optional[str] = None
    brand: Optional[str] = None
    hsn: Optional[str] = None
    price: Optional[float] = None
    mrp: Optional[float] = None
    gstRate: Optional[float] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    status: Optional[str] = None
    variants: Optional[List[VariantModel]] = None

class ProductResponse(BaseModel):
    id: str
    store_id: str
    name: str
    category: str
    fabric: Optional[str] = ""
    brand: Optional[str] = ""
    hsn: Optional[str] = ""
    price: float
    mrp: float
    gstRate: float = 5.0
    description: Optional[str] = ""
    image_url: Optional[str] = ""
    status: str = "active"
    variants: List[VariantModel] = []
    created_at: Optional[str] = None
    updated_at: Optional[str] = None
