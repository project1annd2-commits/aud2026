// State-wise analysis of schools
const fs = require('fs');
const path = require('path');

// Load data
const schools = JSON.parse(fs.readFileSync(path.join(__dirname, 'extracted_data', 'schools.json'), 'utf8'));
const audits = JSON.parse(fs.readFileSync(path.join(__dirname, 'extracted_data', 'audits.json'), 'utf8'));
const infrastructureAudits = JSON.parse(fs.readFileSync(path.join(__dirname, 'extracted_data', 'infrastructure_audits.json'), 'utf8'));

// Function to extract state from location
function extractState(location) {
  // Handle special cases
  if (location.includes('West Bengal')) return 'West Bengal';
  if (location.includes('Tamil Nadu')) return 'Tamil Nadu';
  if (location.includes('Assam')) return 'Assam';
  if (location.includes('Karnataka') || location.includes('KA') || location.includes('Bangalore') || location.includes('RT Nagar') || location.includes('Ilkal') || location.includes('Kollegal') || location.includes('Ghataprabha')) return 'Karnataka';
  if (location.includes('UP') || location.includes('Uttar Pradesh') || location.includes('Lucknow') || location.includes('Bahraich')) return 'Uttar Pradesh';
  if (location.includes('MH') || location.includes('Maharashtra')) return 'Maharashtra';
  if (location.includes('Odissa') || location.includes('Odisha')) return 'Odisha';
  if (location.includes('Chennai')) return 'Tamil Nadu';
  
  // For other locations, use the location as is
  return location;
}

// 1. Number of schools per state
const schoolsByState = {};
schools.forEach(school => {
  const state = extractState(school.location);
  if (!schoolsByState[state]) {
    schoolsByState[state] = {
      count: 0,
      schools: []
    };
  }
  schoolsByState[state].count++;
  schoolsByState[state].schools.push({
    name: school.name,
    location: school.location,
    code: school.code
  });
});

// 2. Create a map of school_id to state for audit analysis
const schoolToState = {};
schools.forEach(school => {
  const state = extractState(school.location);
  schoolToState[school.id] = state;
});

// 3. Calculate average performance metrics per state
const auditStatsByState = {};

// Process teacher and mentor audits
audits.forEach(audit => {
  const schoolId = audit.school_id;
  const state = schoolToState[schoolId];
  
  if (!state) return; // Skip if school not found
  
  if (!auditStatsByState[state]) {
    auditStatsByState[state] = {
      auditCount: 0,
      totalScore: 0,
      maxScore: 0,
      averageScore: 0,
      averagePercentage: 0
    };
  }
  
  // Parse versions if it's a string
  let versions = audit.versions;
  if (typeof versions === 'string') {
    try {
      versions = JSON.parse(versions);
    } catch (e) {
      console.error('Error parsing versions for audit:', audit.id);
      return;
    }
  }
  
  // Get the current version
  const currentVersion = versions[parseInt(audit.current_version)] || versions[0];
  if (!currentVersion) return;
  
  auditStatsByState[state].auditCount++;
  auditStatsByState[state].totalScore += currentVersion.totalScore;
  auditStatsByState[state].maxScore += currentVersion.maxScore;
});

// Process infrastructure audits
infrastructureAudits.forEach(audit => {
  const schoolId = audit.school_id;
  const state = schoolToState[schoolId];
  
  if (!state) return; // Skip if school not found
  
  if (!auditStatsByState[state]) {
    auditStatsByState[state] = {
      auditCount: 0,
      totalScore: 0,
      maxScore: 0,
      averageScore: 0,
      averagePercentage: 0
    };
  }
  
  // Parse versions if it's a string
  let versions = audit.versions;
  if (typeof versions === 'string') {
    try {
      versions = JSON.parse(versions);
    } catch (e) {
      console.error('Error parsing versions for infrastructure audit:', audit.id);
      return;
    }
  }
  
  // Get the current version
  const currentVersion = versions[parseInt(audit.current_version)] || versions[0];
  if (!currentVersion) return;
  
  auditStatsByState[state].auditCount++;
  auditStatsByState[state].totalScore += currentVersion.totalScore;
  auditStatsByState[state].maxScore += currentVersion.maxScore;
});

// Calculate averages
Object.keys(auditStatsByState).forEach(state => {
  const stats = auditStatsByState[state];
  if (stats.auditCount > 0) {
    stats.averageScore = Math.round((stats.totalScore / stats.auditCount) * 100) / 100;
    stats.averagePercentage = Math.round(((stats.totalScore / stats.maxScore) * 100) * 100) / 100;
  }
});

// Generate report
console.log('=== STATE-WISE ANALYSIS OF SCHOOLS ===\n');

console.log('1. NUMBER OF SCHOOLS PER STATE:');
console.log('--------------------------------');
Object.keys(schoolsByState)
  .sort((a, b) => schoolsByState[b].count - schoolsByState[a].count)
  .forEach(state => {
    console.log(`${state}: ${schoolsByState[state].count} schools`);
  });

console.log('\n2. AVERAGE PERFORMANCE METRICS PER STATE:');
console.log('-----------------------------------------');
Object.keys(auditStatsByState)
  .sort((a, b) => auditStatsByState[b].averagePercentage - auditStatsByState[a].averagePercentage)
  .forEach(state => {
    const stats = auditStatsByState[state];
    console.log(`${state}:`);
    console.log(`  - Audits Conducted: ${stats.auditCount}`);
    console.log(`  - Average Score: ${stats.averageScore}`);
    console.log(`  - Average Percentage: ${stats.averagePercentage}%`);
  });

console.log('\n3. DETAILED STATE BREAKDOWN:');
console.log('----------------------------');
Object.keys(schoolsByState)
  .sort((a, b) => schoolsByState[b].count - schoolsByState[a].count)
  .forEach(state => {
    console.log(`\n${state} (${schoolsByState[state].count} schools):`);
    schoolsByState[state].schools.forEach(school => {
      console.log(`  - ${school.name} (${school.location})`);
    });
    
    if (auditStatsByState[state]) {
      const stats = auditStatsByState[state];
      console.log(`  Performance: ${stats.averagePercentage}% average score from ${stats.auditCount} audits`);
    } else {
      console.log(`  Performance: No audit data available`);
    }
  });