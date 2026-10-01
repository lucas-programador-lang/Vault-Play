/* Login e cadastro (Firebase Authentication). Usado só por login.html e register.html. */
import { auth, db, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, doc, setDoc, loadProfile } from './firebase.js';

const $ = s => document.querySelector(s);
const err = m => $('#form-error').textContent = m;
const busy = (form, on) => { form.querySelector('[type=submit]').disabled = on; };

const authMsg = e => ({
  'auth/invalid-credential': 'E-mail ou senha incorretos.',
  'auth/invalid-email': 'Esse e-mail não é válido.',
  'auth/email-already-in-use': 'Este e-mail já tem cadastro. Entre na sua conta.',
  'auth/weak-password': 'A senha precisa ter pelo menos 6 caracteres.',
  'auth/too-many-requests': 'Muitas tentativas. Espere um pouco e tente de novo.',
  'auth/network-request-failed': 'Sem conexão. Confira sua internet.',
  'auth/operation-not-allowed': 'O login por e-mail e senha não está ativado no Firebase.',
  'permission-denied': 'Sem permissão no Firestore. Confira se as regras foram publicadas.'
}[e.code] || 'Algo deu errado. Tente de novo.');

/* Login */
const loginForm = $('#login-form');
if (loginForm) loginForm.onsubmit = async e => {
  e.preventDefault();
  const f = new FormData(loginForm);
  err(''); busy(loginForm, true);
  try {
    const cred = await signInWithEmailAndPassword(auth, f.get('email').trim(), f.get('pass'));
    const p = await loadProfile(cred.user, true);
    if (p.banned) { await signOut(auth); busy(loginForm, false); return err('Esta conta foi suspensa.'); }
    location.href = p.role === 'admin' ? 'admin.html' : 'dashboard.html';
  } catch (x) { console.error(x); err(authMsg(x)); busy(loginForm, false); }
};

/* Cadastro */
const regForm = $('#register-form');
if (regForm) regForm.onsubmit = async e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(regForm));
  if (f.pass.length < 6) return err('A senha precisa ter pelo menos 6 caracteres.');
  if (f.pass !== f.pass2) return err('As senhas não são iguais.');
  err(''); busy(regForm, true);
  try {
    const cred = await createUserWithEmailAndPassword(auth, f.email.trim(), f.pass);
    await setDoc(doc(db, 'users', cred.user.uid), { name: f.name.trim(), email: cred.user.email, role: 'user', banned: false, created: Date.now() });
    location.href = 'dashboard.html';
  } catch (x) { console.error(x); err(authMsg(x)); busy(regForm, false); }
};
