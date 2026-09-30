(function(){
var KEY="vaultplay_ads",ads=[],cur="",app=document.getElementById("app");
var seed=[
{id:1,game:"Free Fire",title:"Conta Diamante com skins raras",desc:"Nível 70, várias skins de arma, e-mail original.",price:250,phone:"11900000001"},
{id:2,game:"Fortnite",title:"Conta com 80 skins e passe de batalha",desc:"Acesso completo, sem banimentos.",price:400,phone:"11900000002"},
{id:3,game:"Valorant",title:"Conta Imortal com skins Vandal",desc:"Rank Imortal 1, todos os agentes desbloqueados.",price:600,phone:"11900000003"}];
var cols=["#06b6d4,#0e7490","#f26b4f,#b93c22","#6366f1,#3730a3","#10b981,#047857","#f59e0b,#b45309"];
function $(s){return document.querySelector(s)}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function load(){try{var r=localStorage.getItem(KEY);ads=r?JSON.parse(r):seed}catch(e){ads=seed}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(ads))}catch(e){}}
function games(){var g=[];ads.forEach(function(a){if(g.indexOf(a.game)<0)g.push(a.game)});return g}
function money(v){return"R$ "+Number(v).toFixed(2).replace(".",",")}
function card(a){
  var c=cols[games().indexOf(a.game)%cols.length].split(","),p=String(a.phone).replace(/\D/g,"");
  return'<article class="project-card"><div class="pc-thumb" style="background:linear-gradient(135deg,'+c[0]+","+c[1]+');display:flex;align-items:center;justify-content:center"><span style="font:800 4.5rem Sora,sans-serif;color:rgba(255,255,255,.3)">'+esc(a.game.charAt(0).toUpperCase())+'</span><span class="pc-cat">'+esc(a.game)+'</span></div><div class="pc-body"><h3>'+esc(a.title)+"</h3><p>"+esc(a.desc)+'</p><div class="pc-meta"><span class="author"><b style="font:700 1.1rem Sora,sans-serif;color:var(--blue-600)">'+money(a.price)+'</b></span><a class="btn btn-primary btn-sm" style="background:#16a34a" target="_blank" rel="noopener" href="https://wa.me/55'+p+"?text="+encodeURIComponent("Olá! Vi sua conta no VaultPlay: "+a.title)+'">Contatar</a></div></div></article>';
}
function steps(){return'<section class="section section-alt"><div class="container"><div class="section-head"><div><span class="tag-label">Como funciona</span><h2>Três passos para vender ou comprar</h2></div></div><div class="steps-grid"><div class="step-card"><div class="step-num">Passo 1</div><h3>Anuncie sua conta</h3><p>Informe jogo, descrição, preço e seu WhatsApp. É grátis.</p></div><div class="step-card"><div class="step-num">Passo 2</div><h3>Compradores encontram</h3><p>Busque por jogo, rank, skins ou itens no catálogo.</p></div><div class="step-card"><div class="step-num">Passo 3</div><h3>Negocie direto</h3><p>O botão de contato abre o WhatsApp do vendedor com a mensagem pronta.</p></div></div><p style="margin-top:22px;color:var(--ink-600);font-size:14px"><b>Segurança:</b> desconfie de preços muito baixos, não pague antes de verificar a conta e confira se a venda é permitida pelos termos do jogo.</p></div></section>'}
function home(){
  return'<section class="hero"><div class="container hero-inner"><div><span class="eyebrow"><span class="dot"></span> Marketplace de contas de jogos</span><h1>Encontre contas, <span class="accent">venda</span> a sua e negocie direto.</h1><p class="lead">O VaultPlay conecta quem quer vender uma conta a quem quer comprar, com contato direto pelo WhatsApp e sem intermediários.</p><div class="hero-cta"><a href="#/vender" class="btn btn-gold btn-lg">Anunciar grátis</a><a href="#/explorar" class="btn btn-ghost btn-lg btn-ghost-hero">Explorar contas</a></div><div class="hero-stats"><div><strong>'+ads.length+'+</strong><span>anúncios ativos</span></div><div><strong>'+games().length+'</strong><span>jogos</span></div><div><strong>Grátis</strong><span>para anunciar</span></div></div></div><div class="hero-visual" aria-hidden="true"><div class="fan-card fan-1"><span class="fc-cat">Free Fire</span><h5>Conta Diamante</h5><p>Skins raras e nível 70.</p><div class="fc-foot"><span>R$ 250,00</span><span class="fc-badge">NOVO</span></div></div><div class="fan-card fan-2"><span class="fc-cat">Fortnite</span><h5>80 skins</h5><p>Passe de batalha incluso.</p><div class="fc-foot"><span>R$ 400,00</span><span>2 dias</span></div></div><div class="fan-card fan-3"><span class="fc-cat">Valorant</span><h5>Conta Imortal</h5><p>Todos os agentes.</p><div class="fc-foot"><span>R$ 600,00</span><span class="fc-badge">TOP</span></div></div><div class="fan-card fan-4"><span class="fc-cat">Sua conta</span><h5>Anuncie aqui</h5><p>Publique e receba contatos.</p><div class="fc-foot"><span>Você</span><span>Hoje</span></div></div></div></div></section>'+
  '<section class="section"><div class="container"><div class="section-head"><div><span class="tag-label">Recém-publicados</span><h2>Contas em destaque</h2></div><a href="#/explorar" class="link">Ver todas as contas →</a></div><div class="project-grid">'+ads.slice(0,6).map(card).join("")+"</div></div></section>"+steps();
}
function explorar(){
  var g=["Todos"].concat(games());
  return'<section class="section" style="padding-top:44px"><div class="container"><div class="section-head"><div><span class="tag-label">Catálogo</span><h2>Explorar contas</h2><p>Busque por jogo, rank, skins ou itens.</p></div></div><div class="filters-bar" style="margin-bottom:16px"><input id="q" class="search-input" type="search" placeholder="Buscar contas por jogo, título ou descrição…"></div><div id="chips" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:28px">'+g.map(function(x){var v=x==="Todos"?"":x;return'<button class="btn btn-sm '+(cur===v?"btn-primary":"btn-ghost")+'" data-g="'+esc(v)+'">'+esc(x)+"</button>"}).join("")+'</div><div class="project-grid" id="list"></div><p id="empty" style="display:none;text-align:center;color:var(--ink-600);padding:40px 0">Nenhum anúncio encontrado.</p></div></section>';
}
function fill(){
  var q=($("#q")||{value:""}).value.toLowerCase();
  var out=ads.filter(function(a){return(!cur||a.game===cur)&&(a.title+a.desc+a.game).toLowerCase().indexOf(q)>-1});
  $("#list").innerHTML=out.map(card).join("");$("#empty").style.display=out.length?"none":"block";
}
function vender(){
  return'<section class="section" style="padding-top:44px"><div class="container" style="max-width:600px"><div class="auth-card"><h2>Anunciar minha conta</h2><p class="sub">Só o seu WhatsApp fica disponível para os interessados.</p><div class="field"><label>Jogo</label><input id="f-game" maxlength="40" placeholder="Ex.: Free Fire, Fortnite, Valorant"></div><div class="field"><label>Título do anúncio</label><input id="f-title" maxlength="80" placeholder="Ex.: Conta nível 70 com skins raras"></div><div class="field"><label>Descrição</label><textarea id="f-desc" rows="4" maxlength="500" placeholder="Nível, rank, itens, skins, vinculação..."></textarea></div><div class="field"><label>Preço (R$)</label><input id="f-price" type="number" min="0" step="0.01" inputmode="decimal"></div><div class="field"><label>WhatsApp com DDD</label><input id="f-phone" type="tel" inputmode="numeric" placeholder="11999999999"></div><div class="field-error" id="msg"></div><button class="btn btn-primary btn-lg" id="publish" style="width:100%">Publicar anúncio</button></div></div></section>';
}
function route(){
  var h=location.hash.replace("#/","").split("?")[0];
  if(h==="explorar"){app.innerHTML=explorar();fill();$("#q").oninput=fill;$("#chips").onclick=function(e){var b=e.target.closest("button");if(b){cur=b.getAttribute("data-g");route()}}}
  else if(h==="vender"){app.innerHTML=vender();$("#publish").onclick=publish}
  else if(h==="como"){app.innerHTML=steps()}
  else app.innerHTML=home();
  document.querySelectorAll(".main-nav a").forEach(function(a){a.classList.toggle("active",a.getAttribute("data-r")===h)});
  var m=$("#mobileNav");m.classList.remove("open");document.body.style.overflow="";window.scrollTo(0,0);
}
function publish(){
  var v=function(i){return $(i).value.trim()};
  var a={id:Date.now(),game:v("#f-game"),title:v("#f-title"),desc:v("#f-desc"),price:parseFloat($("#f-price").value),phone:v("#f-phone").replace(/\D/g,"")};
  if(!a.game||!a.title||isNaN(a.price)||a.phone.length<10){$("#msg").textContent="Preencha jogo, título, preço e um WhatsApp válido com DDD.";return}
  ads.unshift(a);save();cur="";location.hash="#/explorar";
}
var SUN="☀",MOON="☾";
function theme(t){document.documentElement.setAttribute("data-theme",t);$("#themeToggle").textContent=t==="dark"?SUN:MOON}
$("#themeToggle").onclick=function(){var t=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";theme(t);try{localStorage.setItem("theme",t)}catch(e){}};
$("#hamburgerBtn").onclick=function(){$("#mobileNav").classList.toggle("open")};
theme(document.documentElement.getAttribute("data-theme")==="dark"?"dark":"light");
window.onhashchange=route;load();route();
})();
