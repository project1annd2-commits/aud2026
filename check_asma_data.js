import admin from 'firebase-admin';
import fs from 'fs';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(fs.readFileSync('./audit-457c9-firebase-adminsdk-fbsvc-0213350fe3.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'audit-457c9'
});

const db = admin.firestore();

async function checkAsmaData() {
  try {
    console.log('Checking schools created by asma_ayesha...');
    
    // Query schools created by asma_ayesha
    const schoolsSnapshot = await db.collection('schools')
      .where('createdBy', '==', 'asma_ayesha')
      .get();
      
    console.log(`Found ${schoolsSnapshot.size} schools created by asma_ayesha`);
    
    if (schoolsSnapshot.size > 0) {
      console.log('\nSchools:');
      schoolsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`- ${data.name} (${doc.id})`);
      });
    }
    
    // Check if we can query audits for these schools
    console.log('\nChecking audits for asma_ayesha\'s schools...');
    const schoolIds = [];
    schoolsSnapshot.forEach(doc => schoolIds.push(doc.id));
    
    if (schoolIds.length > 0) {
      // Check teacher audits
      const teacherAuditsSnapshot = await db.collection('audits')
        .where('schoolId', 'in', schoolIds.slice(0, 10)) // Limit to 10 due to Firestore constraints
        .get();
        
      console.log(`Found ${teacherAuditsSnapshot.size} teacher audits for asma_ayesha's schools`);
      
      // Check infrastructure audits
      const infraAuditsSnapshot = await db.collection('infrastructure_audits')
        .where('schoolId', 'in', schoolIds.slice(0, 10)) // Limit to 10 due to Firestore constraints
        .get();
        
      console.log(`Found ${infraAuditsSnapshot.size} infrastructure audits for asma_ayesha's schools`);
    }
    
    console.log('\nData verification completed successfully!');
  } catch (error) {
    console.error('Error checking data:', error);
  } finally {
    await admin.app().delete();
  }
}

checkAsmaData();