import authService from './services/authService.js';

class Dashboard {
  constructor() {
    this.authService = authService;
    this.currentUser = null;
    this.init();
  }

  async init() {
    try {
      console.log('🚀 Iniciando dashboard...');
      this.showLoading(true);

      // Verificar autenticação
      const isAuthenticated = await this.checkAuth();

      if (!isAuthenticated) {
        console.log('❌ Não autenticado, redirecionando...');
        this.redirectToLogin();
        return;
      }

      // Carregar dados
      await this.loadUserData();
      this.updateUI();
      this.setupEventListeners();

      this.showLoading(false);
      this.showContent(true);
      console.log('✅ Dashboard carregado com sucesso!');

    } catch (error) {
      console.error('💥 Erro no dashboard:', error);
      this.showError('Erro ao carregar dashboard');
    }
  }

  async checkAuth() {
    console.log('🔐 Verificando autenticação...');

    // 1. Verificar se tem token no localStorage
    const token = localStorage.getItem('fin_token');
    if (!token) {
      console.log('❌ Nenhum token encontrado no localStorage');
      return false;
    }

    console.log('🔑 Token encontrado:', token.substring(0, 20) + '...');

    // 2. Verificar com o backend
    try {
      const profile = await this.authService.getProfile();
      console.log('📊 Resposta do profile:', profile);

      if (profile.success) {
        this.currentUser = profile.data.user;
        console.log('✅ Usuário autenticado:', this.currentUser.email);
        return true;
      } else {
        console.log('❌ Profile falhou:', profile.message);
        return false;
      }
    } catch (error) {
      console.error('💥 Erro ao verificar auth:', error);
      return false;
    }
  }

  async loadUserData() {
    // Seus dados existentes...
    this.userData = {
      activeMentorships: 3,
      completedSessions: 12,
      nextSession: '30/10/2024 - 14:00',
      totalProgress: '75%'
    };
    // ... resto do código
  }

  updateUI() {
    if (this.currentUser) {
      const userName = `${this.currentUser.firstName} ${this.currentUser.lastName}`;
      const userInitials = this.currentUser.firstName[0] + (this.currentUser.lastName?.[0] || '');

      document.getElementById('user-name').textContent = userName;
      document.getElementById('user-avatar').textContent = userInitials;
      document.getElementById('dashboard-title').textContent = `Bem-vindo, ${this.currentUser.firstName}!`;

      console.log('✅ UI atualizada para:', userName);
    }
  }

  showLoading(show) {
    const loadingElement = document.getElementById('loading-state');
    const contentElement = document.getElementById('dashboard-content');

    if (loadingElement) loadingElement.style.display = show ? 'flex' : 'none';
    if (contentElement) contentElement.style.display = show ? 'none' : 'block';
  }

  showContent(show) {
    const contentElement = document.getElementById('dashboard-content');
    if (contentElement) contentElement.style.display = show ? 'block' : 'none';
  }

  redirectToLogin() {
    console.log('🔄 Redirecionando para login...');
    setTimeout(() => {
      window.location.href = '../pages/login';
    }, 1000);
  }

  setupEventListeners() {
    document.getElementById('theme-toggle').addEventListener('click', this.toggleTheme);
    document.getElementById('logout-btn').addEventListener('click', () => this.authService.logout());
  }

  toggleTheme() {
    const html = document.documentElement;
    if (html.classList.contains('dark')) {
      html.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      html.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  }
}

// Inicialização quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
  new Dashboard();
});

// Tema inicial - SEMPRE light por padrão
if (localStorage.getItem('theme') === 'dark') {
  document.documentElement.classList.add('dark');
} else {
  // Força tema light mesmo se o sistema for dark
  document.documentElement.classList.remove('dark');
  localStorage.setItem('theme', 'light');
}

console.log("carregou");
