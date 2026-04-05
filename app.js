

const STOPS = [
  { label:'A', name:'TechStore Central',  addr:'Av. Brasil, 1200 — Centro',       slot:'08:30',       mat:'Base operacional — ponto de partida',         dataStatus:null,                                              dist:'—',     esgKg:0,    isCollect:false, latlng:[-23.4205,-51.9335], color:'#52b788', border:'#2d6a4f' },
  { label:'1', name:'InfoTech Ltda.',     addr:'R. das Flores, 340 — Zona Norte', slot:'09:00–10:00', mat:'Notebooks Dell ×3, cabos, mouse',             dataStatus:{ok:true,  text:'Dados removidos declarados (RB-04)'}, dist:'2,1 km', esgKg:8.5,  isCollect:true,  latlng:[-23.4095,-51.9448], color:'#52b788', border:'#2d6a4f' },
  { label:'2', name:'Suporte Express',    addr:'R. Mandacaru, 87 — Zona Sul',     slot:'10:30–11:30', mat:'Monitores 24" ×2, impressora, teclados',      dataStatus:{ok:false, text:'Contém dados — verificar (RB-04)'},   dist:'3,4 km', esgKg:14.2, isCollect:true,  latlng:[-23.4158,-51.9602], color:'#52b788', border:'#2d6a4f' },
  { label:'3', name:'Inst. Recicla Bem',  addr:'Av. Colombo, 5790 — Maringá',     slot:'13:00–15:00', mat:'Lote 80+ itens — hardware variado',           dataStatus:{ok:true,  text:'Dados removidos declarados (RB-04)'}, dist:'5,1 km', esgKg:38.0, isCollect:true,  latlng:[-23.4285,-51.9698], color:'#3a8fc7', border:'#2a6e9a' },
  { label:'D', name:'Ecoponto Central',   addr:'R. Bahia, 500 — Centro',          slot:'15:30',       mat:'Descarte final dos itens coletados',           dataStatus:null,                                              dist:'2,7 km', esgKg:0,    isCollect:false, latlng:[-23.4348,-51.9505], color:'#f4a261', border:'#c0622a' },
];

let current=0, completedCount=0, satOn=false, routeStarted=false;
let routeLayers=[];
const completed=new Set();


const map=L.map('map',{zoomControl:true}).setView([-23.422,-51.952],14);
const tileLight=L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',{attribution:'&copy; OpenStreetMap &copy; CARTO',maxZoom:19,subdomains:'abcd'});
const tileSat=L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',{attribution:'Tiles &copy; Esri',maxZoom:19});
tileLight.addTo(map);


function makeIcon(s,active){
  const sz=active?36:30;
  const sh=active?'0 0 0 6px rgba(45,106,79,.15),0 3px 12px rgba(0,0,0,.18)':'0 2px 6px rgba(0,0,0,.14)';
  return L.divIcon({className:'',html:`<div style="width:${sz}px;height:${sz}px;border-radius:50%;background:${s.color};color:#fff;font-family:'Space Mono',monospace;font-size:${active?13:11}px;font-weight:700;display:flex;align-items:center;justify-content:center;border:2.5px solid ${s.border};box-shadow:${sh}">${s.label}</div>`,iconSize:[sz,sz],iconAnchor:[sz/2,sz/2]});
}
function makePopupHTML(s,idx){
  return `<div style="font-family:'DM Sans',sans-serif;min-width:165px;padding:2px"><div style="font-weight:700;font-size:.88rem;color:#1a2e22;margin-bottom:2px">${s.name}</div><div style="font-size:.7rem;color:#6b8c78;margin-bottom:6px">${s.addr.split('—')[0].trim()}</div><div style="font-size:.62rem;font-family:'Space Mono',monospace;background:#e8f5ee;color:#2d6a4f;padding:2px 8px;border-radius:7px;display:inline-block;margin-bottom:8px">${s.slot}</div><div style="font-size:.72rem;color:#1a2e22;margin-bottom:8px">${s.mat}</div><button onclick="selectStop(${idx})" style="width:100%;background:#1a3a2a;color:#fff;border:none;border-radius:7px;padding:7px;font-weight:600;font-family:'DM Sans',sans-serif;font-size:.74rem;cursor:pointer">Ver detalhes</button></div>`;
}
const markers=STOPS.map((s,i)=>{const m=L.marker(s.latlng,{icon:makeIcon(s,i===0)}).addTo(map);m.bindPopup(makePopupHTML(s,i));m.on('click',()=>selectStop(i));return m;});


