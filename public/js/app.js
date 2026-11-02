let jobs=[],filter='All',query='',armed=null;
function visible(){
  const t=query.trim().toLowerCase();
  return jobs.filter(j=>(filter==='All'||j.dept===filter)&&(!t||[j.client,j.order,j.desc,j.dept,STAT[j.status]].join(' ').toLowerCase().includes(t)));
}

function render(){
  const total=jobs.reduce((a,j)=>a+j.qty*j.price,0);
  const deliv=jobs.filter(j=>j.status===3).reduce((a,j)=>a+j.qty*j.price,0);
  const open=jobs.filter(j=>j.status<3).length;
  const late=jobs.filter(j=>j.status<3&&j.due&&j.due<todayStr()).length;
  $('#sum').innerHTML=
    `<div><b>${open}</b><span>Open jobs</span></div>`+
    `<div><b>${money(total)}</b><span>Total revenue (all jobs)</span></div>`+
    `<div><b>${money(deliv)}</b><span>Delivered</span></div>`+
    `<div><b class="${late?'late':''}">${late}</b><span>Overdue</span></div>`;

  const cnt=k=>k==='All'?jobs.length:jobs.filter(j=>j.dept===k).length;
  $('#chips').innerHTML=[{k:'All',i:''}].concat(DEPTS).map(d=>
    `<button class="chip" data-f="${d.k}" aria-pressed="${filter===d.k}">${d.i} ${d.k} (${cnt(d.k)})</button>`).join('');

  const list=visible().sort((a,b)=>(a.status===3)-(b.status===3)||(a.due||'9999').localeCompare(b.due||'9999'));
  $('#list').innerHTML=list.length?list.map(j=>{
    const d=dept(j.dept),late=j.status<3&&j.due&&j.due<todayStr();
    return `<article class="job" style="--dc:${d.c}">
      <div class="top"><div><div class="client">${esc(j.client)}</div><div class="ord">${j.order?'Order '+esc(j.order):'No order #'}</div></div><div class="dept">${d.i} ${d.k}</div></div>
      <div class="meta"><span><b>${j.qty}</b> × ${money(j.price)}</span><span>Total <b>${money(j.qty*j.price)}</b></span><span class="${late?'late':''}">Due <b class="${late?'late':''}">${fmtDate(j.due)}</b>${late?' (overdue)':''}</span></div>
      ${j.desc?`<p class="desc">${esc(j.desc)}</p>`:''}
      <div class="prog" role="progressbar" aria-valuenow="${PROG[j.status]}" aria-valuemin="0" aria-valuemax="100"><i style="width:${PROG[j.status]}%"></i></div>
      <div class="row"><span class="st s${j.status}">${STAT[j.status]} · ${PROG[j.status]}%</span>
        <div class="acts">
          <button class="btn sm pri" data-a="next" data-id="${j.id}">${NEXT[j.status]}</button>
          <button class="btn sm" data-a="edit" data-id="${j.id}">Edit</button>
          <button class="btn sm del ${armed===j.id?'armed':''}" data-a="del" data-id="${j.id}">${armed===j.id?'Sure?':'Delete'}</button>
        </div></div>
    </article>`}).join(''):`<div class="empty">No jobs here yet. Tap “+ New job” to add one.</div>`;
}

$('#chips').addEventListener('click',e=>{const b=e.target.closest('[data-f]');if(!b)return;filter=b.dataset.f;render()});
$('#q').addEventListener('input',e=>{query=e.target.value;render()});
$('#list').addEventListener('click',e=>{
  const b=e.target.closest('[data-a]');if(!b)return;
  const j=jobs.find(x=>x.id===b.dataset.id);if(!j)return;
  if(b.dataset.a==='next'){j.status=(j.status+1)%4;armed=null;save();render()}
  else if(b.dataset.a==='edit'){armed=null;openForm(j)}
  else if(b.dataset.a==='del'){
    if(armed===j.id){jobs=jobs.filter(x=>x.id!==j.id);armed=null;save();render()}
    else{armed=j.id;render();setTimeout(()=>{if(armed===j.id){armed=null;render()}},3000)}
  }
});

$('#dsel').innerHTML=DEPTS.map(d=>`<option value="${d.k}">${d.i} ${d.k}</option>`).join('');
let editing=null;
function openForm(j){
  editing=j||null;
  const f=$('#f');
  $('#ft').textContent=j?'Edit job':'New job';
  f.client.value=j?j.client:'';f.order.value=j?j.order:'';
  f.dept.value=j?j.dept:(filter!=='All'?filter:DEPTS[0].k);
  f.qty.value=j?j.qty:1;f.price.value=j?j.price:0;
  f.due.value=j?j.due:'';f.desc.value=j?j.desc:'';
  $('#dlg').showModal();
}
$('#add').onclick=()=>openForm(null);
$('#cancel').onclick=()=>$('#dlg').close();
$('#f').addEventListener('submit',()=>{
  const f=$('#f');
  const data={client:f.client.value.trim(),order:f.order.value.trim(),dept:f.dept.value,
    qty:Math.max(1,parseInt(f.qty.value)||1),price:Math.max(0,parseFloat(f.price.value)||0),
    due:f.due.value,desc:f.desc.value.trim()};
  if(!data.client)return;
  if(editing)Object.assign(editing,data);
  else jobs.push(Object.assign({id:uid(),status:0},data));
  save();render();
});

function csvText(){
  const q=v=>'"'+String(v==null?'':v).replace(/"/g,'""')+'"';
  const rows=[['Order #','Client','Department','Qty','Unit price','Total','Due','Status','Description']];
  jobs.forEach(j=>rows.push([j.order,j.client,j.dept,j.qty,j.price.toFixed(2),(j.qty*j.price).toFixed(2),j.due,STAT[j.status],j.desc]));
  return rows.map(r=>r.map(q).join(',')).join('\n');
}
$('#exp').onclick=()=>{
  const csv=csvText();
  try{
    const blob=new Blob([csv],{type:'text/csv;charset=utf-8'});
    const a=document.createElement('a');
    a.href=URL.createObjectURL(blob);a.download='earlyworx-jobs.csv';
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  }catch(e){$('#csv').value=csv;$('#xdlg').showModal()}
};
$('#xcopy').onclick=()=>{const t=$('#csv');t.select();try{document.execCommand('copy')}catch(e){}};
$('#xclose').onclick=()=>$('#xdlg').close();

jobs=load()||seed();
if(!load())save();
render();
