// frontend/js/dashboard.js - VERSÃO CORRIGIDA
class Dashboard {
  constructor() {
    this.authService = authService;
    this.currentUser = this.getUserData();
    this.userData = null;
    this.init();
  }

  // ✅ MÉTODO CORRIGIDO - NÃO SOBREESCREVE A ROLE DO BANCO
  getUserData() {
    console.log('👤 Buscando dados do usuário...');
    
    // Método 1: Usar authService
    let user = this.authService.getCurrentUser();
    console.log('Usuário do authService:', user);
    
    // Método 2: Buscar diretamente do localStorage se necessário
    if (!user || typeof user !== 'object') {
      console.log('🔄 Buscando usuário diretamente do localStorage...');
      try {
        const userStr = localStorage.getItem('fin_user');
        if (userStr) {
          user = JSON.parse(userStr);
          console.log('Usuário do localStorage:', user);
        }
      } catch (error) {
        console.error('Erro ao parsear usuário do localStorage:', error);
      }
    }
    
    // ✅ CORREÇÃO: Tratar diferentes estruturas de resposta
    if (user) {
      // Caso 1: Estrutura {user: {...}}
      if (user.user && typeof user.user === 'object') {
        console.log('📦 Estrutura {user: {...}} detectada');
        user = user.user;
      }
      // Caso 2: Estrutura {data: {user: {...}}} 
      else if (user.data && user.data.user) {
        console.log('📦 Estrutura {data: {user: {...}}} detectada');
        user = user.data.user;
      }
      // Caso 3: Estrutura {data: {...}} (dados diretos)
      else if (user.data && typeof user.data === 'object') {
        console.log('📦 Estrutura {data: {...}} detectada');
        user = user.data;
      }
    }
    
    // ✅ CORREÇÃO: APENAS FALLBACK SE REALMENTE NÃO TEM USUÁRIO
    // NÃO SOBREESCREVER A ROLE DO BANCO!
    if (!user || typeof user !== 'object') {
      console.log('❌ Nenhum usuário válido encontrado, usando padrão');
      user = {
        firstName: 'Usuário',
        lastName: '',
        email: 'usuario@exemplo.com',
        role: 'mentee' // Apenas para fallback real
      };
    }
    
    // ✅ CORREÇÃO: APENAS garantir firstName se não existir
    // NÃO mexer na role que vem do banco!
    if (!user.firstName) {
      user.firstName = 'Usuário';
    }
    
    console.log('✅ Usuário final para dashboard:', user);
    return user;
  }

  async init() {
    try {
      console.log('🚀 Iniciando dashboard...');
      this.showLoading(true);

      // ✅ VERIFICAÇÃO DE AUTENTICAÇÃO COMPATÍVEL
      const isAuthenticated = await this.checkAuth();
      console.log('🔐 Resultado da autenticação:', isAuthenticated);

      if (!isAuthenticated) {
        console.log('❌ Não autenticado, redirecionando para login...');
        this.redirectToLogin();
        return;
      }

      // ✅ VERIFICAÇÃO ADMIN ATUALIZADA
      console.log('🔍 Verificando se é admin...');
      if (this.isAdmin()) {
        console.log('👑 Usuário é ADMIN, redirecionando para painel administrativo...');
        window.location.href = '../admin/index.html';
        return;
      }

      console.log('👤 Usuário é MENTEE, carregando dashboard normal...');
      
      // Carregar dados do dashboard
      await this.loadUserData();
      this.updateUI();
      this.setupEventListeners();

      this.showLoading(false);
      this.showContent(true);
      console.log('✅ Dashboard carregado com sucesso!');

    } catch (error) {
      console.error('💥 Erro no dashboard:', error);
      this.showError('Erro ao carregar dashboard');
      this.showLoading(false);
    }
  }

