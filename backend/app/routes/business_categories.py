from fastapi import APIRouter
from app.models.business_config import BUSINESS_CATEGORIES, get_business_config

router = APIRouter(prefix="/business-categories", tags=["Business Categories"])

@router.get("")
def list_categories():
    return {"categories": BUSINESS_CATEGORIES}

@router.get("/{category_id}")
def get_category_detail(category_id: str):
    return get_business_config(category_id)
