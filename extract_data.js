import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Create output directory
const outputDir = 'extracted_data';
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

// Helper function to extract and save data
async function extractAndSave(tableName, fileName) {
  console.log(`Extracting ${tableName} data...`);
  const { data, error } = await supabase.from(tableName).select('*');
  if (error) {
    console.error(`Error extracting ${tableName}:`, error);
    return;
  }
  fs.writeFileSync(path.join(outputDir, fileName), JSON.stringify(data, null, 2));
  console.log(`${tableName} data shape: ${data.length} records`);
}

// Extract all data
async function main() {
  await extractAndSave('schools', 'schools.json');
  await extractAndSave('teachers', 'teachers.json');
  await extractAndSave('mentors', 'mentors.json');
  await extractAndSave('audits', 'audits.json');
  await extractAndSave('infrastructure_audits', 'infrastructure_audits.json');

  console.log('\nAll data has been extracted and saved to JSON files in the "extracted_data" directory');
}

main().catch(console.error);