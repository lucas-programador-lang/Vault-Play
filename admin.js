/* Painel do admin: estatísticas, moderação de anúncios e usuários */
const admin = guard('admin');
$('#who').textContent = admin.name;
initViews({ overview: 'Visão geral', listings: 'Anúncios', users: 'Usuários' });

function listingRow(l, withStatus) {
  const pend = l.status === 'pending', rej = l.status === 'rejected';
  const acts = `
    ${pend || rej ? `<button class="btn btn-primary btn-sm" data-act="approve" data-id="${l.id}">Aprovar</button>` : ''}
    ${pend || l.status === 'approved' ? `<button class="btn btn-ghost btn-sm" data-act="reject" data-id="${l.id}">Recusar</button>` : ''}
    <button class="btn btn-danger btn-sm" data-act="del" data-id="${l.id}">Excluir</button>`;
  return `<tr>
    <td><b>${esc(l.title)}</b><br><small class="seller">${esc(l.game)}</small></td>
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
}

document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  const { act, id } = b.dataset;
  if (act === 'approve') { patch(id, { status: 'approved' }); toast('Anúncio aprovado.'); }
  if (act === 'reject') { patch(id, { status: 'rejected' }); toast('Anúncio recusado.'); }
  if (act === 'del') { if (!confirm('Excluir este anúncio de vez?')) return; drop(id); toast('Anúncio excluído.'); }
  if (act === 'ban') { DB.set('users', users().map(u => u.id === id ? { ...u, banned: !u.banned } : u)); toast('Usuário atualizado.'); }
  render();
});
$('#status-filter').onchange = render;

render();
