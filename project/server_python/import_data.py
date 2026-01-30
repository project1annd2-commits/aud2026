import json
import asyncio
import os
import sys

# Add current directory to path so we can import database
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import (
    schools_collection, 
    teachers_collection, 
    mentors_collection, 
    audits_collection
)

DATA_FILE_PATH = r"c:/Users/5410/OneDrive/Documents/aud2026/project/src/data/localStorageData.json"

def clean_item(item):
    """
    Convert snake_case keys to camelCase and parse nested JSON strings.
    """
    new_item = {}
    for k, v in item.items():
        # Key Conversion
        if k == 'created_by': k = 'createdBy'
        elif k == 'created_at': k = 'createdAt'
        elif k == 'school_id': k = 'schoolId'
        elif k == 'subject_id': k = 'subjectId'
        elif k == 'access_code': k = 'accessCode'
        elif k == 'current_version': k = 'currentVersion'
        elif k == 'edited_by': k = 'editedBy'
        elif k == 'is_draft': k = 'isDraft'
        elif k == 'max_score': k = 'maxScore'
        elif k == 'total_score': k = 'totalScore'
        
        # Value Parsing (Nested JSON strings)
        if k == 'versions' and isinstance(v, str):
            try:
                v = json.loads(v)
            except:
                pass
        
        # Recursive cleaning for lists (like versions)
        if isinstance(v, list):
            new_list = []
            for i in v:
                if isinstance(i, dict):
                    new_list.append(clean_item(i))
                else:
                    new_list.append(i)
            v = new_list
        # Recursive cleaning for dicts
        elif isinstance(v, dict):
            v = clean_item(v)
            
        new_item[k] = v
        
    # Validation/Fixes for specific models
    if 'currentVersion' in new_item:
        try:
            new_item['currentVersion'] = int(new_item['currentVersion'])
        except:
            pass 
            
    return new_item

async def import_data():
    if not os.path.exists(DATA_FILE_PATH):
        print(f"File not found: {DATA_FILE_PATH}")
        return

    print(f"Reading data from {DATA_FILE_PATH}...")
    with open(DATA_FILE_PATH, 'r', encoding='utf-8') as f:
        file_content = f.read()
    
    try:
        data = json.loads(file_content)
    except json.JSONDecodeError as e:
        print(f"Error decoding JSON: {e}")
        return

    # Map json keys to collections
    key_map = {
        "schools": schools_collection,
        "teachers": teachers_collection,
        "mentors": mentors_collection,
        "audits": audits_collection
    }
    
    for key, collection in key_map.items():
        if key in data:
            print(f"Processing {key}...")
            # Clear existing data first to remove bad imports
            await collection.delete_many({})
            print(f"Cleared {key} collection.")
            
            try:
                items_str = data[key]
                if isinstance(items_str, str):
                    items = json.loads(items_str)
                else:
                    items = items_str
            except (json.JSONDecodeError, TypeError) as e:
                print(f"Error parsing inner JSON for {key}: {e}")
                continue
            
            if not isinstance(items, list):
                print(f"Skipping {key}: Expected a list")
                continue
                
            count = 0
            for item in items:
                cleaned_item = clean_item(item)
                
                # Use source 'id' as MongoDB '_id'
                if "id" in cleaned_item:
                    cleaned_item["_id"] = cleaned_item["id"]
                    del cleaned_item["id"]
                
                try:
                    await collection.insert_one(cleaned_item)
                    count += 1
                except Exception as e:
                    print(f"Failed to insert item: {e}")

            print(f"Imported {count} new documents into {key} collection.")
        else:
            print(f"Key '{key}' not found.")

if __name__ == "__main__":
    asyncio.run(import_data())