  async checkAuth() {
    console.log('🔐 Verificando autenticação...');

    // Método 1: Usar authService
    const isAuthenticated = this.authService.isAuthenticated();
    console.log('AuthService.isAuthenticated():', isAuthenticated);

    if (isAuthenticated) {
      return true;
    }

    // Método 2: Verificação manual de fallback
    const token = localStorage.getItem('fin_token');
    console.log('Token no localStorage:', token ? 'EXISTE' : 'NÃO EXISTE');

    if (!token) {
      console.log('❌ Nenhum token encontrado');
      return false;
    }

    // Verificar validade do token
    const isValid = this.authService.isValidToken(token);
    console.log('Token válido?:', isValid);

    if (!isValid) {
      console.log('❌ Token inválido');
      this.authService.logout();
      return false;
    }

    // Tentar buscar perfil atualizado para garantir dados corretos
    try {
      console.log('🔄 Buscando perfil atualizado...');
      const profile = await this.authService.getProfile();
      console.log('Resposta do profile:', profile);

      if (profile.success) {
        // Atualizar usuário com dados mais recentes
        this.currentUser = this.getUserData(); // Recarregar dados
        console.log('✅ Usuário atualizado após profile:', this.currentUser);
        return true;
      } else if (profile.offline) {
        console.log('⚠️ Modo offline, continuando com dados locais');
        return true;
      } else {
        console.log('⚠️ Profile falhou, mas token é válido. Continuando...');
        return true;
      }
    } catch (error) {
      console.error('⚠️ Erro ao buscar profile, mas continuando:', error);
      return true; // Continua se o token for válido
    }
  }

  // ✅ VERIFICAR SE É ADMIN - VERSÃO ROBUSTA
  isAdmin() {
    console.log('🔍 === VERIFICAÇÃO ADMIN INICIADA ===');
    
    const user = this.currentUser;
    console.log('👤 Usuário atual:', user);
    
    if (!user) {
      console.log('❌ Nenhum usuário para verificar');
      return false;
    }
    
    // ✅ USAR A ROLE ORIGINAL DO BANCO (sem sobreescrita)
    const userRole = user.role;
    console.log('🎯 Role do usuário:', userRole);
    
    const isAdmin = userRole === 'admin' || userRole === 'administrator';
    console.log('👑 É admin?:', isAdmin ? 'SIM' : 'NÃO');
    console.log('🔚 === VERIFICAÇÃO ADMIN FINALIZADA ===');
    
    return isAdmin;
  }

  redirectToLogin() {
    console.log('🔄 Redirecionando para login...');
    setTimeout(() => {
      window.location.href = '../pages/login.html';
    }, 1500);
  }

  showLoading(show) {
    const loadingElement = document.getElementById('loading-state');
    const contentElement = document.getElementById('dashboard-content');

    if (loadingElement) {
      loadingElement.style.display = show ? 'flex' : 'none';
    }
    if (contentElement) {
      contentElement.style.display = show ? 'none' : 'block';
    }
  }

  showContent(show) {
    const contentElement = document.getElementById('dashboard-content');
    if (contentElement) {
      contentElement.style.display = show ? 'block' : 'none';
    }
  }

  showError(message) {
    console.error('💥 Erro:', message);
    
    // Criar elemento de erro temporário
    const errorDiv = document.createElement('div');
    errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 fade-in';
    errorDiv.innerHTML = `
      <div class="flex items-center">
        <span class="material-symbols-outlined mr-2">error</span>
        <span>${message}</span>
      </div>
    `;
    
    document.body.appendChild(errorDiv);
    
    // Remover após 5 segundos
    setTimeout(() => {
      if (errorDiv.parentNode) {
        errorDiv.parentNode.removeChild(errorDiv);
      }
    }, 5000);
  }

