import motor.motor_asyncio
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URI = os.getenv("MONGODB_URI", "mongodb+srv://project1annd2_db_user:mKhiz4Uy6ObbAeGV@cluster0.dvnoiyy.mongodb.net/school_audit_db?appName=Cluster0")

client = motor.motor_asyncio.AsyncIOMotorClient(MONGODB_URI)
db = client.school_audit_db

# Collections
schools_collection = db["schools"]
teachers_collection = db["teachers"]
mentors_collection = db["mentors"]
audits_collection = db["audits"]
infra_audits_collection = db["infrastructure_audits"]
devices_collection = db["devices"]
login_sessions_collection = db["login_sessions"]
