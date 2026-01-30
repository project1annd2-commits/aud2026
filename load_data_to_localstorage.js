// load_data_to_localstorage.js
import fs from 'fs';
import path from 'path';

// Load JSON data files
const schools = JSON.parse(fs.readFileSync('./extracted_data/schools.json', 'utf8'));
const teachers = JSON.parse(fs.readFileSync('./extracted_data/teachers.json', 'utf8'));
const mentors = JSON.parse(fs.readFileSync('./extracted_data/mentors.json', 'utf8'));
const audits = JSON.parse(fs.readFileSync('./extracted_data/audits.json', 'utf8'));
const infrastructureAudits = JSON.parse(fs.readFileSync('./extracted_data/infrastructure_audits.json', 'utf8'));

// Save to localStorage-like object
const localStorage = {};

localStorage.schools = JSON.stringify(schools);
localStorage.teachers = JSON.stringify(teachers);
localStorage.mentors = JSON.stringify(mentors);
localStorage.audits = JSON.stringify(audits);
localStorage.infrastructure_audits = JSON.stringify(infrastructureAudits);

// Write to a file that can be used by the app
fs.writeFileSync('./project/src/data/localStorageData.json', JSON.stringify(localStorage, null, 2));

console.log('Data loaded to localStorage format:');
console.log('- Schools:', schools.length);
console.log('- Teachers:', teachers.length);
console.log('- Mentors:', mentors.length);
console.log('- Audits:', audits.length);
console.log('- Infrastructure Audits:', infrastructureAudits.length);