function decodePolyline(str){
  const coords=[];let idx=0,lat=0,lng=0;
  while(idx<str.length){
    let b,shift=0,result=0;
    do{b=str.charCodeAt(idx++)-63;result|=(b&0x1f)<<shift;shift+=5;}while(b>=0x20);
    lat+=(result&1)?~(result>>1):(result>>1);
    shift=0;result=0;
    do{b=str.charCodeAt(idx++)-63;result|=(b&0x1f)<<shift;shift+=5;}while(b>=0x20);
    lng+=(result&1)?~(result>>1):(result>>1);
    coords.push([lat/1e5,lng/1e5]);
  }
  return coords;
}


async function drawRoute(){
  setRouteInfo('Calculando rota pelas ruas…');
  const coordStr=STOPS.map(s=>`${s.latlng[1]},${s.latlng[0]}`).join(';');
  const url=`https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=polyline`;
  try{
    const res=await fetch(url);
    const data=await res.json();
    if(data.code!=='Ok'||!data.routes?.length) throw new Error('sem rota');

    const route=data.routes[0];
    const km=(route.distance/1000).toFixed(1);
    const min=Math.round(route.duration/60);
    const h=Math.floor(min/60),m=min%60;
    const dur=h>0?`${h}h ${m}min`:`${m}min`;
    const latlngs=decodePolyline(route.geometry);

    clearRouteLayers();


    routeLayers.push(L.polyline(latlngs,{color:'#ffffff',weight:8,opacity:.6}).addTo(map));

    routeLayers.push(L.polyline(latlngs,{color:'#2d6a4f',weight:5,opacity:.9}).addTo(map));

    routeLayers.push(L.polyline(latlngs,{color:'#52b788',weight:2,opacity:.5,dashArray:'1 10',lineCap:'round'}).addTo(map));

    setRouteInfo(`${km} km · ~${dur} · rota por ruas`);
    showToast(`Rota calculada: ${km} km — ${dur}`);
  }catch(err){
    console.warn('OSRM indisponível:',err);
    clearRouteLayers();
    routeLayers.push(L.polyline(STOPS.map(s=>s.latlng),{color:'#2d6a4f',weight:4,opacity:.65,dashArray:'10 7'}).addTo(map));
    setRouteInfo('Rota simplificada (OSRM indisponível)');
    showToast('Exibindo rota em linha reta');
  }
}
function clearRouteLayers(){routeLayers.forEach(l=>map.removeLayer(l));routeLayers=[];}
function setRouteInfo(t){document.getElementById('routeInfo').textContent=t;}

function selectStop(idx){
  current=idx;
  const s=STOPS[idx];
  document.querySelectorAll('.stop-card').forEach((el,i)=>el.classList.toggle('active',i===idx));
  markers.forEach((m,i)=>m.setIcon(makeIcon(STOPS[i],i===idx)));
  map.flyTo(s.latlng,16,{animate:true,duration:.7});
  markers[idx].openPopup();
  updateNextPopup(idx);
}

function updateNextPopup(idx){
  const s=STOPS[idx];
  const etas=['08:30','09:00','10:30','13:00','15:30'];
  const dists=['—','2,1 km','3,4 km','5,1 km','2,7 km'];
  document.getElementById('nextIcon').textContent=s.label;
  document.getElementById('nextName').textContent=s.name;
  document.getElementById('nextEta').textContent=etas[idx];
  document.getElementById('nextDist').textContent=dists[idx];
  document.getElementById('nextAddr').textContent=s.addr;
  document.getElementById('nextMat').textContent=s.mat;
  const el=document.getElementById('nextData');
  if(s.dataStatus){el.textContent=s.dataStatus.text;el.className=s.dataStatus.ok?'text-success':'text-warning';el.style.color='';}
  else{el.textContent='Dados não aplicáveis';el.className='';el.style.color='#6b8c78';}
}

