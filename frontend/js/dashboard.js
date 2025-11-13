// 🔥 SISTEMA DE AUTENTICAÇÃO
class AuthService {
    constructor() {
        this.API_BASE_URL = 'http://localhost:5000/api';
        this.currentUser = null;
    }

    async getProfile() {
        try {
            const token = this.getToken();
            if (!token) {
                return { success: false, message: 'Token não encontrado' };
            }

            const response = await fetch(`${this.API_BASE_URL}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.currentUser = data.data.user;
                return { success: true, data: data.data };
            } else if (response.status === 401) {
                this.logout();
                return { success: false, message: 'Token inválido' };
            } else {
                return { success: false, message: 'Erro ao carregar perfil' };
            }
        } catch (error) {
            console.error('❌ Erro na requisição de perfil:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    getToken() {
        return localStorage.getItem('fin_token');
    }

    logout() {
        localStorage.removeItem('fin_token');
        localStorage.removeItem('fin_user');
        localStorage.removeItem('user_avatar_base64'); // Limpar avatar também
        localStorage.removeItem('user_avatar');
        window.location.href = '../pages/login.html';
    }

    async validateToken(token) {
        try {
            const response = await fetch(`${this.API_BASE_URL}/auth/profile`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }
}

// 🔥 CLASSE PRINCIPAL DO DASHBOARD
class Dashboard {
    constructor() {
        this.authService = new AuthService();
        this.currentUser = null;
        this.userData = null;
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Iniciando dashboard...');
            this.showLoading(true);

            // ✅ VERIFICAÇÃO DE AUTENTICAÇÃO
            const isAuthenticated = await this.checkAuth();
            console.log('🔐 Resultado da autenticação:', isAuthenticated);

            if (!isAuthenticated) {
                console.log('❌ Não autenticado, redirecionando para login...');
                this.redirectToLogin();
                return;
            }

            // ✅ CARREGAR DADOS DO USUÁRIO
            await this.loadUserData();
            this.updateUI();
            this.setupEventListeners();

            // ✅ INICIALIZAR MENTOR IA
            this.initializeMentorBot();

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

        // Verificar token no localStorage
        const token = localStorage.getItem('fin_token');
        console.log('Token no localStorage:', token ? 'EXISTE' : 'NÃO EXISTE');

        if (!token) {
            console.log('❌ Nenhum token encontrado');
            return false;
        }

        // Tentar buscar perfil do usuário
        try {
            console.log('🔄 Buscando perfil do usuário...');
            const profile = await this.getUserProfile();
            console.log('Resposta do profile:', profile);

            if (profile.success) {
                this.currentUser = profile.data;
                console.log('✅ Usuário autenticado:', this.currentUser);
                return true;
            } else {
                console.log('❌ Falha ao carregar perfil:', profile.message);
                return false;
            }
        } catch (error) {
            console.error('⚠️ Erro ao buscar profile:', error);
            return false;
        }
    }

    async getUserProfile() {
        try {
            const token = localStorage.getItem('fin_token');
            if (!token) {
                return { success: false, message: 'Token não encontrado' };
            }

            const response = await fetch('http://localhost:5000/api/auth/profile', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                return { success: true, data: data.data.user };
            } else if (response.status === 401) {
                this.logout();
                return { success: false, message: 'Token inválido' };
            } else {
                return { success: false, message: 'Erro ao carregar perfil' };
            }
        } catch (error) {
            console.error('❌ Erro na requisição de perfil:', error);
            return { success: false, message: 'Erro de conexão' };
        }
    }

    logout() {
        localStorage.removeItem('fin_token');
        localStorage.removeItem('fin_user');
        localStorage.removeItem('user_avatar_base64');
        localStorage.removeItem('user_avatar');
        window.location.href = '../pages/login.html';
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
                totalProgress: '75%',
                upcomingMentorships: [
                    {
                        title: 'Mentoria de Investimentos',
                        date: '30/10/2024',
                        time: '14:00',
                        mentor: 'Carlos Silva'
                    },
                    {
                        title: 'Planejamento Financeiro',
                        date: '02/11/2024',
                        time: '10:00',
                        mentor: 'Ana Costa'
                    },
                    {
                        title: 'Análise de Portfólio',
                        date: '05/11/2024',
                        time: '16:30',
                        mentor: 'Roberto Alves'
                    }
                ],
                recentProgress: [
                    {
                        activity: 'Finanças Pessoais',
                        progress: '67%',
                        modules: '8 de 12 módulos'
                    },
                    {
                        activity: 'Investimentos',
                        progress: '50%',
                        modules: '5 de 10 módulos'
                    }
                ]
            };

            console.log('✅ Dados carregados:', this.userData);

        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            this.userData = {
                activeMentorships: 0,
                completedSessions: 0,
                nextSession: '-',
                totalProgress: '0%',
                upcomingMentorships: [],
                recentProgress: []
            };
        }
    }

    // ✅ ATUALIZAR INTERFACE
    updateUI() {
        console.log('🎨 Atualizando interface...');
        console.log('👤 Dados do usuário para UI:', this.currentUser);

        this.updateUserInfo();
        this.updateStats();
        this.updateUpcomingMentorships();
        this.updateRecentProgress();
    }

    // ✅ ATUALIZAR INFORMAÇÕES DO USUÁRIO (SISTEMA ATUALIZADO)
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

        // Avatar do usuário - SISTEMA ATUALIZADO
        const userAvatarElement = document.getElementById('user-avatar');
        if (userAvatarElement) {
            this.updateAvatar(user.avatarUrl, user);
            console.log('✅ Avatar atualizado');
        }

        // Título do dashboard
        const dashboardTitle = document.getElementById('dashboard-title');
        if (dashboardTitle) {
            const userName = user.firstName || 'Usuário';
            dashboardTitle.textContent = `Bem-vindo, ${userName}!`;
            console.log('✅ Título do dashboard:', dashboardTitle.textContent);
        }
    }

    // ✅ SISTEMA DE AVATAR COMPLETO (MESMO PADRÃO DAS OUTRAS PÁGINAS)
    updateAvatar(avatarUrl, user) {
        const avatarElement = document.getElementById('user-avatar');
        if (!avatarElement) return;

        const userInitials = (user.firstName?.[0] || 'U') + (user.lastName?.[0] || '');

        console.log('🖼️ Atualizando avatar no dashboard...');
        console.log('📁 Avatar URL recebida:', avatarUrl);

        // 🥇 PRIORIDADE 1: Base64 salvo localmente
        const base64Avatar = localStorage.getItem('user_avatar_base64');
        if (base64Avatar) {
            console.log('🖼️ Usando avatar base64 local no dashboard');
            avatarElement.innerHTML = `<img src="${base64Avatar}" alt="Avatar" class="w-8 h-8 rounded-full object-cover">`;
            return;
        }

        // 🥈 PRIORIDADE 2: URL do servidor (COM CORREÇÃO DA URL)
        if (avatarUrl) {
            console.log('🖼️ Tentando avatar do servidor no dashboard:', avatarUrl);

            // CORREÇÃO: Verificar se é uma URL completa ou relativa
            let fullAvatarUrl;

            if (avatarUrl.startsWith('http')) {
                // Já é uma URL completa
                fullAvatarUrl = avatarUrl;
            } else if (avatarUrl.startsWith('/uploads/')) {
                // URL relativa do servidor - ajustar para o backend
                fullAvatarUrl = `http://localhost:5000${avatarUrl}`;
            } else if (avatarUrl.startsWith('uploads/')) {
                // URL relativa sem a barra
                fullAvatarUrl = `http://localhost:5000/${avatarUrl}`;
            } else {
                // Outro formato - tentar como está
                fullAvatarUrl = `http://localhost:5000/uploads/avatars/${avatarUrl}`;
            }

            console.log('🔗 URL final do avatar:', fullAvatarUrl);

            const testImage = new Image();
            testImage.onload = () => {
                console.log('✅ Imagem do servidor carregou com sucesso no dashboard');
                avatarElement.innerHTML = `<img src="${fullAvatarUrl}" alt="Avatar" class="w-8 h-8 rounded-full object-cover">`;
            };

            testImage.onerror = () => {
                console.log('❌ Imagem do servidor falhou no dashboard, usando iniciais');
                avatarElement.innerHTML = `<span class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">${userInitials}</span>`;
            };

            testImage.src = `${fullAvatarUrl}?t=${Date.now()}`;

            // ⏰ TIMEOUT DE SEGURANÇA
            setTimeout(() => {
                if (!testImage.complete) {
                    console.log('⏰ Timeout - imagem não carregou a tempo no dashboard');
                    avatarElement.innerHTML = `<span class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">${userInitials}</span>`;
                }
            }, 3000);
            return;
        }

        // 🥉 PRIORIDADE 3: Avatar URL salvo localmente
        const localAvatar = localStorage.getItem('user_avatar');
        if (localAvatar) {
            console.log('🖼️ Usando avatar URL local no dashboard:', localAvatar);

            const testImage = new Image();
            testImage.onload = () => {
                avatarElement.innerHTML = `<img src="${localAvatar}" alt="Avatar" class="w-8 h-8 rounded-full object-cover">`;
            };
            testImage.onerror = () => {
                avatarElement.innerHTML = `<span class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">${userInitials}</span>`;
            };
            testImage.src = `${localAvatar}?t=${Date.now()}`;
            return;
        }

        // 🛡️ FALLBACK FINAL: Iniciais
        console.log('🖼️ Nenhum avatar disponível no dashboard, usando iniciais');
        avatarElement.innerHTML = `<span class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">${userInitials}</span>`;
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

    // ✅ ATUALIZAR MENTORIAS PROGRAMADAS
    updateUpcomingMentorships() {
        const container = document.getElementById('upcoming-mentorships');
        if (!container || !this.userData.upcomingMentorships) return;

        if (this.userData.upcomingMentorships.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                  <span class="material-symbols-outlined text-4xl mb-2">event_available</span>
                  <p>Nenhuma mentoria agendada</p>
                  <button class="mt-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-orange-600 transition-colors">
                    Agendar Mentoria
                  </button>
                </div>
              `;
            return;
        }

        container.innerHTML = this.userData.upcomingMentorships.map(mentorship => `
              <div class="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-800 dark:text-white">${mentorship.title}</h4>
                  <div class="flex items-center gap-4 mt-1 text-sm text-gray-600 dark:text-gray-300">
                    <span class="flex items-center gap-1">
                      <span class="material-symbols-outlined text-sm">calendar_today</span>
                      ${mentorship.date}
                    </span>
                    <span class="flex items-center gap-1">
                      <span class="material-symbols-outlined text-sm">schedule</span>
                      ${mentorship.time}
                    </span>
                    <span class="flex items-center gap-1">
                      <span class="material-symbols-outlined text-sm">person</span>
                      ${mentorship.mentor}
                    </span>
                  </div>
                </div>
                <button class="ml-4 px-3 py-1 bg-primary text-white text-sm rounded-lg hover:bg-orange-600 transition-colors">
                  Entrar
                </button>
              </div>
            `).join('');
    }

    // ✅ ATUALIZAR PROGRESSO RECENTE
    updateRecentProgress() {
        const container = document.getElementById('recent-progress');
        if (!container || !this.userData.recentProgress) return;

        if (this.userData.recentProgress.length === 0) {
            container.innerHTML = `
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                  <span class="material-symbols-outlined text-4xl mb-2">trending_up</span>
                  <p>Nenhum progresso registrado</p>
                </div>
              `;
            return;
        }

        container.innerHTML = this.userData.recentProgress.map(progress => `
              <div class="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-800 rounded-lg">
                <div>
                  <p class="font-medium text-text-main dark:text-white">${progress.activity}</p>
                  <p class="text-sm text-text-secondary dark:text-text-secondary-dark">${progress.modules}</p>
                </div>
                <div class="w-16 bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                  <div class="bg-primary h-2 rounded-full" style="width: ${progress.progress}"></div>
                </div>
              </div>
            `).join('');
    }

    // ✅ CONFIGURAR EVENT LISTENERS
    setupEventListeners() {
        console.log('🔗 Configurando event listeners...');

        // Logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                console.log('🚪 Logout solicitado');
                if (confirm('Tem certeza que deseja sair?')) {
                    this.logout();
                }
            });
        }

        // Tema
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // ✅ CONFIGURAR MODAL DO MENTOR IA
        this.setupMentorModal();
    }

    // ✅ CONFIGURAR MODAL DO MENTOR IA
    setupMentorModal() {
        console.log('🔧 Configurando modal do mentor IA...');

        const openButton = document.getElementById('open-mentor-modal');
        const closeButton = document.getElementById('close-modal');
        const modal = document.getElementById('mentor-modal');
        const backdrop = document.getElementById('modal-backdrop');
        const resetChat = document.getElementById('reset-chat');

        if (openButton && modal) {
            openButton.addEventListener('click', () => {
                console.log('🎯 Abrindo modal do mentor IA');
                modal.classList.remove('hidden');
                document.body.style.overflow = 'hidden';

                // Inicializar o chat se ainda não foi inicializado
                this.initializeMentorChat();
            });
        }

        if (closeButton) {
            closeButton.addEventListener('click', () => this.closeMentorModal());
        }

        if (backdrop) {
            backdrop.addEventListener('click', () => this.closeMentorModal());
        }

        if (resetChat) {
            resetChat.addEventListener('click', () => {
                this.resetChat();
            });
        }

        // Fechar com ESC
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
                this.closeMentorModal();
            }
        });

        // Configurar input do chat
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');

        if (messageInput && sendButton) {
            messageInput.addEventListener('input', (e) => {
                sendButton.disabled = !e.target.value.trim();
            });

            messageInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && !sendButton.disabled) {
                    this.sendChatMessage();
                }
            });

            sendButton.addEventListener('click', () => {
                this.sendChatMessage();
            });
        }
    }

    closeMentorModal() {
        const modal = document.getElementById('mentor-modal');
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    }

    resetChat() {
        const conversationArea = document.getElementById('conversation-area');
        if (conversationArea) {
            conversationArea.innerHTML = '';
            this.showWelcomeMessage();
        }
    }

    // ✅ INICIALIZAR MENTOR BOT
    initializeMentorBot() {
        console.log('🤖 Inicializando IA Mentor...');

        // Verificar se o usuário é novo para destacar o mentor
        const isNewUser = !localStorage.getItem('user_onboarding_complete');

        if (isNewUser) {
            // Mostrar prompt para novo usuário
            setTimeout(() => {
                this.showNewUserPrompt();
            }, 2000);
        }
    }

    // ✅ INICIALIZAR CHAT DO MENTOR
    initializeMentorChat() {
        console.log('💬 Inicializando chat do mentor...');

        // Mostrar mensagem de boas-vindas se for a primeira vez
        const conversationArea = document.getElementById('conversation-area');
        if (conversationArea && conversationArea.children.length === 0) {
            this.showWelcomeMessage();
        }
    }

    // ✅ MENSAGEM DE BOAS-VINDAS DO CHAT
    showWelcomeMessage() {
        const conversationArea = document.getElementById('conversation-area');
        if (!conversationArea) return;

        const welcomeMessage = `
              <div class="flex items-end gap-3">
                <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 h-8 shrink-0 flex items-center justify-center bg-primary/20">
                  <span class="material-symbols-outlined text-primary text-xl">smart_toy</span>
                </div>
                <div class="flex flex-1 flex-col gap-1 items-start">
                  <div class="text-base font-normal leading-relaxed max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg rounded-bl-none px-4 py-3 bg-surface-light dark:bg-surface-dark text-text-main dark:text-text-main-dark shadow-sm message-animation">
                    <p class="chat-message">Olá! 👋 Eu sou o <strong>FIN</strong>, seu mentor de onboarding inteligente!</p>
                    <p class="chat-message mt-2">Estou aqui para te conhecer melhor e te guiar para o caminho ideal de crescimento. Posso te ajudar com:</p>
                    <ul class="chat-list">
                      <li>🎯 <strong>Definição de metas</strong> financeiras</li>
                      <li>📚 <strong>Recomendações</strong> de conteúdo</li>
                      <li>👥 <strong>Conexão</strong> com mentores especializados</li>
                      <li>📊 <strong>Acompanhamento</strong> do seu progresso</li>
                    </ul>
                    <p class="chat-message mt-2">Por onde você gostaria de começar? 😊</p>
                  </div>
                  <span class="text-xs text-text-secondary dark:text-text-secondary-dark">Agora</span>
                </div>
              </div>
            `;

        conversationArea.innerHTML = welcomeMessage;
        conversationArea.scrollTop = conversationArea.scrollHeight;
    }

    // ✅ ENVIAR MENSAGEM NO CHAT (com OpenAI via backend)
    async sendChatMessage() {
        const messageInput = document.getElementById('message-input');
        const sendButton = document.getElementById('send-button');
        const conversationArea = document.getElementById('conversation-area');

        if (!messageInput || !sendButton || !conversationArea) return;

        const message = messageInput.value.trim();
        if (!message) return;

        // Adicionar mensagem do usuário
        const userMessage = `
        <div class="flex items-end gap-3 justify-end">
            <div class="flex flex-1 flex-col gap-1 items-end">
                <div class="text-base font-normal leading-relaxed max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg rounded-br-none px-4 py-3 bg-primary text-white shadow-sm message-animation">
                    <p class="chat-message">${this.escapeHtml(message)}</p>
                </div>
                <span class="text-xs text-text-secondary dark:text-text-secondary-dark">Agora</span>
            </div>
            <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 h-8 shrink-0 flex items-center justify-center bg-primary text-white font-bold text-sm">
                ${this.getUserInitials()}
            </div>
        </div>
    `;

        conversationArea.innerHTML += userMessage;
        messageInput.value = '';
        sendButton.disabled = true;
        conversationArea.scrollTop = conversationArea.scrollHeight;

        // Mostrar indicador de digitação
        this.showTypingIndicator();

        try {
            // 🔗 Chamada ao backend que fala com a OpenAI
            const response = await fetch('http://localhost:5000/api/chatMentor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pergunta: message }), // 👈 Alterado aqui para usar "pergunta"
            });

            const data = await response.json();
            this.hideTypingIndicator();
            sendButton.disabled = false;

            if (data.success) {
                this.showBotResponse(data.message); // Bot real com OpenAI
            } else {
                this.showBotResponse("Desculpe, tive um problema ao processar sua mensagem. 😅");
            }

        } catch (error) {
            console.error('Erro ao conectar com o mentor:', error);
            this.hideTypingIndicator();
            sendButton.disabled = false;
            this.showBotResponse("Opa, parece que o servidor está fora do ar. Tenta novamente em alguns minutos. ⚙️");
        }
    }

    // ✅ ESCAPAR HTML PARA SEGURANÇA
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ✅ OBTER INICIAIS DO USUÁRIO (USANDO SISTEMA DE AVATAR)
    getUserInitials() {
        if (!this.currentUser) return 'U';
        const first = this.currentUser.firstName ? this.currentUser.firstName[0] : 'U';
        const last = this.currentUser.lastName ? this.currentUser.lastName[0] : '';
        return (first + last).toUpperCase();
    }

    // ✅ MOSTRAR INDICADOR DE DIGITAÇÃO
    showTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.classList.remove('hidden');
            const conversationArea = document.getElementById('conversation-area');
            if (conversationArea) {
                conversationArea.scrollTop = conversationArea.scrollHeight;
            }
        }
    }

    // ✅ OCULTAR INDICADOR DE DIGITAÇÃO
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typing-indicator');
        if (typingIndicator) {
            typingIndicator.classList.add('hidden');
        }
    }

    // ✅ MOSTRAR RESPOSTA DO BOT (com efeito de digitação)
    showBotResponse(responseText) {
        const conversationArea = document.getElementById('conversation-area');
        if (!conversationArea) return;

        // Evita injeção de HTML
        const safeText = this.escapeHtml(responseText);

        // Estrutura do bot (com span vazio para digitação)
        const botMessage = document.createElement('div');
        botMessage.className = 'flex items-end gap-3 animate-fadeIn';
        botMessage.innerHTML = `
        <div class="bg-center bg-no-repeat aspect-square bg-cover rounded-full w-8 h-8 shrink-0 flex items-center justify-center bg-primary/20">
            <span class="material-symbols-outlined text-primary text-xl">smart_toy</span>
        </div>
        <div class="flex flex-1 flex-col gap-1 items-start">
            <div class="text-base font-normal leading-relaxed max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg rounded-bl-none px-4 py-3 bg-surface-light dark:bg-surface-dark text-text-main dark:text-text-main-dark shadow-sm message-animation">
                <p class="chat-message typing-text"></p>
            </div>
            <span class="text-xs text-text-secondary dark:text-text-secondary-dark">Agora</span>
        </div>
    `;
        conversationArea.appendChild(botMessage);
        conversationArea.scrollTop = conversationArea.scrollHeight;

        // Efeito de digitação
        const typingElement = botMessage.querySelector('.typing-text');
        let i = 0;

        const typingSpeed = 30; // ms por caractere

        const typeInterval = setInterval(() => {
            if (i < safeText.length) {
                typingElement.innerHTML += safeText[i];
                i++;
                conversationArea.scrollTop = conversationArea.scrollHeight; // mantém scroll no fim
            } else {
                clearInterval(typeInterval);
            }
        }, typingSpeed);
    }

    // ✅ PROMPT PARA NOVO USUÁRIO
    showNewUserPrompt() {
        const prompt = document.createElement('div');
        prompt.className = 'fixed bottom-20 right-6 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 max-w-sm z-50 border border-gray-200 dark:border-gray-700';
        prompt.style.animation = 'fadeInUp 0.3s ease-out';
        prompt.innerHTML = `
              <div class="flex items-start gap-3">
                <div class="w-10 h-10 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
                <div class="flex-1">
                  <h4 class="font-semibold text-gray-800 dark:text-white">Conheça o FIN Mentor</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-300 mt-1">Seu assistente IA para te guiar na plataforma</p>
                  <div class="flex gap-2 mt-3">
                    <button id="try-mentor" class="flex-1 bg-primary text-white text-sm py-2 px-3 rounded-lg hover:bg-orange-600 transition-colors">
                      Experimentar
                    </button>
                    <button id="dismiss-mentor" class="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white text-sm py-2 px-3 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors">
                      Depois
                    </button>
                  </div>
                </div>
              </div>
            `;

        document.body.appendChild(prompt);

        // Event listeners para os botões
        document.getElementById('try-mentor').addEventListener('click', () => {
            document.getElementById('open-mentor-modal').click();
            prompt.remove();
            localStorage.setItem('user_onboarding_complete', 'true');
        });

        document.getElementById('dismiss-mentor').addEventListener('click', () => {
            prompt.remove();
            localStorage.setItem('user_onboarding_complete', 'true');
        });

        // Auto-remover após 10 segundos
        setTimeout(() => {
            if (prompt.parentNode) {
                prompt.remove();
            }
        }, 10000);
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

    // Inicializar dashboard
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