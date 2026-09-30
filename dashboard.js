/* Painel do usuário: estatísticas, meus anúncios e criação de anúncio */
const user = guard('user');
$('#who').textContent = user.name;
initViews(
  { overview: 'Visão geral', mine: 'Meus anúncios', new: 'Novo anúncio' },
  () => ({ mine: listings().filter(l => l.uid === user.id && l.status === 'pending').length })
);

/* Escolha do jogo com logo */
$('#gamepick').innerHTML = gameNames().map(g => `<button type="button" class="gtile" data-g="${esc(g)}">${gameLogo(g, 44)}<span>${esc(g)}</span></button>`).join('');
function pickGame(g) {
  $('#f-game').value = g;
  $$('#gamepick .gtile').forEach(t => t.classList.toggle('on', t.dataset.g === g));
}
$('#gamepick').onclick = e => { const t = e.target.closest('.gtile'); if (t) pickGame(t.dataset.g); };
pickGame(gameNames()[0]);

/* Envio de fotos pelo computador ou celular */
let sel = [];
function drawPreviews() {
  $('#previews').innerHTML = sel.map((p, i) => `<div class="pv"><img src="${p}" alt="Foto ${i + 1}">${i === 0 ? '<span>Capa</span>' : ''}<button type="button" data-rm="${i}" aria-label="Remover foto">&times;</button></div>`).join('');
}
async function addFiles(files) {
  const imgs = [...files].filter(f => f.type.startsWith('image/')).slice(0, 4 - sel.length);
  if (!imgs.length) return toast(sel.length >= 4 ? 'Você já adicionou 4 fotos.' : 'Escolha arquivos de imagem.');
  for (const f of imgs) { try { sel.push(await compress(f)); } catch { toast('Não foi possível ler ' + f.name); } }
  drawPreviews();
}
$('#f-files').onchange = e => { addFiles(e.target.files); e.target.value = ''; };
const dz = $('.drop');
['dragenter', 'dragover'].forEach(ev => dz.addEventListener(ev, e => { e.preventDefault(); dz.classList.add('over'); }));
['dragleave', 'drop'].forEach(ev => dz.addEventListener(ev, () => dz.classList.remove('over')));
dz.addEventListener('drop', e => { e.preventDefault(); addFiles(e.dataTransfer.files); });
$('#previews').onclick = e => { const b = e.target.closest('[data-rm]'); if (b) { sel.splice(+b.dataset.rm, 1); drawPreviews(); } };

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
      <td><div class="rowtitle">${gameLogo(l.game, 36)}<div><b>${esc(l.title)}</b><br><small class="seller">${esc(l.game)}</small></div></div></td>
      <td>${brl(l.price)}</td>
      <td>${badge(l.status)}</td>
      <td><div class="actions">
        ${l.status === 'approved' ? `<button class="btn btn-ghost btn-sm" data-act="sold" data-id="${l.id}">Marcar como vendido</button>` : ''}
        <button class="btn btn-danger btn-sm" data-act="del" data-id="${l.id}">Excluir</button>
      </div></td>
    </tr>`).join('') || '<tr><td colspan="4" class="empty">Nenhum anúncio ainda.</td></tr>';
  refreshNav();
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
  if (!f.game) return toast('Escolha o jogo da conta.');
  const saved = DB.set('listings', [{
    id: uid(), uid: user.id, game: f.game, title: f.title.trim(), price: +f.price,
    rank: f.rank.trim(), desc: f.desc.trim(), contact: f.contact.trim(), imgs: sel,
    status: 'pending', created: Date.now()
  }, ...listings()]);
  if (!saved) return toast('Sem espaço no navegador. Use menos fotos ou exclua anúncios antigos.');
  e.target.reset(); sel = []; drawPreviews(); pickGame(gameNames()[0]);
  toast('Anúncio enviado para análise.');
  render(); show('mine');
};

render();
