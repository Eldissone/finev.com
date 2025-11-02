// register.js
document.addEventListener('DOMContentLoaded', function() {
  const registerForm = document.getElementById('register-form');
  const errorDiv = document.getElementById('register-error');
  
  if (!registerForm) {
    console.log('❌ Formulário de registro não encontrado');
    return;
  }

  console.log('✅ Formulário de registro carregado');

  // Alternar visibilidade da senha
  document.getElementById('toggle-password')?.addEventListener('click', function() {
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
  
  document.getElementById('toggle-confirm-password')?.addEventListener('click', function() {
    const passwordInput = document.getElementById('confirmPassword');
    const icon = this.querySelector('span');
    
    if (passwordInput.type === 'password') {
      passwordInput.type = 'text';
      icon.textContent = 'visibility_off';
    } else {
      passwordInput.type = 'password';
      icon.textContent = 'visibility';
    }
  }); 
  
  // Indicador de força da senha
  document.getElementById('password')?.addEventListener('input', function() {
    const password = this.value;
    const strengthBar = document.getElementById('password-strength-bar');
    const strengthText = document.getElementById('password-strength-text');
    
    if (!strengthBar || !strengthText) return;
    
    let strength = 0;
    let text = 'Fraca';
    let colorClass = 'strength-weak';
    
    // Verificar comprimento da senha
    if (password.length >= 8) strength += 25;
    
    // Verificar letras minúsculas
    if (/[a-z]/.test(password)) strength += 25;
    
    // Verificar letras maiúsculas
    if (/[A-Z]/.test(password)) strength += 25;
    
    // Verificar números e caracteres especiais
    if (/[0-9]/.test(password)) strength += 15;
    if (/[^A-Za-z0-9]/.test(password)) strength += 10;
    
    // Determinar nível de força
    if (strength >= 80) {
      text = 'Muito forte';
      colorClass = 'strength-very-strong';
    } else if (strength >= 60) {
      text = 'Forte';
      colorClass = 'strength-strong';
    } else if (strength >= 40) {
      text = 'Média';
      colorClass = 'strength-medium';
    } else {
      text = 'Fraca';
      colorClass = 'strength-weak';
    }
    
    // Atualizar UI
    strengthBar.style.width = `${strength}%`;
    strengthText.textContent = `Força da senha: ${text}`;
    strengthText.className = `password-strength ${colorClass}`;
  });

  registerForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    console.log('📝 Iniciando processo de registro...');
    
    // Coletar dados do formulário
    const formData = {
      firstName: document.getElementById('firstName').value.trim(),
      lastName: document.getElementById('lastName').value.trim(),
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
      confirmPassword: document.getElementById('confirmPassword').value
    };
    
    const terms = document.getElementById('terms').checked;
    
    console.log('📋 Dados do formulário:', { ...formData, password: '***', confirmPassword: '***' });
    
    // Validação básica
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password || !formData.confirmPassword) {
      showError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }
    
    if (!terms) {
      showError('Você deve aceitar os Termos de Serviço para continuar.');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      showError('As senhas não coincidem.');
      return;
    }
    
    if (formData.password.length < 8) {
      showError('A senha deve ter pelo menos 8 caracteres.');
      return;
    }
    
    // Mostrar loading
    const submitBtn = this.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<span>Criando conta...</span><span class="material-symbols-outlined ml-2 pulse-animation">autorenew</span>';
    submitBtn.disabled = true;
    
    try {
      console.log('🚀 Enviando dados para a API...');
      
      // Fazer requisição para a API
      const result = await authService.register({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      });
      
      console.log('📊 Resultado do registro:', result);
      
      if (result.success) {
        // Redirecionar para dashboard
        showSuccess('Conta criada com sucesso! Redirecionando...');
        console.log('✅ Registro bem-sucedido, redirecionando...');
        
        setTimeout(() => {
          window.location.href = '../dashboard/';
        }, 1500);
      } else {
        showError(result.message || 'Erro ao criar conta. Tente novamente.');
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
      }
      
    } catch (error) {
      console.error('❌ Erro no registro:', error);
      showError('Erro de conexão com o servidor. Tente novamente.');
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

  // Adicionar efeitos de foco aos inputs
  document.querySelectorAll('.input-field').forEach(input => {
    input.addEventListener('focus', function() {
      this.parentElement.classList.add('ring-2', 'ring-primary/30');
    });
    
    input.addEventListener('blur', function() {
      this.parentElement.classList.remove('ring-2', 'ring-primary/30');
    });
  });
});