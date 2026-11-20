import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.database import db_manager
from app.seed import seed_database

# Routers
from app.routes import (
    auth,
    business_categories,
    dashboard,
    products,
    inventory,
    invoices,
    customers,
    suppliers,
    purchases,
    expenses,
    reports,
    settings as settings_router
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lax360")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing Lax360 Billing SaaS Backend...")
    db_manager.connect()
    try:
        seed_database()
    except Exception as e:
        logger.warning(f"Database seed note: {e}")
    yield
    logger.info("Lax360 Backend shutdown.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="2.0.0",
    description="Lax360 Billing – Universal Business Billing & POS Management Software",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(business_categories.router)
app.include_router(dashboard.router)
app.include_router(products.router)
app.include_router(inventory.router)
app.include_router(invoices.router)
app.include_router(customers.router)
app.include_router(suppliers.router)
app.include_router(purchases.router)
app.include_router(expenses.router)
app.include_router(reports.router)
app.include_router(settings_router.router)

@app.get("/")
def root():
    return {
        "status": "online",
        "app": "Lax360 Billing",
        "version": "2.0.0",
        "tagline": "Universal Business Billing & POS Management Software"
    }

@app.get("/health")
def health():
    return {"status": "healthy"}
