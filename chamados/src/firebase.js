import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getStorage } from 'firebase/storage';

// Seus dados do Firebase (você precisa adicionar os dados reais do seu projeto)
const firebaseConfig = {
  apiKey: "AIzaSyBs4_fl6sjnyHBRB1UgpudFRExAOpsGXxQ",
  authDomain: "automax-55b5e.firebaseapp.com",
  projectId: "automax-55b5e",
  storageBucket: "automax-55b5e.firebasestorage.app",
  messagingSenderId: "107893210415",
  appId: "1:107893210415:web:2076448c2b48022bb9f5da"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

// Inicializar Firebase Auth
export const auth = getAuth(app);

// Inicializar Google Auth Provider
export const googleProvider = new GoogleAuthProvider();

// Inicializar Firebase Storage
export const storage = getStorage(app);

export default app;
