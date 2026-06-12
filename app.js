const defaultMaterials = [
  {name:'도배지 실크', group:'도배지', spec:'폭 0.93m × 길이 15.6m', unit:'롤', coverage:14.5, price:45000},
  {name:'장판 2.0T', group:'장판', spec:'폭 2.0m × 길이 20m', unit:'롤', coverage:40, price:220000},
  {name:'데코타일 3T', group:'데코타일', spec:'600 × 600', unit:'박스', coverage:3.24, price:28000},
  {name:'타일 300각', group:'타일', spec:'300 × 300', unit:'박스', coverage:1.44, price:22000},
  {name:'합판 12T', group:'합판', spec:'1220 × 2440', unit:'장', coverage:2.9768, price:18500},
  {name:'석고보드 9.5T', group:'석고보드', spec:'900 × 1800', unit:'장', coverage:1.62, price:3800},
  {name:'한치각재 38×38', group:'한치각재', spec:'38 × 38 × 3600', unit:'본', coverage:3.6, price:2800}
];
let currentGroup='도배지';
let lastResult=null;
const surfaceMap={
  '장판':'wall',
  '데코타일':'floor',
  '타일':'floor',
  '합판':'wall',
  '석고보드':'wall',
  '한치각재':'wall',
  '도배지':'wall'
};
const $=id=>document.getElementById(id);
const fmt=n=>Number(n||0).toLocaleString('ko-KR');
const getMaterials=()=>JSON.parse(localStorage.getItem('dh_materials')||'null')||defaultMaterials;
const setMaterials=v=>localStorage.setItem('dh_materials',JSON.stringify(v));
const getHistory=()=>JSON.parse(localStorage.getItem('dh_history')||'[]');
const setHistory=v=>localStorage.setItem('dh_history',JSON.stringify(v));
const groups=()=>[...new Set(getMaterials().map(m=>m.group).filter(Boolean))];

function showPage(id){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const page=$(id);
  if(page) page.classList.add('active');
  document.querySelectorAll('.nav,.bottom-nav button').forEach(b=>b.classList.toggle('active',b.dataset.page===id));
  const sidebar=document.querySelector('.sidebar');
  if(sidebar) sidebar.classList.remove('open');
  try{ renderAll(); }catch(e){ console.error('renderAll error:', e); }
}
document.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>showPage(b.dataset.page));
document.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>showPage(b.dataset.move));
if($('menuBtn')) $('menuBtn').onclick=()=>document.querySelector('.sidebar').classList.toggle('open');
$('today').valueAsDate=new Date();

function renderGroupOptions(){
  const opts=groups().map(g=>`<option value="${g}"></option>`).join('');
  $('groupOptions').innerHTML=opts;
}
function renderTabs(){
  const gs=groups();
  if(!gs.includes(currentGroup)) currentGroup=gs[0]||'';
  const tabsEl=$('materialTabs');
  if(!tabsEl) return;
  tabsEl.innerHTML=gs.map(g=>`<button class="${g===currentGroup?'active':''}" data-g="${g}">${g}</button>`).join('');
  tabsEl.querySelectorAll('button').forEach(b=>b.onclick=()=>{currentGroup=b.dataset.g;renderTabs();renderSelect();applyDefaultSurfaceForCurrentGroup();$('calcTitle').textContent=currentGroup+' 계산';});
}
function applyDefaultSurfaceForCurrentGroup(){
  const s=$('surface');
  if(!s) return;
  const key=currentGroup||'';
  let next='floor';
  for(const k in surfaceMap){ if(key.includes(k)){ next=surfaceMap[k]; break; } }
  s.value=next;
}
function renderSelect(){
  const mats=getMaterials().filter(m=>m.group===currentGroup);
  const sel=$('materialSelect');
  if(!sel) return;
  sel.innerHTML=mats.map((m,i)=>`<option value="${i}">${m.name} · ${m.spec}</option>`).join('');
  applyDefaultSurfaceForCurrentGroup();
}
function calc(){
  const w=+$('width').value||0,l=+$('length').value||0,h=+$('height').value||0,d=+$('deduct').value||0,loss=+$('loss').value||0;
  const surface=$('surface').value;
  let area=surface==='wall'?Math.max(((w+l)*2*h)-d,0):Math.max((w*l)-d,0);
  const mats=getMaterials().filter(m=>m.group===currentGroup);
  const mat=mats[+$('materialSelect').value]||mats[0];
  const need=area*(1+loss/100);
  const order=Math.ceil(need/(mat?.coverage||1));
  const amount=order*(mat?.price||0);
  lastResult={date:new Date().toISOString().slice(0,10), room:$('roomName').value, group:currentGroup, material:mat?.name||'', area, need, order, unit:mat?.unit||'', amount};
  $('areaResult').textContent=area.toFixed(2)+'㎡';
  $('qtyResult').textContent=need.toFixed(2)+'㎡';
  $('orderResult').textContent=order+''+(mat?.unit||'');
  $('amountResult').textContent=fmt(amount)+'원';
  $('formulaHint').textContent=surface==='wall'?'벽면: (가로+세로)×2×높이 - 공제':'바닥/천장: 가로×세로 - 공제';
}
$('calcBtn').onclick=calc;
$('saveCalcBtn').onclick=()=>{if(!lastResult) calc();const h=getHistory();h.unshift(lastResult);setHistory(h);alert('계산 내역이 저장되었습니다.');renderAll();};

