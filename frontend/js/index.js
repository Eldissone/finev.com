// Wire index page CTAs to navigation flow

const goToLogin = (returnTo) => {
  const url = new URL('/frontend/pages/login.html', location.origin);
  if(returnTo) url.searchParams.set('returnTo', returnTo);
  location.href = url.toString();
};

document.addEventListener('DOMContentLoaded', ()=>{
  const finTile = document.getElementById('tile-fin');
  const getStarted = document.getElementById('get-started-btn');
  if(finTile){
    finTile.addEventListener('click', ()=>{
      // If user not authenticated they'll be redirected from dashboard page by guard
      location.href = '/frontend/pages/areasMentorias.html';
    });
  }
  if(getStarted){
    getStarted.addEventListener('click', ()=>{
      // send user to dashboard, but prefer login if not authenticated (login page will return)
      const intended = '/frontend/pages/';
      goToLogin(intended);
    });
  }
});
