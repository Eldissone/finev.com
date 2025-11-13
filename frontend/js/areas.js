class AreasMentoriaPage {
    constructor() {
        this.authService = new AuthService();
        this.currentUser = null;
        this.userPlan = 'basic';
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Iniciando página de áreas de mentoria...');
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

            // ✅ ATUALIZAR UI COM DADOS DO USUÁRIO
            this.updateUserInfo();

            this.updateUI();
            this.setupEventListeners();

            this.showLoading(false);
            this.showContent(true);
            console.log('✅ Página de áreas carregada com sucesso!');

        } catch (error) {
            console.error('💥 Erro na página de áreas:', error);
            this.showError('Erro ao carregar áreas de mentoria');
            this.showLoading(false);
        }
    }

    async checkAuth() {
        console.log('🔐 Verificando autenticação...');

        const token = localStorage.getItem('fin_token');
        console.log('Token no localStorage:', token ? 'EXISTE' : 'NÃO EXISTE');

        if (!token) {
            console.log('❌ Nenhum token encontrado');
            return false;
        }

        try {
            console.log('🔄 Buscando perfil do usuário...');
            // ✅ USAR O MÉTODO DO AuthService PARA GARANTIR CONSISTÊNCIA
            const profile = await this.authService.getProfile();
            console.log('Resposta do profile:', profile);

            if (profile.success) {
                // ✅ CORRIGIR A ESTRUTURA DE DADOS
                this.currentUser = profile.data.user || profile.data;
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

    async loadUserData() {
        try {
            // Se currentUser ainda não foi carregado, carregar do localStorage
            if (!this.currentUser) {
                const userData = JSON.parse(localStorage.getItem('fin_user') || '{}');
                this.currentUser = userData;
            }

            // Definir plano baseado no usuário
            if (this.currentUser) {
                this.userPlan = this.currentUser.plan || 'basic';
            } else {
                this.userPlan = 'basic';
            }

            console.log(`📋 Plano do usuário: ${this.userPlan}`);

        } catch (error) {
            console.error('❌ Erro ao carregar dados do usuário:', error);
            throw error;
        }
    }

    // ✅ ATUALIZAR INFORMAÇÕES DO USUÁRIO (MÉTODO CORRIGIDO)
    updateUserInfo() {
        // Garantir que temos os dados mais recentes
        const user = this.currentUser;

        if (!user) {
            console.log('❌ Nenhum usuário para atualizar UI');
            // Tentar carregar do localStorage como fallback
            const savedUser = localStorage.getItem('fin_user');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                this.updateUserInfo(); // Recursão com dados do localStorage
            }
            return;
        }

        console.log('👤 Atualizando informações do usuário:', user);

        // Nome do usuário no header
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            const firstName = user.firstName || user.name || 'Usuário';
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

        // Título da página
        const pageTitle = document.getElementById('page-title');
        if (pageTitle) {
            const userName = user.firstName || user.name || 'Usuário';
            pageTitle.textContent = `Áreas de Mentoria - ${userName}`;
            console.log('✅ Título da página:', pageTitle.textContent);
        }
    }

    // ✅ SISTEMA DE AVATAR COMPLETO (MESMO PADRÃO DAS OUTRAS PÁGINAS)
    updateAvatar(avatarUrl, user) {
        const avatarElement = document.getElementById('user-avatar');
        if (!avatarElement) return;

        const userInitials = (user.firstName?.[0] || 'U') + (user.lastName?.[0] || '');

        console.log('🖼️ Atualizando avatar nas áreas...');
        console.log('📁 Avatar URL recebida:', avatarUrl);

        // 🥇 PRIORIDADE 1: Base64 salvo localmente
        const base64Avatar = localStorage.getItem('user_avatar_base64');
        if (base64Avatar) {
            console.log('🖼️ Usando avatar base64 local nas áreas');
            avatarElement.innerHTML = `<img src="${base64Avatar}" alt="Avatar" class="w-8 h-8 rounded-full object-cover">`;
            return;
        }

        // 🥈 PRIORIDADE 2: URL do servidor (COM CORREÇÃO DA URL)
        if (avatarUrl) {
            console.log('🖼️ Tentando avatar do servidor nas áreas:', avatarUrl);

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
                console.log('✅ Imagem do servidor carregou com sucesso nas áreas');
                avatarElement.innerHTML = `<img src="${fullAvatarUrl}" alt="Avatar" class="w-8 h-8 rounded-full object-cover">`;
            };

            testImage.onerror = () => {
                console.log('❌ Imagem do servidor falhou nas áreas, usando iniciais');
                avatarElement.innerHTML = `<span class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">${userInitials}</span>`;
            };

            testImage.src = `${fullAvatarUrl}?t=${Date.now()}`;

            // ⏰ TIMEOUT DE SEGURANÇA
            setTimeout(() => {
                if (!testImage.complete) {
                    console.log('⏰ Timeout - imagem não carregou a tempo nas áreas');
                    avatarElement.innerHTML = `<span class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">${userInitials}</span>`;
                }
            }, 3000);
            return;
        }

        // 🥉 PRIORIDADE 3: Avatar URL salvo localmente
        const localAvatar = localStorage.getItem('user_avatar');
        if (localAvatar) {
            console.log('🖼️ Usando avatar URL local nas áreas:', localAvatar);

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
        console.log('🖼️ Nenhum avatar disponível nas áreas, usando iniciais');
        avatarElement.innerHTML = `<span class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">${userInitials}</span>`;
    }

    updateUI() {
        // ✅ GARANTIR QUE updateUserInfo FOI CHAMADO PRIMEIRO
        if (!this.currentUser) {
            console.log('⚠️ Tentando atualizar UI sem dados do usuário');
            return;
        }

        this.updatePlanInfo();
        this.setupAreaAccess();

        console.log('✅ UI atualizada com sucesso');
    }

    updatePlanInfo() {
        const planInfo = {
            basic: {
                name: 'Plano BÁSICO',
                description: 'Acesso à área FIN',
                available: 1,
                total: 6,
                progress: 17
            },
            pro: {
                name: 'Plano PRO',
                description: 'Acesso às áreas FIN, TECH e AGRO',
                available: 3,
                total: 6,
                progress: 50
            },
            premium: {
                name: 'Plano PREMIUM',
                description: 'Acesso a todas as áreas',
                available: 6,
                total: 6,
                progress: 100
            }
        };

        const info = planInfo[this.userPlan];

        document.getElementById('user-plan').textContent = info.name;
        document.getElementById('plan-description').textContent = info.description;
        document.getElementById('available-areas').textContent = `${info.available}/${info.total}`;
        document.getElementById('plan-progress').style.width = `${info.progress}%`;
    }

    setupAreaAccess() {
        const areas = {
            'tech-area': ['pro', 'premium'],
            'biz-area': ['premium'],
            'agro-area': ['pro', 'premium'],
            'life-area': ['premium'],
            'health-area': ['premium']
        };

        // Para cada área, verificar se o usuário tem acesso
        Object.entries(areas).forEach(([areaId, allowedPlans]) => {
            const areaElement = document.getElementById(areaId);
            const lockElement = document.getElementById(areaId.replace('area', 'lock'));

            if (allowedPlans.includes(this.userPlan)) {
                // Usuário tem acesso - transformar em link
                const areaName = areaId.split('-')[0].toUpperCase();
                areaElement.innerHTML = areaElement.innerHTML.replace(
                    '<div class="relative w-full overflow-hidden rounded-xl">',
                    `<a href="../mentores/?area=${areaName}" class="block"><div class="relative w-full overflow-hidden rounded-xl border-2 border-primary">`
                ).replace('</div>', '</div></a>');

                // Remover overlay de bloqueio
                if (lockElement) {
                    lockElement.style.display = 'none';
                }

                // Atualizar badge para "Incluído"
                const badge = areaElement.querySelector('.absolute.top-2.right-2 span');
                if (badge) {
                    badge.className = 'bg-success text-white text-xs px-2 py-1 rounded-full font-medium';
                    badge.textContent = 'Incluído';
                }
            } else {
                // Usuário não tem acesso - manter bloqueado
                if (lockElement) {
                    lockElement.style.opacity = '0';
                    lockElement.style.display = 'flex';
                }
            }
        });
    }

    setupEventListeners() {
        console.log('🔗 Configurando event listeners...');

        // Adicionar event listeners para áreas bloqueadas
        document.querySelectorAll('[id$="-area"]').forEach(area => {
            if (!area.querySelector('a')) {
                area.addEventListener('click', (e) => {
                    e.preventDefault();
                    const lockElement = area.querySelector('[id$="-lock"]');
                    if (lockElement) {
                        lockElement.style.opacity = '1';
                        setTimeout(() => {
                            lockElement.style.opacity = '0';
                        }, 3000);
                    }
                });
            }
        });

        // Adicionar listener para logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                console.log('🚪 Logout solicitado');
                if (confirm('Tem certeza que deseja sair?')) {
                    this.authService.logout();
                }
            });
        }

        // Adicionar listener para tema
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Adicionar listeners para botões de upgrade
        document.querySelectorAll('.upgrade-plan-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showUpgradeModal();
            });
        });
    }

    showUpgradeModal() {
        const modalHtml = `
            <div id="upgrade-modal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white dark:bg-[#333333] rounded-xl p-6 max-w-md w-full mx-4">
                    <div class="flex justify-between items-center mb-4">
                        <h3 class="text-xl font-bold text-text-main dark:text-white">Atualizar Plano</h3>
                        <button onclick="this.closeUpgradeModal()" class="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
                            <span class="material-symbols-outlined">close</span>
                        </button>
                    </div>
                    
                    <p class="text-slate-600 dark:text-slate-300 mb-4">
                        Para acessar todas as áreas de mentoria, atualize para o plano <strong>PREMIUM</strong>.
                    </p>
                    
                    <div class="space-y-3">
                        <div class="flex items-center text-sm text-slate-600 dark:text-slate-300">
                            <span class="material-symbols-outlined text-success mr-2 text-sm">check_circle</span>
                            Acesso a todas as 6 áreas de mentoria
                        </div>
                        <div class="flex items-center text-sm text-slate-600 dark:text-slate-300">
                            <span class="material-symbols-outlined text-success mr-2 text-sm">check_circle</span>
                            Mentores especializados em cada área
                        </div>
                        <div class="flex items-center text-sm text-slate-600 dark:text-slate-300">
                            <span class="material-symbols-outlined text-success mr-2 text-sm">check_circle</span>
                            Conteúdo exclusivo e atualizado
                        </div>
                    </div>
                    
                    <div class="flex space-x-3 mt-6">
                        <button onclick="this.closeUpgradeModal()" class="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-text-main dark:text-white rounded-lg font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            Depois
                        </button>
                        <button onclick="this.upgradeToPremium()" class="flex-1 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors">
                            Atualizar
                        </button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    closeUpgradeModal() {
        const modal = document.getElementById('upgrade-modal');
        if (modal) {
            modal.remove();
        }
    }

    upgradeToPremium() {
        this.showSuccess('Redirecionando para atualização de plano...');
        this.closeUpgradeModal();
        // Em produção, redirecionaria para página de checkout
        setTimeout(() => {
            window.location.href = '../planos/';
        }, 1500);
    }

    showLoading(show) {
        const loadingElement = document.getElementById('loading-state');
        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
        }
    }

    showContent(show) {
        const contentElement = document.getElementById('mentorias-content');
        if (contentElement) {
            contentElement.style.display = show ? 'block' : 'none';
        }
    }

    showError(message) {
        console.error('💥 Erro:', message);
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 fade-in';
        errorDiv.innerHTML = `
            <div class="flex items-center">
                <span class="material-symbols-outlined mr-2">error</span>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(errorDiv);

        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed top-4 right-4 bg-success text-white p-4 rounded-lg shadow-lg z-50 fade-in';
        successDiv.innerHTML = `
            <div class="flex items-center">
                <span class="material-symbols-outlined mr-2">check_circle</span>
                <span>${message}</span>
            </div>
        `;

        document.body.appendChild(successDiv);

        setTimeout(() => {
            if (successDiv.parentNode) {
                successDiv.parentNode.removeChild(successDiv);
            }
        }, 3000);
    }

    redirectToLogin() {
        console.log('🔄 Redirecionando para login...');
        setTimeout(() => {
            window.location.href = '../pages/login.html';
        }, 1500);
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

// ✅ INICIALIZAÇÃO
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM carregado, iniciando página de áreas...');

    // Inicializar página de áreas
    window.currentAreasPage = new AreasMentoriaPage();
});

