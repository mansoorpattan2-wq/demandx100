"""
DemandX 2.0 — Repeatable Database Seeding Module
=================================================
Seeds:
- Organizations & Retailer stores, Suppliers, Manufacturers
- 45+ Canonical Indian Kirana & Supermarket Grocery Products (Rice, Atta, Dals, Oils, Spices, Packaged)
- Batches with realistic manufacturing & best-before dates
- Real-time inventory records for GUNTUR_STORE_01
- Realistic purchase orders with multi-status lifecycles & status history logs
- Default users and roles
"""

from datetime import datetime, timedelta
from backend.db_session import SessionLocal
from backend.models import (
    User, Organization, OrganizationMembership,
    RetailerStore, Supplier, Manufacturer,
    Product, ProductBatch, Inventory,
    PurchaseOrder, PurchaseOrderItem, OrderStatusHistory
)

# 45 Canonical Shelf-Stable Indian Grocery Products
GROCERY_CATALOG = [
    # 1. RICE & GRAINS
    {"id": "sona-masoori-rice", "sku": "GR-RICE-001", "name": "Babu Super Sona Masoori Rice (5kg)", "category": "Rice & Grains", "brand": "Babu", "unit": "5kg bag", "wholesale_price": 290.0, "retail_price": 320.0, "mrp": 360.0, "shelf_life_days": 365, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "basmati-rice", "sku": "GR-RICE-002", "name": "India Gate Royal Basmati Rice (5kg)", "category": "Rice & Grains", "brand": "India Gate", "unit": "5kg bag", "wholesale_price": 460.0, "retail_price": 510.0, "mrp": 580.0, "shelf_life_days": 730, "supplier_id": "SUP_VIJAYAWADA_01"},
    {"id": "daawat-biryani-rice", "sku": "GR-RICE-003", "name": "Daawat Biryani Basmati Rice (1kg)", "category": "Rice & Grains", "brand": "Daawat", "unit": "1kg pack", "wholesale_price": 125.0, "retail_price": 145.0, "mrp": 165.0, "shelf_life_days": 730, "supplier_id": "SUP_VIJAYAWADA_01"},
    {"id": "ponni-boiled-rice", "sku": "GR-RICE-004", "name": "Heritage Thanjavur Ponni Rice (5kg)", "category": "Rice & Grains", "brand": "Heritage", "unit": "5kg bag", "wholesale_price": 310.0, "retail_price": 345.0, "mrp": 380.0, "shelf_life_days": 365, "supplier_id": "SUP_VIJAYAWADA_01"},
    {"id": "kolam-rice", "sku": "GR-RICE-005", "name": "Wada Kolam Daily Steam Rice (5kg)", "category": "Rice & Grains", "brand": "Wada Special", "unit": "5kg bag", "wholesale_price": 280.0, "retail_price": 310.0, "mrp": 350.0, "shelf_life_days": 365, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "idli-rice", "sku": "GR-RICE-006", "name": "Udipi Special Idli Short Grain Rice (5kg)", "category": "Rice & Grains", "brand": "Udipi Mills", "unit": "5kg bag", "wholesale_price": 210.0, "retail_price": 240.0, "mrp": 270.0, "shelf_life_days": 365, "supplier_id": "SUP_VIJAYAWADA_01"},
    {"id": "poha-thick", "sku": "GR-RICE-007", "name": "Tata Sampann High-Fiber Thick Poha (500g)", "category": "Rice & Grains", "brand": "Tata Sampann", "unit": "500g pack", "wholesale_price": 38.0, "retail_price": 48.0, "mrp": 55.0, "shelf_life_days": 180, "supplier_id": "SUP_VIJAYAWADA_01"},

    # 2. ATTA & FLOURS
    {"id": "aashirvaad-atta", "sku": "GR-ATTA-001", "name": "Aashirvaad Superior Sharbati Atta (5kg)", "category": "Atta & Flours", "brand": "ITC Aashirvaad", "unit": "5kg bag", "wholesale_price": 235.0, "retail_price": 265.0, "mrp": 295.0, "shelf_life_days": 180, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "fortune-chakki-atta", "sku": "GR-ATTA-002", "name": "Fortune Chakki Fresh Whole Wheat Atta (5kg)", "category": "Atta & Flours", "brand": "Fortune", "unit": "5kg bag", "wholesale_price": 215.0, "retail_price": 245.0, "mrp": 275.0, "shelf_life_days": 180, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "maida-flour", "sku": "GR-ATTA-003", "name": "Rajdhani Refined Wheat Maida (1kg)", "category": "Atta & Flours", "brand": "Rajdhani", "unit": "1kg pack", "wholesale_price": 42.0, "retail_price": 50.0, "mrp": 58.0, "shelf_life_days": 180, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "sooji-rava", "sku": "GR-ATTA-004", "name": "Double Hiran Roasted Bombay Rava / Sooji (1kg)", "category": "Atta & Flours", "brand": "Double Hiran", "unit": "1kg pack", "wholesale_price": 48.0, "retail_price": 58.0, "mrp": 65.0, "shelf_life_days": 180, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "besan-gram-flour", "sku": "GR-ATTA-005", "name": "Tata Sampann 100% Chana Dal Besan (500g)", "category": "Atta & Flours", "brand": "Tata Sampann", "unit": "500g pack", "wholesale_price": 52.0, "retail_price": 64.0, "mrp": 72.0, "shelf_life_days": 180, "supplier_id": "SUP_VIJAYAWADA_01"},

    # 3. PULSES & DALS
    {"id": "toor-dal", "sku": "GR-DAL-001", "name": "Tata Sampann Unpolished Toor Dal (1kg)", "category": "Pulses & Dals", "brand": "Tata Sampann", "unit": "1kg pack", "wholesale_price": 148.0, "retail_price": 168.0, "mrp": 185.0, "shelf_life_days": 365, "supplier_id": "SUP_VIJAYAWADA_01"},
    {"id": "chana-dal", "sku": "GR-DAL-002", "name": "Tata Sampann High-Protein Chana Dal (1kg)", "category": "Pulses & Dals", "brand": "Tata Sampann", "unit": "1kg pack", "wholesale_price": 88.0, "retail_price": 98.0, "mrp": 115.0, "shelf_life_days": 365, "supplier_id": "SUP_VIJAYAWADA_01"},
    {"id": "moong-dal", "sku": "GR-DAL-003", "name": "Fortune Premium Yellow Moong Dal (1kg)", "category": "Pulses & Dals", "brand": "Fortune", "unit": "1kg pack", "wholesale_price": 120.0, "retail_price": 138.0, "mrp": 155.0, "shelf_life_days": 365, "supplier_id": "SUP_VIJAYAWADA_01"},
    {"id": "urad-dal-gundu", "sku": "GR-DAL-004", "name": "Vijayawada Premium Whole White Urad Dal (1kg)", "category": "Pulses & Dals", "brand": "Krishna Brand", "unit": "1kg pack", "wholesale_price": 135.0, "retail_price": 152.0, "mrp": 170.0, "shelf_life_days": 365, "supplier_id": "SUP_VIJAYAWADA_01"},
    {"id": "masoor-dal", "sku": "GR-DAL-005", "name": "Organic Red Split Masoor Dal (1kg)", "category": "Pulses & Dals", "brand": "Organic Tattva", "unit": "1kg pack", "wholesale_price": 95.0, "retail_price": 110.0, "mrp": 125.0, "shelf_life_days": 365, "supplier_id": "SUP_VIJAYAWADA_01"},
    {"id": "rajma-chitra", "sku": "GR-DAL-006", "name": "Jammu Red Kidney Beans / Rajma Chitra (1kg)", "category": "Pulses & Dals", "brand": "Nature Valley", "unit": "1kg pack", "wholesale_price": 130.0, "retail_price": 150.0, "mrp": 170.0, "shelf_life_days": 365, "supplier_id": "SUP_VIJAYAWADA_01"},
    {"id": "kabuli-chana", "sku": "GR-DAL-007", "name": "Dollar White Chickpeas / Kabuli Chana (1kg)", "category": "Pulses & Dals", "brand": "Choice Pulses", "unit": "1kg pack", "wholesale_price": 122.0, "retail_price": 140.0, "mrp": 160.0, "shelf_life_days": 365, "supplier_id": "SUP_VIJAYAWADA_01"},

    # 4. COOKING OILS & GHEE
    {"id": "cooking-oil", "sku": "GR-OIL-001", "name": "Fortune Sunlite Refined Sunflower Oil (1L)", "category": "Cooking Oils & Ghee", "brand": "Fortune", "unit": "1L pouch", "wholesale_price": 122.0, "retail_price": 135.0, "mrp": 155.0, "shelf_life_days": 270, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "freedom-oil", "sku": "GR-OIL-002", "name": "Freedom Double Filtered Sunflower Oil (1L)", "category": "Cooking Oils & Ghee", "brand": "Freedom", "unit": "1L pouch", "wholesale_price": 120.0, "retail_price": 134.0, "mrp": 150.0, "shelf_life_days": 270, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "groundnut-oil", "sku": "GR-OIL-003", "name": "Gemini Pure Filtered Groundnut Oil (1L)", "category": "Cooking Oils & Ghee", "brand": "Gemini", "unit": "1L bottle", "wholesale_price": 165.0, "retail_price": 185.0, "mrp": 210.0, "shelf_life_days": 365, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "mustard-oil", "sku": "GR-OIL-004", "name": "Engine Brand Kachi Ghani Mustard Oil (1L)", "category": "Cooking Oils & Ghee", "brand": "Engine", "unit": "1L bottle", "wholesale_price": 145.0, "retail_price": 165.0, "mrp": 185.0, "shelf_life_days": 365, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "amul-ghee", "sku": "GR-OIL-005", "name": "Amul Pure Cow Ghee Tin (1L)", "category": "Cooking Oils & Ghee", "brand": "Amul", "unit": "1L tin", "wholesale_price": 540.0, "retail_price": 595.0, "mrp": 630.0, "shelf_life_days": 365, "supplier_id": "SUP_GUNTUR_01"},

    # 5. SUGAR, SALT & SWEETENERS
    {"id": "sugar", "sku": "GR-SUGAR-001", "name": "Madhur Pure Crystal Sugar (5kg)", "category": "Sugar, Salt & Sweeteners", "brand": "Madhur", "unit": "5kg bag", "wholesale_price": 205.0, "retail_price": 230.0, "mrp": 260.0, "shelf_life_days": 730, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "sugar-1kg", "sku": "GR-SUGAR-002", "name": "Madhur Sulphurless Refined Sugar (1kg)", "category": "Sugar, Salt & Sweeteners", "brand": "Madhur", "unit": "1kg pack", "wholesale_price": 43.0, "retail_price": 49.0, "mrp": 55.0, "shelf_life_days": 730, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "tata-salt", "sku": "GR-SALT-001", "name": "Tata Vacuum Evaporated Iodized Salt (1kg)", "category": "Sugar, Salt & Sweeteners", "brand": "Tata Salt", "unit": "1kg pack", "wholesale_price": 23.0, "retail_price": 28.0, "mrp": 30.0, "shelf_life_days": 730, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "tata-salt-lite", "sku": "GR-SALT-002", "name": "Tata Salt Lite Low Sodium Salt (1kg)", "category": "Sugar, Salt & Sweeteners", "brand": "Tata Salt", "unit": "1kg pack", "wholesale_price": 38.0, "retail_price": 46.0, "mrp": 50.0, "shelf_life_days": 730, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "organic-jaggery", "sku": "GR-JAGG-001", "name": "Anakapalle Golden Desi Jaggery Block (1kg)", "category": "Sugar, Salt & Sweeteners", "brand": "Anakapalle Fresh", "unit": "1kg pack", "wholesale_price": 60.0, "retail_price": 75.0, "mrp": 85.0, "shelf_life_days": 180, "supplier_id": "SUP_GUNTUR_01"},

    # 6. SPICES & MASALAS
    {"id": "red-chilli", "sku": "GR-SPICE-001", "name": "Guntur Supreme Stemless Dried Red Chilli (1kg)", "category": "Spices & Masalas", "brand": "Guntur Mirchi Yard", "unit": "1kg pack", "wholesale_price": 125.0, "retail_price": 145.0, "mrp": 165.0, "shelf_life_days": 365, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "chilli-powder", "sku": "GR-SPICE-002", "name": "Everest Tikhalal Hot Chilli Powder (500g)", "category": "Spices & Masalas", "brand": "Everest", "unit": "500g pack", "wholesale_price": 140.0, "retail_price": 165.0, "mrp": 185.0, "shelf_life_days": 365, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "turmeric-powder", "sku": "GR-SPICE-003", "name": "Tata Sampann Nizamabad Turmeric Powder (500g)", "category": "Spices & Masalas", "brand": "Tata Sampann", "unit": "500g pack", "wholesale_price": 95.0, "retail_price": 115.0, "mrp": 130.0, "shelf_life_days": 365, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "coriander-powder", "sku": "GR-SPICE-004", "name": "Everest Dhaniya Coriander Powder (500g)", "category": "Spices & Masalas", "brand": "Everest", "unit": "500g pack", "wholesale_price": 85.0, "retail_price": 102.0, "mrp": 115.0, "shelf_life_days": 365, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "garam-masala", "sku": "GR-SPICE-005", "name": "MDH Super King Garam Masala (100g)", "category": "Spices & Masalas", "brand": "MDH", "unit": "100g box", "wholesale_price": 68.0, "retail_price": 82.0, "mrp": 92.0, "shelf_life_days": 365, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "cumin-seeds", "sku": "GR-SPICE-006", "name": "Catch Whole Cleaned Jeera / Cumin Seeds (200g)", "category": "Spices & Masalas", "brand": "Catch", "unit": "200g pouch", "wholesale_price": 82.0, "retail_price": 98.0, "mrp": 110.0, "shelf_life_days": 365, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "mustard-seeds", "sku": "GR-SPICE-007", "name": "Sri Sri Tattva Black Mustard Seeds Rai (200g)", "category": "Spices & Masalas", "brand": "Sri Sri Tattva", "unit": "200g pouch", "wholesale_price": 32.0, "retail_price": 40.0, "mrp": 48.0, "shelf_life_days": 365, "supplier_id": "SUP_GUNTUR_01"},

    # 7. TEA & COFFEE
    {"id": "tata-tea-gold", "sku": "GR-TEA-001", "name": "Tata Tea Gold Assam Orthodox Leaf (500g)", "category": "Tea & Coffee", "brand": "Tata Tea", "unit": "500g pack", "wholesale_price": 270.0, "retail_price": 310.0, "mrp": 345.0, "shelf_life_days": 365, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "red-label-tea", "sku": "GR-TEA-002", "name": "Brooke Bond Red Label Strong CTC Tea (500g)", "category": "Tea & Coffee", "brand": "Brooke Bond", "unit": "500g pack", "wholesale_price": 245.0, "retail_price": 280.0, "mrp": 310.0, "shelf_life_days": 365, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "bru-instant-coffee", "sku": "GR-COF-001", "name": "BRU Instant Roasted Chicory Coffee (100g)", "category": "Tea & Coffee", "brand": "BRU", "unit": "100g jar", "wholesale_price": 148.0, "retail_price": 172.0, "mrp": 190.0, "shelf_life_days": 540, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "nescafe-classic", "sku": "GR-COF-002", "name": "Nescafe Classic 100% Pure Coffee Jar (100g)", "category": "Tea & Coffee", "brand": "Nescafe", "unit": "100g jar", "wholesale_price": 285.0, "retail_price": 330.0, "mrp": 365.0, "shelf_life_days": 540, "supplier_id": "SUP_GUNTUR_01"},

    # 8. PACKAGED FOODS & NOODLES
    {"id": "maggi-noodles", "sku": "GR-NOOD-001", "name": "Maggi 2-Minute Masala Instant Noodles (4-Pack)", "category": "Packaged Foods", "brand": "Nestle", "unit": "280g pack", "wholesale_price": 48.0, "retail_price": 56.0, "mrp": 60.0, "shelf_life_days": 270, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "yippee-noodles", "sku": "GR-NOOD-002", "name": "Sunfeast Yippee Magic Masala Noodles (4-Pack)", "category": "Packaged Foods", "brand": "ITC", "unit": "260g pack", "wholesale_price": 44.0, "retail_price": 52.0, "mrp": 56.0, "shelf_life_days": 270, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "ketchup-bottle", "sku": "GR-SAUCE-001", "name": "Kissan Fresh Tomato Ketchup Easy Squeezy (500g)", "category": "Packaged Foods", "brand": "HUL Kissan", "unit": "500g bottle", "wholesale_price": 95.0, "retail_price": 115.0, "mrp": 125.0, "shelf_life_days": 365, "supplier_id": "SUP_GUNTUR_01"},

    # 9. BISCUITS & SNACKS
    {"id": "parle-g", "sku": "GR-SNK-001", "name": "Parle-G Original Gluco Biscuits Value Pack (800g)", "category": "Biscuits & Snacks", "brand": "Parle", "unit": "800g pack", "wholesale_price": 72.0, "retail_price": 85.0, "mrp": 90.0, "shelf_life_days": 180, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "good-day-butter", "sku": "GR-SNK-002", "name": "Britannia Good Day Rich Butter Cookies (600g)", "category": "Biscuits & Snacks", "brand": "Britannia", "unit": "600g pack", "wholesale_price": 105.0, "retail_price": 125.0, "mrp": 135.0, "shelf_life_days": 180, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "haldirams-bhujia", "sku": "GR-SNK-003", "name": "Haldiram's Nagpur Spicy Aloo Bhujia (400g)", "category": "Biscuits & Snacks", "brand": "Haldiram's", "unit": "400g pack", "wholesale_price": 95.0, "retail_price": 115.0, "mrp": 125.0, "shelf_life_days": 180, "supplier_id": "SUP_GUNTUR_01"},

    # 10. CLEANING & HOUSEHOLD
    {"id": "surf-excel-bar", "sku": "GR-CLN-001", "name": "Surf Excel Stain Eraser Detergent Bar (200g)", "category": "Cleaning & Household", "brand": "HUL", "unit": "200g bar", "wholesale_price": 28.0, "retail_price": 33.0, "mrp": 35.0, "shelf_life_days": 730, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "vim-dishwash-bar", "sku": "GR-CLN-002", "name": "Vim Pure Lemon Anti-Smell Dishwash Bar (300g)", "category": "Cleaning & Household", "brand": "HUL", "unit": "300g bar", "wholesale_price": 24.0, "retail_price": 28.0, "mrp": 30.0, "shelf_life_days": 730, "supplier_id": "SUP_GUNTUR_01"},
    {"id": "dettol-soap", "sku": "GR-CLN-003", "name": "Dettol Original Germ Protection Bathing Bar (3-Pack)", "category": "Cleaning & Household", "brand": "Reckitt", "unit": "3x75g pack", "wholesale_price": 96.0, "retail_price": 115.0, "mrp": 125.0, "shelf_life_days": 730, "supplier_id": "SUP_GUNTUR_01"},
]


