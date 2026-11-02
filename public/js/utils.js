const $=s=>document.querySelector(s);
const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>'R '+n.toLocaleString('en-ZA',{minimumFractionDigits:2,maximumFractionDigits:2});
const dept=k=>DEPTS.find(d=>d.k===k)||DEPTS[0];
const todayStr=()=>{const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const addDays=n=>{const d=new Date();d.setDate(d.getDate()+n);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
const fmtDate=s=>s?new Date(s+'T00:00:00').toLocaleDateString('en-ZA',{day:'numeric',month:'short'}):'No date';
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,6);
