import { cert, getApps, initializeApp } from 'firebase-admin/app';
import { getAuth, type DecodedIdToken } from 'firebase-admin/auth';

function getFirebaseAuth() {
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!serviceAccountJson) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_JSON is required.');
  }

  const serviceAccount = JSON.parse(serviceAccountJson);
  if (typeof serviceAccount.private_key === 'string') {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
  }
  const app = getApps()[0] ?? initializeApp({
    credential: cert(serviceAccount)
  });
  return getAuth(app);
}

export async function verifyBearerToken(authorization?: string): Promise<DecodedIdToken> {
  const match = authorization?.match(/^Bearer\s+(.+)$/i);
  if (!match) {
    throw new Error('A Firebase bearer token is required.');
  }
  return getFirebaseAuth().verifyIdToken(match[1]);
}

export function isAdminEmail(email?: string): boolean {
  if (!email) return false;
  const adminEmails = (process.env.ADMIN_EMAILS ?? '')
    .split(',')
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
  return adminEmails.includes(email.toLowerCase());
}
