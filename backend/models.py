"""
DemandX 2.0 — Relational Schema Models (SQLAlchemy 2.x)
======================================================
Covers all 21 normalized entities:
1. users
2. organizations
3. organization_memberships
4. retailer_stores
5. suppliers
6. manufacturers
7. products
8. product_batches
9. inventory
10. sales_transactions
11. sales_transaction_items
12. purchase_orders
13. purchase_order_items
14. order_status_history
15. demand_forecasts
16. reorder_recommendations
17. supplier_product_offers
18. ai_conversations
19. ai_messages
20. knowledge_documents & knowledge_chunks
21. audit_logs
"""

import time
import uuid
from datetime import datetime
from typing import Optional, List
from sqlalchemy import (
    Column, String, Integer, Float, Boolean, Text, ForeignKey,
    DateTime, JSON, Index, UniqueConstraint
)
from sqlalchemy.orm import relationship

from backend.db_session import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


# =====================================================================
# 1. USERS & ORGANIZATIONS
# =====================================================================

class User(Base):
    __tablename__ = "users"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    email = Column(String(255), unique=True, nullable=False, index=True)
    full_name = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default="retailer")  # retailer, supplier, manufacturer, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    memberships = relationship("OrganizationMembership", back_populates="user", cascade="all, delete-orphan")


class Organization(Base):
    __tablename__ = "organizations"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    name = Column(String(255), nullable=False)
    type = Column(String(50), nullable=False)  # RETAILER, SUPPLIER, MANUFACTURER
    gstin = Column(String(20), nullable=True)
    city = Column(String(100), nullable=False, default="Guntur")
    state = Column(String(100), nullable=False, default="Andhra Pradesh")
    created_at = Column(DateTime, default=datetime.utcnow)

    memberships = relationship("OrganizationMembership", back_populates="organization", cascade="all, delete-orphan")
    retailer_stores = relationship("RetailerStore", back_populates="organization")
    suppliers = relationship("Supplier", back_populates="organization")
    manufacturers = relationship("Manufacturer", back_populates="organization")


class OrganizationMembership(Base):
    __tablename__ = "organization_memberships"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    organization_id = Column(String(64), ForeignKey("organizations.id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(50), nullable=False, default="MEMBER")  # OWNER, ADMIN, MEMBER
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="memberships")
    organization = relationship("Organization", back_populates="memberships")


# =====================================================================
# 2. BUSINESS UNITS (RETAILER STORE, SUPPLIER, MANUFACTURER)
# =====================================================================

class RetailerStore(Base):
    __tablename__ = "retailer_stores"

    id = Column(String(64), primary_key=True)  # e.g., 'GUNTUR_STORE_01'
    organization_id = Column(String(64), ForeignKey("organizations.id"), nullable=True)
    name = Column(String(255), nullable=False)
    location = Column(String(255), nullable=False)
    region = Column(String(100), nullable=False, default="Guntur")
    store_type = Column(String(50), nullable=False, default="Kirana / Supermarket")
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="retailer_stores")
    inventory_items = relationship("Inventory", back_populates="store")
    purchase_orders = relationship("PurchaseOrder", back_populates="store")


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(String(64), primary_key=True)  # e.g., 'SUP_GUNTUR_01'
    organization_id = Column(String(64), ForeignKey("organizations.id"), nullable=True)
    name = Column(String(255), nullable=False)
    hub = Column(String(255), nullable=False)
    phone = Column(String(50), nullable=True)
    lead_time_days = Column(Integer, default=2)
    min_order_value_inr = Column(Float, default=5000.0)
    rating = Column(Float, default=4.8)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="suppliers")
    product_offers = relationship("SupplierProductOffer", back_populates="supplier")
    purchase_orders = relationship("PurchaseOrder", back_populates="supplier")


