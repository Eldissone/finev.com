// Global UI logic
document.addEventListener('DOMContentLoaded', async () => {
  // Load header/footer components (if placeholders exist)
  const load = (selector, path) => fetch(path).then(r => r.text()).then(html => {
    const el = document.querySelector(selector);
    if (el) el.innerHTML = html;
  });
  await load('#header-placeholder', '../components/header.html');
  await load('#footer-placeholder', '../components/footer.html');

  // After header is loaded, initialize auth state and run page-specific hooks
  let auth;
  try {
    auth = await import('./auth.js');
    await auth.initHeader();
  } catch (e) {
    console.warn('Auth module failed to load', e);
  }

  // Listen for auth changes (login/logout) and refresh header
  try {
    window.addEventListener('auth:changed', async () => {
      try { const a = await import('./auth.js'); if (a && a.initHeader) a.initHeader(); } catch (e) {/*ignore*/ }
    });
  } catch (e) {/*ignore*/ }

  // Cross-tab auth sync: BroadcastChannel preferred, localStorage fallback
  try {
    if ('BroadcastChannel' in window) {
      const bc = new BroadcastChannel('fin-auth');
      bc.addEventListener('message', (ev) => {
        if (ev.data && ev.data.type === 'auth-changed') {
          try { if (auth && auth.initHeader) auth.initHeader(); } catch (e) { }
          // check if user is now logged out and show banner in that case
          try { auth.me().then(r => { if (!r || !r.user) showLoggedOutBanner(); }); } catch (e) { }
        }
      });
    } else {
      window.addEventListener('storage', (ev) => {
        if (ev.key === 'fin-auth-change') {
          try { if (auth && auth.initHeader) auth.initHeader(); } catch (e) { }
          try { auth.me().then(r => { if (!r || !r.user) showLoggedOutBanner(); }); } catch (e) { }
        }
      });
    }
  } catch (e) {/*ignore*/ }

  // Small helper: show a top banner when user is logged out in another tab
  function showLoggedOutBanner() {
    if (document.getElementById('auth-remote-banner')) return;
    // placeholder to reserve space so we don't mutate body styles
    const placeholder = document.createElement('div');
    placeholder.id = 'auth-remote-banner-placeholder';
    placeholder.className = 'w-full';
    // banner using Tailwind utility classes (falls back to minimal inline when Tailwind not present)
    const banner = document.createElement('div');
    banner.id = 'auth-remote-banner';
    banner.className = 'w-full bg-amber-100 text-amber-700 shadow-sm';
    banner.style.position = 'fixed';
    banner.style.top = '0';
    banner.style.left = '0';
    banner.style.right = '0';
    banner.style.zIndex = '9999';
    banner.innerHTML = `
      <div class="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div>Você foi desconectado em outra aba.</div>
        <div class="flex items-center">
          <button id="auth-remote-login" class="bg-primary text-white px-3 py-1 rounded-md mr-2">Entrar novamente</button>
          <button id="auth-remote-close" class="px-3 py-1 rounded-md border">Fechar</button>
        </div>
      </div>
    `;
    // insert placeholder at top of body and banner fixed on top
    document.body.insertBefore(placeholder, document.body.firstChild);
    document.body.appendChild(banner);
    // animate enter
    banner.classList.add('auth-banner-enter', 'auth-banner');
    // wire buttons
    document.getElementById('auth-remote-login').addEventListener('click', () => {
      const url = new URL('/frontend/pages/login.html', location.origin);
      url.searchParams.set('returnTo', location.pathname + location.search);
      location.href = url.toString();
    });
    document.getElementById('auth-remote-close').addEventListener('click', () => {
      const b = document.getElementById('auth-remote-banner');
      const ph = document.getElementById('auth-remote-banner-placeholder');
      if (b) {
        b.classList.remove('auth-banner-enter');
        b.classList.add('auth-banner-exit');
        b.addEventListener('animationend', () => { if (b) b.remove(); if (ph) ph.remove(); });
      } else { if (ph) ph.remove(); }
    });
  }

  // Simple auth-guard for pages that require login
  try {
    const protectedPages = ['dashboard.html', 'perfil.html', 'sessoes.html', 'mentoria.html', 'areasMentorias.html'];
    const path = location.pathname || '';
    const needsAuth = protectedPages.some(p => path.endsWith(p) || path.includes(`/pages/${p}`));
    if (needsAuth && auth) {
      const userResp = await auth.me();
      if (!userResp || !userResp.user) {
        const returnTo = encodeURIComponent(location.pathname + location.search);
        location.href = `/frontend/pages/login.html?returnTo=${returnTo}`;
        return;
      }
    }
  } catch (e) {
    console.warn('auth-guard error', e);
  }

  // Page-specific initializers
  try {
    const m = await import('./mentorias.js');
    if (document.getElementById('mentorias-list') || document.getElementById('mentoria-details')) {
      m.loadMentorias();
    }
  } catch (e) { console.warn('mentorias failed', e); }

  try {
    if (document.getElementById('profile-name') || document.getElementById('profile-avatar')) {
      const p = await import('./profile.js');
      p.loadProfile();
    }
  } catch (e) { console.warn('profile failed', e); }

  // index page behaviors
  try {
    if (location.pathname.endsWith('index.html') || location.pathname === '/' || location.pathname.endsWith('/pages')) {
      await import('./index.js');
    }
  } catch (e) { console.warn('index init failed', e); }
});