function nextStop(){if(current<STOPS.length-1)selectStop(current+1);else showToast('Você está na última parada!');}
function prevStop(){if(current>0)selectStop(current-1);else showToast('Você está na primeira parada!');}

function toggleSatellite(){
  satOn=!satOn;
  const btn=document.getElementById('btnSat');
  if(satOn){tileLight.remove();tileSat.addTo(map);btn.classList.add('active');}
  else{tileSat.remove();tileLight.addTo(map);btn.classList.remove('active');}
  showToast(satOn?'Visão de satélite ativada':'Mapa padrão restaurado');
}
function recenter(){map.fitBounds(L.latLngBounds(STOPS.map(s=>s.latlng)),{padding:[60,60]});}


function confirmQR(){
  if(!STOPS[current].isCollect){showToast('Este ponto não é uma coleta.');return;}
  if(completed.has(current)){showToast('Esta coleta já foi confirmada.');return;}
  completed.add(current);completedCount++;
  document.querySelectorAll('.stop-card')[current].classList.add('done');
  const ci=STOPS.filter(s=>s.isCollect).indexOf(STOPS[current]);
  if(ci>=0){const s=document.getElementById(`di-${ci}`)?.querySelector('.daily-item-status');if(s){s.textContent='Concluído';s.className='daily-item-status ds-done';}}
  updateProgress();
  showToast('✅ QR confirmado! Coleta validada (RB-07)');
  if(current<STOPS.length-1)setTimeout(()=>nextStop(),700);
}

function updateProgress(){
  const total=STOPS.filter(s=>s.isCollect).length;
  const pct=Math.min(Math.round(completedCount/total*100),100);
  ['progFill','dailyFill'].forEach(id=>document.getElementById(id).style.width=pct+'%');
  document.getElementById('progPct').textContent=pct+'%';
  document.getElementById('statDone').textContent=completedCount;
  document.getElementById('dailyDone').textContent=completedCount;
  document.getElementById('ringPct').textContent=pct+'%';
  const circ=94.2;
  document.getElementById('ringProgress').setAttribute('stroke-dasharray',`${circ*pct/100} ${circ}`);
  const kg=STOPS.filter((_,i)=>completed.has(i)).reduce((a,s)=>a+s.esgKg,0);
  document.getElementById('esgVal').textContent=kg>0?`≈ ${kg.toFixed(1)} kg evitados em aterro`:'≈ 0 kg evitados em aterro';
}

function openPopup(type){
  if(type==='coleta'){document.getElementById('popupDaily').classList.remove('d-none');document.getElementById('popupNext').style.opacity='0.3';document.getElementById('popupNext').style.pointerEvents='none';}
}
function closePopup(type){
  if(type==='coleta'){document.getElementById('popupDaily').classList.add('d-none');document.getElementById('popupNext').style.opacity='';document.getElementById('popupNext').style.pointerEvents='';}
}
function openChat(){showToast('Chat aberto — contatos censurados até reserva (RB-11)');}

function startRoute(){
  if(routeStarted)return;
  routeStarted=true;
  const btn=document.getElementById('btnStartRoute');
  btn.disabled=true;btn.innerHTML='<i class="bi bi-check-circle-fill me-1"></i> Em andamento';
  showToast('🚛 Rota iniciada! Boa coleta!');
  selectStop(1);
}

let toastTimer;
function showToast(msg){
  clearTimeout(toastTimer);
  const w=document.getElementById('toastWrap');
  document.getElementById('toastText').textContent=msg;
  w.classList.remove('d-none');
  toastTimer=setTimeout(()=>w.classList.add('d-none'),3200);
}


drawRoute();
recenter();
updateNextPopup(0);
setTimeout(()=>showToast('Mapa carregado — calculando rota…'),400);