def seed_database_if_empty():
    """
    Seeds canonical organizations, grocery items, inventory, and demo orders.
    Checks records individually to prevent duplicates and preserve existing user data.
    """
    session = SessionLocal()
    try:
        now = datetime.utcnow()

        # 1. Organizations
        org_definitions = [
            Organization(
                id="ORG_GUNTUR_RETAIL",
                name="Guntur Kirana Supermarket Union",
                type="RETAILER",
                gstin="37AAAAA0000A1Z5",
                city="Guntur",
                state="Andhra Pradesh"
            ),
            Organization(
                id="ORG_GUNTUR_SPICE",
                name="Guntur Spice & Agro Logistics Hub",
                type="SUPPLIER",
                gstin="37BBBBB1111B2Z4",
                city="Guntur",
                state="Andhra Pradesh"
            ),
            Organization(
                id="ORG_VIJAYAWADA_GRAINS",
                name="Vijayawada Grains & Pulses FPO",
                type="SUPPLIER",
                gstin="37CCCCC2222C3Z3",
                city="Vijayawada",
                state="Andhra Pradesh"
            ),
            Organization(
                id="ORG_KRISHNA_MILLS",
                name="Krishna Valley Agro Millers & Processors",
                type="MANUFACTURER",
                gstin="37DDDDD3333D4Z2",
                city="Miryalaguda",
                state="Telangana"
            )
        ]
        for org in org_definitions:
            if not session.query(Organization).filter_by(id=org.id).first():
                session.add(org)
        session.flush()

        # 2. Users
        user_definitions = [
            User(
                id="USR_ADMIN_01",
                email="admin@demandx.in",
                full_name="DemandX Enterprise Admin",
                role="admin"
            ),
            User(
                id="USR_RETAILER_01",
                email="durga.prasad@gunturkirana.in",
                full_name="Durga Prasad (Retailer)",
                role="retailer"
            ),
            User(
                id="USR_SUPPLIER_01",
                email="sales@gunturspice.in",
                full_name="Ramesh Babu (Supplier Lead)",
                role="supplier"
            )
        ]
        for u in user_definitions:
            if not session.query(User).filter_by(id=u.id).first():
                session.add(u)
        session.flush()

        # Memberships
        memberships = [
            ("USR_RETAILER_01", "ORG_GUNTUR_RETAIL", "OWNER"),
            ("USR_SUPPLIER_01", "ORG_GUNTUR_SPICE", "ADMIN"),
        ]
        for uid, oid, role in memberships:
            if not session.query(OrganizationMembership).filter_by(user_id=uid, organization_id=oid).first():
                session.add(OrganizationMembership(user_id=uid, organization_id=oid, role=role))
        session.flush()

        # 3. Business Units
        store = RetailerStore(
            id="GUNTUR_STORE_01",
            organization_id="ORG_GUNTUR_RETAIL",
            name="My Store - Guntur, AP",
            location="Shop #4, Main Bazaar, Guntur, AP",
            region="Guntur Central",
            store_type="Kirana Supermarket"
        )
        if not session.query(RetailerStore).filter_by(id=store.id).first():
            session.add(store)

        sup1 = Supplier(
            id="SUP_GUNTUR_01",
            organization_id="ORG_GUNTUR_SPICE",
            name="Guntur Spice Traders & Exporters",
            hub="Guntur Yard No. 4, AP",
            phone="+91 863 2234101",
            lead_time_days=2,
            min_order_value_inr=5000.0,
            rating=4.9
        )
        if not session.query(Supplier).filter_by(id=sup1.id).first():
            session.add(sup1)

        sup2 = Supplier(
            id="SUP_VIJAYAWADA_01",
            organization_id="ORG_VIJAYAWADA_GRAINS",
            name="Vijayawada Grains & Pulses FPO",
            hub="Bhavanipuram Wholesale Mandi, Vijayawada",
            phone="+91 866 2445588",
            lead_time_days=3,
            min_order_value_inr=8000.0,
            rating=4.8
        )
        if not session.query(Supplier).filter_by(id=sup2.id).first():
            session.add(sup2)

        mfg = Manufacturer(
            id="MFG_KRISHNA_MILLS",
            organization_id="ORG_KRISHNA_MILLS",
            name="Krishna Valley Agro Millers & Processors",
            plant_location="Miryalaguda Industrial Corridor",
            capacity_mt=12000.0
        )
        if not session.query(Manufacturer).filter_by(id=mfg.id).first():
            session.add(mfg)
        session.flush()

        # 4. Products & Inventory
        for item in GROCERY_CATALOG:
            prod = session.query(Product).filter_by(id=item["id"]).first()
            if not prod:
                prod = Product(
                    id=item["id"],
                    sku=item["sku"],
                    name=item["name"],
                    category=item["category"],
                    brand=item["brand"],
                    unit=item["unit"],
                    pack_size=item.get("pack_size", "Standard"),
                    wholesale_price=item["wholesale_price"],
                    retail_price=item["retail_price"],
                    mrp=item["mrp"],
                    shelf_life_days=item["shelf_life_days"],
                    is_active=True,
                    manufacturer_id=mfg.id
                )
                session.add(prod)
                session.flush()

            # Batch
            batch_num = f"B-{now.strftime('%y%m')}-{prod.sku[-3:]}"
            existing_batch = session.query(ProductBatch).filter_by(batch_number=batch_num).first()
            if not existing_batch:
                batch = ProductBatch(
                    batch_number=batch_num,
                    product_id=prod.id,
                    mfg_date=now - timedelta(days=20),
                    best_before_date=now + timedelta(days=item["shelf_life_days"] - 20),
                    quantity=500
                )
                session.add(batch)

            # Store Inventory
            existing_inv = session.query(Inventory).filter_by(store_id="GUNTUR_STORE_01", product_id=prod.id).first()
            if not existing_inv:
                base_stock = 800 if "rice" in prod.id else 300 if "sugar" in prod.id else 150
                inv = Inventory(
                    store_id="GUNTUR_STORE_01",
                    product_id=prod.id,
                    current_stock=base_stock,
                    safety_stock=int(base_stock * 1.3),
                    reorder_threshold=int(base_stock * 0.8),
                    last_restocked_at=now - timedelta(days=5)
                )
                session.add(inv)

        # 5. Purchase Orders with Multi-Status Lifecycles
        po_specs = [
            {
                "id": "PO-9401",
                "status": "SUBMITTED",
                "supplier_id": "SUP_GUNTUR_01",
                "created_days_ago": 1,
                "items": [
                    {"product_id": "sona-masoori-rice", "name": "Babu Super Sona Masoori Rice (5kg)", "qty": 50, "unit": "5kg bag", "price": 290.0},
                    {"product_id": "chana-dal", "name": "Tata Sampann High-Protein Chana Dal (1kg)", "qty": 100, "unit": "1kg pack", "price": 88.0}
                ]
            },
            {
                "id": "PO-9402",
                "status": "ACCEPTED",
                "supplier_id": "SUP_GUNTUR_01",
                "created_days_ago": 2,
                "accepted_days_ago": 1,
                "items": [
                    {"product_id": "sugar", "name": "Madhur Pure Crystal Sugar (5kg)", "qty": 40, "unit": "5kg bag", "price": 205.0},
                    {"product_id": "cooking-oil", "name": "Fortune Sunlite Refined Sunflower Oil (1L)", "qty": 80, "unit": "1L pouch", "price": 122.0}
                ]
            },
            {
                "id": "PO-9403",
                "status": "DISPATCHED",
                "supplier_id": "SUP_VIJAYAWADA_01",
                "created_days_ago": 4,
                "accepted_days_ago": 3,
                "dispatched_days_ago": 1,
                "items": [
                    {"product_id": "toor-dal", "name": "Tata Sampann Unpolished Toor Dal (1kg)", "qty": 60, "unit": "1kg pack", "price": 148.0},
                    {"product_id": "basmati-rice", "name": "India Gate Royal Basmati Rice (5kg)", "qty": 30, "unit": "5kg bag", "price": 460.0}
                ]
            },
            {
                "id": "PO-9404",
                "status": "DELIVERED",
                "supplier_id": "SUP_GUNTUR_01",
                "created_days_ago": 7,
                "accepted_days_ago": 6,
                "dispatched_days_ago": 4,
                "delivered_days_ago": 2,
                "items": [
                    {"product_id": "aashirvaad-atta", "name": "Aashirvaad Superior Sharbati Atta (5kg)", "qty": 40, "unit": "5kg bag", "price": 235.0},
                    {"product_id": "tata-salt", "name": "Tata Vacuum Evaporated Iodized Salt (1kg)", "qty": 120, "unit": "1kg pack", "price": 23.0}
                ]
            },
            {
                "id": "PO-9405",
                "status": "CANCELLED",
                "supplier_id": "SUP_VIJAYAWADA_01",
                "cancellation_reason": "Crop arrival delayed at Vijayawada grain mandi.",
                "created_days_ago": 5,
                "cancelled_days_ago": 4,
                "items": [
                    {"product_id": "moong-dal", "name": "Fortune Premium Yellow Moong Dal (1kg)", "qty": 50, "unit": "1kg pack", "price": 120.0}
                ]
            }
        ]

        for spec in po_specs:
            existing_po = session.query(PurchaseOrder).filter_by(id=spec["id"]).first()
            if not existing_po:
                total = sum(it["qty"] * it["price"] for it in spec["items"])
                created_dt = now - timedelta(days=spec["created_days_ago"])
                po = PurchaseOrder(
                    id=spec["id"],
                    store_id="GUNTUR_STORE_01",
                    supplier_id=spec["supplier_id"],
                    total_amount=total,
                    status=spec["status"],
                    cancellation_reason=spec.get("cancellation_reason"),
                    lead_time_days=2,
                    is_demo=True,
                    created_at=created_dt,
                    submitted_at=created_dt,
                    accepted_at=now - timedelta(days=spec["accepted_days_ago"]) if "accepted_days_ago" in spec else None,
                    dispatched_at=now - timedelta(days=spec["dispatched_days_ago"]) if "dispatched_days_ago" in spec else None,
                    delivered_at=now - timedelta(days=spec["delivered_days_ago"]) if "delivered_days_ago" in spec else None,
                    cancelled_at=now - timedelta(days=spec["cancelled_days_ago"]) if "cancelled_days_ago" in spec else None
                )
                session.add(po)
                session.flush()

                for it in spec["items"]:
                    po_item = PurchaseOrderItem(
                        purchase_order_id=po.id,
                        product_id=it["product_id"],
                        product_name=it["name"],
                        quantity=it["qty"],
                        unit=it["unit"],
                        unit_price=it["price"],
                        total_price=it["qty"] * it["price"]
                    )
                    session.add(po_item)

                # Order Status History
                hist = OrderStatusHistory(
                    purchase_order_id=po.id,
                    from_status="DRAFT",
                    to_status=spec["status"],
                    changed_by="System Seed / Supplier Agent",
                    reason=spec.get("cancellation_reason") or "Initial seed transition",
                    timestamp=created_dt
                )
                session.add(hist)

        session.commit()
        print(" DemandX 2.0 Database seeded canonical grocery items and records without duplicates!")
    except Exception as e:
        session.rollback()
        print(f" Database seed notice: {e}")
    finally:
        session.close()
