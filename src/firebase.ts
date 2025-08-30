// src/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCiX002EZbL_HGpMDySGFXZkz5GWc0H01w",
  authDomain: "atcoder-problem.firebaseapp.com",
  projectId: "atcoder-problem",
  storageBucket: "atcoder-problem.firebasestorage.app",
  messagingSenderId: "408489096270",
  appId: "1:408489096270:web:22af0240f895c6aa6bff1f",
  measurementId: "G-6D51BTF5C2"
};


const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
