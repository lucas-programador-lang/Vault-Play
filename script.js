/* VaultPlay — código compartilhado, conectado ao Firebase (login, anúncios, fotos). */
import { auth, db, storage, onAuthStateChanged, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where, ref, uploadString, getDownloadURL } from './firebase.js';

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const pref = { get: k => localStorage.getItem('vp_' + k) === '1', set: (k, v) => localStorage.setItem('vp_' + k, v ? '1' : '0') };

const GAMES = {
  'Free Fire': ['#f59e0b', '#b91c1c'], 'Valorant': ['#ef4444', '#7f1d1d'],
  'League of Legends': ['#0ea5e9', '#1e3a8a'], 'Fortnite': ['#3b82f6', '#0e7490'],
  'CS2': ['#f59e0b', '#78350f'], 'Roblox': ['#64748b', '#0f172a'],
  'Minecraft': ['#16a34a', '#14532d'], 'GTA V': ['#10b981', '#134e4a'],
  'Outro': ['#0891b2', '#0b3a4a']
};
const STATUS = { pending: 'Em análise', approved: 'Ativo', sold: 'Vendido', rejected: 'Recusado' };
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const badge = s => `<span class="badge b-${s}">${STATUS[s]}</span>`;
function toast(msg) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2800);
}

/* ===== Sessão (Firebase Authentication + perfil no Firestore) ===== */
let current = null;
async function loadProfile(fb, create = false) {
  const r = doc(db, 'users', fb.uid);
  let s = await getDoc(r);
  if (!s.exists() && create) {
    await setDoc(r, { name: (fb.email || 'Usuário').split('@')[0], email: fb.email, role: 'user', banned: false, created: Date.now() });
    s = await getDoc(r);
  }
  return s.exists() ? { id: fb.uid, ...s.data() } : null;
}
const ready = new Promise(res => {
  onAuthStateChanged(auth, async fb => {
    try { current = fb ? await loadProfile(fb) : null; } catch (e) { console.error(e); current = null; }
    if (current && current.banned) { current = null; signOut(auth); }
    res(current);
  });
});
const me = () => current;
async function guard(role) {
  const u = await ready;
  if (!u || u.role !== role) {
    location.href = !u ? 'login.html' : u.role === 'admin' ? 'admin.html' : 'dashboard.html';
    await new Promise(() => {});
  }
  return u;
}
document.addEventListener('click', async e => {
  if (e.target.closest('#logout')) { await signOut(auth); location.href = 'index.html'; }
});
function renderNav() {
  const el = $('#nav-actions'); if (!el) return;
  const u = me();
  el.innerHTML = u
    ? `<a class="btn btn-ghost btn-sm" href="${u.role === 'admin' ? 'admin' : 'dashboard'}.html">Meu painel</a><button class="btn btn-primary btn-sm" id="logout">Sair</button>`
    : `<a class="btn btn-ghost btn-sm" href="login.html">Entrar</a><a class="btn btn-primary btn-sm" href="register.html">Criar conta</a>`;
}

/* ===== Dados (Firestore e Storage) ===== */
const cache = {};
const col = n => collection(db, n);
const withId = d => ({ id: d.id, ...d.data() });
const fetchListings = async q => { const l = (await getDocs(q)).docs.map(withId); l.forEach(x => cache[x.id] = x); return l; };
const fetchApproved = () => fetchListings(query(col('listings'), where('status', '==', 'approved')));
const fetchMine = uid => fetchListings(query(col('listings'), where('uid', '==', uid)));
const fetchAll = () => fetchListings(col('listings'));
const fetchUsers = async () => (await getDocs(col('users'))).docs.map(withId);
const patch = (id, ch) => updateDoc(doc(db, 'listings', id), ch);
const drop = id => deleteDoc(doc(db, 'listings', id));
const setBanned = (id, banned) => updateDoc(doc(db, 'users', id), { banned });

