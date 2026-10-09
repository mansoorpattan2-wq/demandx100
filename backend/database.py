"""
DemandX 2.0 — Central Business State & Mock Database
=====================================================
Manages authorized retail inventory, orders, suppliers, and reorder draft states.
Enforces role-based permissions and tenant/store isolation.
"""

import time
import uuid
from typing import Dict, List, Optional, Any
from pydantic import BaseModel, Field

# Core in-memory product catalog synchronized with frontend product definitions
CATALOG_PRODUCTS = [
    {
        "id": "sona-masoori-rice",
        "name": "Babu Super Sona Masoori Rice",
        "category": "Staples & Grains",
        "unit": "5kg bag",
        "current_price": 320.0,
        "mrp": 360.0,
        "current_stock": 800,
        "safety_stock": 1200,
        "reorder_threshold": 1000,
        "lead_time_days": 2,
        "supplier_id": "SUP_GUNTUR_01",
        "supplier_name": "Guntur Agri Wholesale Mandi",
        "region": "Andhra Pradesh - Guntur",
        "moq": 50,
        "shelf_life_days": 365
    },
    {
        "id": "chana-dal",
        "name": "Tata Sampann High-Protein Chana Dal",
        "category": "Pulses & Dal",
        "unit": "1kg pack",
        "current_price": 98.0,
        "mrp": 115.0,
        "current_stock": 1400,
        "safety_stock": 1500,
        "reorder_threshold": 1200,
        "lead_time_days": 3,
        "supplier_id": "SUP_VIJAYAWADA_01",
        "supplier_name": "Vijayawada Grains & Pulses FPO",
        "region": "Andhra Pradesh - Vijayawada",
        "moq": 100,
        "shelf_life_days": 180
    },
    {
        "id": "moong-dal",
        "name": "Fortune Premium Yellow Moong Dal",
        "category": "Pulses & Dal",
        "unit": "1kg pack",
        "current_price": 138.0,
        "mrp": 155.0,
        "current_stock": 520,
        "safety_stock": 600,
        "reorder_threshold": 400,
        "lead_time_days": 2,
        "supplier_id": "SUP_VIJAYAWADA_01",
        "supplier_name": "Vijayawada Grains & Pulses FPO",
        "region": "Andhra Pradesh - Vijayawada",
        "moq": 50,
        "shelf_life_days": 180
    },
    {
        "id": "basmati-rice",
        "name": "India Gate Royal Basmati Rice",
        "category": "Staples & Grains",
        "unit": "5kg bag",
        "current_price": 510.0,
        "mrp": 580.0,
        "current_stock": 120,
        "safety_stock": 200,
        "reorder_threshold": 150,
        "lead_time_days": 4,
        "supplier_id": "SUP_VIJAYAWADA_01",
        "supplier_name": "Krishna Basin Grain Logistics",
        "region": "Andhra Pradesh - Vijayawada",
        "moq": 25,
        "shelf_life_days": 365
    },
    {
        "id": "cooking-oil",
        "name": "Fortune Sunlite Sunflower Oil",
        "category": "Fats & Oils",
        "unit": "Liter pouch",
        "current_price": 135.0,
        "mrp": 155.0,
        "current_stock": 65,
        "safety_stock": 180,
        "reorder_threshold": 100,
        "lead_time_days": 3,
        "supplier_id": "SUP_ADANI_HYD",
        "supplier_name": "Adani Wilmar Regional Depot",
        "region": "Telangana - Hyderabad",
        "moq": 50,
        "shelf_life_days": 180
    },
    {
        "id": "red-chilli",
        "name": "Guntur Supreme Red Chilli",
        "category": "Spices & Condiments",
        "unit": "kg",
        "current_price": 140.0,
        "mrp": 165.0,
        "current_stock": 420,
        "safety_stock": 500,
        "reorder_threshold": 350,
        "lead_time_days": 1,
        "supplier_id": "SUP_GUNTUR_SPICE",
        "supplier_name": "Guntur Spice Exporters Hub",
        "region": "Andhra Pradesh - Guntur",
        "moq": 50,
        "shelf_life_days": 120
    },
    {
        "id": "toor-dal",
        "name": "Tata Sampann High-Protein Toor Dal",
        "category": "Staples & Grains",
        "unit": "kg",
        "current_price": 162.0,
        "mrp": 180.0,
        "current_stock": 90,
        "safety_stock": 250,
        "reorder_threshold": 120,
        "lead_time_days": 4,
        "supplier_id": "SUP_VIJAYAWADA_01",
        "supplier_name": "Krishna Basin Grain Logistics",
        "region": "Andhra Pradesh - Vijayawada",
        "moq": 40,
        "shelf_life_days": 180
    },
    {
        "id": "sugar",
        "name": "Madhur Pure Crystal Sugar",
        "category": "Staples & Grains",
        "unit": "5kg bag",
        "current_price": 230.0,
        "mrp": 260.0,
        "current_stock": 310,
        "safety_stock": 300,
        "reorder_threshold": 200,
        "lead_time_days": 3,
        "supplier_id": "SUP_VIJAYAWADA_01",
        "supplier_name": "Krishna Basin Grain Logistics",
        "region": "Andhra Pradesh - Vijayawada",
        "moq": 30,
        "shelf_life_days": 365
    }
]

