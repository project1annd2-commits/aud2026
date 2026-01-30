"""
Check MongoDB collections to see actual counts
"""
import asyncio
from database import (
    schools_collection,
    teachers_collection,
    mentors_collection,
    audits_collection
)

async def check_counts():
    schools_count = await schools_collection.count_documents({})
    teachers_count = await teachers_collection.count_documents({})
    mentors_count = await mentors_collection.count_documents({})
    audits_count = await audits_collection.count_documents({})
    
    print("MongoDB Collection Counts:")
    print(f"Schools: {schools_count}")
    print(f"Teachers: {teachers_count}")
    print(f"Mentors: {mentors_count}")
    print(f"Audits: {audits_count}")
    
    # Check if there are any documents with different field names
    print("\n--- Checking field names ---")
    
    if schools_count > 0:
        sample_school = await schools_collection.find_one({})
        print(f"\nSample School fields: {list(sample_school.keys())}")
    
    if teachers_count > 0:
        sample_teacher = await teachers_collection.find_one({})
        print(f"Sample Teacher fields: {list(sample_teacher.keys())}")
    
    if mentors_count > 0:
        sample_mentor = await mentors_collection.find_one({})
        print(f"Sample Mentor fields: {list(sample_mentor.keys())}")

if __name__ == "__main__":
    asyncio.run(check_counts())
