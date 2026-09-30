/* Painel do admin: estatísticas, moderação de anúncios, usuários e jogos */
const admin = guard('admin');
$('#who').textContent = admin.name;
initViews(
  { overview: 'Visão geral', listings: 'Anúncios', users: 'Usuários', games: 'Jogos' },
  () => ({ listings: listings().filter(l => l.status === 'pending').length })
);

function listingRow(l, withStatus) {
  const pend = l.status === 'pending', rej = l.status === 'rejected';
  const acts = `
    ${pend || rej ? `<button class="btn btn-primary btn-sm" data-act="approve" data-id="${l.id}">Aprovar</button>` : ''}
    ${pend || l.status === 'approved' ? `<button class="btn btn-ghost btn-sm" data-act="reject" data-id="${l.id}">Recusar</button>` : ''}
    <button class="btn btn-danger btn-sm" data-act="del" data-id="${l.id}">Excluir</button>`;
  return `<tr>
    <td><div class="rowtitle">${gameLogo(l.game, 36)}<div><b>${esc(l.title)}</b><br><small class="seller">${esc(l.game)}</small></div></div></td>
    <td>${esc(sellerName(l.uid))}</td>
    <td>${brl(l.price)}</td>
    ${withStatus ? `<td>${badge(l.status)}</td>` : ''}
    <td><div class="actions">${acts}</div></td>
  </tr>`;
}

function render() {
  const L = listings(), U = users();
  const n = s => L.filter(l => l.status === s).length;

  $('#stats').innerHTML = [
    ['Usuários', U.filter(u => u.role === 'user').length],
    ['Anúncios', L.length],
    ['Aguardando aprovação', n('pending')],
    ['Ativos', n('approved')],
    ['Vendidos', n('sold')],
    ['Valor em anúncios ativos', brl(L.filter(l => l.status === 'approved').reduce((t, l) => t + l.price, 0))]
  ].map(([k, v]) => `<div class="stat"><small>${k}</small><strong>${v}</strong></div>`).join('');

  const pending = L.filter(l => l.status === 'pending').sort((a, b) => a.created - b.created);
  $('#pending-rows').innerHTML = pending.map(l => listingRow(l, false)).join('')
    || '<tr><td colspan="4" class="empty">Nenhum anúncio esperando aprovação.</td></tr>';

  const f = $('#status-filter').value;
  const all = L.filter(l => !f || l.status === f).sort((a, b) => b.created - a.created);
  $('#all-rows').innerHTML = all.map(l => listingRow(l, true)).join('')
    || '<tr><td colspan="5" class="empty">Nenhum anúncio com esse status.</td></tr>';

  $('#user-rows').innerHTML = U.map(u => `<tr>
    <td><b>${esc(u.name)}</b></td>
    <td>${esc(u.email)}</td>
    <td>${L.filter(l => l.uid === u.id).length}</td>
    <td>${u.role === 'admin' ? '<span class="badge b-sold">Admin</span>' : u.banned ? '<span class="badge b-rejected">Suspenso</span>' : '<span class="badge b-approved">Ativo</span>'}</td>
    <td>${u.role === 'admin' ? '' : `<button class="btn ${u.banned ? 'btn-ghost' : 'btn-danger'} btn-sm" data-act="ban" data-id="${u.id}">${u.banned ? 'Reativar' : 'Suspender'}</button>`}</td>
  </tr>`).join('');

  const logos = DB.get('glogos', {}), extra = DB.get('xgames', []);
  $('#game-rows').innerHTML = gameNames().map(g => `<div class="gcard">
    ${gameLogo(g, 64)}<b>${esc(g)}</b>
    <small class="seller">${L.filter(l => l.game === g && l.status === 'approved').length} anúncios ativos</small>
    <div class="actions">
      <label class="btn btn-ghost btn-sm">Enviar logo<input class="logo-file" type="file" accept="image/*" hidden data-game="${esc(g)}"></label>
      ${logos[g] ? `<button class="btn btn-ghost btn-sm" data-act="rmlogo" data-id="${esc(g)}">Remover logo</button>` : ''}
      ${extra.includes(g) ? `<button class="btn btn-danger btn-sm" data-act="delgame" data-id="${esc(g)}">Excluir jogo</button>` : ''}
    </div></div>`).join('');
  refreshNav();
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const { act, id } = b.dataset;
  if (act === 'approve') { patch(id, { status: 'approved' }); toast('Anúncio aprovado.'); }
  if (act === 'reject') { patch(id, { status: 'rejected' }); toast('Anúncio recusado.'); }
  if (act === 'del') { if (!confirm('Excluir este anúncio de vez?')) return; drop(id); toast('Anúncio excluído.'); }
  if (act === 'ban') { DB.set('users', users().map(u => u.id === id ? { ...u, banned: !u.banned } : u)); toast('Usuário atualizado.'); }
  if (act === 'rmlogo') { const m = DB.get('glogos', {}); delete m[id]; DB.set('glogos', m); toast('Logo removida.'); }
  if (act === 'delgame') {
    if (!confirm('Excluir este jogo da lista? Os anúncios dele continuam no site.')) return;
    DB.set('xgames', DB.get('xgames', []).filter(g => g !== id)); toast('Jogo excluído.');
  }
  render();
});

/* Enviar logo de um jogo */
document.addEventListener('change', async e => {
  const i = e.target.closest('.logo-file'); if (!i || !i.files[0]) return;
  try {
    const m = DB.get('glogos', {});
    m[i.dataset.game] = await compress(i.files[0], 160, 'image/png');
    toast(DB.set('glogos', m) ? 'Logo atualizada.' : 'Sem espaço no navegador para essa logo.');
  } catch { toast('Não foi possível ler essa imagem.'); }
  render();
});

/* Adicionar jogo */
$('#game-form').onsubmit = e => {
  e.preventDefault();
  const name = new FormData(e.target).get('name').trim();
  if (gameNames().some(g => g.toLowerCase() === name.toLowerCase())) return toast('Esse jogo já está na lista.');
  DB.set('xgames', [...DB.get('xgames', []), name]);
  e.target.reset(); toast('Jogo adicionado.'); render();
};

$('#status-filter').onchange = render;
render();