function renderMaterials(){
  const ms=getMaterials();
  $('materialCards').innerHTML=ms.map((m,i)=>`<article class="mat-card"><h3>${m.name}</h3><dl><dt>그룹</dt><dd>${m.group}</dd><dt>규격</dt><dd>${m.spec}</dd><dt>단위</dt><dd>${m.unit}</dd><dt>커버량</dt><dd>${m.coverage}</dd><dt>단가</dt><dd>${fmt(m.price)}원</dd></dl><div class="mat-actions"><button class="edit" onclick="editMaterial(${i})">수정</button><button class="del" onclick="delMaterial(${i})">삭제</button></div></article>`).join('');
  renderGroupsPanel();
  renderPricePanel();
}
window.editMaterial=i=>{
  const m=getMaterials()[i];
  $('editIndex').value=i;$('matName').value=m.name;$('matGroup').value=m.group;$('matSpec').value=m.spec;$('matUnit').value=m.unit;$('matCoverage').value=m.coverage;$('matPrice').value=m.price;
  $('materialDialog').showModal();
};
window.delMaterial=i=>{if(confirm('삭제할까요?')){const ms=getMaterials();ms.splice(i,1);setMaterials(ms);renderAll();}};
$('addMaterialBtn').onclick=()=>{$('materialForm').reset();$('editIndex').value='';renderGroupOptions();$('materialDialog').showModal();};
$('cancelMaterial').onclick=()=>$('materialDialog').close();
$('materialForm').addEventListener('submit',e=>{
  e.preventDefault();
  const name=$('matName').value.trim(), group=$('matGroup').value.trim();
  if(!name||!group){alert('자재명과 그룹은 필수입니다.');return;}
  const ms=getMaterials();
  const m={name,group,spec:$('matSpec').value.trim(),unit:$('matUnit').value.trim()||'개',coverage:+$('matCoverage').value||1,price:+$('matPrice').value||0};
  const idx=$('editIndex').value;
  if(idx==='') ms.push(m); else ms[Number(idx)]=m;
  setMaterials(ms);
  currentGroup=group;
  $('materialDialog').close();
  renderAll();
  showManageTab('list');
});

function showManageTab(name){
  document.querySelectorAll('#manageTabs button').forEach(b=>b.classList.toggle('active',b.dataset.manage===name));
  document.querySelectorAll('.manage-panel').forEach(p=>p.classList.remove('active'));
  const target={list:'materialCards',group:'groupPanel',price:'pricePanel'}[name];
  $(target).classList.add('active');
}
document.querySelectorAll('#manageTabs button').forEach(b=>b.onclick=()=>showManageTab(b.dataset.manage));
function renderGroupsPanel(){
  const ms=getMaterials();
  const counts={}; ms.forEach(m=>counts[m.group]=(counts[m.group]||0)+1);
  $('groupList').innerHTML=Object.entries(counts).map(([g,c])=>`<div class="group-row"><b>${g}</b><span>${c}개 등록</span></div>`).join('')||'<div class="empty-small">등록된 그룹이 없습니다.</div>';
}
function renderPricePanel(){
  const ms=getMaterials();
  $('priceTable').innerHTML=`<table><thead><tr><th>자재명</th><th>그룹</th><th>규격</th><th>단위</th><th>단가</th><th>저장</th></tr></thead><tbody>${ms.map((m,i)=>`<tr><td>${m.name}</td><td>${m.group}</td><td>${m.spec}</td><td>${m.unit}</td><td><input class="price-input" id="price_${i}" type="number" value="${m.price}"></td><td><button class="outline mini" onclick="savePrice(${i})">저장</button></td></tr>`).join('')}</tbody></table>`;
}
window.savePrice=i=>{const ms=getMaterials();ms[i].price=+$(`price_${i}`).value||0;setMaterials(ms);renderAll();showManageTab('price');};


