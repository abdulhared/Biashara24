import os
import tempfile
from pathlib import Path

# All tests share a fresh temporary database, never the business database.
TEST_DIRECTORY = tempfile.TemporaryDirectory(prefix="biashara360-tests-")
os.environ["DATABASE_URL"] = "sqlite:///" + str(Path(TEST_DIRECTORY.name) / "test.db")
os.environ["ENVIRONMENT"] = "development"

def pytest_sessionfinish(session, exitstatus):
    from app.database import engine
    engine.dispose()
    TEST_DIRECTORY.cleanup()
