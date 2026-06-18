import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDVF552oiT09UiRsDxCizzNBtv3zqfjSHo",
  authDomain: "contractor-estimator-d7887.firebaseapp.com",
  projectId: "contractor-estimator-d7887",
  storageBucket: "contractor-estimator-d7887.appspot.com",
  messagingSenderId: "290699609395",
  appId: "1:290699609395:web:e7141c7635985a0a2a46",
};

// 🔥 IMPORTANT: prevents duplicate initialization crash
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
