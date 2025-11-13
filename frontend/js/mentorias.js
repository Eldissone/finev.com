class MentoriasPage {
    constructor() {
        this.authService = new AuthService();
        this.currentUser = null;
        this.mentoriasData = null;
        this.currentFilter = 'all';
        this.isMentor = false;
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Iniciando página de mentorias...');
            this.showLoading(true);

            // Verificar autenticação
            const isAuthenticated = await this.checkAuthentication();

            if (!isAuthenticated) {
                console.log('❌ Não autenticado, redirecionando...');
                this.redirectToLogin();
                return;
            }

            // Verificar se usuário é mentor
            await this.checkUserRole();

            // Carregar dados das mentorias
            await this.loadMentoriasData();

            // Atualizar UI
            this.updateUI();
            this.setupEventListeners();

            // Esconder loading e mostrar conteúdo
            this.showLoading(false);
            this.showContent(true);

            console.log('✅ Página de mentorias carregada com sucesso');

        } catch (error) {
            console.error('💥 Erro ao carregar mentorias:', error);
            this.showError('Erro ao carregar mentorias');
        }
    }

    async checkAuthentication() {
        const token = localStorage.getItem('fin_token');

        if (!token) {
            console.log('❌ Token não encontrado');
            return false;
        }

        // Verificar com o backend
        const profile = await this.authService.getProfile();
        if (!profile.success) {
            console.log('❌ Perfil não carregado:', profile.message);
            return false;
        }

        this.currentUser = profile.data.user;
        return true;
    }

    async checkUserRole() {
        try {
            const user = this.currentUser;
            this.isMentor = user.role === 'mentor' || user.isMentor === true;
            console.log(`👤 Role do usuário: ${this.isMentor ? 'mentor' : 'mentee'}`);
            
        } catch (error) {
            console.error('❌ Erro ao verificar role do usuário:', error);
            this.isMentor = false;
        }
    }

    async loadMentoriasData() {
        try {
            if (this.isMentor) {
                await this.loadMentoriasFromAPI();
            } else {
                await this.loadMentoriasAluno();
            }

        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            this.loadMockData();
        }
    }

    // ATUALIZADO: Carregar mentorias da API PostgreSQL
    async loadMentoriasFromAPI() {
        try {
            console.log('📡 Carregando mentorias da API PostgreSQL...');
            
            const response = await fetch('http://localhost:5000/api/mentorias/minhas', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('fin_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Resposta da API PostgreSQL:', data);
                
                if (data.success && data.data) {
                    this.processAPIData(data.data);
                } else {
                    throw new Error(data.message || 'Dados inválidos da API');
                }
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || `Erro HTTP: ${response.status}`);
            }
        } catch (error) {
            console.error('❌ Erro ao carregar da API, usando dados mock:', error);
            this.loadMockData();
        }
    }

    // NOVO MÉTODO: Carregar mentorias para alunos
    async loadMentoriasAluno() {
        try {
            console.log('📡 Carregando mentorias disponíveis para aluno...');
            
            const response = await fetch('http://localhost:5000/api/mentorias', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('fin_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log('✅ Mentorias disponíveis:', data);
                
                if (data.success && data.data) {
                    this.processMentoriasAluno(data.data);
                } else {
                    throw new Error(data.message || 'Dados inválidos da API');
                }
            } else {
                throw new Error('Erro ao carregar mentorias disponíveis');
            }
        } catch (error) {
            console.error('❌ Erro ao carregar mentorias para aluno:', error);
            this.loadMockData();
        }
    }

    // ATUALIZADO: Processar dados da API PostgreSQL
    processAPIData(mentoriasAPI) {
        console.log('📊 Processando dados da API PostgreSQL:', mentoriasAPI);
        
        // Para mentores: mostrar suas próprias mentorias
        const activeMentorships = mentoriasAPI
            .filter(m => m.disponivel === true)
            .map(mentoria => ({
                id: mentoria.id,
                mentor: mentoria.mentor_nome,
                mentorRole: mentoria.mentor_role,
                topic: mentoria.titulo,
                descricao: mentoria.descricao,
                area: mentoria.area,
                progress: this.calculateProgress(mentoria),
                nextSession: this.getNextSession(mentoria),
                sessionsCompleted: 0,
                totalSessions: mentoria.duracao,
                preco: mentoria.preco,
                rating: 4.8,
                dataCriacao: mentoria.data_criacao,
                isOwner: true // Indica que é dono da mentoria
            }));

        const completedMentorships = mentoriasAPI
            .filter(m => m.disponivel === false)
            .map(mentoria => ({
                id: mentoria.id,
                mentor: mentoria.mentor_nome,
                topic: mentoria.titulo,
                descricao: mentoria.descricao,
                area: mentoria.area,
                completedDate: new Date(mentoria.data_criacao).toLocaleDateString('pt-BR'),
                rating: 4.8,
                sessionsCompleted: mentoria.duracao,
                preco: mentoria.preco
            }));

        this.mentoriasData = {
            activeMentorships,
            upcomingSessions: this.getUpcomingSessions(activeMentorships),
            completedMentorships,
            stats: this.calculateStats(activeMentorships, completedMentorships)
        };

        console.log('✅ Dados processados para mentor:', this.mentoriasData);
    }

    // NOVO MÉTODO: Processar mentorias para alunos
    processMentoriasAluno(mentoriasAPI) {
        console.log('📊 Processando mentorias para aluno:', mentoriasAPI);
        
        // Para alunos: mostrar mentorias disponíveis de outros mentores
        const availableMentorships = mentoriasAPI.map(mentoria => ({
            id: mentoria.id,
            mentor: mentoria.mentor_nome,
            mentorRole: mentoria.mentor_role,
            mentorAvatar: mentoria.mentor_avatar,
            mentorBio: mentoria.mentor_bio,
            mentorExpertise: mentoria.mentor_expertise,
            topic: mentoria.titulo,
            descricao: mentoria.descricao,
            area: mentoria.area,
            duracao: mentoria.duracao,
            preco: mentoria.preco,
            rating: 4.8, // Placeholder - você pode adicionar ratings reais
            dataCriacao: mentoria.data_criacao,
            isOwner: false // Aluno não é dono da mentoria
        }));

        this.mentoriasData = {
            activeMentorships: availableMentorships,
            upcomingSessions: [],
            completedMentorships: [],
            stats: {
                active: availableMentorships.length,
                monthSessions: 0,
                totalHours: '0h',
                completionRate: '0%',
                nextSession: null
            }
        };

        console.log('✅ Dados processados para aluno:', this.mentoriasData);
    }

    // Métodos auxiliares atualizados
    calculateProgress(mentoria) {
        return Math.min(100, Math.floor((Math.random() * 70) + 10));
    }

    getNextSession(mentoria) {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date.toLocaleDateString('pt-BR') + ' - 14:00';
    }

    getUpcomingSessions(activeMentorships) {
        return activeMentorships.slice(0, 2).map((mentoria, index) => ({
            id: index + 1,
            mentorshipId: mentoria.id,
            mentor: mentoria.mentor,
            topic: `${mentoria.topic} - Aula ${Math.floor(Math.random() * 5) + 1}`,
            date: new Date(Date.now() + (index + 3) * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
            time: '14:00',
            duration: '60 min',
            type: 'video',
            joinLink: '#'
        }));
    }

    calculateStats(activeMentorships, completedMentorships) {
        return {
            active: activeMentorships.length,
            monthSessions: activeMentorships.length * 2,
            totalHours: `${activeMentorships.length * 8}h`,
            completionRate: `${Math.floor((completedMentorships.length / (completedMentorships.length + activeMentorships.length)) * 100) || 0}%`,
            nextSession: activeMentorships.length > 0 ? {
                id: activeMentorships[0].id,
                mentor: activeMentorships[0].mentor,
                topic: activeMentorships[0].topic,
                date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
                time: '14:00'
            } : null
        };
    }

    // ATUALIZADO: Dados mock com estrutura PostgreSQL
    loadMockData() {
        if (this.isMentor) {
            this.mentoriasData = {
                activeMentorships: [
                    {
                        id: 1,
                        mentor: 'Carlos Mendes',
                        mentorRole: 'Analista Sênior',
                        topic: 'Análise de Investimentos',
                        descricao: 'Mentoria completa sobre análise de investimentos',
                        area: 'investimentos',
                        progress: 60,
                        nextSession: '30/10/2024 - 14:00',
                        sessionsCompleted: 4,
                        totalSessions: 8,
                        preco: 299.90,
                        rating: 4.8,
                        isOwner: true
                    }
                ],
                upcomingSessions: [
                    {
                        id: 1,
                        mentorshipId: 1,
                        mentor: 'Carlos Mendes',
                        topic: 'Análise de Investimentos - Aula 5',
                        date: '30/10/2024',
                        time: '14:00',
                        duration: '60 min',
                        type: 'video',
                        joinLink: '#'
                    }
                ],
                completedMentorships: [],
                stats: {
                    active: 1,
                    monthSessions: 2,
                    totalHours: '8h',
                    completionRate: '0%',
                    nextSession: {
                        id: 1,
                        mentor: 'Carlos Mendes',
                        topic: 'Análise de Investimentos',
                        date: '30/10/2024',
                        time: '14:00'
                    }
                }
            };
        } else {
            this.mentoriasData = {
                activeMentorships: [
                    {
                        id: 1,
                        mentor: 'Carlos Mendes',
                        mentorRole: 'Analista Sênior',
                        mentorAvatar: null,
                        mentorBio: 'Especialista em investimentos com 10 anos de experiência',
                        mentorExpertise: 'Investimentos, Ações, Fundos',
                        topic: 'Análise de Investimentos',
                        descricao: 'Aprenda a analisar e escolher os melhores investimentos',
                        area: 'investimentos',
                        duracao: 8,
                        preco: 299.90,
                        rating: 4.8,
                        isOwner: false
                    },
                    {
                        id: 2,
                        mentor: 'Ana Silva',
                        mentorRole: 'Gestora de Carteiras',
                        mentorAvatar: null,
                        mentorBio: 'Gestora de carteiras em grande corretora',
                        mentorExpertise: 'Gestão de Carteiras, Renda Fixa',
                        topic: 'Gestão de Carteiras',
                        descricao: 'Aprenda a gerenciar sua carteira de investimentos',
                        area: 'gestao-carteiras',
                        duracao: 6,
                        preco: 199.90,
                        rating: 4.9,
                        isOwner: false
                    }
                ],
                upcomingSessions: [],
                completedMentorships: [],
                stats: {
                    active: 2,
                    monthSessions: 0,
                    totalHours: '0h',
                    completionRate: '0%',
                    nextSession: null
                }
            };
        }
    }

    updateUI() {
        if (!this.currentUser) return;

        this.updateUserInfo();
        this.toggleMentorButton();
        this.updateStats();
        this.updateActiveMentorships();
        this.updateUpcomingSessions();
        this.updateCompletedMentorships();
        this.updateNextSession();
    }

    toggleMentorButton() {
        const novaMentoriaBtn = document.getElementById('nova-mentoria-btn');
        if (novaMentoriaBtn) {
            if (this.isMentor) {
                novaMentoriaBtn.classList.remove('hidden');
                console.log('✅ Botão "Nova Mentoria" mostrado para mentor');
            } else {
                novaMentoriaBtn.classList.add('hidden');
                console.log('❌ Botão "Nova Mentoria" ocultado para aluno');
            }
        }
    }

    updateUserInfo() {
        const user = this.currentUser;
        if (!user) return;

        console.log('👤 Atualizando informações do usuário:', user);

        const userNameElement = document.getElementById('header-name');
        if (userNameElement) {
            const firstName = user.firstName || user.name || 'Usuário';
            const lastName = user.lastName || '';
            const userName = `${firstName} ${lastName}`.trim();
            userNameElement.textContent = userName;
        }

        const userAvatarElement = document.getElementById('header-avatar');
        if (userAvatarElement) {
            this.updateAvatar(user.avatarUrl, user);
        }
    }

    updateAvatar(avatarUrl, user) {
        const avatarElement = document.getElementById('header-avatar');
        if (!avatarElement) return;

        const userInitials = (user.firstName?.[0] || 'U') + (user.lastName?.[0] || '');
        const base64Avatar = localStorage.getItem('user_avatar_base64');

        if (base64Avatar) {
            avatarElement.innerHTML = `<img src="${base64Avatar}" alt="Avatar" class="w-8 h-8 rounded-full object-cover">`;
            return;
        }

        if (avatarUrl) {
            let fullAvatarUrl = avatarUrl;
            if (avatarUrl.startsWith('/uploads/')) {
                fullAvatarUrl = `http://localhost:5000${avatarUrl}`;
            } else if (avatarUrl.startsWith('uploads/')) {
                fullAvatarUrl = `http://localhost:5000/${avatarUrl}`;
            }

            const testImage = new Image();
            testImage.onload = () => {
                avatarElement.innerHTML = `<img src="${fullAvatarUrl}" alt="Avatar" class="w-8 h-8 rounded-full object-cover">`;
            };
            testImage.onerror = () => {
                avatarElement.innerHTML = `<span class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">${userInitials}</span>`;
            };
            testImage.src = `${fullAvatarUrl}?t=${Date.now()}`;
            return;
        }

        avatarElement.innerHTML = `<span class="flex items-center justify-center w-8 h-8 rounded-full bg-primary/20 text-primary font-bold text-sm">${userInitials}</span>`;
    }

    updateStats() {
        if (!this.mentoriasData?.stats) return;
        
        const stats = this.mentoriasData.stats;
        document.getElementById('stats-active').textContent = stats.active;
        document.getElementById('stats-month').textContent = stats.monthSessions;
        document.getElementById('stats-hours').textContent = stats.totalHours;
        document.getElementById('stats-completion').textContent = stats.completionRate;
        document.getElementById('active-count').textContent = `${stats.active} ${this.isMentor ? 'ativas' : 'disponíveis'}`;
        document.getElementById('completed-count').textContent = `${this.mentoriasData.completedMentorships?.length || 0} concluídas`;
    }

    // ATUALIZADO: Renderização de mentorias com dados PostgreSQL
    updateActiveMentorships() {
        const container = document.getElementById('active-mentorships');
        const mentorias = this.mentoriasData?.activeMentorships || [];

        if (!mentorias.length) {
            container.innerHTML = `
            <div class="text-center py-8 text-slate-500 dark:text-slate-400">
              <span class="material-symbols-outlined text-4xl mb-2">school</span>
              <p class="mb-4">${this.isMentor ? 'Nenhuma mentoria ativa no momento' : 'Nenhuma mentoria disponível'}</p>
              ${this.isMentor ? 
                '<button id="nova-mentoria-empty" class="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors">Criar Primeira Mentoria</button>' :
                '<button onclick="window.location.href=\'../mentores/\'" class="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-opacity-90 transition-colors">Explorar Mentores</button>'
              }
            </div>
          `;

          const emptyBtn = document.getElementById('nova-mentoria-empty');
          if (emptyBtn) {
              emptyBtn.addEventListener('click', () => this.abrirModalNovaMentoria());
          }
            return;
        }

        container.innerHTML = mentorias.map(mentoria => `
          <div class="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div class="flex justify-between items-start mb-3">
              <div class="flex-1">
                <h3 class="font-bold text-text-main dark:text-white mb-1">${mentoria.topic}</h3>
                <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">
                  Com ${mentoria.mentor} • ${mentoria.mentorRole}
                  ${mentoria.area ? `• ${this.formatArea(mentoria.area)}` : ''}
                </p>
                ${mentoria.descricao ? `
                <p class="text-sm text-slate-500 dark:text-slate-400 mb-2 line-clamp-2">${mentoria.descricao}</p>
                ` : ''}
                ${this.isMentor ? `
                <div class="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-2">
                  <span class="material-symbols-outlined text-sm mr-1">schedule</span>
                  Próxima sessão: ${mentoria.nextSession}
                </div>
                <div class="flex items-center text-sm text-slate-500 dark:text-slate-400">
                  <span class="material-symbols-outlined text-sm mr-1">star</span>
                  ${mentoria.rating} • ${mentoria.sessionsCompleted}/${mentoria.totalSessions} sessões
                </div>
                ` : `
                <div class="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-2">
                  <span class="material-symbols-outlined text-sm mr-1">schedule</span>
                  ${mentoria.duracao} sessões • ${mentoria.preco ? `R$ ${mentoria.preco.toFixed(2)}` : 'Gratuito'}
                </div>
                `}
              </div>
              ${this.isMentor ? `
              <span class="text-lg font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">${mentoria.progress}%</span>
              ` : `
              <div class="flex items-center bg-success/10 px-3 py-1 rounded-full">
                <span class="material-symbols-outlined text-success text-sm mr-1">star</span>
                <span class="font-bold text-success text-sm">${mentoria.rating}</span>
              </div>
              `}
            </div>
            ${this.isMentor ? `
            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 mb-3">
              <div class="bg-primary h-2 rounded-full transition-all duration-500" style="width: ${mentoria.progress}%"></div>
            </div>
            ` : ''}
            <div class="flex gap-2">
              <button onclick="window.location.href='../mentoria/${mentoria.id}/'" class="flex-1 bg-primary text-white py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors">
                Ver Detalhes
              </button>
              ${this.isMentor ? `
              <button onclick="window.location.href='../sessao/agendar/?mentoria=${mentoria.id}'" class="flex-1 border border-slate-300 dark:border-slate-600 text-text-main dark:text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Agendar
              </button>
              ` : `
              <button onclick="mentoriasPage.inscreverMentoria(${mentoria.id})" class="flex-1 border border-slate-300 dark:border-slate-600 text-text-main dark:text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Inscrever-se
              </button>
              `}
            </div>
          </div>
        `).join('');
    }

    // NOVO MÉTODO: Formatar área para exibição
    formatArea(area) {
        const areasMap = {
            'investimentos': 'Investimentos',
            'gestao-carteiras': 'Gestão de Carteiras',
            'mercado-acoes': 'Mercado de Ações',
            'financas-pessoais': 'Finanças Pessoais',
            'planejamento-financeiro': 'Planejamento Financeiro'
        };
        return areasMap[area] || area;
    }

    // NOVO MÉTODO: Inscrever-se em mentoria (para alunos)
    async inscreverMentoria(mentoriaId) {
        try {
            console.log(`📝 Inscrevendo-se na mentoria ${mentoriaId}...`);
            
            // Aqui você implementaria a lógica de inscrição
            const response = await fetch('http://localhost:5000/api/inscricoes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('fin_token')}`
                },
                body: JSON.stringify({
                    mentoria_id: mentoriaId
                })
            });

            if (response.ok) {
                this.showSuccess('Inscrição realizada com sucesso!');
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Erro ao realizar inscrição');
            }

        } catch (error) {
            console.error('❌ Erro ao inscrever-se:', error);
            this.showError('Erro ao inscrever-se: ' + error.message);
        }
    }

    updateUpcomingSessions() {
        const container = document.getElementById('upcoming-sessions');
        const sessions = this.mentoriasData?.upcomingSessions || [];

        if (!sessions.length) {
            container.innerHTML = `
            <div class="text-center py-8 text-slate-500 dark:text-slate-400">
              <span class="material-symbols-outlined text-4xl mb-2">event</span>
              <p>Nenhuma sessão agendada</p>
            </div>
          `;
            return;
        }

        container.innerHTML = sessions.map(session => `
          <div class="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h3 class="font-bold text-text-main dark:text-white mb-1">${session.topic}</h3>
                <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">${session.mentor}</p>
                <div class="flex items-center text-sm text-slate-500 dark:text-slate-400 mb-1">
                  <span class="material-symbols-outlined text-sm mr-1">calendar_today</span>
                  ${session.date} às ${session.time} • ${session.duration}
                </div>
                <div class="flex items-center text-sm text-slate-500 dark:text-slate-400">
                  <span class="material-symbols-outlined text-sm mr-1">${session.type === 'video' ? 'videocam' : 'location_on'}</span>
                  ${session.type === 'video' ? 'Videochamada' : session.location}
                </div>
              </div>
              <button onclick="window.location.href='${session.joinLink}'" class="bg-primary text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-opacity-90 transition-colors whitespace-nowrap">
                ${session.type === 'video' ? 'Entrar' : 'Ver Local'}
              </button>
            </div>
          </div>
        `).join('');
    }

    updateCompletedMentorships() {
        const container = document.getElementById('completed-mentorships');
        const mentorias = this.mentoriasData?.completedMentorships || [];

        if (!mentorias.length) {
            container.innerHTML = `
            <div class="text-center py-8 text-slate-500 dark:text-slate-400">
              <span class="material-symbols-outlined text-4xl mb-2">check_circle</span>
              <p>Nenhuma mentoria concluída</p>
            </div>
          `;
            return;
        }

        container.innerHTML = mentorias.map(mentoria => `
          <div class="bg-slate-50 dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <h3 class="font-bold text-text-main dark:text-white mb-1">${mentoria.topic}</h3>
                <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">Com ${mentoria.mentor}</p>
                <div class="flex items-center text-sm text-slate-500 dark:text-slate-400">
                  <span class="material-symbols-outlined text-sm mr-1">check_circle</span>
                  Concluída em ${mentoria.completedDate} • ${mentoria.sessionsCompleted} sessões
                </div>
              </div>
              <div class="flex items-center bg-success/10 px-3 py-1 rounded-full">
                <span class="material-symbols-outlined text-success text-sm mr-1">star</span>
                <span class="font-bold text-success text-sm">${mentoria.rating}</span>
              </div>
            </div>
          </div>
        `).join('');
    }

    updateNextSession() {
        const container = document.getElementById('next-session-card');
        const nextSession = this.mentoriasData?.stats?.nextSession;

        if (!nextSession) {
            container.innerHTML = `
            <div class="bg-white/20 rounded-lg p-4 text-center">
              <span class="material-symbols-outlined text-white/60 text-4xl mb-2">event_available</span>
              <p class="text-white/80 text-sm">Nenhuma sessão agendada</p>
            </div>
          `;
            return;
        }

        container.innerHTML = `
          <div class="bg-white/20 rounded-lg p-4">
            <h3 class="font-bold mb-1">${nextSession.topic}</h3>
            <p class="text-white/90 text-sm mb-2">Com ${nextSession.mentor}</p>
            <div class="flex items-center text-white/80 text-sm mb-3">
              <span class="material-symbols-outlined text-sm mr-1">schedule</span>
              ${nextSession.date} às ${nextSession.time}
            </div>
            <button onclick="window.location.href='../sessao/${nextSession.id}/'" class="w-full bg-white text-primary py-2 rounded-lg font-medium hover:bg-opacity-90 transition-colors">
              Preparar para Sessão
            </button>
          </div>
        `;
    }

    setupEventListeners() {
        document.getElementById('logout-btn').addEventListener('click', () => {
            if (confirm('Tem certeza que deseja sair?')) {
                this.authService.logout();
            }
        });

        document.getElementById('theme-toggle').addEventListener('click', this.toggleTheme);

        // Filtros
        document.getElementById('filter-all').addEventListener('click', () => this.setFilter('all'));
        document.getElementById('filter-active').addEventListener('click', () => this.setFilter('active'));
        document.getElementById('filter-completed').addEventListener('click', () => this.setFilter('completed'));

        // Eventos do modal de nova mentoria (apenas para mentores)
        if (this.isMentor) {
            this.setupMentorEventListeners();
        }
    }

    setupMentorEventListeners() {
        const novaMentoriaBtn = document.getElementById('nova-mentoria-btn');
        if (novaMentoriaBtn) {
            novaMentoriaBtn.addEventListener('click', () => this.abrirModalNovaMentoria());
        }
        this.setupModalEventListeners();
    }

    abrirModalNovaMentoria() {
        const modal = document.getElementById('modal-nova-mentoria');
        if (modal) {
            modal.classList.remove('hidden');
        }
    }

    setupModalEventListeners() {
        const modal = document.getElementById('modal-nova-mentoria');
        const fecharModal = document.getElementById('fechar-modal');
        const cancelarBtn = document.getElementById('cancelar-mentoria');
        const form = document.getElementById('form-nova-mentoria');

        if (!modal || !fecharModal || !cancelarBtn || !form) {
            console.log('❌ Elementos do modal não encontrados');
            return;
        }

        const closeModal = () => {
            modal.classList.add('hidden');
            form.reset();
        };

        fecharModal.addEventListener('click', closeModal);
        cancelarBtn.addEventListener('click', closeModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.criarNovaMentoria();
        });
    }

    async criarNovaMentoria() {
        try {
            const formData = {
                titulo: document.getElementById('mentoria-titulo').value,
                descricao: document.getElementById('mentoria-descricao').value,
                area: document.getElementById('mentoria-area').value,
                duracao: parseInt(document.getElementById('mentoria-duracao').value),
                preco: parseFloat(document.getElementById('mentoria-preco').value),
                disponivel: document.getElementById('disponivel').checked
            };

            console.log('📝 Criando nova mentoria:', formData);

            const resultado = await this.salvarMentoria(formData);

            if (resultado.success) {
                this.showSuccess('Mentoria criada com sucesso!');
                this.fecharModalNovaMentoria();
                await this.loadMentoriasData();
                this.updateUI();
            } else {
                throw new Error(resultado.message || 'Erro ao criar mentoria');
            }

        } catch (error) {
            console.error('❌ Erro ao criar mentoria:', error);
            this.showError('Erro ao criar mentoria: ' + error.message);
        }
    }

    async salvarMentoria(mentoriaData) {
        try {
            const response = await fetch('http://localhost:5000/api/mentorias', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('fin_token')}`
                },
                body: JSON.stringify(mentoriaData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Erro ao criar mentoria');
            }

            return data;

        } catch (error) {
            console.error('❌ Erro na API:', error);
            throw error;
        }
    }

    fecharModalNovaMentoria() {
        const modal = document.getElementById('modal-nova-mentoria');
        const form = document.getElementById('form-nova-mentoria');
        if (modal) modal.classList.add('hidden');
        if (form) form.reset();
    }

    showSuccess(message) {
        alert(message);
    }

    showError(message) {
        alert('Erro: ' + message);
    }

    setFilter(filter) {
        this.currentFilter = filter;

        document.getElementById('filter-all').classList.toggle('bg-primary', filter === 'all');
        document.getElementById('filter-all').classList.toggle('text-white', filter === 'all');
        document.getElementById('filter-all').classList.toggle('border', filter !== 'all');

        document.getElementById('filter-active').classList.toggle('bg-primary', filter === 'active');
        document.getElementById('filter-active').classList.toggle('text-white', filter === 'active');
        document.getElementById('filter-active').classList.toggle('border', filter !== 'active');

        document.getElementById('filter-completed').classList.toggle('bg-primary', filter === 'completed');
        document.getElementById('filter-completed').classList.toggle('text-white', filter === 'completed');
        document.getElementById('filter-completed').classList.toggle('border', filter !== 'completed');

        console.log(`Filtro aplicado: ${filter}`);
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

    redirectToLogin() {
        window.location.href = '../pages/login.html';
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

// Inicializar quando DOM estiver pronto
document.addEventListener('DOMContentLoaded', () => {
    console.log('✅ DOM carregado, iniciando página de mentorias...');
    window.mentoriasPage = new MentoriasPage();
});

// Tema inicial
if (localStorage.getItem('theme') === 'dark') {
    document.documentElement.classList.add('dark');
} else {
    document.documentElement.classList.remove('dark');
    localStorage.setItem('theme', 'light');
}

// Debug helper
window.debugUser = () => {
    console.log('🔍 DEBUG USER DATA:');
    console.log('currentUser:', window.mentoriasPage?.currentUser);
    console.log('localStorage fin_user:', localStorage.getItem('fin_user'));
    console.log('localStorage fin_token:', localStorage.getItem('fin_token'));
    console.log('localStorage user_avatar_base64:', localStorage.getItem('user_avatar_base64') ? 'EXISTS' : 'NOT EXISTS');
};