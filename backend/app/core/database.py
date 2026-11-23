import logging
from typing import Optional, Any
from pymongo import MongoClient, ASCENDING, DESCENDING
import mongomock
from app.core.config import settings

logger = logging.getLogger("lax360.database")

class DatabaseManager:
    def __init__(self):
        self.sync_client: Optional[Any] = None
        self.sync_db: Optional[Any] = None
        self.is_mock: bool = False

    def connect(self):
        if self.sync_db is not None:
            return

        mongo_uri = settings.MONGODB_URI.strip()
        if (
            settings.USE_IN_MEMORY_FALLBACK
            and (not mongo_uri or mongo_uri == "your-mongodb-connection-string")
        ):
            logger.warning("MongoDB URI is not configured. Using the in-memory database.")
            self.sync_client = mongomock.MongoClient()
            self.sync_db = self.sync_client[settings.DATABASE_NAME]
            self.is_mock = True
            self.create_indexes()
            return

        try:
            logger.info("Connecting to configured MongoDB Atlas...")
            client = MongoClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=8000,
                connectTimeoutMS=8000,
                retryWrites=True
            )
            client.admin.command('ping')
            self.sync_client = client
            self.sync_db = client[settings.DATABASE_NAME]
            self.is_mock = False
            logger.info("Connected successfully to live MongoDB Atlas!")
        except Exception as e:
            if settings.USE_IN_MEMORY_FALLBACK:
                logger.warning(f"MongoDB Atlas direct connection failed: {e}. Falling back to in-memory mongomock.")
                self.sync_client = mongomock.MongoClient()
                self.sync_db = self.sync_client[settings.DATABASE_NAME]
                self.is_mock = True
            else:
                logger.error(f"Failed to connect to MongoDB: {e}")
                raise e

        self.create_indexes()

    def get_db(self):
        if self.sync_db is None:
            self.connect()
        return self.sync_db

    def create_indexes(self):
        try:
            db = self.sync_db
            db.users.create_index([("email", ASCENDING)], unique=True)
            db.users.create_index([("business_id", ASCENDING)])
            db.businesses.create_index([("id", ASCENDING)], unique=True)
            db.products.create_index([("business_id", ASCENDING), ("code", ASCENDING)])
            db.products.create_index([("business_id", ASCENDING), ("barcode", ASCENDING)])
            db.invoices.create_index([("business_id", ASCENDING), ("invoice_number", ASCENDING)], unique=True)
            db.invoices.create_index([("business_id", ASCENDING), ("created_at", DESCENDING)])
            db.customers.create_index([("business_id", ASCENDING), ("phone", ASCENDING)])
            db.suppliers.create_index([("business_id", ASCENDING)])
            db.purchases.create_index([("business_id", ASCENDING), ("purchase_number", ASCENDING)])
            db.expenses.create_index([("business_id", ASCENDING), ("date", DESCENDING)])
        except Exception as e:
            logger.warning(f"Index creation notice: {e}")

db_manager = DatabaseManager()

def get_database():
    return db_manager.get_db()
