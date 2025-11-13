
// 🔥 CLASSE PRINCIPAL DA PÁGINA DE MENTORES
class MentoresPage {
    constructor() {
        this.authService = new AuthService();
        this.currentUser = null;
        this.mentoresData = [];
        this.filteredMentores = [];
        this.currentFilters = {
            area: 'all',
            expertise: 'all',
            plan: ['all', 'basic', 'pro', 'premium'],
            rating: 0,
            experience: ['junior', 'pleno', 'senior'],
            search: ''
        };
        this.currentPage = 1;
        this.mentoresPerPage = 9;
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Iniciando página de mentores...');
            this.showLoading(true);

            // ✅ VERIFICAÇÃO DE AUTENTICAÇÃO
            const isAuthenticated = await this.checkAuth();
            console.log('🔐 Resultado da autenticação:', isAuthenticated);

            if (!isAuthenticated) {
                console.log('❌ Não autenticado, redirecionando...');
                this.redirectToLogin();
                return;
            }

            // ✅ CARREGAR DADOS DOS MENTORES DA API
            await this.loadMentoresData();

            // ✅ ATUALIZAR UI
            this.updateUI();
            this.setupEventListeners();

            // ✅ ESCONDER LOADING E MOSTRAR CONTEÚDO
            this.showLoading(false);
            this.showContent(true);

            console.log('✅ Página de mentores carregada com sucesso');

        } catch (error) {
            console.error('💥 Erro ao carregar mentores:', error);
            this.showError('Erro ao carregar mentores');
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

    // ✅ SISTEMA DE AVATAR COMPLETO (MESMO PADRÃO DAS OUTRAS PÁGINAS)
    updateAvatar(avatarUrl, user) {
        const avatarElement = document.getElementById('header-avatar');
        if (!avatarElement) return;

        const userInitials = (user.firstName?.[0] || 'U') + (user.lastName?.[0] || '');

        console.log('🖼️ Atualizando avatar no header...');
        console.log('📁 Avatar URL recebida:', avatarUrl);

        // 🥇 PRIORIDADE 1: Base64 salvo localmente
        const base64Avatar = localStorage.getItem('user_avatar_base64');
        if (base64Avatar) {
            console.log('🖼️ Usando avatar base64 local no header');
            avatarElement.innerHTML = `<img src="${base64Avatar}" alt="Avatar" class="w-8 h-8 rounded-full object-cover">`;
            return;
        }

        // 🥈 PRIORIDADE 2: URL do servidor (COM CORREÇÃO DA URL)
        if (avatarUrl) {
            console.log('🖼️ Tentando avatar do servidor no header:', avatarUrl);

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
                console.log('✅ Imagem do servidor carregou com sucesso no header');
                avatarElement.innerHTML = `<img src="${fullAvatarUrl}" alt="Avatar" class="w-8 h-8 rounded-full object-cover">`;
            };

            testImage.onerror = () => {
                console.log('❌ Imagem do servidor falhou no header, usando iniciais');
                avatarElement.innerHTML = `<span class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">${userInitials}</span>`;
            };

            testImage.src = `${fullAvatarUrl}?t=${Date.now()}`;

            // ⏰ TIMEOUT DE SEGURANÇA
            setTimeout(() => {
                if (!testImage.complete) {
                    console.log('⏰ Timeout - imagem não carregou a tempo no header');
                    avatarElement.innerHTML = `<span class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">${userInitials}</span>`;
                }
            }, 3000);
            return;
        }

        // 🥉 PRIORIDADE 3: Avatar URL salvo localmente
        const localAvatar = localStorage.getItem('user_avatar');
        if (localAvatar) {
            console.log('🖼️ Usando avatar URL local no header:', localAvatar);

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
        console.log('🖼️ Nenhum avatar disponível no header, usando iniciais');
        avatarElement.innerHTML = `<span class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">${userInitials}</span>`;
    }

    logout() {
        this.authService.logout();
    }

    redirectToLogin() {
        console.log('🔄 Redirecionando para login...');
        setTimeout(() => {
            window.location.href = '../pages/login.html';
        }, 1500);
    }

    showLoading(show) {
        const loadingElement = document.getElementById('loading-state');
        const contentElement = document.getElementById('mentores-content');

        if (loadingElement) {
            loadingElement.style.display = show ? 'flex' : 'none';
        }
        if (contentElement) {
            contentElement.style.display = show ? 'none' : 'block';
        }
    }

    showContent(show) {
        const contentElement = document.getElementById('mentores-content');
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

    // ✅ CARREGAR DADOS DOS MENTORES DA API
    async loadMentoresData() {
        try {
            console.log('📊 Carregando dados dos mentores da API...');

            const token = localStorage.getItem('fin_token');
            const headers = token ? { 'Authorization': `Bearer ${token}` } : {};

            const response = await fetch('http://localhost:5000/api/mentors', {
                headers: headers
            });

            if (response.ok) {
                const data = await response.json();
                this.mentoresData = data.data || [];
                console.log('✅ Mentores carregados da API:', this.mentoresData.length);
            } else {
                console.log('⚠️ API não disponível, usando dados mock');
                this.mentoresData = await this.getMockMentoresData();
            }

            this.filteredMentores = [...this.mentoresData];

        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            console.log('🔄 Usando dados mock como fallback');
            this.mentoresData = await this.getMockMentoresData();
            this.filteredMentores = [...this.mentoresData];
        }
    }

    // ✅ DADOS MOCK PARA FALLBACK
    async getMockMentoresData() {
        return [
            {
                id: 1,
                name: 'Carlos Mendes',
                role: 'Analista Sênior de Investimentos',
                company: 'XP Investimentos',
                area: 'FIN',
                expertise: ['investimentos', 'mercado financeiro', 'análise técnica'],
                rating: 4.8,
                reviews: 127,
                experience: '12 anos',
                price: 150,
                plan: 'basic',
                available: true,
                avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
                description: 'Especialista em análise de investimentos e gestão de carteiras. Mais de 10 anos de experiência no mercado financeiro.',
                languages: ['Português', 'Inglês'],
                specialties: ['Ações', 'Fundos Imobiliários', 'Renda Fixa']
            },
            {
                id: 2,
                name: 'Ana Silva',
                role: 'Gestora de Carteiras',
                company: 'BTG Pactual',
                area: 'FIN',
                expertise: ['gestão de carteiras', 'wealth management', 'planejamento financeiro'],
                rating: 4.9,
                reviews: 89,
                experience: '8 anos',
                price: 200,
                plan: 'pro',
                available: true,
                avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
                description: 'Especialista em gestão de patrimônio e planejamento financeiro pessoal e familiar.',
                languages: ['Português', 'Inglês', 'Espanhol'],
                specialties: ['Wealth Management', 'Planejamento Sucessório', 'Investimentos Internacionais']
            },
            {
                id: 3,
                name: 'Roberto Almeida',
                role: 'Especialista em Ações',
                company: 'Warren Brasil',
                area: 'FIN',
                expertise: ['análise fundamentalista', 'valuation', 'mercado de ações'],
                rating: 4.7,
                reviews: 156,
                experience: '15 anos',
                price: 180,
                plan: 'premium',
                available: false,
                avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
                description: 'Analista fundamentalista com vasta experiência em valuation de empresas e mercado acionário.',
                languages: ['Português', 'Inglês'],
                specialties: ['Valuation', 'Análise Fundamentalista', 'Empresas Listadas']
            },
            {
                id: 4,
                name: 'Mariana Costa',
                role: 'CTO & Tech Lead',
                company: 'Google',
                area: 'TECH',
                expertise: ['arquitetura de software', 'cloud computing', 'gestão de equipes'],
                rating: 4.9,
                reviews: 203,
                experience: '10 anos',
                price: 250,
                plan: 'premium',
                available: true,
                avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
                description: 'Líder técnica com experiência em scaling de startups e arquitetura de sistemas distribuídos.',
                languages: ['Português', 'Inglês'],
                specialties: ['Arquitetura Cloud', 'Scaling', 'Liderança Técnica']
            }
        ];
    }

    // ✅ ATUALIZAR INTERFACE
    updateUI() {
        console.log('🎨 Atualizando interface...');
        console.log('👤 Dados do usuário para UI:', this.currentUser);

        this.updateUserInfo();
        this.updateStats();
        this.updateAreas();
        this.updateMentoresList();
    }

    // ✅ ATUALIZAR INFORMAÇÕES DO USUÁRIO (SISTEMA ATUALIZADO)
    updateUserInfo() {
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
        const userNameElement = document.getElementById('header-name');
        if (userNameElement) {
            const firstName = user.firstName || user.name || 'Usuário';
            const lastName = user.lastName || '';
            const userName = `${firstName} ${lastName}`.trim();
            userNameElement.textContent = userName;
            console.log('✅ Nome no header:', userName);
        }

        // Avatar do usuário - SISTEMA ATUALIZADO
        const userAvatarElement = document.getElementById('header-avatar');
        if (userAvatarElement) {
            this.updateAvatar(user.avatarUrl, user);
            console.log('✅ Avatar atualizado');
        }
    }

    // ✅ ATUALIZAR ESTATÍSTICAS
    updateStats() {
        const total = this.mentoresData.length;
        const available = this.mentoresData.filter(m => m.available).length;
        const pro = this.mentoresData.filter(m => m.plan === 'pro').length;
        const premium = this.mentoresData.filter(m => m.plan === 'premium').length;

        document.getElementById('total-mentors').textContent = total;
        document.getElementById('available-now').textContent = available;
        document.getElementById('pro-mentors').textContent = pro;
        document.getElementById('premium-mentors').textContent = premium;
    }

    // ✅ ATUALIZAR ÁREAS
    updateAreas() {
        const areas = {
            'FIN': { name: 'Finanças, Inovação e Negócio', color: 'from-primary to-orange-400', mentors: this.mentoresData.filter(m => m.area === 'FIN').length },
            'TECH': { name: 'Tecnologia & Inovação', color: 'from-blue-500 to-cyan-400', mentors: this.mentoresData.filter(m => m.area === 'TECH').length },
            'BIZ': { name: 'Business & Empreendedorismo', color: 'from-green-500 to-emerald-400', mentors: this.mentoresData.filter(m => m.area === 'BIZ').length },
            'AGRO': { name: 'Agronegócio & Sustentabilidade', color: 'from-yellow-500 to-amber-400', mentors: this.mentoresData.filter(m => m.area === 'AGRO').length },
            'LIFE': { name: 'Desenvolvimento Pessoal', color: 'from-purple-500 to-pink-400', mentors: this.mentoresData.filter(m => m.area === 'LIFE').length },
            'HEALTH': { name: 'Saúde & Bem-estar', color: 'from-red-500 to-rose-400', mentors: this.mentoresData.filter(m => m.area === 'HEALTH').length }
        };

        const container = document.getElementById('areas-grid');
        container.innerHTML = Object.entries(areas).map(([code, area]) => `
          <div class="bg-gradient-to-r ${area.color} rounded-xl p-4 text-white cursor-pointer hover:scale-105 transition-transform duration-200" onclick="mentoresPage.filterByArea('${code}')">
            <h4 class="text-lg font-bold mb-1">${code}</h4>
            <p class="text-sm text-white/80 mb-2">${area.name}</p>
            <div class="flex justify-between items-center">
              <span class="text-xs bg-white/20 px-2 py-1 rounded-full">${area.mentors} mentores</span>
              <span class="material-symbols-outlined text-sm">arrow_forward</span>
            </div>
          </div>
        `).join('');
    }

    // ✅ ATUALIZAR LISTA DE MENTORES
    updateMentoresList() {
        const container = document.getElementById('mentors-grid');
        const startIndex = (this.currentPage - 1) * this.mentoresPerPage;
        const endIndex = startIndex + this.mentoresPerPage;
        const currentMentores = this.filteredMentores.slice(startIndex, endIndex);

        document.getElementById('mentors-count').textContent = `${this.filteredMentores.length} mentores encontrados`;

        if (currentMentores.length === 0) {
            container.innerHTML = `
            <div class="col-span-full text-center py-12">
              <span class="material-symbols-outlined text-4xl text-slate-400 mb-4">search_off</span>
              <h3 class="text-lg font-medium text-text-main dark:text-white mb-2">Nenhum mentor encontrado</h3>
              <p class="text-slate-600 dark:text-slate-400">Tente ajustar os filtros ou buscar por outros termos.</p>
            </div>
          `;
            return;
        }

        container.innerHTML = currentMentores.map(mentor => `
          <div class="mentor-card bg-white dark:bg-[#333333] rounded-xl p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <!-- Header do Mentor -->
            <div class="flex items-start justify-between mb-4">
              <div class="flex items-center space-x-3">
                <img src="${mentor.avatar}" alt="${mentor.name}" class="w-12 h-12 rounded-full object-cover">
                <div>
                  <h3 class="font-bold text-text-main dark:text-white">${mentor.name}</h3>
                  <p class="text-sm text-slate-600 dark:text-slate-400">${mentor.role}</p>
                </div>
              </div>
              <span class="flex items-center ${mentor.plan === 'premium' ? 'bg-premium/10 text-premium' : mentor.plan === 'pro' ? 'bg-pro/10 text-pro' : 'bg-primary/10 text-primary'} text-xs px-2 py-1 rounded-full font-medium">
                ${mentor.plan.toUpperCase()}
              </span>
            </div>

            <!-- Informações -->
            <div class="space-y-3 mb-4">
              <div class="flex items-center justify-between">
                <div class="flex items-center">
                  <span class="material-symbols-outlined text-yellow-400 text-sm mr-1">star</span>
                  <span class="text-sm font-medium text-text-main dark:text-white">${mentor.rating}</span>
                  <span class="text-xs text-slate-500 dark:text-slate-400 ml-1">(${mentor.reviews})</span>
                </div>
                <div class="flex items-center ${mentor.available ? 'text-success' : 'text-red-500'}">
                  <span class="material-symbols-outlined text-sm mr-1">${mentor.available ? 'check_circle' : 'cancel'}</span>
                  <span class="text-xs">${mentor.available ? 'Disponível' : 'Indisponível'}</span>
                </div>
              </div>

              <div class="flex items-center text-sm text-slate-600 dark:text-slate-400">
                <span class="material-symbols-outlined text-sm mr-1">business</span>
                ${mentor.company}
              </div>

              <div class="flex items-center text-sm text-slate-600 dark:text-slate-400">
                <span class="material-symbols-outlined text-sm mr-1">schedule</span>
                ${mentor.experience} de experiência
              </div>
            </div>

            <!-- Área e Especialidades -->
            <div class="mb-4">
              <div class="flex flex-wrap gap-1 mb-2">
                <span class="bg-primary/10 text-primary text-xs px-2 py-1 rounded-full">${mentor.area}</span>
                ${mentor.expertise.slice(0, 2).map(exp => `
                  <span class="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs px-2 py-1 rounded-full">${exp}</span>
                `).join('')}
                ${mentor.expertise.length > 2 ? `<span class="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs px-2 py-1 rounded-full">+${mentor.expertise.length - 2}</span>` : ''}
              </div>
            </div>

            <!-- Descrição -->
            <p class="text-sm text-slate-600 dark:text-slate-400 mb-4 line-clamp-2">${mentor.description}</p>

            <!-- Ações -->
            <div class="flex items-center justify-between">
              <div class="text-lg font-bold text-primary">R$ ${mentor.price}/h</div>
              <div class="flex space-x-2">
                <button class="p-2 text-slate-400 hover:text-primary transition-colors" title="Favoritar" onclick="mentoresPage.toggleFavorite(${mentor.id})">
                  <span class="material-symbols-outlined text-sm">favorite</span>
                </button>
                <button onclick="mentoresPage.viewMentorProfile(${mentor.id})" class="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors">
                  Ver Perfil
                </button>
              </div>
            </div>
          </div>
        `).join('');

        // Atualizar paginação
        this.updatePagination();
    }

    // ✅ ATUALIZAR PAGINAÇÃO
    updatePagination() {
        const totalPages = Math.ceil(this.filteredMentores.length / this.mentoresPerPage);
        const container = document.getElementById('pagination');

        if (totalPages <= 1) {
            container.innerHTML = '';
            return;
        }

        let paginationHTML = '';

        // Botão anterior
        if (this.currentPage > 1) {
            paginationHTML += `
            <button onclick="mentoresPage.changePage(${this.currentPage - 1})" class="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">
              <span class="material-symbols-outlined text-sm">chevron_left</span>
            </button>
          `;
        }

        // Páginas
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `
              <button class="p-2 rounded-lg bg-primary text-white font-medium">${i}</button>
            `;
            } else {
                paginationHTML += `
              <button onclick="mentoresPage.changePage(${i})" class="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">${i}</button>
            `;
            }
        }

        // Botão próximo
        if (this.currentPage < totalPages) {
            paginationHTML += `
            <button onclick="mentoresPage.changePage(${this.currentPage + 1})" class="p-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700">
              <span class="material-symbols-outlined text-sm">chevron_right</span>
            </button>
          `;
        }

        container.innerHTML = paginationHTML;
    }