class Manufacturer(Base):
    __tablename__ = "manufacturers"

    id = Column(String(64), primary_key=True)  # e.g., 'MFG_KRISHNA_MILLS'
    organization_id = Column(String(64), ForeignKey("organizations.id"), nullable=True)
    name = Column(String(255), nullable=False)
    plant_location = Column(String(255), nullable=False)
    capacity_mt = Column(Float, default=5000.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    organization = relationship("Organization", back_populates="manufacturers")
    products = relationship("Product", back_populates="manufacturer")


# =====================================================================
# 3. PRODUCTS, BATCHES & INVENTORY
# =====================================================================

class Product(Base):
    __tablename__ = "products"

    id = Column(String(64), primary_key=True)  # e.g., 'sona-masoori-rice'
    sku = Column(String(64), unique=True, nullable=False, index=True)
    name = Column(String(255), nullable=False, index=True)
    category = Column(String(100), nullable=False, index=True)
    brand = Column(String(100), nullable=False)
    unit = Column(String(50), nullable=False)  # e.g. '5kg bag', '1kg pack', '1L pouch'
    pack_size = Column(String(50), nullable=False, default="Standard")
    wholesale_price = Column(Float, nullable=False)
    retail_price = Column(Float, nullable=False)
    mrp = Column(Float, nullable=False)
    shelf_life_days = Column(Integer, default=365)
    storage_instructions = Column(String(255), default="Store in a cool, dry place. Keep away from moisture.")
    hsn_code = Column(String(20), default="100630")
    gst_rate = Column(Float, default=5.0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    manufacturer_id = Column(String(64), ForeignKey("manufacturers.id"), nullable=True)
    manufacturer = relationship("Manufacturer", back_populates="products")

    batches = relationship("ProductBatch", back_populates="product")
    inventory_items = relationship("Inventory", back_populates="product")
    offers = relationship("SupplierProductOffer", back_populates="product")


class ProductBatch(Base):
    __tablename__ = "product_batches"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    batch_number = Column(String(64), nullable=False, index=True)
    product_id = Column(String(64), ForeignKey("products.id"), nullable=False, index=True)
    mfg_date = Column(DateTime, nullable=False)
    best_before_date = Column(DateTime, nullable=False)
    quantity = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="batches")


class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    store_id = Column(String(64), ForeignKey("retailer_stores.id"), nullable=False, index=True)
    product_id = Column(String(64), ForeignKey("products.id"), nullable=False, index=True)
    current_stock = Column(Integer, default=0, nullable=False)
    safety_stock = Column(Integer, default=50, nullable=False)
    reorder_threshold = Column(Integer, default=30, nullable=False)
    last_restocked_at = Column(DateTime, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("store_id", "product_id", name="uq_store_product_inventory"),
    )

    store = relationship("RetailerStore", back_populates="inventory_items")
    product = relationship("Product", back_populates="inventory_items")


# =====================================================================
# 4. SALES TRANSACTIONS (RETAILER POS / CUSTOMER ORDERS)
# =====================================================================

class SalesTransaction(Base):
    __tablename__ = "sales_transactions"

    id = Column(String(64), primary_key=True)  # e.g., 'DX-10420'
    store_id = Column(String(64), ForeignKey("retailer_stores.id"), nullable=False, index=True)
    customer_name = Column(String(255), default="Walk-in Customer")
    total_amount = Column(Float, nullable=False)
    payment_method = Column(String(50), default="UPI")  # UPI, Cash, VyaPulse Khata
    status = Column(String(50), default="COMPLETED")
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    items = relationship("SalesTransactionItem", back_populates="transaction", cascade="all, delete-orphan")


class SalesTransactionItem(Base):
    __tablename__ = "sales_transaction_items"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    transaction_id = Column(String(64), ForeignKey("sales_transactions.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String(64), ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)

    transaction = relationship("SalesTransaction", back_populates="items")
    product = relationship("Product")


# =====================================================================
# 5. PURCHASE ORDERS, ITEMS & STATUS HISTORY
# =====================================================================

class PurchaseOrder(Base):
    __tablename__ = "purchase_orders"

    id = Column(String(64), primary_key=True)  # e.g., 'PO-9401'
    store_id = Column(String(64), ForeignKey("retailer_stores.id"), nullable=False, index=True)
    supplier_id = Column(String(64), ForeignKey("suppliers.id"), nullable=False, index=True)
    total_amount = Column(Float, nullable=False)
    status = Column(String(50), default="DRAFT", nullable=False, index=True)
    # Lifecycle: DRAFT -> SUBMITTED -> ACCEPTED -> PACKED -> DISPATCHED -> DELIVERED (or REJECTED / CANCELLED)
    rejection_reason = Column(String(255), nullable=True)
    cancellation_reason = Column(String(255), nullable=True)
    lead_time_days = Column(Integer, default=2)
    is_demo = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    submitted_at = Column(DateTime, nullable=True)
    accepted_at = Column(DateTime, nullable=True)
    packed_at = Column(DateTime, nullable=True)
    dispatched_at = Column(DateTime, nullable=True)
    delivered_at = Column(DateTime, nullable=True)
    cancelled_at = Column(DateTime, nullable=True)

    store = relationship("RetailerStore", back_populates="purchase_orders")
    supplier = relationship("Supplier", back_populates="purchase_orders")
    items = relationship("PurchaseOrderItem", back_populates="purchase_order", cascade="all, delete-orphan")
    history = relationship("OrderStatusHistory", back_populates="purchase_order", cascade="all, delete-orphan")


class PurchaseOrderItem(Base):
    __tablename__ = "purchase_order_items"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    purchase_order_id = Column(String(64), ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(String(64), ForeignKey("products.id"), nullable=False)
    product_name = Column(String(255), nullable=False)
    quantity = Column(Integer, nullable=False)
    unit = Column(String(50), nullable=False)
    unit_price = Column(Float, nullable=False)
    total_price = Column(Float, nullable=False)

    purchase_order = relationship("PurchaseOrder", back_populates="items")
    product = relationship("Product")


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    purchase_order_id = Column(String(64), ForeignKey("purchase_orders.id", ondelete="CASCADE"), nullable=False, index=True)
    from_status = Column(String(50), nullable=False)
    to_status = Column(String(50), nullable=False)
    changed_by = Column(String(255), nullable=False)
    reason = Column(String(255), nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)

    purchase_order = relationship("PurchaseOrder", back_populates="history")


# =====================================================================
# 6. DEMAND FORECASTS, REORDERS & OFFERS
# =====================================================================

class DemandForecast(Base):
    __tablename__ = "demand_forecasts"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    store_id = Column(String(64), ForeignKey("retailer_stores.id"), nullable=False, index=True)
    product_id = Column(String(64), ForeignKey("products.id"), nullable=False, index=True)
    forecast_horizon_days = Column(Integer, default=7)
    predicted_demand = Column(Float, nullable=False)
    demand_level = Column(String(50), default="MEDIUM")
    model_version = Column(String(50), default="XGBoost_v2.0_R2_0.9626")
    accuracy_metric = Column(String(50), default="R2=0.9626, MAE=10.62")
    created_at = Column(DateTime, default=datetime.utcnow)


class ReorderRecommendation(Base):
    __tablename__ = "reorder_recommendations"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    store_id = Column(String(64), ForeignKey("retailer_stores.id"), nullable=False, index=True)
    product_id = Column(String(64), ForeignKey("products.id"), nullable=False, index=True)
    recommended_order_units = Column(Integer, nullable=False)
    formula_explanation = Column(Text, nullable=False)
    stockout_risk = Column(String(50), default="MEDIUM")
    urgency = Column(String(50), default="STANDARD")
    created_at = Column(DateTime, default=datetime.utcnow)


class SupplierProductOffer(Base):
    __tablename__ = "supplier_product_offers"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    supplier_id = Column(String(64), ForeignKey("suppliers.id"), nullable=False, index=True)
    product_id = Column(String(64), ForeignKey("products.id"), nullable=False, index=True)
    moq = Column(Integer, default=10)
    wholesale_price = Column(Float, nullable=False)
    lead_time_days = Column(Integer, default=2)
    in_stock = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    supplier = relationship("Supplier", back_populates="product_offers")
    product = relationship("Product", back_populates="offers")


# =====================================================================
# 7. AI CONVERSATIONS, MESSAGES & KNOWLEDGE
# =====================================================================

class AIConversation(Base):
    __tablename__ = "ai_conversations"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    user_id = Column(String(64), nullable=True, index=True)
    role = Column(String(50), default="retailer")
    store_id = Column(String(64), default="GUNTUR_STORE_01")
    language = Column(String(10), default="en")
    created_at = Column(DateTime, default=datetime.utcnow)

    messages = relationship("AIMessage", back_populates="conversation", cascade="all, delete-orphan")


class AIMessage(Base):
    __tablename__ = "ai_messages"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    conversation_id = Column(String(64), ForeignKey("ai_conversations.id", ondelete="CASCADE"), nullable=False, index=True)
    sender = Column(String(20), nullable=False)  # user, assistant, system
    text = Column(Text, nullable=False)
    language = Column(String(10), default="en")
    tools_called = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)

    conversation = relationship("AIConversation", back_populates="messages")


class KnowledgeDocument(Base):
    __tablename__ = "knowledge_documents"

    id = Column(String(64), primary_key=True)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    source = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    permitted_roles = Column(JSON, default=["retailer", "supplier", "manufacturer", "admin"])
    tenant_id = Column(String(64), default="GLOBAL")
    created_at = Column(DateTime, default=datetime.utcnow)

    chunks = relationship("KnowledgeChunk", back_populates="document", cascade="all, delete-orphan")


class KnowledgeChunk(Base):
    __tablename__ = "knowledge_chunks"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    document_id = Column(String(64), ForeignKey("knowledge_documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False)
    text = Column(Text, nullable=False)
    keywords = Column(JSON, nullable=True)

    document = relationship("KnowledgeDocument", back_populates="chunks")


# =====================================================================
# 8. AUDIT LOGS
# =====================================================================

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(String(64), primary_key=True, default=generate_uuid)
    action = Column(String(100), nullable=False, index=True)
    actor_id = Column(String(64), nullable=True)
    actor_role = Column(String(50), nullable=True)
    entity_type = Column(String(50), nullable=False)  # ORDER, INVENTORY, DRAFT, AUTH
    entity_id = Column(String(64), nullable=False, index=True)
    details = Column(JSON, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
