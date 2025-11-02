// Load profile information from /api/me and populate the page
import { me } from './auth.js';

export async function loadProfile(){
  try{
    const resp = await me();
    if(!resp || !resp.user) return;
    const user = resp.user;
    const nameEl = document.getElementById('profile-name');
    const avatarEl = document.getElementById('profile-avatar');
    const roleEl = document.getElementById('profile-role');
    if(nameEl) nameEl.textContent = user.name || user.email || 'Usuário';
    if(roleEl) roleEl.textContent = user.role || '';
    if(avatarEl && user.avatar_url){ avatarEl.style.backgroundImage = `url('${user.avatar_url}')`; }
  }catch(e){ console.warn('loadProfile error', e); }
}
