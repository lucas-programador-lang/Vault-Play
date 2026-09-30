var KEY="vaultplay_ads",TH="vaultplay_theme",ads=[],cur="";
var seed=[
{id:1,game:"Free Fire",title:"Conta Diamante com skins raras",desc:"Nível 70, várias skins de arma, e-mail original.",price:250,phone:"11900000001"},
{id:2,game:"Fortnite",title:"Conta com 80 skins e passe de batalha",desc:"Acesso completo, sem banimentos.",price:400,phone:"11900000002"},
{id:3,game:"Valorant",title:"Conta Imortal com skins Vandal",desc:"Rank Imortal 1, todos os agentes desbloqueados.",price:600,phone:"11900000003"}];
var cols=["#0891b2,#155e75","#f26b4f,#c2410c","#6366f1,#4338ca","#10b981,#047857","#f59e0b,#b45309"];
var WA='<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2Zm5.2 14.2c-.2.6-1.3 1.2-1.8 1.2-.5.1-1 .2-3.3-.7-2.8-1.2-4.600-4-4.700-4.200-.1-.2-1.100-1.500-1.100-2.800s.7-2 1-2.300c.2-.3.500-.3.700-.3h.5c.2 0 .4 0 .6.500l.8 2c.1.200.1.400 0 .500l-.4.600c-.2.200-.3.300-.1.600.7 1.100 1.500 1.900 2.700 2.500.3.200.5.100.7-.1l.8-1c.2-.3.400-.2.600-.1l1.900.9c.3.100.5.200.5.400.1.100.1.700-.1 1.300Z"/></svg>';
var SUN='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
var MOON='<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.800Z"/></svg>';
function $(i){return document.getElementById(i)}
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function load(){try{var r=localStorage.getItem(KEY);ads=r?JSON.parse(r):seed}catch(e){ads=seed}}
function save(){try{localStorage.setItem(KEY,JSON.stringify(ads))}catch(e){}}
function games(){var g=[];ads.forEach(function(a){if(g.indexOf(a.game)<0)g.push(a.game)});return g}
function toast(t){var e=$("toast");e.textContent=t;e.classList.add("on");setTimeout(function(){e.classList.remove("on")},2400)}
function render(){
 var q=$("q").value.toLowerCase(),gs=games();
 $("s1").textContent=ads.length;$("s2").textContent=gs.length;
 $("chips").innerHTML=["Todos"].concat(gs).map(function(x){var v=x==="Todos"?"":x;return'<button class="chip'+(cur===v?" on":"")+'" data-g="'+esc(v)+'">'+esc(x)+"</button>"}).join("");
 var out=ads.filter(function(a){return(!cur||a.game===cur)&&(a.title+a.desc+a.game).toLowerCase().indexOf(q)>-1});
 $("list").innerHTML=out.map(function(a,n){
  var c=cols[gs.indexOf(a.game)%cols.length].split(","),p=String(a.phone).replace(/\D/g,"");
  return'<article class="card"><div class="ch"><div class="av" style="background:linear-gradient(135deg,'+c[0]+","+c[1]+')">'+esc(a.game.charAt(0).toUpperCase())+'</div><div><small>Jogo</small><b>'+esc(a.game)+'</b></div>'+(n===0&&a.id>1e6?'<span class="new">Novo</span>':"")+'</div><h3>'+esc(a.title)+"</h3><p>"+esc(a.desc)+'</p><div class="ft"><div class="pr"><small>Preço</small><b>R$ '+Number(a.price).toFixed(2).replace(".",",")+'</b></div><a class="btn wa" target="_blank" rel="noopener" href="https://wa.me/55'+p+"?text="+encodeURIComponent("Olá! Vi sua conta no VaultPlay: "+a.title)+'">'+WA+"Contatar</a></div></article>"}).join("");
 $("empty").classList.toggle("hide",out.length>0);
}
function route(){
 var h=location.hash.replace("#/","");if(["vender","como"].indexOf(h)<0)h="home";
 var m={home:"v-home",vender:"v-sell",como:"v-how"};
 ["v-home","v-sell","v-how"].forEach(function(i){$(i).classList.add("hide")});
 $(m[h]).classList.remove("hide");$("mob").classList.remove("open");window.scrollTo(0,0);
 document.querySelectorAll("nav.d a").forEach(function(a){a.classList.toggle("on",a.getAttribute("data-r")===h)});
}
$("q").oninput=render;
$("chips").onclick=function(e){var b=e.target.closest(".chip");if(b){cur=b.getAttribute("data-g");render()}};
$("hm").onclick=function(){$("mob").classList.toggle("open")};
$("go").onclick=function(e){e.preventDefault();$("explorar").scrollIntoView({behavior:"smooth"})};
function setTheme(t){document.documentElement.setAttribute("data-theme",t);$("tg").innerHTML=t==="dark"?SUN:MOON}
$("tg").onclick=function(){var t=document.documentElement.getAttribute("data-theme")==="dark"?"light":"dark";setTheme(t);try{localStorage.setItem(TH,t)}catch(e){}};
$("publish").onclick=function(){
 var a={id:Date.now(),game:$("f-game").value.trim(),title:$("f-title").value.trim(),desc:$("f-desc").value.trim(),price:parseFloat($("f-price").value),phone:$("f-phone").value.replace(/\D/g,"")};
 if(!a.game||!a.title||isNaN(a.price)||a.phone.length<10){$("msg").textContent="Preencha jogo, título, preço e um WhatsApp válido com DDD.";return}
 $("msg").textContent="";ads.unshift(a);save();
 ["f-game","f-title","f-desc","f-price","f-phone"].forEach(function(i){$(i).value=""});
 cur="";render();location.hash="#/";toast("Anúncio publicado!");
};
window.onhashchange=route;
var t="dark";try{t=localStorage.getItem(TH)||"dark"}catch(e){}setTheme(t);
load();render();route();
