  // auth.js - VERSÃO COMPLETA E CORRIGIDA
  class AuthService {
    constructor() {
      this.baseURL = 'http://localhost:5000/api';
      console.log('🔄 AuthService inicializado');
    }

    // ✅ MÉTODO DE REDIRECIONAMENTO - CORRIGIDO
    redirectBasedOnRole(user) {
      console.log('🔄 === INICIANDO REDIRECIONAMENTO ===');
      console.log('👤 Usuário:', user);
      console.log('🎯 Role:', user.role);

      // Pequeno delay para garantir processamento
      setTimeout(() => {
        if (user.role === 'admin' || user.role === 'administrator') {
          console.log('👑 Redirecionando para painel administrativo');
          console.log('➡️ Destino: ../admin/index.html');
          window.location.href = '../admin/index.html';
        } else {
          console.log('👤 Redirecionando para dashboard normal');
          console.log('➡️ Destino: ../dashboard/');
          window.location.href = '/dashboard';
        }
      }, 100);
    }

 async login(credentials) {
  try {
    const response = await fetch(`${this.baseURL}/auth/login`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(credentials)
    });

    const data = await response.json();

    if (data.success && data.data?.token) {
      let userData = data.data.user;
      
      // ✅ CORREÇÃO: Garantir que a role está definida
      if (!userData.role) {
        console.log('⚠️ Role não definida, determinando automaticamente...');
        
        // Lógica para determinar role baseada no email ou outros fatores
        if (userData.email === 'admin@fin.com' || userData.email.includes('admin')) {
          userData.role = 'admin';
        } else {
          userData.role = 'mentee';
        }
        
        console.log('✅ Role definida como:', userData.role);
      }
      
      localStorage.setItem('fin_token', data.data.token);
      localStorage.setItem('fin_user', JSON.stringify(userData));
      
      // Dispara evento customizado para notificar o login
      window.dispatchEvent(new Event('authChange'));
      
      console.log('Login realizado - Role:', userData.role);
    }

    return data;

  } catch (error) {
    console.error('Erro no login:', error);
    return { success: false, message: 'Erro de conexão com o servidor' };
  }
}
    async register(userData) {
      try {
        console.log('📝 Tentando registrar:', userData.email);

        const response = await fetch(`${this.baseURL}/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(userData)
        });

        const data = await response.json();

        if (data.success && data.data?.token) {
          localStorage.setItem('fin_token', data.data.token);
          localStorage.setItem('fin_user', JSON.stringify(data.data.user));

          window.dispatchEvent(new Event('authChange'));

          console.log('✅ Registro bem-sucedido! Role:', data.data.user.role);

          // Redirecionar baseado no role
          this.redirectBasedOnRole(data.data.user);

          return data;
        } else {
          console.log('❌ Registro falhou:', data.message);
          return data;
        }

      } catch (error) {
        console.error('❌ Erro no registro:', error);
        return {
          success: false,
          message: 'Erro de conexão com o servidor'
        };
      }
    }

    async getProfile() {
      try {
        const token = localStorage.getItem('fin_token');

        if (!token) {
          console.log('❌ Nenhum token encontrado para profile');
          return { success: false, message: 'Token não encontrado' };
        }

        console.log('👤 Buscando perfil...');

        const response = await fetch(`${this.baseURL}/auth/profile`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        console.log('📊 Status do profile:', response.status);

        if (response.status === 401) {
          console.log('❌ Token inválido - fazendo logout');
          this.logout();
          return { success: false, message: 'Token inválido ou expirado' };
        }

        const data = await response.json();

        if (data.success && data.data?.user) {
          localStorage.setItem('fin_user', JSON.stringify(data.data.user));
          window.dispatchEvent(new Event('authChange'));
          console.log('✅ Perfil atualizado:', data.data.user.email);
        } else {
          console.log('❌ Erro no profile:', data.message);
        }

        return data;

      } catch (error) {
        console.error('❌ Erro ao buscar perfil:', error);
        return {
          success: false,
          message: 'Erro de conexão com o servidor'
        };
      }
    }

    isAuthenticated() {
      const token = localStorage.getItem('fin_token');
      const hasToken = !!token;

      console.log('🔐 Verificando autenticação:', hasToken ? 'SIM' : 'NÃO');

      if (hasToken && this.isValidToken(token)) {
        return true;
      } else if (hasToken && !this.isValidToken(token)) {
        console.log('❌ Token existe mas é inválido');
        this.logout();
        return false;
      }

      return false;
    }

    isValidToken(token) {
      if (!token) return false;

      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Date.now() / 1000;
        const isValid = payload.exp > now;

        console.log('🔍 Token válido?:', isValid ? 'SIM' : 'NÃO');

        return isValid;
      } catch (error) {
        console.error('❌ Erro ao verificar token:', error);
        return false;
      }
    }

    getCurrentUser() {
      const userStr = localStorage.getItem('fin_user');
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          console.log('👤 Usuário atual:', user.email);
          return user;
        } catch (error) {
          console.error('❌ Erro ao parsear usuário:', error);
          return null;
        }
      }

      console.log('❌ Nenhum usuário encontrado no localStorage');
      return null;
    }

    logout() {
      console.log('🚪 Fazendo logout...');

      localStorage.removeItem('fin_token');
      localStorage.removeItem('fin_user');

      window.dispatchEvent(new Event('authChange'));

      setTimeout(() => {
        window.location.href = '../pages/login.html';
      }, 500);
    }

    async checkAuth() {
      console.log('🔐 Verificando autenticação completa...');

      const token = localStorage.getItem('fin_token');
      if (!token) {
        console.log('❌ Nenhum token encontrado');
        return false;
      }

      if (!this.isValidToken(token)) {
        console.log('❌ Token inválido ou expirado');
        this.logout();
        return false;
      }

      try {
        const profile = await this.getProfile();
        if (profile.success) {
          console.log('✅ Autenticação válida');
          return true;
        } else {
          console.log('❌ Profile inválido:', profile.message);
          return false;
        }
      } catch (error) {
        console.error('❌ Erro ao verificar autenticação:', error);
        return false;
      }
    }

    isAdmin() {
      const user = this.getCurrentUser();
      return user && (user.role === 'admin' || user.role === 'administrator');
    }
    

    isMentor() {
      const user = this.getCurrentUser();
      return user && user.role === 'mentor';
    }

    isMentee() {
      const user = this.getCurrentUser();
      return user && user.role === 'mentee';
    }

    getAuthHeaders() {
      const token = localStorage.getItem('fin_token');
      const headers = {
        'Content-Type': 'application/json'
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      return headers;
    }

    getAuthState() {
      const token = localStorage.getItem('fin_token');
      const user = this.getCurrentUser();

      return {
        isAuthenticated: this.isAuthenticated(),
        hasToken: !!token,
        tokenValid: token ? this.isValidToken(token) : false,
        user: user,
        token: token ? `${token.substring(0, 20)}...` : null
      };
    }
  }

  // ✅ CRIAR INSTÂNCIA GLOBAL
  const authService = new AuthService();

  // ✅ DEBUG
  console.log('🔄 AuthService carregado');
  console.log('🔐 Estado inicial:', authService.getAuthState());