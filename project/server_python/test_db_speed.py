import pymongo
import time

uri = "mongodb+srv://project1annd2_db_user:mKhiz4Uy6ObbAeGV@cluster0.dvnoiyy.mongodb.net/school_audit_db?appName=Cluster0"
client = pymongo.MongoClient(uri)

def test_db():
    start_time = time.time()
    try:
        db = client.school_audit_db
        count = db.schools.count_documents({})
        print(f"Schools count: {count}")
        print(f"Time taken: {time.time() - start_time:.4f} seconds")
    except Exception as e:
        print(f"DB Error: {e}")

if __name__ == "__main__":
    test_db()
