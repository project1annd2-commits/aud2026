import os
from dotenv import load_dotenv
import pandas as pd
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Initialize Supabase client
url = os.getenv('VITE_SUPABASE_URL')
key = os.getenv('VITE_SUPABASE_ANON_KEY')
supabase: Client = create_client(url, key)

# Create output directory
output_dir = 'extracted_data'
os.makedirs(output_dir, exist_ok=True)

# Extract and save Schools data
print("Extracting Schools data...")
schools_response = supabase.table('schools').select('*').execute()
schools_df = pd.DataFrame(schools_response.data)
schools_df.to_json(f'{output_dir}/schools.json', orient='records', indent=2)
print(f"Schools data shape: {schools_df.shape}")

# Extract and save Teachers data
print("\nExtracting Teachers data...")
teachers_response = supabase.table('teachers').select('*').execute()
teachers_df = pd.DataFrame(teachers_response.data)
teachers_df.to_json(f'{output_dir}/teachers.json', orient='records', indent=2)
print(f"Teachers data shape: {teachers_df.shape}")

# Extract and save Mentors data
print("\nExtracting Mentors data...")
mentors_response = supabase.table('mentors').select('*').execute()
mentors_df = pd.DataFrame(mentors_response.data)
mentors_df.to_json(f'{output_dir}/mentors.json', orient='records', indent=2)
print(f"Mentors data shape: {mentors_df.shape}")

# Extract and save Audits data
print("\nExtracting Audits data...")
audits_response = supabase.table('audits').select('*').execute()
audits_df = pd.DataFrame(audits_response.data)
audits_df.to_json(f'{output_dir}/audits.json', orient='records', indent=2)
print(f"Audits data shape: {audits_df.shape}")

# Extract and save Infrastructure Audits data
print("\nExtracting Infrastructure Audits data...")
infra_audits_response = supabase.table('infrastructure_audits').select('*').execute()
infra_audits_df = pd.DataFrame(infra_audits_response.data)
infra_audits_df.to_json(f'{output_dir}/infrastructure_audits.json', orient='records', indent=2)
print(f"Infrastructure Audits data shape: {infra_audits_df.shape}")

print("\nAll data has been extracted and saved to JSON files in the 'extracted_data' directory")