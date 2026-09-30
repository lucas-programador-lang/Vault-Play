/* VaultPlay — código compartilhado.
   Os dados ficam no localStorage do navegador (etapa 1).
   Na etapa 2 trocamos por Firebase para todos verem os mesmos anúncios. */

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];

const DB = {
  get(k, d) { try { const v = JSON.parse(localStorage.getItem('vp_' + k)); return v ?? d; } catch { return d; } },
  set(k, v) { localStorage.setItem('vp_' + k, JSON.stringify(v)); }
};

const GAMES = {
  'Free Fire': ['#f59e0b', '#b91c1c'], 'Valorant': ['#ef4444', '#7f1d1d'],
  'League of Legends': ['#0ea5e9', '#1e3a8a'], 'Fortnite': ['#3b82f6', '#0e7490'],
  'CS2': ['#f59e0b', '#78350f'], 'Roblox': ['#64748b', '#0f172a'],
  'Minecraft': ['#16a34a', '#14532d'], 'GTA V': ['#10b981', '#134e4a'],
  'Outro': ['#0891b2', '#0b3a4a']
};
const STATUS = { pending: 'Em análise', approved: 'Ativo', sold: 'Vendido', rejected: 'Recusado' };

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const users = () => DB.get('users', []);
const listings = () => DB.get('listings', []);
const patch = (id, ch) => DB.set('listings', listings().map(l => l.id === id ? { ...l, ...ch } : l));
const drop = id => DB.set('listings', listings().filter(l => l.id !== id));
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const brl = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const sellerName = id => (users().find(u => u.id === id) || {}).name || 'Vendedor';
const badge = s => `<span class="badge b-${s}">${STATUS[s]}</span>`;

function toast(msg) {
  const t = $('#toast'); if (!t) return;
  t.textContent = msg; t.classList.add('show');
  clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 2600);
}

/* Dados iniciais (só na primeira visita) */
(function seed() {
  if (DB.get('users')) return;
  DB.set('users', [
    { id: 'u_admin', name: 'Administrador', email: 'admin@vaultplay.com', pass: 'admin123', role: 'admin', banned: false, created: Date.now() },
    { id: 'u_demo', name: 'Rafael Souza', email: 'rafael@exemplo.com', pass: '123456', role: 'user', banned: false, created: Date.now() }
  ]);
  const mk = (game, title, price, rank, desc, contact) => ({ id: uid(), uid: 'u_demo', game, title, price, rank, desc, contact, img: '', status: 'approved', created: Date.now() - Math.random() * 6e8 });
  DB.set('listings', [
    mk('Valorant', 'Conta Ascendant 2 com 40 skins', 350, 'Ascendant 2', 'Conta full acesso, e-mail original incluso. Skins de facas e rifles raros.', '5511999990001'),
    mk('Free Fire', 'Conta Mestre com passe e bundles', 180, 'Mestre', 'Nível 72, várias skins de arma e 2 bundles antigos. Vinculada ao Facebook.', '5511999990002'),
    mk('Fortnite', 'Conta OG com skins de 2018', 900, 'Temporada 4', 'Skins da temporada 4 e 5, pickaxe rara. Troca de e-mail liberada.', 'Discord: rafael#2048'),
    mk('League of Legends', 'Conta Diamante IV, 120 campeões', 420, 'Diamante IV', 'Todos os campeões liberados, 60 skins, sem punições.', '5511999990003'),
    mk('CS2', 'Prime com inventário e Global Elite', 650, 'Global Elite', '2.400 horas, inventário com facas e luvas. Sem VAC.', 'Discord: rafael#2048'),
    mk('Minecraft', 'Conta Java com capa Migrator', 120, 'Java + Bedrock', 'Conta original com capa rara e nome curto.', '5511999990004')
  ]);
})();