/* Envia as fotos para o Storage e salva o anúncio (entra como "em análise") */
async function createListing(user, data, shots) {
  const r = doc(col('listings')), imgs = [];
  for (let i = 0; i < shots.length; i++) {
    const f = ref(storage, `listings/${user.id}/${r.id}/${i}.jpg`);
    await uploadString(f, shots[i], 'data_url');
    imgs.push(await getDownloadURL(f));
  }
  await setDoc(r, { ...data, uid: user.id, sellerName: user.name, imgs, status: 'pending', created: Date.now() });
}

/* Jogos extras e logos enviadas pelo admin (documento config/games) */
let cfg = { extra: [], logos: {} };
try { const s = await getDoc(doc(db, 'config', 'games')); if (s.exists()) cfg = { extra: [], logos: {}, ...s.data() }; } catch (e) { console.warn('config', e); }
const getCfg = () => cfg;
async function saveCfg(next) { await setDoc(doc(db, 'config', 'games'), next); cfg = next; }

/* Ícones em SVG */
const ICONS = {
  panel: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20c-.3-2.4-1.5-4-3.5-4.8"/>',
  out: '<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.3 8-8 9-4.7-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  game: '<rect x="2.5" y="7" width="19" height="11" rx="4"/><path d="M7 10.5v4M5 12.5h4M15.5 11.5h.01M18 13.5h.01"/>',
  globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z"/>',
  chev: '<path d="M15 6l-6 6 6 6"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="M21 16l-5-5-9 9"/>'
};
const ico = n => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${ICONS[n]}</svg>`;
$$('[data-ico]').forEach(e => e.innerHTML = ico(e.dataset.ico));

/* No celular, cada linha da tabela mostra o nome da coluna */
function labelTables() {
  $$('table').forEach(t => {
    const h = [...t.tHead.rows[0].cells].map(c => c.textContent);
    [...t.tBodies[0].rows].forEach(r => [...r.cells].forEach((c, i) => { if (c.colSpan === 1) c.dataset.label = h[i] || ''; }));
  });
}
if ($('.main')) new MutationObserver(labelTables).observe($('.main'), { childList: true, subtree: true });

/* Troca de seções nos dashboards */
function initViews(titles, counts) {
  const show = v => {
    $$('[data-view]').forEach(s => s.hidden = s.dataset.view !== v);
    $$('.side nav button').forEach(b => b.classList.toggle('active', b.dataset.go === v));
    $('#title').textContent = titles[v];
  };
  const map = { overview: 'panel', mine: 'list', new: 'plus', listings: 'list', users: 'users', games: 'game' };
  $$('.side nav button').forEach(b => {
    b.title = b.textContent;
    b.innerHTML = `${ico(map[b.dataset.go])}<span>${b.textContent}</span>`;
    b.onclick = () => show(b.dataset.go);
  });
  const out = $('.side .out'), u = me();
  out.innerHTML = ico('out') + '<span>Sair</span>';
  $('.side nav').insertAdjacentHTML('beforebegin', '<small class="side-label">Menu</small>');
  out.insertAdjacentHTML('beforebegin', `<small class="side-label">Atalhos</small><a class="side-link" href="index.html">${ico('globe')}<span>Ver o site</span></a><button class="side-link" id="toggle" type="button">${ico('chev')}<span>Recolher menu</span></button>`);
  if (u) out.insertAdjacentHTML('beforebegin', `<div class="side-user"><span class="av">${esc(u.name[0].toUpperCase())}</span><div><b>${esc(u.name)}</b><small>${u.role === 'admin' ? 'Administrador' : 'Vendedor'}</small></div></div>`);
  const setC = c => { document.body.classList.toggle('collapsed', c); pref.set('collapsed', c); };
  setC(pref.get('collapsed'));
  $('#toggle').onclick = () => setC(!document.body.classList.contains('collapsed'));
  window.refreshNav = () => {
    const c = counts ? counts() : {};
    $$('.side nav button').forEach(b => {
      let s = b.querySelector('.count'); const n = c[b.dataset.go];
      if (n) { if (!s) { s = document.createElement('em'); s.className = 'count'; b.append(s); } s.textContent = n; }
      else if (s) s.remove();
    });
  };
  window.show = show; show(Object.keys(titles)[0]); refreshNav();
}

/* Card de anúncio */
/* Jogos e logos */
const slug = n => n.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const gameNames = () => [...Object.keys(GAMES).filter(g => g !== 'Outro'), ...cfg.extra, 'Outro'];
const gameColors = g => GAMES[g] || Object.values(GAMES)[[...g].reduce((t, c) => t + c.charCodeAt(0), 0) % (Object.keys(GAMES).length - 1)];
const initials = g => (g.includes(' ') ? g.split(' ').map(w => w[0]).join('').slice(0, 3) : g.slice(0, 2)).toUpperCase();
/* Logo: enviada pelo admin, ou arquivo logos/<nome-do-jogo>.png; sem nenhum dos dois, mostra as iniciais */
function gameLogo(g, size = 40) {
  const [a, b] = gameColors(g), src = cfg.logos[g] || `logos/${slug(g)}.png`;
  return `<span class="glogo" style="--a:${a};--b:${b};--s:${size}px"><em>${esc(initials(g))}</em><img src="${esc(src)}" alt="" onerror="this.remove()"></span>`;
}
const photos = l => (l.imgs && l.imgs.length ? l.imgs : l.img ? [l.img] : []).filter(s => /^(https?:\/\/|data:image\/)/.test(s));

/* Reduz a imagem antes de guardar (fotos em JPEG, logos em PNG) */
function compress(file, max = 900, type = 'image/jpeg', q = .72) {
  return new Promise((ok, no) => {
    const r = new FileReader();
    r.onerror = no;
    r.onload = () => {
      const im = new Image();
      im.onerror = no;
      im.onload = () => {
        const k = Math.min(1, max / Math.max(im.width, im.height)), c = document.createElement('canvas');
        c.width = Math.round(im.width * k); c.height = Math.round(im.height * k);
        const x = c.getContext('2d');
        if (type === 'image/jpeg') { x.fillStyle = '#fff'; x.fillRect(0, 0, c.width, c.height); }
        x.drawImage(im, 0, 0, c.width, c.height);
        ok(c.toDataURL(type, q));
      };
      im.src = r.result;
    };
    r.readAsDataURL(file);
  });
}

function thumb(l) {
  const [a, b] = gameColors(l.game), p = photos(l)[0];
  const bg = `${p ? `url('${esc(p)}'),` : ''}linear-gradient(135deg,${a},${b})`;
  return `<div class="thumb${p ? ' photo' : ''}" data-ini="${esc(initials(l.game))}" style="background-image:${bg}">${gameLogo(l.game, 40)}${l.status === 'sold' ? '<span class="tag">Vendido</span>' : ''}<b>${esc(l.game)}</b></div>`;
}
const cardHTML = l => `<article class="card" data-id="${l.id}">${thumb(l)}<div class="card-body"><h3>${esc(l.title)}</h3><div class="chips"><span class="chip">${esc(l.rank || 'Sem rank')}</span></div><div class="card-foot"><span class="price">${brl(l.price)}</span><span class="seller">${esc(l.sellerName)}</span></div></div></article>`;

function openModal(id) {
  const l = cache[id]; if (!l) return;
  const ph = photos(l), digits = l.contact.replace(/\D/g, '');
  const wa = digits.length >= 10 ? `<a class="btn btn-primary btn-sm" target="_blank" rel="noopener" href="https://wa.me/${digits}">Abrir WhatsApp</a>` : '';
  const strip = ph.length > 1 ? `<div class="strip">${ph.map((p, i) => `<img src="${esc(p)}" alt="Foto ${i + 1}" data-full="${esc(p)}">`).join('')}</div>` : '';
  $('#sheet').innerHTML = `${thumb(l)}${strip}<div class="sheet-body"><h3>${esc(l.title)}</h3><div class="chips"><span class="chip">${esc(l.rank || 'Sem rank')}</span><span class="chip">${brl(l.price)}</span></div><p>${esc(l.desc)}</p><div class="contact"><span>${esc(l.contact)}</span>${wa}</div><small class="seller">Vendedor: ${esc(l.sellerName)}. Combine o pagamento direto com o vendedor e confira a conta antes de pagar.</small><button class="btn btn-ghost" data-close="1">Fechar</button></div>`;
  $('#sheet').onclick = e => { const i = e.target.closest('[data-full]'); if (i) $('#sheet .thumb').style.backgroundImage = `url('${i.dataset.full.replace(/'/g, '%27')}')`; };
  $('#modal').classList.add('open');
}

