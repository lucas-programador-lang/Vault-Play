/* Painel do usuário: estatísticas, meus anúncios e criação de anúncio */
const user = guard('user');
$('#who').textContent = user.name;
initViews({ overview: 'Visão geral', mine: 'Meus anúncios', new: 'Novo anúncio' });

Object.keys(GAMES).forEach(g => $('#f-game').insertAdjacentHTML('beforeend', `<option>${g}</option>`));

function render() {
  const mine = listings().filter(l => l.uid === user.id).sort((a, b) => b.created - a.created);
  const n = s => mine.filter(l => l.status === s).length;
  const open = mine.filter(l => l.status === 'approved');

  $('#stats').innerHTML = [
    ['Anúncios', mine.length],
    ['Ativos', n('approved')],
    ['Em análise', n('pending')],
    ['Vendidos', n('sold')],
    ['Valor em aberto', brl(open.reduce((t, l) => t + l.price, 0))]
  ].map(([k, v]) => `<div class="stat"><small>${k}</small><strong>${v}</strong></div>`).join('');

  $('#preview').innerHTML = open.slice(0, 3).map(cardHTML).join('')
    || '<p class="empty">Você ainda não tem anúncios ativos. Crie o primeiro em "Novo anúncio".</p>';

  $('#rows').innerHTML = mine.map(l => `
    <tr>
      <td><b>${esc(l.title)}</b><br><small class="seller">${esc(l.game)}</small></td>
      <td>${brl(l.price)}</td>
      <td>${badge(l.status)}</td>
      <td><div class="actions">
        ${l.status === 'approved' ? `<button class="btn btn-ghost btn-sm" data-act="sold" data-id="${l.id}">Marcar como vendido</button>` : ''}
        <button class="btn btn-danger btn-sm" data-act="del" data-id="${l.id}">Excluir</button>
      </div></td>
    </tr>`).join('') || '<tr><td colspan="4" class="empty">Nenhum anúncio ainda.</td></tr>';
}

$('#rows').onclick = e => {
  const b = e.target.closest('[data-act]'); if (!b) return;
  if (b.dataset.act === 'sold') { patch(b.dataset.id, { status: 'sold' }); toast('Anúncio marcado como vendido.'); }
  if (b.dataset.act === 'del' && confirm('Excluir este anúncio? Essa ação não pode ser desfeita.')) { drop(b.dataset.id); toast('Anúncio excluído.'); }
  render();
};

$('#new-form').onsubmit = e => {
  e.preventDefault();
  const f = Object.fromEntries(new FormData(e.target));
  if (f.img && !/^https?:\/\//.test(f.img)) return toast('O link da imagem precisa começar com http.');
  DB.set('listings', [{
    id: uid(), uid: user.id, game: f.game, title: f.title.trim(), price: +f.price,
    rank: f.rank.trim(), desc: f.desc.trim(), contact: f.contact.trim(), img: f.img.trim(),
    status: 'pending', created: Date.now()
  }, ...listings()]);
  e.target.reset();
  toast('Anúncio enviado para análise.');
  render(); show('mine');
};

render();
