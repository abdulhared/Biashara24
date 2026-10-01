"""SQLite backup/restore and first-admin provisioning. Run from backend."""
import argparse
import getpass
import sqlite3
import time
from contextlib import closing
from pathlib import Path

def copy_database(source, destination):
    source, destination = Path(source).resolve(), Path(destination).resolve()
    if not source.is_file(): raise ValueError("Source database does not exist")
    if destination.exists(): raise ValueError("Destination already exists; choose a new path")
    destination.parent.mkdir(parents=True, exist_ok=True)
    start=time.monotonic()
    with closing(sqlite3.connect(source.as_uri()+"?mode=ro",uri=True)) as src, closing(sqlite3.connect(destination)) as dst:
        src.backup(dst)
        result=dst.execute("PRAGMA integrity_check").fetchone()[0]
        if result!="ok": raise ValueError("Database integrity check failed: "+result)
    return {"source":str(source),"destination":str(destination),"seconds":round(time.monotonic()-start,3),"integrity":"ok"}

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    sub=parser.add_subparsers(dest="command",required=True)
    for name in ("backup","restore"):
        p=sub.add_parser(name);p.add_argument("source");p.add_argument("destination")
    sub.add_parser("create-admin")
    args=parser.parse_args()
    if args.command in ("backup","restore"):
        print(copy_database(args.source,args.destination));return
    from sqlalchemy import select
    from .database import engine,SessionLocal
    from .migrations import upgrade
    from .models import User
    from .middleware.auth import hash_password
    upgrade(engine)
    username=input("Admin email: ").strip().lower()
    password=getpass.getpass("Password (at least 12 characters): ")
    if not username or len(password)<12: raise ValueError("Email and a password of at least 12 characters are required")
    if password!=getpass.getpass("Confirm password: "): raise ValueError("Passwords do not match")
    with SessionLocal() as db:
        if db.scalar(select(User).where(User.username==username)): raise ValueError("Account already exists")
        db.add(User(username=username,password_hash=hash_password(password),role="director",full_name="Director"))
        db.commit()
    print("Director account created.")

if __name__=="__main__": main()
