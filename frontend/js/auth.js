class AuthService {
  constructor() {
    this.baseURL = 'http://localhost:5000/api';
    this.isRefreshing = false;
  }

  // Pega o token atual do localStorage
  getAuthHeaders() {
    const token = localStorage.getItem('fin_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  // Verifica se o token é válido
  isValidToken(token) {
    if (!token) return false;
    
    try {
      // Decodifica o token JWT para verificar expiração
      const payload = JSON.parse(atob(token.split('.')[1]));
      const now = Date.now() / 1000;
      return payload.exp > now;
    } catch (error) {
      return false;
    }
  }

  async register(userData) {
    try {
      const response = await fetch(`${this.baseURL}/auth/register`, {
        method: 'POST',
        headers: this.getAuthHeaders(),
        body: JSON.stringify(userData)
      });

      const data = await response.json();

      if (data.success && data.data?.token) {
        localStorage.setItem('fin_token', data.data.token);
        localStorage.setItem('fin_user', JSON.stringify(data.data.user));
        
        // Dispara evento customizado para notificar o login
        window.dispatchEvent(new Event('authChange'));
      }

      return data;

    } catch (error) {
      console.error('Erro no registro:', error);
      return { success: false, message: 'Erro de conexão com o servidor' };
    }
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
        localStorage.setItem('fin_token', data.data.token);
        localStorage.setItem('fin_user', JSON.stringify(data.data.user));
        
        // Dispara evento customizado para notificar o login
        window.dispatchEvent(new Event('authChange'));
        
        console.log('Login realizado - Token salvo:', localStorage.getItem('fin_token') ? 'SIM' : 'NÃO');
      }

      return data;

    } catch (error) {
      console.error('Erro no login:', error);
      return { success: false, message: 'Erro de conexão com o servidor' };
    }
  }

  logout() {
    localStorage.removeItem('fin_token');
    localStorage.removeItem('fin_user');
    
    // Dispara evento customizado para notificar o logout
    window.dispatchEvent(new Event('authChange'));
    
    window.location.href = '../pages/login';
  }

  isAuthenticated() {
    const token = localStorage.getItem('fin_token');
    
    if (!token) {
      console.log('Nenhum token encontrado');
      return false;
    }
    
    if (!this.isValidToken(token)) {
      console.log('Token inválido ou expirado');
      this.logout();
      return false;
    }
    
    return true;
  }

  getCurrentUser() {
    const userStr = localStorage.getItem('fin_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch (error) {
        console.error('Erro ao parsear usuário:', error);
        return null;
      }
    }

    // Se não há usuário mas há token, tenta buscar do servidor
    const token = localStorage.getItem('fin_token');
    if (token && this.isValidToken(token)) {
      this.getProfile(); // Tenta atualizar os dados do usuário
      return { firstName: 'Usuário', lastName: '' };
    }

    return null;
  }

  async getProfile() {
    try {
      const response = await fetch(`${this.baseURL}/auth/profile`, {
        method: 'GET',
        headers: this.getAuthHeaders()
      });

      // Se token expirou ou não é válido, força logout
      if (response.status === 401) {
        console.log('Token inválido - fazendo logout');
        this.logout();
        return { success: false, message: 'Token inválido ou expirado' };
      }

      const data = await response.json();
      
      // Atualiza dados do usuário se a requisição foi bem sucedida
      if (data.success && data.data) {
        localStorage.setItem('fin_user', JSON.stringify(data.data));
        window.dispatchEvent(new Event('authChange'));
      }

      return data;

    } catch (error) {
      console.error('Erro ao buscar perfil:', error);
      
      // Em caso de erro de rede, não faz logout automaticamente
      // Permite que o usuário continue usando a aplicação offline
      return { 
        success: false, 
        message: 'Erro de conexão com o servidor',
        offline: true 
      };
    }
  }

  // Método para verificar autenticação em tempo real
  checkAuth() {
    return new Promise((resolve) => {
      const token = localStorage.getItem('fin_token');
      
      if (!token) {
        resolve(false);
        return;
      }
      
      if (this.isValidToken(token)) {
        resolve(true);
      } else {
        this.logout();
        resolve(false);
      }
    });
  }
}

const authService = new AuthService();