// ✅ TEMA INICIAL
if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
}

// ✅ DEBUG HELPER
window.debugUser = () => {
    const areasPage = window.currentAreasPage;
    console.log('🔍 DEBUG USER DATA:');
    console.log('currentUser:', areasPage?.currentUser);
    console.log('userPlan:', areasPage?.userPlan);
    console.log('localStorage fin_user:', localStorage.getItem('fin_user'));
    console.log('localStorage fin_token:', localStorage.getItem('fin_token'));
    console.log('localStorage user_avatar_base64:', localStorage.getItem('user_avatar_base64') ? 'EXISTS' : 'NOT EXISTS');
    console.log('localStorage user_avatar:', localStorage.getItem('user_avatar'));
};

// ✅ ADICIONAR ANIMAÇÃO CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes fade-in {
        from { opacity: 0; transform: translateY(-10px); }
        to { opacity: 1; transform: translateY(0); }
    }
    .fade-in {
        animation: fade-in 0.3s ease-out;
    }
    
    @keyframes fadeInUp {
        from {
            opacity: 0;
            transform: translateY(20px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .area-card {
        transition: all 0.3s ease;
    }
    
    .area-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
    }
    
    .locked-area {
        position: relative;
        cursor: not-allowed;
    }
    
    .locked-area::after {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.5);
        border-radius: 0.75rem;
        transition: opacity 0.3s ease;
    }
`;
document.head.appendChild(style);