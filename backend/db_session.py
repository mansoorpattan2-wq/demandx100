"""
DemandX 2.0 — Database Session & Connection Management
======================================================
Supports:
1. Supabase PostgreSQL via DATABASE_URL / SUPABASE_DB_URL (using psycopg 3)
2. Zero-friction persistent SQLite fallback (sqlite:///demandx.db) when PostgreSQL is not configured
3. Thread-safe session factories and FastAPI dependency injection
"""

import os
import re
import urllib.parse
from typing import Generator, Dict, Any, List
from sqlalchemy import create_engine, text, inspect
from sqlalchemy.orm import sessionmaker, declarative_base, Session

# Try loading .env from backend directory and root directory (Render env vars take precedence)
try:
    from dotenv import load_dotenv
    backend_dir = os.path.dirname(os.path.abspath(__file__))
    base_dir = os.path.dirname(backend_dir)
    for env_path in [
        os.path.join(base_dir, ".env"),
        os.path.join(backend_dir, ".env"),
    ]:
        if os.path.exists(env_path):
            load_dotenv(env_path, override=False)
except ImportError:
    pass

# Base class for SQLAlchemy ORM models
Base = declarative_base()


def mask_db_url(url: str) -> str:
    """Masks database user password in connection strings."""
    if not url or "@" not in url:
        return url
    return re.sub(r"://([^:]+):([^@]+)@", r"://\1:****@", url)


def get_database_url() -> str:
    """
    Resolves the connection string from environment variables.
    Uses the exact URL supplied through the environment (e.g. Supabase Session Pooler).
    Ensures URL encoding for special characters in credentials and driver prefix for psycopg3.
    Removes hardcoded pooler-host guessing.
    """
    raw_url = (
        os.environ.get("DATABASE_URL")
        or os.environ.get("SUPABASE_DB_URL")
        or os.environ.get("POSTGRES_URL")
        or ""
    ).strip()

    if not raw_url:
        # Fallback to local persistent SQLite
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        sqlite_path = os.path.join(base_dir, "demandx.db")
        return f"sqlite:///{sqlite_path}"

    scheme_sep = "://"
    if scheme_sep not in raw_url:
        return raw_url

    prefix, rest = raw_url.split(scheme_sep, 1)
    driver_prefix = "postgresql+psycopg" if prefix in ["postgres", "postgresql", "postgresql+psycopg"] else prefix

    if "@" not in rest:
        return f"{driver_prefix}://{rest}"

    # Split credentials and host at the last '@' to safely handle passwords containing '@'
    last_at = rest.rfind("@")
    user_pass = rest[:last_at]
    host_db = rest[last_at + 1:]

    if ":" in user_pass:
        user, pwd = user_pass.split(":", 1)
        # Avoid double-encoding by unquoting first, then cleanly encoding special characters
        raw_pwd = urllib.parse.unquote(pwd)
        encoded_pwd = urllib.parse.quote(raw_pwd, safe="")
        credentials = f"{user}:{encoded_pwd}"
    else:
        credentials = user_pass

    return f"{driver_prefix}://{credentials}@{host_db}"


def create_resilient_engine():
    """Creates SQLAlchemy engine from exact configured URL, falling back to SQLite if unreachable."""
    configured_url = get_database_url()
    is_sqlite = configured_url.startswith("sqlite")

    engine_args = {
        "echo": False,
        "future": True,
    }

    if is_sqlite:
        engine_args["connect_args"] = {"check_same_thread": False}
        return create_engine(configured_url, **engine_args), configured_url, True

    # PostgreSQL / Supabase
    engine_args["pool_pre_ping"] = True
    engine_args["pool_size"] = 10
    engine_args["max_overflow"] = 20
    engine_args["connect_args"] = {"connect_timeout": 10}

    try:
        eng = create_engine(configured_url, **engine_args)
        with eng.connect() as conn:
            conn.execute(text("SELECT 1"))
        masked = mask_db_url(configured_url)
        print(f" DemandX Backend connected to PostgreSQL: {masked}")
        return eng, configured_url, False
    except Exception as e:
        err_msg = str(e)
        if "@" in err_msg:
            err_msg = re.sub(r"://([^:]+):([^@]+)@", r"://\1:****@", err_msg)
        print(f" Warning: Could not connect to remote PostgreSQL ({err_msg}). Falling back to local persistent SQLite.")
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        sqlite_path = os.path.join(base_dir, "demandx.db")
        fallback_url = f"sqlite:///{sqlite_path}"
        eng = create_engine(fallback_url, connect_args={"check_same_thread": False})
        return eng, fallback_url, True



engine, ACTIVE_DATABASE_URL, is_sqlite = create_resilient_engine()

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
    expire_on_commit=False
)


def get_db() -> Generator[Session, None, None]:
    """FastAPI dependency for acquiring database sessions."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Initializes tables without dropping existing data and seeds canonical grocery demo records."""
    import backend.models  # noqa: F401
    Base.metadata.create_all(bind=engine)

    from backend.seed_data import seed_database_if_empty
    seed_database_if_empty()


def get_database_status_info() -> Dict[str, Any]:
    """Inspects active database, provider type, schema tables and record metrics."""
    try:
        insp = inspect(engine)
        tables = insp.get_table_names()
    except Exception:
        tables = []

    is_supabase = "supabase" in ACTIVE_DATABASE_URL.lower() or "supabase" in (
        os.environ.get("DATABASE_URL", "") + os.environ.get("SUPABASE_DB_URL", "")
    ).lower()

    masked_url = mask_db_url(ACTIVE_DATABASE_URL)
    provider = "Supabase PostgreSQL" if (is_supabase and not is_sqlite) else ("PostgreSQL" if not is_sqlite else "Persistent SQLite (DemandX Local Engine)")

    product_count = 0
    order_count = 0
    try:
        with engine.connect() as conn:
            if "products" in tables:
                r = conn.execute(text("SELECT count(*) FROM products")).scalar()
                product_count = int(r or 0)
            if "purchase_orders" in tables:
                r2 = conn.execute(text("SELECT count(*) FROM purchase_orders")).scalar()
                order_count = int(r2 or 0)
    except Exception:
        pass

    return {
        "status": "connected",
        "provider": provider,
        "is_supabase": is_supabase and not is_sqlite,
        "engine_driver": "sqlite" if is_sqlite else "postgresql+psycopg",
        "connection_target": masked_url,
        "is_fallback": is_sqlite and bool(os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL")),
        "tables": tables,
        "table_count": len(tables),
        "total_grocery_products": product_count,
        "total_purchase_orders": order_count,
        "supabase_configured_in_env": bool(
            os.environ.get("DATABASE_URL") or os.environ.get("SUPABASE_DB_URL") or os.environ.get("VITE_SUPABASE_URL")
        )
    }


