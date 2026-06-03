import { initializeApp } from "firebase/app";
import { getFirestore, collectionGroup, getDocs } from "firebase/firestore";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

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

async function check() {
  console.log("Fetching transactions...");
  const querySnapshot = await getDocs(collectionGroup(db, "transactions"));
  console.log(`Found ${querySnapshot.size} transactions.`);
  querySnapshot.forEach((doc) => {
    const data = doc.data();
    console.log(`ID: ${doc.id}, Amount: ${data.amount} (${typeof data.amount}), Type: ${data.type}, Date: ${data.date}, Category: ${data.category}`);
  });
  process.exit(0);
}

check().catch(console.error);
