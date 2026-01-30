// migrate_to_firebase.js
console.log('Script loaded');
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import minimist from 'minimist';
import pRetry from 'p-retry';
console.log('Imports completed');

function loadJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

async function writeBatchWithRetries(db, writes) {
  const BATCH_SIZE = 500;
  console.log(`Starting to write ${writes.length} documents in batches of ${BATCH_SIZE}`);

  for (let i = 0; i < writes.length; i += BATCH_SIZE) {
    const slice = writes.slice(i, i + BATCH_SIZE);
    console.log(`Processing batch ${Math.floor(i / BATCH_SIZE) + 1}: ${slice.length} documents`);

    await pRetry(async () => {
      const batch = db.batch();
      slice.forEach(w => {
        const ref = w.id ? db.collection(w.col).doc(w.id) : db.collection(w.col).doc();
        batch.set(ref, w.data, { merge: false });
        console.log(`Adding document to batch: ${w.col}/${w.id || 'auto-id'}`);
      });
      console.log('Committing batch...');
      await batch.commit();
      console.log('Batch committed successfully');
    }, {
      retries: 5,
      onFailedAttempt: (error) => {
        console.error(`Batch commit failed, attempt ${error.attemptNumber}, retrying...`, error.message);
      }
    });
    console.log(`Committed batch ${Math.floor(i / BATCH_SIZE) + 1}`);
  }
  console.log('All batches committed successfully');
}

async function migrate({ keyPath, dataDir, projectId }) {
  console.log('Starting migration...');
  console.log('Key path:', keyPath);
  console.log('Data dir:', dataDir);
  console.log('Project ID:', projectId);

  admin.initializeApp({
    credential: admin.credential.cert(JSON.parse(fs.readFileSync(keyPath, 'utf8'))),
    projectId
  });
  console.log('Firebase initialized');
  const db = admin.firestore();

  console.log('Loading schools data...');
  // Schools
  const schools = loadJson(path.join(dataDir, 'schools.json'));
  console.log(`Found ${schools.length} schools`);
  const schoolWrites = schools.map(s => ({
    col: 'schools',
    id: s.id,
    data: {
      name: s.name,
      location: s.location,
      code: s.code || null,
      createdBy: s.created_by,
      createdAt: s.created_at ? admin.firestore.Timestamp.fromDate(new Date(s.created_at)) : admin.firestore.FieldValue.serverTimestamp()
    }
  }));
  console.log(`Prepared ${schoolWrites.length} school writes`);
  await writeBatchWithRetries(db, schoolWrites);
  console.log('Schools migration completed');

  console.log('Loading teachers data...');
  // Teachers
  const teachers = loadJson(path.join(dataDir, 'teachers.json'));
  console.log(`Found ${teachers.length} teachers`);
  const teacherWrites = teachers.map(t => ({
    col: 'teachers',
    id: t.id,
    data: {
      schoolId: t.school_id,
      name: t.name,
      qualification: t.qualification,
      phone: t.phone,
      email: t.email,
      subject: t.subject,
      createdAt: t.created_at ? admin.firestore.Timestamp.fromDate(new Date(t.created_at)) : admin.firestore.FieldValue.serverTimestamp()
    }
  }));
  console.log(`Prepared ${teacherWrites.length} teacher writes`);
  await writeBatchWithRetries(db, teacherWrites);
  console.log('Teachers migration completed');

  console.log('Loading mentors data...');
  // Mentors
  const mentors = loadJson(path.join(dataDir, 'mentors.json'));
  console.log(`Found ${mentors.length} mentors`);
  const mentorWrites = mentors.map(m => ({
    col: 'mentors',
    id: m.id,
    data: {
      schoolId: m.school_id,
      name: m.name,
      qualification: m.qualification,
      phone: m.phone,
      email: m.email,
      expertise: m.expertise,
      createdAt: m.created_at ? admin.firestore.Timestamp.fromDate(new Date(m.created_at)) : admin.firestore.FieldValue.serverTimestamp()
    }
  }));
  console.log(`Prepared ${mentorWrites.length} mentor writes`);
  await writeBatchWithRetries(db, mentorWrites);
  console.log('Mentors migration completed');

  console.log('Loading audits data...');
  // Audits
  const audits = loadJson(path.join(dataDir, 'audits.json'));
  console.log(`Found ${audits.length} audits`);
  const auditWrites = audits.map(a => ({
    col: 'audits',
    id: a.id,
    data: {
      type: a.type,
      subjectId: a.subject_id,
      schoolId: a.school_id,
      accessCode: a.access_code,
      versions: a.versions,
      currentVersion: a.current_version,
      createdAt: a.created_at ? admin.firestore.Timestamp.fromDate(new Date(a.created_at)) : admin.firestore.FieldValue.serverTimestamp()
    }
  }));
  console.log(`Prepared ${auditWrites.length} audit writes`);
  await writeBatchWithRetries(db, auditWrites);
  console.log('Audits migration completed');

  console.log('Loading infrastructure audits data...');
  // Infrastructure Audits
  const infraAudits = loadJson(path.join(dataDir, 'infrastructure_audits.json'));
  console.log(`Found ${infraAudits.length} infrastructure audits`);
  const infraAuditWrites = infraAudits.map(a => ({
    col: 'infrastructure_audits',
    id: a.id,
    data: {
      schoolId: a.school_id,
      accessCode: a.access_code,
      versions: a.versions,
      currentVersion: a.current_version,
      createdAt: a.created_at ? admin.firestore.Timestamp.fromDate(new Date(a.created_at)) : admin.firestore.FieldValue.serverTimestamp()
    }
  }));
  console.log(`Prepared ${infraAuditWrites.length} infrastructure audit writes`);
  await writeBatchWithRetries(db, infraAuditWrites);
  console.log('Infrastructure audits migration completed');

  console.log('Migration finished');
}

console.log('Checking execution condition...');
console.log('import.meta.url:', import.meta.url);
console.log('process.argv[1]:', process.argv[1]);

// Normalize paths for comparison
const normalizedArgvPath = path.resolve(process.argv[1]).replace(/\\/g, '/');
const normalizedMetaUrl = import.meta.url.replace(/^file:\/\/\//, '').replace(/%20/g, ' ');

console.log('Normalized argv path:', normalizedArgvPath);
console.log('Normalized meta url:', normalizedMetaUrl);
console.log('Are they equal?', normalizedArgvPath === normalizedMetaUrl);

if (normalizedArgvPath === normalizedMetaUrl) {
  console.log('Script started');
  const argv = minimist(process.argv.slice(2));
  console.log('Arguments:', argv);
  const key = argv.key || argv.k;
  const dataDir = argv.dataDir || './exports';
  const projectId = argv.projectId;
  console.log(`Key: ${key}, DataDir: ${dataDir}, ProjectId: ${projectId}`);

  if (!key || !projectId) {
    console.error('Usage: node migrate_to_firebase.js --key <serviceAccountKey.json> --dataDir ./exports --projectId <your-project-id>');
    process.exit(1);
  }

  console.log('Calling migrate function...');
  migrate({ keyPath: key, dataDir, projectId }).then(() => {
    console.log('Migration completed successfully');
    process.exit(0);
  }).catch(err => {
    console.error('Migration error:', err);
    console.error('Stack:', err.stack);
    process.exit(2);
  });
} else {
  console.log('Script not executed directly, exiting');
}
