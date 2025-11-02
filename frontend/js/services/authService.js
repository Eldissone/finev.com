// authService.js - Versão completa e corrigida
class AuthService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
  }

  async login(credentials) {
    try {
      console.log('🔐 Tentando login:', credentials.email);
      
      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(credentials)
      });
      
      const data = await response.json();
      
      // ✅ SALVAR O TOKEN NO LOCALSTORAGE
      if (data.success && data.data?.token) {
        localStorage.setItem('fin_token', data.data.token);
        localStorage.setItem('fin_user', JSON.stringify(data.data.user));
        
        // Disparar evento para notificar mudança de auth
        window.dispatchEvent(new Event('authChange'));
        
        console.log('✅ Token salvo no login:', data.data.token ? 'SIM' : 'NÃO');
        console.log('👤 Usuário salvo:', data.data.user ? 'SIM' : 'NÃO');
      } else {
        console.log('❌ Login falhou:', data.message);
      }
      
      return data;
      
    } catch (error) {
      console.error('❌ Erro no login:', error);
      return { 
        success: false, 
        message: 'Erro de conexão com o servidor' 
      };
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
      
      // ✅ SALVAR O TOKEN NO REGISTER TAMBÉM
      if (data.success && data.data?.token) {
        localStorage.setItem('fin_token', data.data.token);
        localStorage.setItem('fin_user', JSON.stringify(data.data.user));
        
        window.dispatchEvent(new Event('authChange'));
        
        console.log('✅ Token salvo no registro:', data.data.token ? 'SIM' : 'NÃO');
        console.log('👤 Usuário salvo:', data.data.user ? 'SIM' : 'NÃO');
      } else {
        console.log('❌ Registro falhou:', data.message);
      }
      
      return data;
      
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      return { 
        success: false, 
        message: 'Erro de conexão com o servidor' 
      };
    }
  }

  // ✅ MÉTODO PARA BUSCAR PERFIL
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
      
      // Atualizar dados do usuário
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

  // ✅ VERIFICAR SE ESTÁ AUTENTICADO
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

  // ✅ VERIFICAR VALIDADE DO TOKEN JWT
  isValidToken(token) {
    if (!token) return false;
    
    try {
      // Decodificar JWT para verificar expiração
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      const isValid = payload.exp > now;
      
      console.log('🔍 Token válido?:', isValid ? 'SIM' : 'NÃO');
      console.log('⏰ Expira em:', new Date(payload.exp * 1000).toLocaleString());
      
      return isValid;
    } catch (error) {
      console.error('❌ Erro ao verificar token:', error);
      return false;
    }
  }

  // ✅ OBTER USUÁRIO ATUAL
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

  // ✅ LOGOUT
  logout() {
    console.log('🚪 Fazendo logout...');
    
    const tokenBefore = localStorage.getItem('fin_token');
    const userBefore = localStorage.getItem('fin_user');
    
    localStorage.removeItem('fin_token');
    localStorage.removeItem('fin_user');
    
    const tokenAfter = localStorage.getItem('fin_token');
    const userAfter = localStorage.getItem('fin_user');
    
    console.log('🗑️ Token removido?:', !tokenAfter ? 'SIM' : 'NÃO');
    console.log('🗑️ User removido?:', !userAfter ? 'SIM' : 'NÃO');
    
    // Disparar evento para notificar mudança de auth
    window.dispatchEvent(new Event('authChange'));
    
    // Redirecionar para login
    setTimeout(() => {
      window.location.href = '../login/';
    }, 500);
  }

  // ✅ VERIFICAR AUTENTICAÇÃO COMPLETA (PARA DASHBOARD)
  async checkAuth() {
    console.log('🔐 Verificando autenticação completa...');
    
    // 1. Verificar se tem token
    const token = localStorage.getItem('fin_token');
    if (!token) {
      console.log('❌ Nenhum token encontrado');
      return false;
    }

    // 2. Verificar se token é válido
    if (!this.isValidToken(token)) {
      console.log('❌ Token inválido ou expirado');
      this.logout();
      return false;
    }

    // 3. Verificar com o backend
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

  // ✅ OBTER HEADERS PARA REQUISIÇÕES AUTENTICADAS
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

  // ✅ VERIFICAR ESTADO DA AUTENTICAÇÃO
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

// ✅ DEBUG NO CONSOLE
console.log('🔄 AuthService carregado');
console.log('🔐 Estado inicial:', authService.getAuthState());

// ✅ EXPORTAR PARA USO EM MÓDULOS
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { authService };
}

export default authService; // opcional~