    // ✅ FILTRAR POR ÁREA
    filterByArea(area) {
        document.getElementById('area-filter').value = area;
        this.applyFilters();
    }

    // ✅ APLICAR FILTROS
    applyFilters() {
        // Coletar filtros
        this.currentFilters.area = document.getElementById('area-filter').value;
        this.currentFilters.expertise = document.getElementById('expertise-filter').value;
        this.currentFilters.search = document.getElementById('search-mentors').value.toLowerCase();

        // Coletar checkboxes de plano
        const planCheckboxes = document.querySelectorAll('input[name="plan"]:checked');
        this.currentFilters.plan = Array.from(planCheckboxes).map(cb => cb.value);

        // Coletar radio de avaliação
        const ratingRadio = document.querySelector('input[name="rating"]:checked');
        this.currentFilters.rating = parseFloat(ratingRadio.value);

        // Coletar checkboxes de experiência
        const expCheckboxes = document.querySelectorAll('input[name="experience"]:checked');
        this.currentFilters.experience = Array.from(expCheckboxes).map(cb => cb.value);

        // Aplicar filtros
        this.filteredMentores = this.mentoresData.filter(mentor => {
            // Filtro de área
            if (this.currentFilters.area !== 'all' && mentor.area !== this.currentFilters.area) {
                return false;
            }

            // Filtro de especialidade
            if (this.currentFilters.expertise !== 'all' && !mentor.expertise.includes(this.currentFilters.expertise)) {
                return false;
            }

            // Filtro de plano
            if (!this.currentFilters.plan.includes('all') && !this.currentFilters.plan.includes(mentor.plan)) {
                return false;
            }

            // Filtro de avaliação
            if (this.currentFilters.rating > 0 && mentor.rating < this.currentFilters.rating) {
                return false;
            }

            // Filtro de experiência
            let expMatch = false;
            if (this.currentFilters.experience.includes('junior') && mentor.experience.includes('até 3')) expMatch = true;
            if (this.currentFilters.experience.includes('pleno') && mentor.experience.includes('3-7')) expMatch = true;
            if (this.currentFilters.experience.includes('senior') && mentor.experience.includes('+')) expMatch = true;
            if (!expMatch) return false;

            // Filtro de busca
            if (this.currentFilters.search && !mentor.name.toLowerCase().includes(this.currentFilters.search) &&
                !mentor.role.toLowerCase().includes(this.currentFilters.search) &&
                !mentor.expertise.some(exp => exp.includes(this.currentFilters.search))) {
                return false;
            }

            return true;
        });

        this.currentPage = 1;
        this.updateMentoresList();
    }

