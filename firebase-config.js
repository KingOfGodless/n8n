// Import SDKs
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// Your Specific Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDjQRvWRNlKUJ_Xq88zZWJf7yJNNigXSPo",
    authDomain: "tamizhaapp-d6ca6.firebaseapp.com",
    databaseURL: "https://tamizhaapp-d6ca6-default-rtdb.firebaseio.com",
    projectId: "tamizhaapp-d6ca6",
    storageBucket: "tamizhaapp-d6ca6.firebasestorage.app",
    messagingSenderId: "727816041677",
    appId: "1:727816041677:web:66c3df6a23beeb0b5a6584",
    measurementId: "G-9X1E5180VC"
};

// Initialize & Export
const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);