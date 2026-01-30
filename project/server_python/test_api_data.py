import requests

BASE_URL = "http://localhost:5000/api"

def test_endpoint(endpoint):
    try:
        response = requests.get(f"{BASE_URL}/{endpoint}")
        if response.status_code == 200:
            data = response.json()
            print(f"GET /api/{endpoint}: Success. Count = {len(data)}")
        else:
            print(f"GET /api/{endpoint}: Failed. Status = {response.status_code}")
    except Exception as e:
        print(f"GET /api/{endpoint}: Error - {e}")

if __name__ == "__main__":
    print("Testing API endpoints...")
    test_endpoint("schools")
    test_endpoint("teachers")
    test_endpoint("mentors")
    test_endpoint("audits")
