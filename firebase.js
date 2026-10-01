/* Conexão com o Firebase (projeto vault-play-cb272) */
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js';
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-auth.js';
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore.js';
import { getStorage, ref, uploadString, getDownloadURL } from 'https://www.gstatic.com/firebasejs/10.14.1/firebase-storage.js';

const firebaseConfig = {
  apiKey: "AIzaSyCAXc2gCBRhIcFnrMQPxkB29wBjGjE5AKw",
  authDomain: "vault-play-cb272.firebaseapp.com",
  databaseURL: "https://vault-play-cb272-default-rtdb.firebaseio.com",
  projectId: "vault-play-cb272",
  storageBucket: "vault-play-cb272.firebasestorage.app",
  messagingSenderId: "527168435639",
  appId: "1:527168435639:web:6f122c6ba1318475c0a432"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app), db = getFirestore(app), storage = getStorage(app);
export { onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, ref, uploadString, getDownloadURL };

/* Lê o perfil do usuário em users/{uid}. Com create=true, cria o perfil se ainda não existir. */
export async function loadProfile(fb, create = false) {
  const r = doc(db, 'users', fb.uid);
  let snap = await getDoc(r);
  if (!snap.exists() && create) {
    await setDoc(r, { name: (fb.email || 'Usuário').split('@')[0], email: fb.email, role: 'user', banned: false, created: Date.now() });
    snap = await getDoc(r);
  }
  return snap.exists() ? { id: fb.uid, ...snap.data() } : null;
}
