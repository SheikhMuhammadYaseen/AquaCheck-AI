/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const firebaseApp = require('firebase/app');
const firebaseFirestore = require('firebase/firestore');

const { initializeApp } = firebaseApp;
const { getApp, getApps } = firebaseApp;
const { getFirestore, doc, getDoc, setDoc, getDocs, collection, query, where, addDoc, updateDoc } = firebaseFirestore;

import fs from 'fs';
import path from 'path';
import { CityWaterData } from '../types/city';
import { CommunityReport } from '../types/report';

let db: any = null;

// Initialize Firebase dynamically from config file or environment variables
try {
  let firebaseConfig: any = null;

  // 1. Try environment variables first (most secure for Vercel and local .env)
  if (process.env.FIREBASE_API_KEY) {
    firebaseConfig = {
      apiKey: process.env.FIREBASE_API_KEY,
      authDomain: process.env.FIREBASE_AUTH_DOMAIN,
      projectId: process.env.FIREBASE_PROJECT_ID,
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.FIREBASE_APP_ID,
      firestoreDatabaseId: process.env.FIREBASE_DATABASE_ID || '(default)'
    };
  } else {
    // 2. Fallback to firebase-applet-config.json file
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const configRaw = fs.readFileSync(configPath, 'utf-8');
      firebaseConfig = JSON.parse(configRaw);
    }
  }

  if (firebaseConfig) {
    const app = getApps().length === 0 ? initializeApp({
      apiKey: firebaseConfig.apiKey,
      authDomain: firebaseConfig.authDomain,
      projectId: firebaseConfig.projectId,
      storageBucket: firebaseConfig.storageBucket,
      messagingSenderId: firebaseConfig.messagingSenderId,
      appId: firebaseConfig.appId,
    }) : getApp();

    db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');
    console.log('[Firebase] Initialized successfully with database ID:', firebaseConfig.firestoreDatabaseId || '(default)');
  } else {
    console.warn('[Firebase] Config not found (neither environment variables nor firebase-applet-config.json). Database features will fall back to local files.');
  }
} catch (error) {
  console.error('[Firebase] Initialization error:', error);
}

export function isFirebaseEnabled(): boolean {
  return db !== null;
}

export { db };

// ==================== FIRESTORE HELPERS ====================

// 1. Get City Data
export async function getCityFromFirestore(country: string, city: string): Promise<CityWaterData | null> {
  if (!db) return null;
  try {
    const docId = `${normalize(country)}_${normalize(city)}`;
    const docRef = doc(db, 'cities', docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as CityWaterData;
    }
  } catch (error) {
    console.error('[Firebase] Error getting city:', error);
  }
  return null;
}

// 2. Save/Update City Data
export async function saveCityToFirestore(data: CityWaterData): Promise<void> {
  if (!db) return;
  try {
    const docId = `${normalize(data.country)}_${normalize(data.city)}`;
    const docRef = doc(db, 'cities', docId);
    await setDoc(docRef, data, { merge: true });
    console.log(`[Firebase] Saved city to Firestore: ${data.city}, ${data.country}`);
  } catch (error) {
    console.error('[Firebase] Error saving city:', error);
  }
}

// 3. Get All Cities
export async function getAllCitiesFromFirestore(): Promise<CityWaterData[]> {
  if (!db) return [];
  try {
    const colRef = collection(db, 'cities');
    const querySnapshot = await getDocs(colRef);
    const cities: CityWaterData[] = [];
    querySnapshot.forEach((docSnap) => {
      cities.push(docSnap.data() as CityWaterData);
    });
    return cities;
  } catch (error) {
    console.error('[Firebase] Error getting all cities:', error);
    return [];
  }
}

// 4. Get Community Reports
export async function getReportsFromFirestore(filterCountry?: string, filterCity?: string): Promise<CommunityReport[]> {
  if (!db) return [];
  try {
    const colRef = collection(db, 'reports');
    let q = query(colRef);

    if (filterCountry && filterCity) {
      q = query(colRef, 
        where('country_norm', '==', normalize(filterCountry)),
        where('city_norm', '==', normalize(filterCity))
      );
    } else if (filterCountry) {
      q = query(colRef, where('country_norm', '==', normalize(filterCountry)));
    } else if (filterCity) {
      q = query(colRef, where('city_norm', '==', normalize(filterCity)));
    }

    const querySnapshot = await getDocs(q);
    const reports: CommunityReport[] = [];
    querySnapshot.forEach((docSnap) => {
      reports.push(docSnap.data() as CommunityReport);
    });
    return reports;
  } catch (error) {
    console.error('[Firebase] Error getting reports:', error);
    return [];
  }
}

// 5. Save Community Report
export async function saveReportToFirestore(report: CommunityReport): Promise<void> {
  if (!db) return;
  try {
    const docId = report.id;
    const docRef = doc(db, 'reports', docId);
    
    // Add normalized search keys for efficient querying
    const FirestoreReport = {
      ...report,
      country_norm: normalize(report.country),
      city_norm: normalize(report.city),
    };

    await setDoc(docRef, FirestoreReport);
    console.log('[Firebase] Saved report with ID:', report.id);
  } catch (error) {
    console.error('[Firebase] Error saving report:', error);
  }
}

// Helper to normalize strings
function normalize(text: string): string {
  return text.toLowerCase().trim().replace(/\s+/g, ' ');
}
