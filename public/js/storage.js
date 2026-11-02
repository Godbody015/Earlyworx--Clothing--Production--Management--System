function load(){try{const s=localStorage.getItem(KEY);if(s)return JSON.parse(s)}catch(e){}return null}
function save(){try{localStorage.setItem(KEY,JSON.stringify(jobs))}catch(e){}}

function seed(){
  return [
    {id:uid(),client:'RAMBO Shorts',order:'EW-1001',dept:'Sublimation',qty:40,price:185,due:addDays(4),status:1,desc:'Sample job: full-sublimation shorts, sizes S to XXL.'},
    {id:uid(),client:'School Uniform',order:'EW-1002',dept:'Sewing',qty:120,price:210,due:addDays(9),status:0,desc:'Sample job: school shirts, name tags on the chest.'},
    {id:uid(),client:'TSHEPI',order:'EW-1003',dept:'DTF',qty:25,price:95,due:addDays(-1),status:2,desc:'Sample job: DTF transfers pressed on black tees.'}
  ];
}
