import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    "AIzaSyDVF552oiTO9UiRsDxCizzNBtv3zgfjSHo",

  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ||
    "contractor-estimator-d7887.firebaseapp.com",

  projectId:
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    "contractor-estimator-d7887",

  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
    "contractor-estimator-d7887.firebasestorage.app",

  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ||
    "290699609395",

  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ||
    "1:290699609395:web:e7141c7635998a5ba02a46",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

export default app;
