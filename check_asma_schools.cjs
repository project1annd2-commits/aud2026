// Check schools and audits for asma_ayesha
const fs = require('fs');

// Load data
const schools = JSON.parse(fs.readFileSync('extracted_data/schools.json', 'utf8'));

// Get schools created by asma_ayesha
const asmaSchools = schools.filter(school => school.created_by === 'asma_ayesha');
console.log('Schools created by asma_ayesha:');
asmaSchools.forEach(school => {
  console.log(`- ${school.name} (ID: ${school.id})`);
});

// Get school IDs
const asmaSchoolIds = asmaSchools.map(school => school.id);
console.log('\nSchool IDs:', asmaSchoolIds);

// Check audits for these schools
const audits = JSON.parse(fs.readFileSync('extracted_data/audits.json', 'utf8'));
const infraAudits = JSON.parse(fs.readFileSync('extracted_data/infrastructure_audits.json', 'utf8'));

console.log('\nChecking audits for asma_ayesha schools...');

// Check teacher/mentor audits
const asmaAudits = audits.filter(audit => asmaSchoolIds.includes(audit.school_id));
console.log(`Found ${asmaAudits.length} teacher/mentor audits for asma_ayesha schools`);

// Check infrastructure audits
const asmaInfraAudits = infraAudits.filter(audit => asmaSchoolIds.includes(audit.school_id));
console.log(`Found ${asmaInfraAudits.length} infrastructure audits for asma_ayesha schools`);

console.log('\nTotal audits:', asmaAudits.length + asmaInfraAudits.length);