  // ✅ CARREGAR DADOS DO USUÁRIO
  async loadUserData() {
    try {
      console.log('📊 Carregando dados do usuário...');
      
      // Simular dados - em produção viria da API
      await new Promise(resolve => setTimeout(resolve, 800));
      
      this.userData = {
        activeMentorships: 3,
        completedSessions: 12,
        nextSession: '30/10/2024 - 14:00',
        totalProgress: '75%'
      };

      console.log('✅ Dados carregados:', this.userData);

    } catch (error) {
      console.error('❌ Erro ao carregar dados:', error);
      this.userData = {
        activeMentorships: 0,
        completedSessions: 0,
        nextSession: '-',
        totalProgress: '0%'
      };
    }
  }

  // ✅ ATUALIZAR INTERFACE
  updateUI() {
    console.log('🎨 Atualizando interface...');
    console.log('👤 Dados do usuário para UI:', this.currentUser);
    
    this.updateUserInfo();
    this.updateStats();
  }

  // ✅ ATUALIZAR INFORMAÇÕES DO USUÁRIO
  updateUserInfo() {
    const user = this.currentUser;
    
    if (!user) {
      console.log('❌ Nenhum usuário para atualizar UI');
      return;
    }
    
    console.log('👤 Atualizando informações do usuário:', user);

    // Nome do usuário no header
    const userNameElement = document.getElementById('user-name');
    if (userNameElement) {
      const firstName = user.firstName || 'Usuário';
      const lastName = user.lastName || '';
      const userName = `${firstName} ${lastName}`.trim();
      userNameElement.textContent = userName;
      console.log('✅ Nome no header:', userName);
    }

    // Avatar do usuário
    const userAvatarElement = document.getElementById('user-avatar');
    if (userAvatarElement) {
      const firstInitial = user.firstName ? user.firstName[0].toUpperCase() : 'U';
      const lastInitial = user.lastName ? user.lastName[0].toUpperCase() : '';
      userAvatarElement.textContent = firstInitial + lastInitial;
      console.log('✅ Avatar:', userAvatarElement.textContent);
    }

    // Título do dashboard
    const dashboardTitle = document.getElementById('dashboard-title');
    if (dashboardTitle) {
      const userName = user.firstName || 'Usuário';
      dashboardTitle.textContent = `Bem-vindo, ${userName}!`;
      console.log('✅ Título do dashboard:', dashboardTitle.textContent);
    }
  }

  // ✅ ATUALIZAR ESTATÍSTICAS
  updateStats() {
    console.log('📈 Atualizando estatísticas...');
    
    if (!this.userData) {
      console.log('⚠️ userData não definido, usando padrão');
      this.userData = {
        activeMentorships: 0,
        completedSessions: 0,
        nextSession: '-',
        totalProgress: '0%'
      };
    }

    const elements = {
      'active-mentorships': this.userData.activeMentorships,
      'completed-sessions': this.userData.completedSessions,
      'next-session': this.userData.nextSession,
      'total-progress': this.userData.totalProgress
    };

    Object.entries(elements).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) {
        element.textContent = value;
        console.log(`✅ ${id}: ${value}`);
      } else {
        console.log(`❌ Elemento ${id} não encontrado`);
      }
    });
  }

  // ✅ CONFIGURAR EVENT LISTENERS
  setupEventListeners() {
    console.log('🔗 Configurando event listeners...');
    
    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        console.log('🚪 Logout solicitado');
        this.authService.logout();
      });
    }

    // Tema
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => this.toggleTheme());
    }

    // Listen para mudanças de autenticação
    window.addEventListener('authChange', () => {
      console.log('🔄 Evento authChange detectado, recarregando dados...');
      this.currentUser = this.getUserData();
      this.updateUserInfo();
    });
  }

  // ✅ ALTERNAR TEMA
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

// ✅ INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
  console.log('✅ DOM carregado, iniciando dashboard...');
  new Dashboard();
});

// ✅ TEMA INICIAL
if (localStorage.getItem('theme') === 'dark' || 
    (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
  document.documentElement.classList.add('dark');
  localStorage.setItem('theme', 'dark');
} else {
  document.documentElement.classList.remove('dark');
  localStorage.setItem('theme', 'light');
}

console.log('✅ Dashboard.js carregado');