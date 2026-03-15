// Modülleri CDN üzerinden çekiyoruz
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDlnH1bN4dUo6qMLaQRHdY1TmwZhhCFCJE",
  authDomain: "satir-arasi-5ed31.firebaseapp.com",
  projectId: "satir-arasi-5ed31",
  storageBucket: "satir-arasi-5ed31.firebasestorage.app",
  messagingSenderId: "573269163098",
  appId: "1:573269163098:web:d388698dc4708a3b7b6c63"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);