/* ===== Vitrine (index.html) ===== */
await ready;
renderNav();

if ($('#grid')) {
  const gsel = $('#game');
  gameNames().forEach(g => gsel.insertAdjacentHTML('beforeend', `<option>${esc(g)}</option>`));
  let all = [];
  const render = () => {
    const q = $('#q').value.toLowerCase(), g = gsel.value, s = $('#sort').value;
    const list = all.filter(l => (!g || l.game === g) && (l.title + l.game + l.rank).toLowerCase().includes(q));
    list.sort((a, b) => s === 'low' ? a.price - b.price : s === 'high' ? b.price - a.price : b.created - a.created);
    $('#count').textContent = list.length + (list.length === 1 ? ' conta' : ' contas');
    $('#grid').innerHTML = list.map(cardHTML).join('') || '<p class="empty">Nenhuma conta encontrada. Tente outro jogo ou outra busca.</p>';
  };
  ['q', 'game', 'sort'].forEach(id => $('#' + id).addEventListener('input', render));
  $('#grid').onclick = e => { const c = e.target.closest('.card'); if (c) openModal(c.dataset.id); };
  $('#modal').onclick = e => { if (e.target.id === 'modal' || e.target.dataset.close) $('#modal').classList.remove('open'); };
  $('#grid').innerHTML = '<p class="empty">Carregando anúncios...</p>';
  try { all = await fetchApproved(); render(); }
  catch (e) { console.error(e); $('#grid').innerHTML = '<p class="empty">Não foi possível carregar os anúncios agora. Tente de novo em instantes.</p>'; }
}

