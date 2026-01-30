// test_database_query.js
import admin from 'firebase-admin';
import fs from 'fs';

// Initialize Firebase Admin SDK
const serviceAccount = JSON.parse(fs.readFileSync('./audit-457c9-firebase-adminsdk-fbsvc-0213350fe3.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'audit-457c9'
});

const db = admin.firestore();

async function testDatabaseQuery() {
  try {
    console.log('Testing database query for asma_ayesha...');
    
    // Test the exact query that the frontend uses
    const schoolsCollection = db.collection('schools');
    const query = schoolsCollection
      .where('createdBy', '==', 'asma_ayesha')
      .orderBy('createdAt', 'desc');
      
    const querySnapshot = await query.get();
    
    console.log(`Query returned ${querySnapshot.size} documents`);
    
    querySnapshot.forEach((doc, index) => {
      if (index < 5) { // Only show first 5
        const data = doc.data();
        console.log(`- ${data.name} (createdBy: ${data.createdBy})`);
      }
    });
    
    if (querySnapshot.size === 0) {
      console.log('Query returned no results. Let\'s check all schools to see what\'s in the database:');
      
      const allSchoolsSnapshot = await db.collection('schools').limit(10).get();
      allSchoolsSnapshot.forEach((doc, index) => {
        const data = doc.data();
        console.log(`- ${data.name} (createdBy: ${data.createdBy})`);
      });
    }
    
  } catch (error) {
    console.error('Error testing database query:', error);
  } finally {
    await admin.app().delete();
  }
}

testDatabaseQuery();