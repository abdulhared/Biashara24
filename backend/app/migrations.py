"""Versioned SQLite upgrades with a backup and preservation of business records."""
from datetime import datetime
from pathlib import Path
import sqlite3
from contextlib import closing
from sqlalchemy import inspect, text
from .database import Base

VERSION = 6
# Defaults for existing rows when adding the fields introduced by this migration.
DEFAULTS = {"updated_at": "CURRENT_TIMESTAMP", "created_at": "CURRENT_TIMESTAMP",
            "started_at": "CURRENT_TIMESTAMP", "is_active": "1", "printer_port": "9100",
            "reorder_quantity": "0", "cost_per_unit": "0", "version": "1", "voided_quantity": "0", "tax_rate": "16"}

def upgrade(engine):
    from . import models
    existing = inspect(engine).get_table_names()
    missing = [(table, col) for table in Base.metadata.sorted_tables if table.name in existing
               for col in table.columns if col.name not in {c["name"] for c in inspect(engine).get_columns(table.name)}]
    old_payment_unique = 'payments' in existing and any(c['column_names'] == ['order_id'] for c in inspect(engine).get_unique_constraints('payments'))
    if (missing or old_payment_unique) and engine.dialect.name != "sqlite":
        raise RuntimeError("An existing non-SQLite database needs a reviewed schema migration before startup.")
    pending_version = bool(existing) and "schema_versions" not in existing
    if existing and "schema_versions" in existing:
        with engine.connect() as conn:
            pending_version = not conn.execute(text("SELECT version FROM schema_versions WHERE version = :version"), {"version":VERSION}).first()
    if (missing or pending_version or old_payment_unique) and engine.url.database and engine.url.database != ":memory:" and engine.dialect.name == "sqlite":
        source = Path(engine.url.database).resolve()
        backup = source.with_name(source.name + f".pre-v{VERSION}-" + datetime.now().strftime("%Y%m%d%H%M%S%f") + ".bak")
        with closing(sqlite3.connect(source)) as src, closing(sqlite3.connect(backup)) as dst:
            src.backup(dst)
    Base.metadata.create_all(engine)
    with engine.begin() as conn:
        for table, col in missing:
            # SQLite cannot add CURRENT_TIMESTAMP defaults. Backfill explicitly.
            kind = col.type.compile(dialect=engine.dialect)
            fk = next(iter(col.foreign_keys), None)
            reference = f' REFERENCES "{fk.column.table.name}"("{fk.column.name}")' if fk else ""
            conn.execute(text(f'ALTER TABLE "{table.name}" ADD COLUMN "{col.name}" {kind}{reference}'))
            default = DEFAULTS.get(col.name)
            if default:
                conn.execute(text(f'UPDATE "{table.name}" SET "{col.name}" = {default} WHERE "{col.name}" IS NULL'))
        if "carwash_transactions" in existing:
            conn.execute(text("UPDATE carwash_transactions SET transaction_number = 'CW-LEGACY-' || id WHERE transaction_number IS NULL"))
        if old_payment_unique:
            # SQLite cannot drop an inline UNIQUE constraint. Copy all columns and
            # IDs into the new schema inside this transaction, with a pre-upgrade backup.
            from sqlalchemy.schema import CreateTable
            from .models import Payment
            table = Payment.__table__
            ddl = str(CreateTable(table).compile(dialect=engine.dialect))
            conn.execute(text(ddl.replace('CREATE TABLE payments', 'CREATE TABLE payments_upgrade', 1)))
            columns = ', '.join('"' + c.name + '"' for c in table.columns)
            conn.execute(text(f'INSERT INTO payments_upgrade ({columns}) SELECT {columns} FROM payments'))
            conn.execute(text('DROP TABLE payments'))
            conn.execute(text('ALTER TABLE payments_upgrade RENAME TO payments'))
        for table in Base.metadata.sorted_tables:
            for idx in table.indexes:
                idx.create(conn, checkfirst=True)
        if engine.dialect.name == "sqlite":
            conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ux_wash_number ON carwash_transactions(transaction_number)"))
        conn.execute(text("CREATE TABLE IF NOT EXISTS schema_versions (version INTEGER PRIMARY KEY)"))
        if not conn.execute(text("SELECT version FROM schema_versions WHERE version = 1")).first():
            conn.execute(text("INSERT INTO schema_versions(version) VALUES (1)"))
        if not conn.execute(text("SELECT version FROM schema_versions WHERE version = 2")).first():
            conn.execute(text("INSERT INTO schema_versions(version) VALUES (2)"))
        if not conn.execute(text("SELECT version FROM schema_versions WHERE version = 3")).first():
            conn.execute(text("INSERT INTO schema_versions(version) VALUES (3)"))
        if not conn.execute(text("SELECT version FROM schema_versions WHERE version = 4")).first():
            # Recover only recorded submission history, never today's edited menu.
            import json
            for items, deliveries in conn.execute(text("SELECT items, deliveries FROM order_batches WHERE kind IN ('original','addition') ORDER BY id")):
                items = json.loads(items) if isinstance(items, str) else items
                deliveries = json.loads(deliveries) if isinstance(deliveries, str) else deliveries
                names = {d['department_id']: d.get('department') for d in deliveries or []}
                for item in items or []:
                    conn.execute(text("UPDATE order_items SET name_at_time=:name, department_id_at_time=:department, department_name_at_time=:department_name WHERE id=:id AND name_at_time IS NULL"),
                                 {"id":item['order_item_id'], "name":item['name'], "department":item['department_id'],
                                  "department_name":item.get('department_name') or names.get(item['department_id'])})
            conn.execute(text("INSERT INTO schema_versions(version) VALUES (4)"))
        if not conn.execute(text("SELECT version FROM schema_versions WHERE version = 5")).first():
            conn.execute(text("UPDATE payments SET active_order_id=order_id WHERE status != 'rejected'"))
            conn.execute(text("INSERT INTO schema_versions(version) VALUES (5)"))
        if not conn.execute(text("SELECT version FROM schema_versions WHERE version = 6")).first():
            # Keep existing open food visible without inventing historical recipes
            # or deducting ingredients that might already have been consumed.
            conn.execute(text("""INSERT INTO kitchen_lines (order_item_id,status,version,recipe_snapshot)
                SELECT i.id, CASE WHEN i.ready THEN 'ready' ELSE 'pending' END, 1, '[]'
                FROM order_items i JOIN orders o ON o.id=i.order_id
                WHERE o.status NOT IN ('cleared','completed','cancelled')
                  AND i.quantity > i.voided_quantity
                  AND NOT EXISTS (SELECT 1 FROM kitchen_lines k WHERE k.order_item_id=i.id)"""))
            conn.execute(text("INSERT INTO schema_versions(version) VALUES (6)"))
