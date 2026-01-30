// Test script to verify audit data parsing fix
const admin = require('firebase-admin');
const serviceAccount = require('./project/src/lib/serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function testAuditParsing() {
  try {
    console.log('Testing audit data parsing...');
    
    // Get all audits
    const auditsSnapshot = await db.collection('audits').limit(1).get();
    console.log(`Found ${auditsSnapshot.size} audits`);
    
    if (!auditsSnapshot.empty) {
      const firstAuditDoc = auditsSnapshot.docs[0];
      const auditData = firstAuditDoc.data();
      console.log('Audit versions type:', typeof auditData.versions);
      console.log('Audit versions is array:', Array.isArray(auditData.versions));
      
      if (typeof auditData.versions === 'string') {
        console.log('Versions is stored as string, attempting to parse...');
        try {
          const parsedVersions = JSON.parse(auditData.versions);
          console.log('Parsed versions type:', typeof parsedVersions);
          console.log('Parsed versions is array:', Array.isArray(parsedVersions));
          console.log('Parsed versions length:', parsedVersions.length);
        } catch (parseError) {
          console.error('Failed to parse versions JSON:', parseError);
        }
      } else if (Array.isArray(auditData.versions)) {
        console.log('Versions is correctly stored as array');
        console.log('Versions length:', auditData.versions.length);
      }
    }
    
    console.log('Test completed!');
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    process.exit(0);
  }
}

testAuditParsing();