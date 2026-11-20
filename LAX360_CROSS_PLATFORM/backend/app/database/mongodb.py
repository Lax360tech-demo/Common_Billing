import json
import os
import uuid
import asyncio
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from app.core.config import settings

try:
    from motor.motor_asyncio import AsyncIOMotorClient
    HAS_MOTOR = True
except ImportError:
    HAS_MOTOR = False

class MemoryCollection:
    def __init__(self, name: str, persistence_path: Optional[str] = None):
        self.name = name
        self.documents: Dict[str, dict] = {}
        self.persistence_path = persistence_path
        self._load()

    def _load(self):
        if self.persistence_path and os.path.exists(self.persistence_path):
            try:
                with open(self.persistence_path, "r", encoding="utf-8") as f:
                    docs = json.load(f)
                    for d in docs:
                        doc_id = str(d.get("_id") or d.get("id"))
                        self.documents[doc_id] = d
            except Exception as e:
                print(f"[Fallback DB] Warning loading {self.name}: {e}")

    def _save(self):
        if self.persistence_path:
            try:
                os.makedirs(os.path.dirname(self.persistence_path), exist_ok=True)
                with open(self.persistence_path, "w", encoding="utf-8") as f:
                    json.dump(list(self.documents.values()), f, default=str, indent=2)
            except Exception as e:
                print(f"[Fallback DB] Warning saving {self.name}: {e}")

    async def find_one(self, query: dict) -> Optional[dict]:
        for doc in self.documents.values():
            match = True
            for k, v in query.items():
                target = doc.get(k)
                if k == "id" and "_id" in doc and target is None:
                    target = str(doc.get("_id"))
                if target != v:
                    match = False
                    break
            if match:
                return dict(doc)
        return None

    async def find(self, query: Optional[dict] = None) -> List[dict]:
        results = []
        for doc in self.documents.values():
            if not query:
                results.append(dict(doc))
                continue
            match = True
            for k, v in query.items():
                target = doc.get(k)
                if k == "id" and "_id" in doc and target is None:
                    target = str(doc.get("_id"))
                if target != v:
                    match = False
                    break
            if match:
                results.append(dict(doc))
        return results

    async def insert_one(self, doc: dict) -> Any:
        doc_copy = dict(doc)
        doc_id = str(doc_copy.get("_id") or doc_copy.get("id") or uuid.uuid4().hex)
        doc_copy["_id"] = doc_id
        doc_copy["id"] = doc_id
        self.documents[doc_id] = doc_copy
        self._save()
        class InsertResult:
            inserted_id = doc_id
        return InsertResult()

    async def update_one(self, query: dict, update: dict) -> Any:
        target = await self.find_one(query)
        if not target:
            return None
        doc_id = str(target.get("_id") or target.get("id"))
        update_fields = update.get("$set", update)
        self.documents[doc_id].update(update_fields)
        self._save()
        return self.documents[doc_id]

    async def delete_one(self, query: dict) -> bool:
        target = await self.find_one(query)
        if not target:
            return False
        doc_id = str(target.get("_id") or target.get("id"))
        if doc_id in self.documents:
            del self.documents[doc_id]
            self._save()
            return True
        return False

    async def count_documents(self, query: Optional[dict] = None) -> int:
        docs = await self.find(query)
        return len(docs)

class DatabaseManager:
    def __init__(self):
        self.client = None
        self.db = None
        self.is_atlas = False
        self._memory_collections: Dict[str, MemoryCollection] = {}

    async def connect(self):
        if settings.MONGODB_URI and HAS_MOTOR:
            try:
                print(f"[MongoDB] Connecting to Atlas cluster...")
                self.client = AsyncIOMotorClient(settings.MONGODB_URI, serverSelectionTimeoutMS=4000)
                await self.client.admin.command('ping')
                self.db = self.client[settings.DATABASE_NAME]
                self.is_atlas = True
                print("[MongoDB] Successfully connected to MongoDB Atlas!")
                return
            except Exception as e:
                print(f"[MongoDB] Atlas connection could not be established ({e}). Engaging embedded fallback storage.")
                self.is_atlas = False
        else:
            print("[MongoDB] No MONGODB_URI provided. Running with high-performance persistent fallback storage.")
            self.is_atlas = False

    def get_collection(self, collection_name: str):
        if self.is_atlas and self.db is not None:
            return self.db[collection_name]
        
        if collection_name not in self._memory_collections:
            base_dir = os.path.join(os.path.dirname(__file__), "storage")
            file_path = os.path.join(base_dir, f"{collection_name}.json")
            self._memory_collections[collection_name] = MemoryCollection(collection_name, file_path)
        return self._memory_collections[collection_name]

db_manager = DatabaseManager()
