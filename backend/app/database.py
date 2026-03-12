import os
import logging
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from dotenv import load_dotenv
from pathlib import Path

logger = logging.getLogger(__name__)

ROOT_DIR = Path(__file__).parent.parent
UPLOAD_DIR = ROOT_DIR / "uploads"
UPLOAD_DIR.mkdir(exist_ok=True)
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ.get('MONGO_URL')
db_name = os.environ.get('DB_NAME')

if not mongo_url:
    logger.error("MONGO_URL environment variable is not set!")
    raise RuntimeError("MONGO_URL environment variable is required")
if not db_name:
    logger.error("DB_NAME environment variable is not set!")
    raise RuntimeError("DB_NAME environment variable is required")

# Log connection attempt (mask the password in the URL)
safe_url = mongo_url.split('@')[-1] if '@' in mongo_url else 'localhost'
logger.info(f"Connecting to MongoDB at: {safe_url}, database: {db_name}")

client = AsyncIOMotorClient(
    mongo_url,
    tlsCAFile=certifi.where(),
    serverSelectionTimeoutMS=30000,
    tls=True
)
db = client[db_name]


async def check_db_connection():
    """Verify that the database connection is working."""
    try:
        await client.admin.command('ping')
        logger.info("MongoDB connection successful")
        return True
    except Exception as e:
        logger.error(f"MongoDB connection failed: {e}")
        return False
