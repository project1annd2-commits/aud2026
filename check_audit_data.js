import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./audit-457c9-firebase-adminsdk-fbsvc-9198fee929.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'audit-457c9'
});

const db = admin.firestore();

async function checkAuditData() {
  console.log('Checking audit data structure...');
  
  try {
    // Check a sample audit document
    const auditsCollection = db.collection('audits');
    const snapshot = await auditsCollection.limit(1).get();
    
    if (!snapshot.empty) {
      const doc = snapshot.docs[0];
      const data = doc.data();
      console.log('Sample audit document:');
      console.log('ID:', doc.id);
      console.log('Data:', JSON.stringify(data, null, 2));
      
      // Check versions structure
      if (data.versions && Array.isArray(data.versions)) {
        console.log('\nVersions array found:');
        console.log('Number of versions:', data.versions.length);
        
        if (data.versions.length > 0) {
          const firstVersion = data.versions[0];
          console.log('\nFirst version structure:');
          console.log(JSON.stringify(firstVersion, null, 2));
        }
      }
    } else {
      console.log('No audit documents found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkAuditData();