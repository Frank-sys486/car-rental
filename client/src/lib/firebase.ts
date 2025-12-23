import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

// 1. Hardcoded Configuration (Prioritized)
// Fill this in to use a permanent configuration. If apiKey is empty, it falls back to localStorage.
const hardcodedConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

export function initializeFirebase() {
  try {
    if (hardcodedConfig.apiKey) {
      app = initializeApp(hardcodedConfig);
      db = getFirestore(app);
      console.log("Firebase initialized successfully (Hardcoded)");
      return;
    }

    const configStr = localStorage.getItem("firebase_config");
    if (configStr) {
      const config = JSON.parse(configStr);
      app = initializeApp(config);
      db = getFirestore(app);
      console.log("Firebase initialized successfully");
    }
  } catch (e) {
    console.error("Failed to initialize Firebase", e);
  }
}

// Initialize on load
initializeFirebase();

export { db };