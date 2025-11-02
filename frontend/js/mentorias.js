// Mentorias interactions
export async function loadMentorias(){
  try{
    const res = await fetch('/api/mentorias', { credentials: 'same-origin' });
    if(!res.ok) return;
    const data = await res.json();
    const list = document.getElementById('mentorias-list') || document.getElementById('mentoria-details');
    if(!list) return;
    list.innerHTML = '';
    data.items.forEach(item =>{
      const el = document.createElement('article');
      el.className = 'mentoria-item';
      el.innerHTML = `<h3>${item.title}</h3><p>Type: ${item.type}</p>`;
      list.appendChild(el);
    });
  }catch(e){
    console.warn('loadMentorias', e);
  }
}

// Auto-run on pages where #mentorias-list or #mentoria-details exists
document.addEventListener('DOMContentLoaded', ()=>{
  if(document.getElementById('mentorias-list') || document.getElementById('mentoria-details')){
    loadMentorias();
  }
});