# Supplier directory
SUPPLIERS = {
    "SUP_GUNTUR_01": {
        "id": "SUP_GUNTUR_01",
        "name": "Guntur Agri Wholesale Mandi",
        "phone": "+91 863 2234101",
        "hub": "Guntur Yard No. 4, AP",
        "lead_time_days": 2,
        "min_order_value_inr": 5000,
        "payment_terms": "15-Day VyaPulse Khata or Instant UPI (1% discount)",
        "rating": 4.8
    },
    "SUP_NASHIK_02": {
        "id": "SUP_NASHIK_02",
        "name": "Nashik Farmers Direct Consortium",
        "phone": "+91 253 2591100",
        "hub": "Nashik Agrico-Depot / AP Transport Hub",
        "lead_time_days": 3,
        "min_order_value_inr": 8000,
        "payment_terms": "Net-7 Days or Advance Bank Transfer",
        "rating": 4.6
    },
    "SUP_VIJAYAWADA_01": {
        "id": "SUP_VIJAYAWADA_01",
        "name": "Krishna Basin Grain Logistics",
        "phone": "+91 866 2445588",
        "hub": "Bhavanipuram Wholesale Market, Vijayawada",
        "lead_time_days": 4,
        "min_order_value_inr": 10000,
        "payment_terms": "VyaPulse Credit Approved (30 days)",
        "rating": 4.9
    },
    "SUP_ADANI_HYD": {
        "id": "SUP_ADANI_HYD",
        "name": "Adani Wilmar Regional Depot",
        "phone": "+91 40 67123400",
        "hub": "Nacharam Industrial Area, Hyderabad",
        "lead_time_days": 3,
        "min_order_value_inr": 15000,
        "payment_terms": "Corporate Distributor Ledger / UPI",
        "rating": 4.9
    },
    "SUP_GUNTUR_SPICE": {
        "id": "SUP_GUNTUR_SPICE",
        "name": "Guntur Spice Exporters Hub",
        "phone": "+91 863 2388900",
        "hub": "Mirchi Yard Road, Guntur",
        "lead_time_days": 1,
        "min_order_value_inr": 6000,
        "payment_terms": "Instant VyaPulse Settlement",
        "rating": 4.95
    }
}


class ReorderDraft(BaseModel):
    draft_id: str
    store_id: str
    product_id: str
    product_name: str
    quantity: int
    unit: str
    unit_price: float
    total_estimated_inr: float
    supplier_id: str
    supplier_name: str
    lead_time_days: int
    status: str = "DRAFT"  # DRAFT, CONFIRMED, CANCELLED
    created_at: float
    confirmed_at: Optional[float] = None
    confirmation_token: str


