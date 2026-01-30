// merge_and_migrate.js
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';

// Function to load JSON file
function loadJson(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`File ${filePath} not found, returning empty array`);
    return [];
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

// Function to save JSON file
function saveJson(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
  console.log(`Saved ${data.length} records to ${filePath}`);
}

// Function to merge arrays and remove duplicates based on id
function mergeAndDeduplicate(existing, additional) {
  const merged = [...existing];
  const existingIds = new Set(existing.map(item => item.id));
  
  additional.forEach(item => {
    if (!existingIds.has(item.id)) {
      merged.push(item);
      existingIds.add(item.id);
    }
  });
  
  return merged;
}

// Function to run migration
function runMigration() {
  return new Promise((resolve, reject) => {
    // Get the service account key file
    const keyFiles = fs.readdirSync('.').filter(file => file.includes('firebase-adminsdk'));
    if (keyFiles.length === 0) {
      reject(new Error('No Firebase service account key found'));
      return;
    }
    const keyFile = keyFiles[0];
    
    console.log('Running migration with key file:', keyFile);
    
    const migrateProcess = spawn('node', ['migrate_to_firebase.js', '--key', keyFile, '--dataDir', './extracted_data', '--projectId', 'audit-457c9'], {
      stdio: 'inherit'
    });
    
    migrateProcess.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Migration process exited with code ${code}`));
      }
    });
    
    migrateProcess.on('error', (error) => {
      reject(error);
    });
  });
}

// Main function
async function main() {
  console.log('Merging additional data with existing data...');
  
  try {
    // Merge schools data
    console.log('Merging schools data...');
    const existingSchools = loadJson(path.join('extracted_data', 'schools.json'));
    const additionalSchools = loadJson(path.join('extracted_data', 'schools_additional.json'));
    const mergedSchools = mergeAndDeduplicate(existingSchools, additionalSchools);
    saveJson(path.join('extracted_data', 'schools.json'), mergedSchools);
    
    // Merge teachers data
    console.log('Merging teachers data...');
    const existingTeachers = loadJson(path.join('extracted_data', 'teachers.json'));
    const additionalTeachers = loadJson(path.join('extracted_data', 'teachers_additional.json'));
    const mergedTeachers = mergeAndDeduplicate(existingTeachers, additionalTeachers);
    saveJson(path.join('extracted_data', 'teachers.json'), mergedTeachers);
    
    // Merge mentors data
    console.log('Merging mentors data...');
    const existingMentors = loadJson(path.join('extracted_data', 'mentors.json'));
    const additionalMentors = loadJson(path.join('extracted_data', 'mentors_additional.json'));
    const mergedMentors = mergeAndDeduplicate(existingMentors, additionalMentors);
    saveJson(path.join('extracted_data', 'mentors.json'), mergedMentors);
    
    // Merge audits data
    console.log('Merging audits data...');
    const existingAudits = loadJson(path.join('extracted_data', 'audits.json'));
    const additionalAudits = loadJson(path.join('extracted_data', 'audits_additional.json'));
    const mergedAudits = mergeAndDeduplicate(existingAudits, additionalAudits);
    saveJson(path.join('extracted_data', 'audits.json'), mergedAudits);
    
    // Merge infrastructure audits data
    console.log('Merging infrastructure audits data...');
    const existingInfraAudits = loadJson(path.join('extracted_data', 'infrastructure_audits.json'));
    const additionalInfraAudits = loadJson(path.join('extracted_data', 'infrastructure_audits_additional.json'));
    const mergedInfraAudits = mergeAndDeduplicate(existingInfraAudits, additionalInfraAudits);
    saveJson(path.join('extracted_data', 'infrastructure_audits.json'), mergedInfraAudits);
    
    console.log('All data merged successfully!');
    console.log('Starting Firebase migration...');
    
    // Run the migration
    await runMigration();
    
    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Error during merge and migration:', error);
    process.exit(1);
  }
}

main();