/* ===== Login e cadastro ===== */
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
const busy = (f, on) => { const b = f.querySelector('[type=submit]'); b.disabled = on; };

const loginForm = $('#login-form');
if (loginForm) loginForm.onsubmit = async e => {
  e.preventDefault();
  const f = new FormData(loginForm), err = m => $('#form-error').textContent = m;
  err(''); busy(loginForm, true);
  try {
    const cred = await signInWithEmailAndPassword(auth, f.get('email').trim(), f.get('pass'));
    const p = await loadProfile(cred.user, true);
    if (p.banned) { await signOut(auth); busy(loginForm, false); return err('Esta conta foi suspensa.'); }
    location.href = p.role === 'admin' ? 'admin.html' : 'dashboard.html';
  } catch (x) { console.error(x); err(authMsg(x)); busy(loginForm, false); }
};

const regForm = $('#register-form');
if (regForm) regForm.onsubmit = async e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(regForm)), err = m => $('#form-error').textContent = m;
  if (f.pass.length < 6) return err('A senha precisa ter pelo menos 6 caracteres.');
  if (f.pass !== f.pass2) return err('As senhas não são iguais.');
  err(''); busy(regForm, true);
  try {
    const cred = await createUserWithEmailAndPassword(auth, f.email.trim(), f.pass);
    await setDoc(doc(db, 'users', cred.user.uid), { name: f.name.trim(), email: cred.user.email, role: 'user', banned: false, created: Date.now() });
    location.href = 'dashboard.html';
  } catch (x) { console.error(x); err(authMsg(x)); busy(regForm, false); }
};

export { $, $$, esc, brl, badge, toast, STATUS, guard, me, initViews, gameLogo, gameNames, compress, cardHTML, fetchMine, fetchAll, fetchUsers, createListing, patch, drop, setBanned, getCfg, saveCfg };
