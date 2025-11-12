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
            console.log('✅ Dashboard carregado com sucesso!');

        } catch (error) {
            console.error('💥 Erro no dashboard:', error);
            this.showError('Erro ao carregar dashboard');
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

        // Avatar do usuário
        const userAvatarElement = document.getElementById('user-avatar');
        if (userAvatarElement) {
            this.updateAvatar(user.avatarUrl, user);
            console.log('✅ Avatar atualizado');
        }

        // Título do dashboard
        const dashboardTitle = document.getElementById('dashboard-title');
        if (dashboardTitle) {
            const userName = user.firstName || user.name || 'Usuário';
            dashboardTitle.textContent = `Bem-vindo, ${userName}!`;
            console.log('✅ Título do dashboard:', dashboardTitle.textContent);
        }
    }

    // ✅ SISTEMA DE AVATAR ATUALIZADO
    updateAvatar(avatarUrl, user) {
        const avatarElement = document.getElementById('user-avatar');
        if (!avatarElement) return;

        const userInitials = (user.firstName?.[0] || 'U') + (user.lastName?.[0] || '');

        console.log('🖼️ Atualizando avatar no dashboard...');

        // PRIORIDADE 1: Base64 salvo localmente
        const base64Avatar = localStorage.getItem('user_avatar_base64');
        if (base64Avatar) {
            console.log('🖼️ Usando avatar base64 local no dashboard');
            avatarElement.innerHTML = `<img src="${base64Avatar}" alt="Avatar" class="w-8 h-8 rounded-full object-cover">`;
            return;
        }

        // PRIORIDADE 2: URL do servidor (com fallback robusto)
        if (avatarUrl) {
            console.log('🖼️ Tentando avatar do servidor no dashboard:', avatarUrl);

            // Criar uma imagem de teste para verificar se carrega
            const testImage = new Image();
            testImage.onload = () => {
                console.log('✅ Imagem do servidor carregou com sucesso no dashboard');
                avatarElement.innerHTML = `<img src="${avatarUrl}" alt="Avatar" class="w-8 h-8 rounded-full object-cover">`;
            };

            testImage.onerror = () => {
                console.log('❌ Imagem do servidor falhou no dashboard, usando iniciais');
                avatarElement.innerHTML = `<span>${userInitials}</span>`;
            };

            // Corrigir URL se necessário
            const fullAvatarUrl = avatarUrl.startsWith('http') ? avatarUrl : `http://localhost:5000/api${avatarUrl}`;
            testImage.src = `${fullAvatarUrl}?t=${Date.now()}`; // Adicionar timestamp para evitar cache

            // Timeout para fallback
            setTimeout(() => {
                if (!testImage.complete) {
                    console.log('⏰ Timeout - imagem não carregou a tempo no dashboard');
                    avatarElement.innerHTML = `<span>${userInitials}</span>`;
                }
            }, 3000);

            return;
        }

        // PRIORIDADE 3: Avatar URL salvo localmente (fallback antigo)
        const localAvatar = localStorage.getItem('user_avatar');
        if (localAvatar && localAvatar.startsWith('http')) {
            console.log('🖼️ Usando avatar URL local no dashboard:', localAvatar);

            const testImage = new Image();
            testImage.onload = () => {
                avatarElement.innerHTML = `<img src="${localAvatar}" alt="Avatar" class="w-8 h-8 rounded-full object-cover">`;
            };
            testImage.onerror = () => {
                avatarElement.innerHTML = `<span>${userInitials}</span>`;
            };
            testImage.src = `${localAvatar}?t=${Date.now()}`;

            return;
        }

        // FALLBACK FINAL: Iniciais
        console.log('🖼️ Nenhum avatar disponível no dashboard, usando iniciais');
        avatarElement.innerHTML = `<span>${userInitials}</span>`;
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
                this.authService.logout();
            });
        }
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
        // Implementar exibição de erro se necessário
        console.error('💥 Erro:', message);
    }

    redirectToLogin() {
        window.location.href = '../login/';
    }
}

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM carregado, iniciando areas...');

    new AreasMentoriaPage();
});

// Tema inicial - SEMPRE light por padrão
if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
} else {
    // Força tema light mesmo se o sistema for dark
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
}

// Debug helper
window.debugUser = () => {
    const areasPage = window.currentAreasPage;
    console.log('🔍 DEBUG USER DATA:');
    console.log('currentUser:', areasPage?.currentUser);
    console.log('userPlan:', areasPage?.userPlan);
    console.log('localStorage fin_user:', localStorage.getItem('fin_user'));
    console.log('localStorage fin_token:', localStorage.getItem('fin_token'));
    console.log('localStorage user_avatar_base64:', localStorage.getItem('user_avatar_base64') ? 'EXISTS' : 'NOT EXISTS');
};