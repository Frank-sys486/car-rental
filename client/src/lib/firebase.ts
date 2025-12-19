import { initializeApp, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";

let app: FirebaseApp | undefined;
let db: Firestore | undefined;

export function initializeFirebase() {
  try {
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