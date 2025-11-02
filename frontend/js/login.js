// login.js - VERSÃO CORRIGIDA
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Login.js carregado');
  
  const loginForm = document.getElementById('login-form');
  const errorDiv = document.getElementById('login-error');
  
  if (!loginForm) {
    console.log('❌ Formulário de login não encontrado');
    return;
  }

  console.log('✅ Formulário de login encontrado');

  // Verificar se o authService está disponível
  if (typeof authService === 'undefined') {
    console.error('❌ authService não está disponível!');
    showError('Erro ao carregar o sistema de autenticação. Recarregue a página.');
    return;
  }

  console.log('✅ authService disponível:', typeof authService.redirectBasedOnRole);

  // Verificar se já está autenticado
  checkExistingAuth();

  // Configurar toggle de senha
  const togglePassword = document.getElementById('toggle-password');
  if (togglePassword) {
    togglePassword.addEventListener('click', function() {
      const passwordInput = document.getElementById('password');
      const icon = this.querySelector('span');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.textContent = 'visibility_off';
      } else {
        passwordInput.type = 'password';
        icon.textContent = 'visibility';
      }
    });
  }

  loginForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    console.log('🔐 Iniciando processo de login...');
    
    const formData = {
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value
    };
    
    console.log('📋 Dados do login:', formData);
    
    if (!formData.email || !formData.password) {
      showError('Por favor, preencha todos os campos.');
      return;
    }
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Entrando...</span><span class="material-symbols-outlined ml-2">autorenew</span>';
    submitBtn.disabled = true;
    
    try {
      console.log('🚀 Enviando credenciais para a API...');
      const result = await authService.login(formData);
      console.log('📊 Resultado do login:', result);
      
      if (result.success) {
        showSuccess('Login realizado com sucesso! Redirecionando...');
        console.log('✅ Login bem-sucedido!');
        
        // Fallback caso o redirecionamento falhe
        setTimeout(() => {
          if (window.location.href.includes('login.html')) {
            console.log('🚨 Redirecionamento automático falhou - tentando manualmente');
            const user = authService.getCurrentUser();
            if (user) {
              if (user.role === 'admin') {
                window.location.href = '../admin/index.html';
              } else {
                window.location.href = '/dashboard';
              }
            }
          }
        }, 2000);
        
      } else {
        showError(result.message || 'Email ou senha incorretos.');
      }
    } catch (error) {
      console.error('❌ Erro no login:', error);
      showError('Erro de conexão com o servidor. Tente novamente.');
    } finally {
      submitBtn.innerHTML = originalText;
      submitBtn.disabled = false;
    }
  });

  // ✅ VERIFICAR SE JÁ ESTÁ AUTENTICADO
  async function checkExistingAuth() {
    try {
      const token = localStorage.getItem('fin_token');
      
      if (token && authService.isValidToken(token)) {
        console.log('🔐 Usuário já autenticado, verificando perfil...');
        
        const profile = await authService.getProfile();
        if (profile.success) {
          console.log('✅ Usuário autenticado, redirecionando...');
          
          // Usar redirecionamento direto para evitar problemas
          const user = profile.data.user;
          if (user.role === 'admin' || user.role === 'administrator') {
            window.location.href = '../admin/index.html';
          } else {
            window.location.href = '../dashboard/';
          }
        }
      }
    } catch (error) {
      console.log('❌ Erro ao verificar autenticação existente:', error);
    }
  }

  function showError(message) {
    console.error('❌ Erro:', message);
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    errorDiv.classList.remove('bg-green-100', 'text-green-700', 'dark:bg-green-900/30', 'dark:text-green-400');
    errorDiv.classList.add('bg-red-100', 'text-red-700', 'dark:bg-red-900/30', 'dark:text-red-400');
  }

  function showSuccess(message) {
    console.log('✅ Sucesso:', message);
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    errorDiv.classList.remove('bg-red-100', 'text-red-700', 'dark:bg-red-900/30', 'dark:text-red-400');
    errorDiv.classList.add('bg-green-100', 'text-green-700', 'dark:bg-green-900/30', 'dark:text-green-400');
  }
});