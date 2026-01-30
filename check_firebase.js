import admin from 'firebase-admin';
import { readFileSync } from 'fs';

const serviceAccount = JSON.parse(readFileSync('./audit-457c9-firebase-adminsdk-fbsvc-9198fee929.json', 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  projectId: 'audit-457c9'
});

const db = admin.firestore();

async function checkCollections() {
  console.log('Checking all collections...');

  try {
    const collections = await db.listCollections();
    console.log('Collections:', collections.map(c => c.id));

    for (const collection of collections) {
      const snapshot = await collection.get();
      console.log(`${collection.id}: ${snapshot.size} documents`);

      if (snapshot.size > 0 && snapshot.size <= 5) {
        console.log(`Sample documents from ${collection.id}:`);
        snapshot.forEach(doc => {
          console.log(`  ${doc.id}:`, JSON.stringify(doc.data(), null, 2));
        });
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

checkCollections();