function exportHistoryExcel(selectedOnly=false){
  const h=getHistory();
  let rows=h;
  if(selectedOnly){
    const checks=[...document.querySelectorAll('.hist-check:checked')].map(x=>+x.value);
    rows=h.filter((r,i)=>checks.includes(i));
  }
  if(!rows.length){
    alert(selectedOnly ? '선택된 내역이 없습니다.' : '내보낼 계산 내역이 없습니다.');
    return;
  }
  if(typeof XLSX==='undefined'){
    alert('엑셀 내보내기 모듈을 불러오지 못했습니다. 인터넷 연결 후 다시 시도해주세요.');
    return;
  }
  const data=rows.map(x=>({
    '날짜':x.date,
    '공간':x.room||'',
    '구분':x.group||'',
    '자재':x.material||'',
    '면적(㎡)':Number(x.area||0).toFixed(2),
    '필요면적(㎡)':Number(x.need||0).toFixed(2),
    '발주수량':`${x.order||0}${x.unit||''}`,
    '금액':x.amount||0
  }));
  const wb=XLSX.utils.book_new();
  const ws=XLSX.utils.json_to_sheet(data);
  XLSX.utils.book_append_sheet(wb,ws,'계산내역');
  XLSX.writeFile(wb,'DH_계산내역.xlsx');
}

function deleteSelectedHistory(){
  const checks=[...document.querySelectorAll('.hist-check:checked')].map(x=>+x.value);
  if(!checks.length){alert('삭제할 내역을 선택해주세요.');return;}
  if(!confirm('선택한 계산 내역을 삭제할까요?')) return;
  const h=getHistory().filter((_,i)=>!checks.includes(i));
  setHistory(h);
  renderAll();
}

function isCivilHistoryItem(x){
  const text=((x.category||'')+' '+(x.group||'')+' '+(x.material||'')).toLowerCase();
  const civilWords=['토목','pvc','pe관','흄관','이중벽관','맨홀','집수정','그레이팅','관로','우수','오수'];
  return civilWords.some(w=>text.includes(w.toLowerCase()));
}
function renderUsageStats(h){
  const buildingEl=$('usageBuilding');
  const civilEl=$('usageCivil');
  if(!buildingEl || !civilEl) return;
  const total=h.length;
  if(!total){
    buildingEl.textContent='건축 0%';
    civilEl.textContent='토목 0%';
    return;
  }
  const civil=h.filter(isCivilHistoryItem).length;
  const building=total-civil;
  const bPct=Math.round(building/total*100);
  const cPct=100-bPct;
  buildingEl.textContent=`건축 ${bPct}%`;
  civilEl.textContent=`토목 ${cPct}%`;
}

function renderHistory(){
  const h=getHistory();
  renderUsageStats(h);
  const target=$('historyTable');
  if(!target) return;

  if(!h.length){
    target.innerHTML='<div class="empty">저장된 계산 내역이 없습니다.</div>';
  }else{
    target.innerHTML=`<table class="history-data-table">
      <thead>
        <tr>
          <th class="check-col"><input type="checkbox" id="allChk"></th>
          <th>날짜</th>
          <th>공간</th>
          <th>자재</th>
          <th>면적</th>
          <th>발주</th>
          <th>금액</th>
        </tr>
      </thead>
      <tbody>
        ${h.map((x,i)=>`<tr>
          <td class="check-col"><input class="hist-check" type="checkbox" value="${i}"></td>
          <td>${x.date}</td>
          <td>${x.room||''}</td>
          <td>${x.material}</td>
          <td>${Number(x.area||0).toFixed(2)}㎡</td>
          <td>${x.order}${x.unit}</td>
          <td>${fmt(x.amount)}원</td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  }

  const all=$('allChk');
  if(all) all.onclick=()=>document.querySelectorAll('.hist-check').forEach(c=>c.checked=all.checked);

  $('recentList').innerHTML=h.slice(0,4).map(x=>`${x.date} · ${x.group} · ${fmt(x.amount)}원`).join('<br>')||'최근 내역 없음';
  $('dashboardTable').innerHTML=h.slice(0,6).map(x=>`${x.date} &nbsp; ${x.group} &nbsp; ${x.material} &nbsp; ${x.order}${x.unit} &nbsp; ${fmt(x.amount)}원`).join('<br>')||'계산 후 저장하면 여기에 표시됩니다.';
  $('statCount').textContent=h.length+'건';
  $('statAmount').textContent=fmt(h.reduce((a,b)=>a+(b.amount||0),0))+'원';
}

const exportSelectedBtn=$('exportSelectedBtn');
if(exportSelectedBtn) exportSelectedBtn.onclick=()=>exportHistoryExcel(true);
const exportAllBtn=$('exportAllBtn');
if(exportAllBtn) exportAllBtn.onclick=()=>exportHistoryExcel(false);
const deleteSelectedBtn=$('deleteSelectedBtn');
if(deleteSelectedBtn) deleteSelectedBtn.onclick=deleteSelectedHistory;
const clearHistory=$('clearHistory');
if(clearHistory) clearHistory.onclick=()=>{if(confirm('계산 내역을 모두 삭제할까요?')){setHistory([]);renderAll();}};
function renderAll(){
  renderGroupOptions();
  renderTabs();
  renderSelect();
  renderMaterials();
  renderHistory();
  if($('statMaterials')) $('statMaterials').textContent=getMaterials().length+'개';
}
renderAll();
if($('roomName')) $('roomName').value='';
calc();
