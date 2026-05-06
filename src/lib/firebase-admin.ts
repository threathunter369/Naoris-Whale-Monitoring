import { initializeApp, getApps, App } from 'firebase-admin/app';
import { getFirestore, Firestore, FieldValue } from 'firebase-admin/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve(process.cwd(), 'firebase-applet-config.json');
const firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

const projectId = firebaseConfig.projectId;
const databaseId = firebaseConfig.firestoreDatabaseId;

console.log(`[Admin SDK] Initializing firebase-admin. Project: ${projectId}, Database: ${databaseId}`);

let app: App;
if (getApps().length === 0) {
  // If we have a projectId, use it, otherwise initializeApp() will try to find it in the environment
  app = initializeApp({
    projectId: projectId || process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT,
  });
} else {
  app = getApps()[0];
}

// In Firestore Enterprise/named databases, the databaseId must be passed if it's not '(default)'
export const db: Firestore = (databaseId && databaseId !== '(default)') 
  ? getFirestore(app, databaseId) 
  : getFirestore(app);

export const adminDb = db;
export { FieldValue };

console.log("[Admin SDK] Firestore Admin instance initialized.");
