import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, query } from 'firebase/firestore';

// Firebase config - you'll need to provide your credentials
const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
    measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkAccessCodeDuplicates(targetAccessCode: string) {
    console.log(`\n🔍 Checking for access code: ${targetAccessCode}\n`);

    const results: any[] = [];

    // Check regular audits (teacher/mentor)
    console.log('Checking audits collection...');
    const auditsSnapshot = await getDocs(collection(db, 'audits'));
    auditsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.accessCode === targetAccessCode) {
            results.push({
                collection: 'audits',
                id: doc.id,
                type: data.type,
                accessCode: data.accessCode,
                schoolId: data.schoolId,
                subjectId: data.subjectId,
                createdAt: data.createdAt
            });
        }
    });

    // Check infrastructure audits
    console.log('Checking infrastructure_audits collection...');
    const infraAuditsSnapshot = await getDocs(collection(db, 'infrastructure_audits'));
    infraAuditsSnapshot.forEach((doc) => {
        const data = doc.data();
        if (data.accessCode === targetAccessCode) {
            results.push({
                collection: 'infrastructure_audits',
                id: doc.id,
                type: 'infrastructure',
                accessCode: data.accessCode,
                schoolId: data.schoolId,
                createdAt: data.createdAt
            });
        }
    });

    // Report results
    console.log('\n' + '='.repeat(60));
    console.log(`RESULTS FOR ACCESS CODE: ${targetAccessCode}`);
    console.log('='.repeat(60));

    if (results.length === 0) {
        console.log('❌ Access code NOT FOUND in database');
    } else if (results.length === 1) {
        console.log('✅ Access code found ONCE (no duplicates)');
        console.log('\nDetails:');
        console.table(results);
    } else {
        console.log(`⚠️  DUPLICATE DETECTED! Access code found ${results.length} times`);
        console.log('\nDetails:');
        console.table(results);
    }

    console.log('='.repeat(60) + '\n');

    return results;
}

// Check for all duplicate access codes
async function findAllDuplicates() {
    console.log('\n🔍 Scanning for ALL duplicate access codes...\n');

    const accessCodeMap = new Map<string, any[]>();

    // Check audits
    const auditsSnapshot = await getDocs(collection(db, 'audits'));
    auditsSnapshot.forEach((doc) => {
        const data = doc.data();
        const code = data.accessCode;
        if (!accessCodeMap.has(code)) {
            accessCodeMap.set(code, []);
        }
        accessCodeMap.get(code)!.push({
            collection: 'audits',
            id: doc.id,
            type: data.type,
            accessCode: data.accessCode,
            schoolId: data.schoolId,
            subjectId: data.subjectId
        });
    });

    // Check infrastructure audits
    const infraAuditsSnapshot = await getDocs(collection(db, 'infrastructure_audits'));
    infraAuditsSnapshot.forEach((doc) => {
        const data = doc.data();
        const code = data.accessCode;
        if (!accessCodeMap.has(code)) {
            accessCodeMap.set(code, []);
        }
        accessCodeMap.get(code)!.push({
            collection: 'infrastructure_audits',
            id: doc.id,
            type: 'infrastructure',
            accessCode: data.accessCode,
            schoolId: data.schoolId
        });
    });

    // Find duplicates
    const duplicates = Array.from(accessCodeMap.entries())
        .filter(([_, audits]) => audits.length > 1);

    console.log('='.repeat(60));
    console.log('DUPLICATE ACCESS CODES FOUND');
    console.log('='.repeat(60));

    if (duplicates.length === 0) {
        console.log('✅ No duplicates found!');
    } else {
        console.log(`⚠️  Found ${duplicates.length} duplicate access codes:\n`);
        duplicates.forEach(([code, audits]) => {
            console.log(`\nAccess Code: ${code} (appears ${audits.length} times)`);
            console.table(audits);
        });
    }

    console.log('='.repeat(60) + '\n');
}

// Main execution
async function main() {
    try {
        // Check specific access code
        await checkAccessCodeDuplicates('7608');

        // Optionally check for all duplicates
        console.log('\nWould you like to check for ALL duplicate access codes? (y/n)');
        // Uncomment the line below to scan for all duplicates
        // await findAllDuplicates();

    } catch (error) {
        console.error('Error:', error);
    }
}

main();
