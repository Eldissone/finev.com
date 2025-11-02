// login.js - Versão corrigida
document.addEventListener('DOMContentLoaded', function() {
  console.log('✅ Login.js carregado');
  
  const loginForm = document.getElementById('login-form');
  const errorDiv = document.getElementById('login-error');
  
  if (!loginForm) {
    console.log('❌ Formulário de login não encontrado');
    return;
  }

  console.log('✅ Formulário de login encontrado');

  // Configurar toggle de senha
  const togglePassword = document.getElementById('toggle-password');
  if (togglePassword) {
    togglePassword.addEventListener('click', function() {
      const passwordInput = document.getElementById('password');
      const icon = this.querySelector('span');
      
      if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.textContent = 'visibility_off';
        console.log('👁️ Senha visível');
      } else {
        passwordInput.type = 'password';
        icon.textContent = 'visibility';
        console.log('👁️ Senha oculta');
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
    
    console.log('📋 Dados do login:', { email: formData.email, passwordLength: formData.password.length });
    
    if (!formData.email || !formData.password) {
      showError('Por favor, preencha todos os campos.');
      return;
    }
    
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Entrando...</span><span class="material-symbols-outlined ml-2 pulse-animation">autorenew</span>';
    submitBtn.disabled = true;
    
    try {
      console.log('🚀 Enviando credenciais para a API...');
      const result = await authService.login(formData);
      console.log('📊 Resultado do login:', result);
      
      if (result.success) {
        showSuccess('Login realizado com sucesso! Redirecionando...');
        console.log('✅ Login bem-sucedido!');
        console.log('🔑 Token salvo:', localStorage.getItem('fin_token') ? 'SIM' : 'NÃO');
        console.log('👤 User salvo:', localStorage.getItem('fin_user') ? 'SIM' : 'NÃO');
        
        // Teste imediato do profile
        authService.getProfile()
          .then(profile => {
            console.log('📊 Teste pós-login:', profile);
          });
        
        setTimeout(() => {
          window.location.href = '../dashboard/';
        }, 1500);
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

  function showError(message) {
    console.error('❌ Erro no formulário:', message);
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