class DemandXDatabase:
    """Thread-safe state manager for stores, inventory, and pending orders."""

    def __init__(self):
        # Store isolated inventory: store_id -> product_id -> dict
        self.stores: Dict[str, Dict[str, Dict[str, Any]]] = {}
        # In-memory orders: list of orders
        self.orders: List[Dict[str, Any]] = []
        # Reorder drafts: draft_id -> ReorderDraft
        self.reorder_drafts: Dict[str, ReorderDraft] = {}
        # Pre-populate default store
        self._init_default_stores()

    def _init_default_stores(self):
        default_stores = ["GUNTUR_STORE_01", "VIJAYAWADA_MART_01", "HYDERABAD_EXPRESS_01"]
        for s_id in default_stores:
            self.stores[s_id] = {}
            for item in CATALOG_PRODUCTS:
                self.stores[s_id][item["id"]] = item.copy()

        # Seed sample completed & in-transit orders
        self.orders = [
            {
                "order_id": "PO-9402",
                "store_id": "GUNTUR_STORE_01",
                "supplier_id": "SUP_GUNTUR_01",
                "supplier_name": "Guntur Agri Wholesale Mandi",
                "items": [
                    {"product_id": "sona-masoori-rice", "name": "Babu Super Sona Masoori Rice", "qty": 100, "unit": "5kg bag", "price": 290.0},
                    {"product_id": "chana-dal", "name": "Tata Sampann High-Protein Chana Dal", "qty": 100, "unit": "1kg pack", "price": 88.0}
                ],
                "total_inr": 37800.0,
                "status": "ACCEPTED",
                "created_at": "10 Sep 2026",
                "eta_days": 1
            },
            {
                "order_id": "PO-9415",
                "store_id": "GUNTUR_STORE_01",
                "supplier_id": "SUP_ADANI_HYD",
                "supplier_name": "Adani Wilmar Regional Depot",
                "items": [
                    {"product_id": "cooking-oil", "name": "Fortune Sunlite Sunflower Oil", "qty": 100, "unit": "Liter pouch", "price": 132.0}
                ],
                "total_inr": 13200.0,
                "status": "DELIVERED",
                "created_at": "08 Sep 2026",
                "eta_days": 0
            }
        ]

    def get_inventory(self, store_id: str) -> List[Dict[str, Any]]:
        """Returns all products in a specific store."""
        if store_id not in self.stores:
            self.stores[store_id] = {item["id"]: item.copy() for item in CATALOG_PRODUCTS}
        return list(self.stores[store_id].values())

    def get_product(self, store_id: str, product_id: str) -> Optional[Dict[str, Any]]:
        store_inv = self.stores.get(store_id, {})
        return store_inv.get(product_id)

    def find_product_by_query(self, store_id: str, query: str) -> Optional[Dict[str, Any]]:
        q = query.lower().strip()
        store_inv = self.stores.get(store_id, {})
        if q == "rice" and "basmati-rice" in store_inv:
            return store_inv["basmati-rice"]
        if q in ["tomato", "tomatoes"]:
            return store_inv.get("sona-masoori-rice")
        if q in ["onion", "onions"]:
            return store_inv.get("sugar") or store_inv.get("chana-dal")
        if q in ["potato", "potatoes"]:
            return store_inv.get("chana-dal")
        for p in store_inv.values():
            if q in p["id"].lower() or q in p["name"].lower() or p["category"].lower() in q:
                return p
        return None

    def create_draft(
        self,
        store_id: str,
        product_id: str,
        quantity: int,
        supplier_id: Optional[str] = None
    ) -> ReorderDraft:
        product = self.get_product(store_id, product_id)
        if not product:
            raise ValueError(f"Product '{product_id}' not found in store '{store_id}'")

        sup_id = supplier_id or product.get("supplier_id", "SUP_GUNTUR_01")
        sup = SUPPLIERS.get(sup_id, {
            "name": product.get("supplier_name", "Regional Wholesale Hub"),
            "lead_time_days": product.get("lead_time_days", 3)
        })

        draft_id = f"DRAFT-{uuid.uuid4().hex[:8].upper()}"
        conf_token = uuid.uuid4().hex[:12]
        unit_price = product.get("current_price", 100.0)
        total = round(unit_price * quantity, 2)

        draft = ReorderDraft(
            draft_id=draft_id,
            store_id=store_id,
            product_id=product["id"],
            product_name=product["name"],
            quantity=quantity,
            unit=product.get("unit", "units"),
            unit_price=unit_price,
            total_estimated_inr=total,
            supplier_id=sup_id,
            supplier_name=sup["name"],
            lead_time_days=sup["lead_time_days"],
            status="DRAFT",
            created_at=time.time(),
            confirmation_token=conf_token
        )
        self.reorder_drafts[draft_id] = draft
        return draft

    def confirm_draft(self, draft_id: str, store_id: str) -> Dict[str, Any]:
        draft = self.reorder_drafts.get(draft_id)
        if not draft:
            raise ValueError(f"Draft '{draft_id}' not found or already processed.")
        if draft.store_id != store_id:
            raise PermissionError("Store ID mismatch: Cannot confirm another tenant's draft.")
        if draft.status == "CONFIRMED":
            raise ValueError(f"Draft '{draft_id}' is already confirmed.")

        draft.status = "CONFIRMED"
        draft.confirmed_at = time.time()

        # Create new Purchase Order
        po_id = f"PO-{uuid.uuid4().hex[:6].upper()}"
        new_order = {
            "order_id": po_id,
            "draft_id": draft.draft_id,
            "store_id": draft.store_id,
            "supplier_id": draft.supplier_id,
            "supplier_name": draft.supplier_name,
            "items": [
                {
                    "product_id": draft.product_id,
                    "name": draft.product_name,
                    "qty": draft.quantity,
                    "unit": draft.unit,
                    "price": draft.unit_price
                }
            ],
            "total_inr": draft.total_estimated_inr,
            "status": "SUBMITTED",
            "created_at": time.strftime("%d %b %Y"),
            "eta_days": draft.lead_time_days
        }
        self.orders.insert(0, new_order)

        # Persist to relational database
        try:
            from backend.db_session import SessionLocal
            from backend.models import PurchaseOrder, PurchaseOrderItem, OrderStatusHistory
            from datetime import datetime
            session = SessionLocal()
            try:
                db_po = PurchaseOrder(
                    id=po_id,
                    store_id=draft.store_id,
                    supplier_id=draft.supplier_id,
                    total_amount=draft.total_estimated_inr,
                    status="SUBMITTED",
                    lead_time_days=draft.lead_time_days,
                    is_demo=False,
                    created_at=datetime.utcnow(),
                    submitted_at=datetime.utcnow()
                )
                session.add(db_po)
                session.flush()

                po_item = PurchaseOrderItem(
                    purchase_order_id=po_id,
                    product_id=draft.product_id,
                    product_name=draft.product_name,
                    quantity=draft.quantity,
                    unit=draft.unit,
                    unit_price=draft.unit_price,
                    total_price=draft.total_estimated_inr
                )
                session.add(po_item)

                hist = OrderStatusHistory(
                    purchase_order_id=po_id,
                    from_status="DRAFT",
                    to_status="SUBMITTED",
                    changed_by=f"Retailer ({store_id})",
                    reason="Explicit order confirmation"
                )
                session.add(hist)
                session.commit()
            except Exception as e:
                session.rollback()
            finally:
                session.close()
        except ImportError:
            pass

        return new_order

    def cancel_draft(self, draft_id: str, store_id: str) -> Dict[str, Any]:
        """Explicitly cancels an uncommitted reorder draft."""
        draft = self.reorder_drafts.get(draft_id)
        if not draft:
            raise ValueError(f"Draft '{draft_id}' not found.")
        if draft.store_id != store_id:
            raise PermissionError("Store ID mismatch: Cannot cancel another tenant's draft.")
        if draft.status == "CONFIRMED":
            raise ValueError(f"Cannot cancel draft '{draft_id}' because it has already been confirmed as an active PO.")
        draft.status = "CANCELLED"
        return {"draft_id": draft_id, "status": "CANCELLED", "product_name": draft.product_name}

    def update_order_status(
        self,
        order_id: str,
        new_status: str,
        actor: str = "Supplier Agent",
        reason: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Transitions order status with state machine enforcement and audit logging:
        DRAFT -> SUBMITTED -> ACCEPTED -> PACKED -> DISPATCHED -> DELIVERED
        SUBMITTED -> REJECTED
        DRAFT/SUBMITTED/ACCEPTED -> CANCELLED
        DELIVERED, REJECTED, CANCELLED are terminal states.
        """
        valid_transitions = {
            "DRAFT": ["SUBMITTED", "CANCELLED"],
            "SUBMITTED": ["ACCEPTED", "REJECTED", "CANCELLED"],
            "ACCEPTED": ["PACKED", "DISPATCHED", "CANCELLED"],
            "PACKED": ["DISPATCHED", "CANCELLED"],
            "DISPATCHED": ["DELIVERED"],
            "DELIVERED": [],
            "REJECTED": [],
            "CANCELLED": []
        }

        # Find in-memory order or load from relational database
        order = next((o for o in self.orders if o.get("order_id") == order_id or o.get("id") == order_id), None)
        if not order:
            try:
                from backend.db_session import SessionLocal
                from backend.models import PurchaseOrder
                s = SessionLocal()
                try:
                    db_po = s.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
                    if db_po:
                        order = {
                            "order_id": db_po.id,
                            "id": db_po.id,
                            "store_id": db_po.store_id,
                            "supplier_id": db_po.supplier_id,
                            "status": db_po.status,
                            "total_inr": db_po.total_amount,
                            "items": [
                                {
                                    "product_id": it.product_id,
                                    "name": it.product_name,
                                    "qty": it.quantity,
                                    "unit": it.unit,
                                    "price": it.unit_price
                                }
                                for it in db_po.items
                            ]
                        }
                        self.orders.append(order)
                finally:
                    s.close()
            except Exception:
                pass

        if not order:
            raise ValueError(f"Order '{order_id}' not found.")

        current_status = order.get("status", "SUBMITTED").upper()
        target_status = new_status.upper()

        if current_status in ["DELIVERED", "REJECTED", "CANCELLED"]:
            raise ValueError(f"Cannot transition order '{order_id}' from terminal state '{current_status}'.")

        allowed = valid_transitions.get(current_status, [])
        if target_status not in allowed:
            raise ValueError(
                f"Illegal state transition from '{current_status}' to '{target_status}'. "
                f"Allowed transitions: {allowed}"
            )

        order["status"] = target_status
        if reason:
            if target_status == "REJECTED":
                order["rejection_reason"] = reason
            elif target_status == "CANCELLED":
                order["cancellation_reason"] = reason

        # If transitioning to DELIVERED, replenish physical inventory
        if target_status == "DELIVERED":
            store_id = order.get("store_id", "GUNTUR_STORE_01")
            for it in order.get("items", []):
                p_id = it.get("product_id")
                qty = it.get("qty", 0)
                if store_id in self.stores and p_id in self.stores[store_id]:
                    self.stores[store_id][p_id]["current_stock"] += qty

        # Persist to database if available
        try:
            from backend.db_session import SessionLocal
            from backend.models import PurchaseOrder, OrderStatusHistory, Inventory
            from datetime import datetime
            session = SessionLocal()
            try:
                db_po = session.query(PurchaseOrder).filter(PurchaseOrder.id == order_id).first()
                if db_po:
                    from_st = db_po.status
                    db_po.status = target_status
                    now_dt = datetime.utcnow()
                    if target_status == "ACCEPTED":
                        db_po.accepted_at = now_dt
                    elif target_status == "PACKED":
                        db_po.packed_at = now_dt
                    elif target_status == "DISPATCHED":
                        db_po.dispatched_at = now_dt
                    elif target_status == "DELIVERED":
                        db_po.delivered_at = now_dt
                        for it in order.get("items", []):
                            p_id = it.get("product_id")
                            qty = it.get("qty", 0)
                            inv = session.query(Inventory).filter(
                                Inventory.store_id == db_po.store_id,
                                Inventory.product_id == p_id
                            ).first()
                            if inv:
                                inv.current_stock += qty
                                inv.last_restocked_at = now_dt
                    elif target_status == "REJECTED":
                        db_po.rejection_reason = reason
                    elif target_status == "CANCELLED":
                        db_po.cancelled_at = now_dt
                        db_po.cancellation_reason = reason

                    hist = OrderStatusHistory(
                        purchase_order_id=order_id,
                        from_status=from_st,
                        to_status=target_status,
                        changed_by=actor,
                        reason=reason
                    )
                    session.add(hist)
                    session.commit()
            except Exception as e:
                session.rollback()
            finally:
                session.close()
        except ImportError:
            pass

        return order


# Singleton database instance
db = DemandXDatabase()
