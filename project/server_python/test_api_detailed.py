import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_detailed():
    print("Testing API endpoints in detail...\n")
    
    # Test Schools
    try:
        response = requests.get(f"{BASE_URL}/schools")
        if response.status_code == 200:
            schools = response.json()
            print(f"✅ Schools: {len(schools)} documents")
            if schools:
                print(f"   Sample: {schools[0].get('name', 'N/A')}")
                print(f"   Fields: {list(schools[0].keys())}")
        else:
            print(f"❌ Schools: Status {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Schools Error: {e}")
    
    print()
    
    # Test Teachers
    try:
        response = requests.get(f"{BASE_URL}/teachers")
        if response.status_code == 200:
            teachers = response.json()
            print(f"✅ Teachers: {len(teachers)} documents")
            if teachers:
                print(f"   Sample: {teachers[0].get('name', 'N/A')}")
                print(f"   Fields: {list(teachers[0].keys())}")
        else:
            print(f"❌ Teachers: Status {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Teachers Error: {e}")
    
    print()
    
    # Test Mentors
    try:
        response = requests.get(f"{BASE_URL}/mentors")
        if response.status_code == 200:
            mentors = response.json()
            print(f"✅ Mentors: {len(mentors)} documents")
            if mentors:
                print(f"   Sample: {mentors[0].get('name', 'N/A')}")
                print(f"   Fields: {list(mentors[0].keys())}")
        else:
            print(f"❌ Mentors: Status {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Mentors Error: {e}")
    
    print()
    
    # Test Audits
    try:
        response = requests.get(f"{BASE_URL}/audits")
        if response.status_code == 200:
            audits = response.json()
            print(f"✅ Audits: {len(audits)} documents")
            if audits:
                print(f"   Type: {audits[0].get('type', 'N/A')}")
                print(f"   Fields: {list(audits[0].keys())}")
        else:
            print(f"❌ Audits: Status {response.status_code}")
            print(f"   Response: {response.text}")
    except Exception as e:
        print(f"❌ Audits Error: {e}")

if __name__ == "__main__":
    test_detailed()
