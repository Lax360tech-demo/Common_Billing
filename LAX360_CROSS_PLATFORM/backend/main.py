from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from contextlib import asynccontextmanager
import uvicorn
import os

from app.core.config import settings
from app.database.mongodb import db_manager
from app.database.seed_data import seed_initial_data

from app.routers import (
    auth, products, customers, invoices, coupons, festival_offers,
    dashboard, reports, settings as store_settings
)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("[LAX360 API] Starting up backend service...")
    await db_manager.connect()
    await seed_initial_data(db_manager)
    print("[LAX360 API] Initialization complete and ready to serve requests.")
    yield
    # Shutdown
    print("[LAX360 API] Shutting down backend service.")

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    description="LAX360 Cross-Platform Textile Billing & POS API Engine",
    lifespan=lifespan
)

# CORS Configuration
origins = ["*"] if settings.CORS_ORIGINS == "*" else [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Healthcheck
@app.get("/api/health")
@app.get("/health")
def healthcheck():
    return {
        "status": "ok",
        "service": "LAX360 Backend",
        "database": "Atlas" if db_manager.is_atlas else "Persistent Local Engine"
    }

# Mount routers under /api/v1, /api, and direct root
for prefix in [settings.API_V1_STR, "/api", ""]:
    app.include_router(auth.router, prefix=prefix)
    app.include_router(products.router, prefix=prefix)
    app.include_router(customers.router, prefix=prefix)
    app.include_router(invoices.router, prefix=prefix)
    app.include_router(coupons.router, prefix=prefix)
    app.include_router(festival_offers.router, prefix=prefix)
    app.include_router(dashboard.router, prefix=prefix)
    app.include_router(reports.router, prefix=prefix)
    app.include_router(store_settings.router, prefix=prefix)

# Serve Frontend static assets directly from FastAPI
frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "frontend", "dist"))

if os.path.exists(frontend_dist):
    assets_dir = os.path.join(frontend_dist, "assets")
    if os.path.exists(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/")
    async def index_root():
        index_file = os.path.join(frontend_dist, "index.html")
        return FileResponse(index_file)

    @app.get("/{catchall:path}")
    async def catch_all_spa(catchall: str):
        # Don't intercept API or docs routes
        if catchall.startswith(("api", "docs", "openapi.json", "health")):
            return
        target = os.path.join(frontend_dist, catchall)
        if os.path.exists(target) and os.path.isfile(target):
            return FileResponse(target)
        return FileResponse(os.path.join(frontend_dist, "index.html"))

if __name__ == "__main__":
    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=True)