    // ✅ MUDAR PÁGINA
    changePage(page) {
        this.currentPage = page;
        this.updateMentoresList();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ✅ VER PERFIL DO MENTOR
    viewMentorProfile(mentorId) {
        window.location.href = `../mentor/${mentorId}/`;
    }

    // ✅ FAVORITAR MENTOR
    async toggleFavorite(mentorId) {
        try {
            const token = localStorage.getItem('fin_token');
            const response = await fetch(`http://localhost:5000/api/mentors/${mentorId}/favorite`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                this.showSuccess(data.message || 'Mentor favoritado com sucesso!');
            } else {
                this.showError('Erro ao favoritar mentor');
            }
        } catch (error) {
            console.error('❌ Erro ao favoritar:', error);
            this.showSuccess('Mentor favoritado!'); // Fallback visual
        }
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

    // ✅ CONFIGURAR EVENT LISTENERS
    setupEventListeners() {
        console.log('🔗 Configurando event listeners...');

        // Logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            console.log('🚪 Logout solicitado');
            if (confirm('Tem certeza que deseja sair?')) {
                this.logout();
            }
        });

        // Tema
        document.getElementById('theme-toggle').addEventListener('click', () => this.toggleTheme());

        // Filtros
        document.getElementById('area-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('expertise-filter').addEventListener('change', () => this.applyFilters());
        document.getElementById('search-mentors').addEventListener('input', () => this.applyFilters());
        document.getElementById('apply-filters').addEventListener('click', () => this.applyFilters());

        // Checkboxes e radios
        document.querySelectorAll('input[name="plan"], input[name="rating"], input[name="experience"]').forEach(input => {
            input.addEventListener('change', () => this.applyFilters());
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
    console.log('✅ DOM carregado, iniciando página de mentores...');

    // Inicializar página de mentores
    window.mentoresPage = new MentoresPage();
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
    console.log('🔍 DEBUG USER DATA:');
    console.log('currentUser:', window.mentoresPage?.currentUser);
    console.log('localStorage fin_user:', localStorage.getItem('fin_user'));
    console.log('localStorage fin_token:', localStorage.getItem('fin_token'));
    console.log('localStorage user_avatar_base64:', localStorage.getItem('user_avatar_base64') ? 'EXISTS' : 'NOT EXISTS');
};
