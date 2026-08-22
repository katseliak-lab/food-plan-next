// Lazy Firebase init from NEXT_PUBLIC_* env vars. These values are public and
// safe on the client — access is guarded by Firestore security rules (each user
// can read/write only their own document).
import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAuth, type Auth } from "firebase/auth";
import { getFirestore, type Firestore } from "firebase/firestore";

const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = (): boolean =>
  Boolean(config.apiKey && !/PASTE|xxxx|your/i.test(config.apiKey));

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;

export function getFirebase(): { auth: Auth; db: Firestore } | null {
  if (!isFirebaseConfigured()) return null;
  if (!app) app = getApps()[0] ?? initializeApp(config);
  if (!authInstance) authInstance = getAuth(app);
  if (!dbInstance) dbInstance = getFirestore(app);
  return { auth: authInstance, db: dbInstance };
}
