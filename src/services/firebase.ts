import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  getDoc, 
  getDocFromServer, 
  setDoc, 
  onSnapshot,
  Unsubscribe 
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { WorkshopDatabase } from '../types/journal';

// Initialize Firebase App
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// CRITICAL: Initialize Firestore using the specific database ID provisioned
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Validate connection
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'journal', 'current'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firebase Firestore is offline or not reachable.');
    }
    return false;
  }
}

const JOURNAL_DOC_PATH = 'journal/current';

/**
 * Fetch the current journal database from Firestore
 */
export async function getJournalFromFirestore(): Promise<WorkshopDatabase | null> {
  try {
    const journalDocRef = doc(db, 'journal', 'current');
    const snap = await getDoc(journalDocRef);
    if (snap.exists()) {
      return snap.data() as WorkshopDatabase;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, JOURNAL_DOC_PATH);
  }
}

/**
 * Save or update the entire journal database in Firestore
 */
export async function saveJournalToFirestore(database: WorkshopDatabase): Promise<void> {
  try {
    const journalDocRef = doc(db, 'journal', 'current');
    const payload = {
      ...database,
      updatedAt: new Date().toISOString()
    };
    await setDoc(journalDocRef, payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, JOURNAL_DOC_PATH);
  }
}

/**
 * Subscribe to real-time updates for multi-device sync
 */
export function subscribeToJournal(
  onData: (data: WorkshopDatabase) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  const journalDocRef = doc(db, 'journal', 'current');
  return onSnapshot(
    journalDocRef,
    (snap) => {
      if (snap.exists()) {
        const remoteData = snap.data() as WorkshopDatabase;
        if (remoteData && Array.isArray(remoteData.months)) {
          onData(remoteData);
        }
      }
    },
    (error) => {
      console.warn('Firestore subscription warning:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, JOURNAL_DOC_PATH);
    }
  );
}
