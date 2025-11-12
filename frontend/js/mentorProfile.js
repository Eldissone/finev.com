// js/mentorProfile.js
class MentorProfilePage {
    constructor() {
        this.authService = authService;
        this.currentUser = null;
        this.mentorData = null;
        this.API_BASE = 'http://localhost:5000/api';
        this.init();
    }

    async init() {
        try {
            console.log('🚀 Iniciando perfil do mentor...');
            this.showLoading(true);

            const isAuthenticated = await this.checkAuthentication();
            if (!isAuthenticated) {
                this.redirectToLogin();
                return;
            }

            await this.loadMentorData();
            this.updateUI();
            this.setupEventListeners();

            this.showLoading(false);
            this.showContent(true);

        } catch (error) {
            console.error('💥 Erro ao carregar perfil do mentor:', error);
            this.showError('Erro ao carregar perfil do mentor');
        }
    }

    async loadMentorData() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const mentorId = urlParams.get('id');

            if (!mentorId) {
                throw new Error('ID do mentor não especificado');
            }

            console.log('📋 Carregando dados do mentor:', mentorId);

            const response = await fetch(`${this.API_BASE}/mentor-profile/${mentorId}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('fin_token')}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Erro ao carregar dados do mentor');
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.error);
            }

            this.mentorData = data.data;
            console.log('✅ Dados do mentor carregados:', this.mentorData);
            
            // Carregar dados adicionais
            await this.loadAdditionalData();

        } catch (error) {
            console.error('❌ Erro ao carregar dados do mentor:', error);
            
            // Fallback para dados mock
            console.log('🔄 Usando dados mock como fallback');
            await this.loadMockData();
        }
    }

    async loadAdditionalData() {
        try {
            // Carregar módulos do curso
            const modulesResponse = await fetch(`${this.API_BASE}/mentor/${this.mentorData.id}/modules`);
            this.modules = modulesResponse.ok ? await modulesResponse.json() : [];

            // Carregar sessões ao vivo
            const sessionsResponse = await fetch(`${this.API_BASE}/mentor/${this.mentorData.id}/sessions`);
            this.liveSessions = sessionsResponse.ok ? await sessionsResponse.json() : [];

            // Carregar horários disponíveis
            const slotsResponse = await fetch(`${this.API_BASE}/mentor/${this.mentorData.id}/availability`);
            this.availableSlots = slotsResponse.ok ? await slotsResponse.json() : [];

        } catch (error) {
            console.error('Erro ao carregar dados adicionais:', error);
            // Usar dados mock como fallback
            this.loadMockAdditionalData();
        }
    }

    updateUI() {
        if (!this.mentorData) return;

        // Informações básicas
        document.getElementById('mentor-avatar').src = this.mentorData.avatar;
        document.getElementById('mentor-name').textContent = this.mentorData.name;
        document.getElementById('mentor-role').textContent = this.mentorData.role;
        document.getElementById('mentor-company').textContent = this.mentorData.company;
        document.getElementById('mentor-rating').textContent = this.mentorData.rating;
        document.getElementById('mentor-reviews').textContent = this.mentorData.reviews;
        document.getElementById('mentor-experience').textContent = this.mentorData.experience;
        document.getElementById('mentor-price').textContent = `R$ ${this.mentorData.price}`;
        document.getElementById('mentor-sessions').textContent = this.mentorData.totalSessions;
        document.getElementById('mentor-response-rate').textContent = `${this.mentorData.responseRate}%`;
        document.getElementById('mentor-avg-time').textContent = `${this.mentorData.avgSessionTime}min`;

        // Atualizar badge do plano
        const planBadge = document.getElementById('mentor-plan-badge');
        planBadge.textContent = this.mentorData.plan.toUpperCase();
        planBadge.className = `px-2 py-1 rounded-full text-xs font-medium ${
            this.mentorData.plan === 'premium' ? 'bg-premium text-gray-800' :
            this.mentorData.plan === 'pro' ? 'bg-pro text-white' :
            'bg-primary text-white'
        }`;

        // Atualizar áreas e especialidades
        const expertiseContainer = document.querySelector('.flex-wrap.gap-2');
        expertiseContainer.innerHTML = `
            <span class="bg-primary/10 text-primary text-sm px-3 py-1 rounded-full">${this.mentorData.area}</span>
            ${this.mentorData.expertise.map(exp => 
                `<span class="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-sm px-3 py-1 rounded-full">${exp}</span>`
            ).join('')}
        `;

        // Atualizar seções restantes
        this.updateModulesList();
        this.updateLiveSessions();
        this.updateAvailableSlots();
        this.updateSupportMaterials();
    }

    // ... restante dos métodos permanecem similares
}