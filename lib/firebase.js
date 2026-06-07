import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDVF552oiTO9UiRsDxCizzNBtv3zgfjSHo",
  authDomain: "contractor-estimator-d7887.firebaseapp.com",
  projectId: "contractor-estimator-d7887",
  storageBucket: "contractor-estimator-d7887.firebasestorage.app",
  messagingSenderId: "290699609395",
  appId: "1:290699609395:web:e7141c7635998a5ba02a46"
};

const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
