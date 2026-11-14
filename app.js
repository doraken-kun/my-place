const KEY="my-places-v1";
let places=load(); let activeFilter="all"; let deferredPrompt=null; let map=null; let markers=[];
const $=id=>document.getElementById(id);
function load(){try{return JSON.parse(localStorage.getItem(KEY)||"[]")}catch{return []}}
function save(){localStorage.setItem(KEY,JSON.stringify(places));render()}
function esc(s=""){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function render(){
 $("totalCount").textContent=places.length;$("todoCount").textContent=places.filter(p=>!p.visited).length;$("doneCount").textContent=places.filter(p=>p.visited).length;
 const q=$("filterSearch").value.trim().toLowerCase();
 const shown=places.filter(p=>(activeFilter==="all"||(activeFilter==="todo"&&!p.visited)||(activeFilter==="done"&&p.visited))&&(`${p.name} ${p.category} ${p.memo}`.toLowerCase().includes(q)));
 $("placesList").innerHTML=shown.map(p=>`<article class="place"><div class="placehead"><div><div class="placename">${esc(p.name)}</div><div class="meta">${esc(p.category)}${p.address?" · "+esc(p.address):""}</div></div><span class="status ${p.visited?"done":""}">${p.visited?"訪問済み":"行きたい"}</span></div>${p.memo?`<div class="memo">${esc(p.memo)}</div>`:""}<div class="actions"><button data-action="toggle" data-id="${p.id}">${p.visited?"未訪問に戻す":"行った！"}</button>${p.lat&&p.lon?`<button data-action="focus" data-id="${p.id}">地図で見る</button>`:""}<a target="_blank" rel="noopener" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.name)}">Googleマップ</a><button class="danger" data-action="delete" data-id="${p.id}">削除</button></div></article>`).join("");
 $("empty").style.display=shown.length?"none":"block";renderMap();
}
function renderMap(){
 if(!map||!window.L)return;markers.forEach(m=>m.remove());markers=[];
 places.filter(p=>p.lat&&p.lon).forEach(p=>{const m=L.marker([p.lat,p.lon]).addTo(map).bindPopup(`<b>${esc(p.name)}</b><br>${p.visited?"訪問済み":"行きたい"}`);markers.push(m)});
 if(markers.length){const group=L.featureGroup(markers);map.fitBounds(group.getBounds().pad(.18),{maxZoom:12})}
}
$("placeForm").addEventListener("submit",e=>{e.preventDefault();const name=$("placeName").value.trim();if(!name)return;places.unshift({id:crypto.randomUUID?crypto.randomUUID():String(Date.now()),name,category:$("category").value,memo:$("memo").value.trim(),lat:$("lat").value?Number($("lat").value):null,lon:$("lon").value?Number($("lon").value):null,address:$("address").value,visited:false,createdAt:new Date().toISOString()});$("placeForm").reset();$("lookupStatus").textContent="場所を保存しました。";$("lat").value=$("lon").value=$("address").value="";save()});
$("lookupBtn").addEventListener("click",async()=>{const q=$("placeName").value.trim();if(!q){$("lookupStatus").textContent="先に場所の名前を入力してください。";return}$("lookupStatus").textContent="場所を検索しています…";try{const url="https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&countrycodes=jp&q="+encodeURIComponent(q);const r=await fetch(url,{headers:{"Accept-Language":"ja"}});if(!r.ok)throw Error();const a=await r.json();if(!a.length){$("lookupStatus").textContent="場所が見つかりませんでした。名前を変えて再検索してください。";return}const x=a[0];$("lat").value=x.lat;$("lon").value=x.lon;$("address").value=x.display_name;$("lookupStatus").textContent="位置を取得しました："+x.display_name}catch{$("lookupStatus").textContent="検索に失敗しました。通信環境を確認するか、名前だけで登録してください。"}});
$("placesList").addEventListener("click",e=>{const b=e.target.closest("button[data-action]");if(!b)return;const p=places.find(x=>x.id===b.dataset.id);if(!p)return;if(b.dataset.action==="toggle")p.visited=!p.visited;if(b.dataset.action==="delete"&&confirm(`「${p.name}」を削除しますか？`))places=places.filter(x=>x.id!==p.id);if(b.dataset.action==="focus"&&map){map.setView([p.lat,p.lon],14);const m=markers[places.filter(x=>x.lat&&x.lon).indexOf(p)];if(m)m.openPopup()}save()});
document.querySelectorAll(".chip").forEach(b=>b.addEventListener("click",()=>{activeFilter=b.dataset.filter;document.querySelectorAll(".chip").forEach(x=>x.classList.toggle("active",x===b));render()}));
$("filterSearch").addEventListener("input",render);
$("exportBtn").addEventListener("click",()=>{const blob=new Blob([JSON.stringify(places,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="my-places-backup.json";a.click();URL.revokeObjectURL(a.href)});
$("importFile").addEventListener("change",async e=>{const f=e.target.files[0];if(!f)return;try{const data=JSON.parse(await f.text());if(!Array.isArray(data))throw Error();if(confirm("現在の登録内容をバックアップで置き換えますか？")){places=data;save();alert("復元しました。")}}catch{alert("バックアップファイルを読み込めませんでした。")}e.target.value=""});
if(window.L){map=L.map("map").setView([36.2,138.25],5);L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map)}
window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installBtn").classList.remove("hidden")});
$("installBtn").addEventListener("click",async()=>{if(!deferredPrompt)return;deferredPrompt.prompt();await deferredPrompt.userChoice;deferredPrompt=null;$("installBtn").classList.add("hidden")});
if("serviceWorker"in navigator&&location.protocol.startsWith("http"))navigator.serviceWorker.register("./sw.js").catch(()=>{});
render();