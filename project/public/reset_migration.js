// reset_migration.js
// This script clears the migration flag so the app will fetch fresh data from Firebase

// Clear the migration flag
localStorage.removeItem('supabase_migration_completed');

// Clear any existing data
localStorage.removeItem('schools');
localStorage.removeItem('teachers');
localStorage.removeItem('mentors');
localStorage.removeItem('audits');
localStorage.removeItem('infrastructure_audits');

console.log('Migration flag and localStorage data cleared');
console.log('Please refresh the app to fetch data from Firebase');