/* Sessão */
const me = () => { const id = DB.get('session'); return users().find(u => u.id === id && !u.banned) || null; };
function guard(role) {
  const u = me();
  if (!u) { location.href = 'login.html'; throw 0; }
  if (u.role !== role) { location.href = u.role === 'admin' ? 'admin.html' : 'dashboard.html'; throw 0; }
  return u;
}
document.addEventListener('click', e => {
  if (e.target.id === 'logout') { DB.set('session', null); location.href = 'index.html'; }
});

function renderNav() {
  const el = $('#nav-actions'); if (!el) return;
  const u = me();
  el.innerHTML = u
    ? `<a class="btn btn-ghost btn-sm" href="${u.role === 'admin' ? 'admin' : 'dashboard'}.html">Meu painel</a><button class="btn btn-primary btn-sm" id="logout">Sair</button>`
    : `<a class="btn btn-ghost btn-sm" href="login.html">Entrar</a><a class="btn btn-primary btn-sm" href="register.html">Criar conta</a>`;
}
renderNav();

/* Ícones em SVG */
const ICONS = {
  panel: '<rect x="3" y="3" width="7" height="9" rx="1.5"/><rect x="14" y="3" width="7" height="5" rx="1.5"/><rect x="14" y="12" width="7" height="9" rx="1.5"/><rect x="3" y="16" width="7" height="5" rx="1.5"/>',
  list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  users: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.5-3.5 3-5.5 6.5-5.5s6 2 6.5 5.5M16 4.5a3.5 3.5 0 0 1 0 7M21.5 20c-.3-2.4-1.5-4-3.5-4.8"/>',
  out: '<path d="M9 4H5a1 1 0 0 0-1 1v14a1 1 0 0 0 1 1h4M16 8l4 4-4 4M20 12H9"/>',
  shield: '<path d="M12 3l8 3v6c0 4.5-3.3 8-8 9-4.7-1-8-4.5-8-9V6z"/><path d="M9 12l2 2 4-4"/>',
  chat: '<path d="M21 12a8 8 0 0 1-11.5 7.2L4 20l1-4.6A8 8 0 1 1 21 12z"/>'
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
function initViews(titles) {
  const show = v => {
    $$('[data-view]').forEach(s => s.hidden = s.dataset.view !== v);
    $$('.side nav button').forEach(b => b.classList.toggle('active', b.dataset.go === v));
    $('#title').textContent = titles[v];
  };
  const map = { overview: 'panel', mine: 'list', new: 'plus', listings: 'list', users: 'users' };
  $$('.side nav button').forEach(b => {
    b.innerHTML = `${ico(map[b.dataset.go])}<span>${b.textContent}</span>`;
    b.onclick = () => show(b.dataset.go);
  });
  const out = $('.side .out'), u = me();
  out.innerHTML = ico('out') + '<span>Sair</span>';
  $('.side nav').insertAdjacentHTML('beforebegin', '<small class="side-label">Menu</small>');
  if (u) out.insertAdjacentHTML('beforebegin', `<div class="side-user"><span class="av">${esc(u.name[0].toUpperCase())}</span><div><b>${esc(u.name)}</b><small>${u.role === 'admin' ? 'Administrador' : 'Vendedor'}</small></div></div>`);
  window.show = show; show(Object.keys(titles)[0]);
}

/* Card de anúncio */
function thumb(l) {
  const [a, b] = GAMES[l.game] || GAMES.Outro;
  const grad = `linear-gradient(135deg,${a},${b})`;
  const img = l.img && /^https?:\/\//.test(l.img) ? `url('${esc(l.img)}'),` : '';
  return `<div class="thumb" data-ini="${esc(l.game.split(' ').map(w => w[0]).join('').slice(0, 3))}" style="background-image:${img}${grad}">${l.status === 'sold' ? '<span class="tag">Vendido</span>' : ''}<b>${esc(l.game)}</b></div>`;
}
const cardHTML = l => `<article class="card" data-id="${l.id}">${thumb(l)}<div class="card-body"><h3>${esc(l.title)}</h3><div class="chips"><span class="chip">${esc(l.rank || 'Sem rank')}</span></div><div class="card-foot"><span class="price">${brl(l.price)}</span><span class="seller">${esc(sellerName(l.uid))}</span></div></div></article>`;

function openModal(id) {
  const l = listings().find(x => x.id === id); if (!l) return;
  const digits = l.contact.replace(/\D/g, '');
  const wa = digits.length >= 10 ? `<a class="btn btn-primary btn-sm" target="_blank" rel="noopener" href="https://wa.me/${digits}">Abrir WhatsApp</a>` : '';
  $('#sheet').innerHTML = `${thumb(l)}<div class="sheet-body"><h3>${esc(l.title)}</h3><div class="chips"><span class="chip">${esc(l.rank || 'Sem rank')}</span><span class="chip">${brl(l.price)}</span></div><p>${esc(l.desc)}</p><div class="contact"><span>${esc(l.contact)}</span>${wa}</div><small class="seller">Vendedor: ${esc(sellerName(l.uid))}. Combine o pagamento direto com o vendedor e confira a conta antes de pagar.</small><button class="btn btn-ghost" data-close="1">Fechar</button></div>`;
  $('#modal').classList.add('open');
}

/* Vitrine (index.html) */
if ($('#grid')) {
  const gsel = $('#game');
  Object.keys(GAMES).forEach(g => gsel.insertAdjacentHTML('beforeend', `<option>${g}</option>`));
  const render = () => {
    const q = $('#q').value.toLowerCase(), g = gsel.value, s = $('#sort').value;
    const list = listings().filter(l => l.status === 'approved' && (!g || l.game === g) && (l.title + l.game + l.rank).toLowerCase().includes(q));
    list.sort((a, b) => s === 'low' ? a.price - b.price : s === 'high' ? b.price - a.price : b.created - a.created);
    $('#count').textContent = list.length + (list.length === 1 ? ' conta' : ' contas');
    $('#grid').innerHTML = list.map(cardHTML).join('') || '<p class="empty">Nenhuma conta encontrada. Tente outro jogo ou outra busca.</p>';
  };
  ['q', 'game', 'sort'].forEach(id => $('#' + id).addEventListener('input', render));
  render();
  $('#grid').onclick = e => { const c = e.target.closest('.card'); if (c) openModal(c.dataset.id); };
  $('#modal').onclick = e => { if (e.target.id === 'modal' || e.target.dataset.close) $('#modal').classList.remove('open'); };
}

/* Login */
const loginForm = $('#login-form');
if (loginForm) loginForm.onsubmit = e => {
  e.preventDefault();
  const f = new FormData(loginForm), email = f.get('email').trim().toLowerCase();
  const u = users().find(x => x.email === email && x.pass === f.get('pass'));
  if (!u) return $('#form-error').textContent = 'E-mail ou senha incorretos.';
  if (u.banned) return $('#form-error').textContent = 'Esta conta foi suspensa.';
  DB.set('session', u.id);
  location.href = u.role === 'admin' ? 'admin.html' : 'dashboard.html';
};

/* Cadastro */
const regForm = $('#register-form');
if (regForm) regForm.onsubmit = e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(regForm)), err = m => $('#form-error').textContent = m;
  const email = f.email.trim().toLowerCase();
  if (f.pass.length < 6) return err('A senha precisa ter pelo menos 6 caracteres.');
  if (f.pass !== f.pass2) return err('As senhas não são iguais.');
  if (users().some(u => u.email === email)) return err('Este e-mail já tem cadastro. Entre na sua conta.');
  const u = { id: uid(), name: f.name.trim(), email, pass: f.pass, role: 'user', banned: false, created: Date.now() };
  DB.set('users', [...users(), u]);
  DB.set('session', u.id);
  location.href = 'dashboard.html';
};
