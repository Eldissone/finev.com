// frontend/js/api.js
class FINAPI {
    constructor() {
        // Usar a mesma URL do seu backend existente
        this.baseURL = 'http://localhost:5000/api';
        this.token = localStorage.getItem('fin_token');
    }

    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': this.token ? `Bearer ${this.token}` : '',
                ...options.headers,
            },
            ...options
        };

        // Remove Content-Type se for FormData (upload de arquivos)
        if (options.body instanceof FormData) {
            delete config.headers['Content-Type'];
        }

        try {
            const response = await fetch(url, config);
            
            // Se for 204 No Content, retorna sucesso
            if (response.status === 204) {
                return { success: true };
            }

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || `Erro ${response.status}: ${response.statusText}`);
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    // Função auxiliar para fazer requisição com fallback para mock
    async requestWithFallback(endpoint, options = {}, mockDataFn) {
        try {
            return await this.request(endpoint, options);
        } catch (error) {
            console.warn('⚠️ API não disponível, usando dados mock:', error.message);
            return mockDataFn();
        }
    }

    // Auth endpoints - baseado na sua estrutura existente
    async login(email, password) {
        return this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(userData) {
        return this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async getProfile() {
        return this.request('/users/profile');
    }

    async logout() {
        localStorage.removeItem('fin_token');
        this.token = null;
        return this.request('/auth/logout');
    }

    // Admin endpoints com fallback para mock data
    async getAdminStats() {
        return this.requestWithFallback('/admin/stats', {}, () => ({
            success: true,
            data: {
                totalUsers: 1542,
                activeMentors: 89,
                activeMentorships: 234,
                completionRate: '78%',
                revenue: 125000,
                newUsersThisMonth: 142
            }
        }));
    }

    async getUsers(filters = {}) {
        return this.requestWithFallback(`/admin/users?${new URLSearchParams(filters)}`, {}, () => {
            // Dados mock para usuários
            const mockUsers = [
                {
                    id: '1',
                    firstName: 'João',
                    lastName: 'Silva',
                    email: 'joao.silva@email.com',
                    role: 'mentee',
                    status: 'active',
                    createdAt: '2024-01-15T10:00:00Z',
                    lastLogin: '2024-01-28T14:30:00Z'
                },
                {
                    id: '2',
                    firstName: 'Maria',
                    lastName: 'Santos',
                    email: 'maria.santos@email.com',
                    role: 'mentor',
                    status: 'active',
                    createdAt: '2024-01-10T14:30:00Z',
                    specialization: 'Desenvolvimento Web',
                    experienceYears: 5,
                    rating: 4.8,
                    isVerified: true,
                    lastLogin: '2024-01-28T09:15:00Z'
                },
                {
                    id: '3',
                    firstName: 'Pedro',
                    lastName: 'Oliveira',
                    email: 'pedro.oliveira@email.com',
                    role: 'mentee',
                    status: 'inactive',
                    createdAt: '2024-01-20T09:15:00Z',
                    lastLogin: '2024-01-25T16:45:00Z'
                },
                {
                    id: '4',
                    firstName: 'Ana',
                    lastName: 'Costa',
                    email: 'ana.costa@email.com',
                    role: 'mentor',
                    status: 'active',
                    createdAt: '2024-01-08T16:45:00Z',
                    specialization: 'Data Science',
                    experienceYears: 3,
                    rating: 4.5,
                    isVerified: true,
                    lastLogin: '2024-01-28T11:20:00Z'
                },
                {
                    id: '5',
                    firstName: 'Carlos',
                    lastName: 'Ferreira',
                    email: 'carlos.ferreira@email.com',
                    role: 'admin',
                    status: 'active',
                    createdAt: '2024-01-01T08:00:00Z',
                    lastLogin: '2024-01-28T08:30:00Z'
                },
                {
                    id: '6',
                    firstName: 'Juliana',
                    lastName: 'Rocha',
                    email: 'juliana.rocha@email.com',
                    role: 'mentee',
                    status: 'suspended',
                    createdAt: '2024-01-25T11:30:00Z',
                    lastLogin: '2024-01-26T10:15:00Z'
                },
                {
                    id: '7',
                    firstName: 'Ricardo',
                    lastName: 'Almeida',
                    email: 'ricardo.almeida@email.com',
                    role: 'mentor',
                    status: 'active',
                    createdAt: '2024-01-12T13:20:00Z',
                    specialization: 'Mobile Development',
                    experienceYears: 7,
                    rating: 4.9,
                    isVerified: true,
                    lastLogin: '2024-01-28T13:45:00Z'
                },
                {
                    id: '8',
                    firstName: 'Fernanda',
                    lastName: 'Lima',
                    email: 'fernanda.lima@email.com',
                    role: 'mentee',
                    status: 'active',
                    createdAt: '2024-01-18T15:10:00Z',
                    lastLogin: '2024-01-28T17:20:00Z'
                },
                {
                    id: '9',
                    firstName: 'Roberto',
                    lastName: 'Souza',
                    email: 'roberto.souza@email.com',
                    role: 'mentor',
                    status: 'inactive',
                    createdAt: '2024-01-05T12:00:00Z',
                    specialization: 'UX/UI Design',
                    experienceYears: 4,
                    rating: 4.2,
                    isVerified: true,
                    lastLogin: '2024-01-20T14:30:00Z'
                },
                {
                    id: '10',
                    firstName: 'Amanda',
                    lastName: 'Martins',
                    email: 'amanda.martins@email.com',
                    role: 'mentee',
                    status: 'active',
                    createdAt: '2024-01-22T14:25:00Z',
                    lastLogin: '2024-01-28T15:40:00Z'
                }
            ];

            // Aplicar filtros nos dados mock
            let filteredUsers = [...mockUsers];

            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                filteredUsers = filteredUsers.filter(user => 
                    user.firstName.toLowerCase().includes(searchTerm) ||
                    user.lastName.toLowerCase().includes(searchTerm) ||
                    user.email.toLowerCase().includes(searchTerm)
                );
            }

            if (filters.status) {
                filteredUsers = filteredUsers.filter(user => user.status === filters.status);
            }

            if (filters.role) {
                filteredUsers = filteredUsers.filter(user => user.role === filters.role);
            }

            // Paginação
            const page = parseInt(filters.page) || 1;
            const limit = parseInt(filters.limit) || 10;
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

            return {
                success: true,
                data: {
                    users: paginatedUsers,
                    pagination: {
                        total: filteredUsers.length,
                        page: page,
                        limit: limit,
                        pages: Math.ceil(filteredUsers.length / limit)
                    }
                }
            };
        });
    }

    async getUser(userId) {
        return this.requestWithFallback(`/admin/users/${userId}`, {}, () => ({
            success: true,
            data: {
                user: {
                    id: userId,
                    firstName: 'Usuário',
                    lastName: 'Exemplo',
                    email: 'usuario@exemplo.com',
                    role: 'mentee',
                    status: 'active',
                    createdAt: '2024-01-01T00:00:00Z',
                    lastLogin: '2024-01-28T12:00:00Z'
                }
            }
        }));
    }

    async updateUser(userId, userData) {
        return this.requestWithFallback(`/admin/users/${userId}`, {
            method: 'PUT',
            body: JSON.stringify(userData)
        }, () => ({
            success: true,
            message: 'Usuário atualizado com sucesso (mock)',
            data: { id: userId, ...userData }
        }));
    }

    async promoteToMentor(userId) {
        return this.requestWithFallback(`/admin/users/${userId}/promote`, {
            method: 'PATCH'
        }, () => ({
            success: true,
            message: 'Usuário promovido a mentor com sucesso (mock)',
            data: { userId, role: 'mentor' }
        }));
    }

    async toggleUserStatus(userId, status) {
        return this.requestWithFallback(`/admin/users/${userId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status })
        }, () => ({
            success: true,
            message: `Status do usuário alterado para ${status} (mock)`,
            data: { userId, status }
        }));
    }

    async getMentors(filters = {}) {
        return this.requestWithFallback(`/admin/mentors?${new URLSearchParams(filters)}`, {}, async () => {
            // Reutiliza os dados de usuários e filtra apenas mentores
            const usersResponse = await this.getUsers(filters);
            const mentors = usersResponse.data.users.filter(user => user.role === 'mentor');
            
            return {
                success: true,
                data: {
                    mentors: mentors,
                    pagination: usersResponse.data.pagination
                }
            };
        });
    }

    async getMentorships(filters = {}) {
        return this.requestWithFallback(`/admin/mentorships?${new URLSearchParams(filters)}`, {}, () => {
            // Dados mock para mentorias
            const mockMentorships = [
                {
                    id: '1',
                    menteeId: '1',
                    menteeFirstName: 'João',
                    menteeLastName: 'Silva',
                    menteeEmail: 'joao.silva@email.com',
                    mentorId: '2',
                    mentorFirstName: 'Maria',
                    mentorLastName: 'Santos',
                    mentorEmail: 'maria.santos@email.com',
                    startDate: '2024-01-20T10:00:00Z',
                    endDate: null,
                    status: 'active',
                    progress: 65,
                    totalSessions: 12,
                    completedSessions: 8,
                    nextSession: '2024-01-30T14:00:00Z'
                },
                {
                    id: '2',
                    menteeId: '3',
                    menteeFirstName: 'Pedro',
                    menteeLastName: 'Oliveira',
                    menteeEmail: 'pedro.oliveira@email.com',
                    mentorId: '4',
                    mentorFirstName: 'Ana',
                    mentorLastName: 'Costa',
                    mentorEmail: 'ana.costa@email.com',
                    startDate: '2024-01-18T14:30:00Z',
                    endDate: '2024-01-25T16:00:00Z',
                    status: 'completed',
                    progress: 100,
                    totalSessions: 8,
                    completedSessions: 8,
                    nextSession: null
                },
                {
                    id: '3',
                    menteeId: '8',
                    menteeFirstName: 'Fernanda',
                    menteeLastName: 'Lima',
                    menteeEmail: 'fernanda.lima@email.com',
                    mentorId: '7',
                    mentorFirstName: 'Ricardo',
                    mentorLastName: 'Almeida',
                    mentorEmail: 'ricardo.almeida@email.com',
                    startDate: '2024-01-25T09:15:00Z',
                    endDate: null,
                    status: 'active',
                    progress: 30,
                    totalSessions: 10,
                    completedSessions: 3,
                    nextSession: '2024-01-29T11:00:00Z'
                },
                {
                    id: '4',
                    menteeId: '10',
                    menteeFirstName: 'Amanda',
                    menteeLastName: 'Martins',
                    menteeEmail: 'amanda.martins@email.com',
                    mentorId: '2',
                    mentorFirstName: 'Maria',
                    mentorLastName: 'Santos',
                    mentorEmail: 'maria.santos@email.com',
                    startDate: '2024-01-22T16:00:00Z',
                    endDate: null,
                    status: 'pending',
                    progress: 0,
                    totalSessions: 6,
                    completedSessions: 0,
                    nextSession: null
                }
            ];

            // Aplicar filtros
            let filteredMentorships = [...mockMentorships];

            if (filters.status) {
                filteredMentorships = filteredMentorships.filter(m => m.status === filters.status);
            }

            if (filters.search) {
                const searchTerm = filters.search.toLowerCase();
                filteredMentorships = filteredMentorships.filter(m =>
                    m.menteeFirstName.toLowerCase().includes(searchTerm) ||
                    m.menteeLastName.toLowerCase().includes(searchTerm) ||
                    m.mentorFirstName.toLowerCase().includes(searchTerm) ||
                    m.mentorLastName.toLowerCase().includes(searchTerm)
                );
            }

            return {
                success: true,
                data: {
                    mentorships: filteredMentorships,
                    pagination: {
                        total: filteredMentorships.length,
                        page: 1,
                        limit: 10,
                        pages: 1
                    }
                }
            };
        });
    }

    async getRecentActivity() {
        return this.requestWithFallback('/admin/activity', {}, () => ({
            success: true,
            data: [
                {
                    id: '1',
                    userId: '1',
                    userInitials: 'JS',
                    description: 'Novo usuário registrado - João Silva',
                    type: 'user_registered',
                    timestamp: new Date(Date.now() - 5 * 60000).toISOString()
                },
                {
                    id: '2',
                    userId: '2',
                    userInitials: 'MS',
                    description: 'Usuário promovido a mentor - Maria Santos',
                    type: 'mentor_promoted',
                    timestamp: new Date(Date.now() - 15 * 60000).toISOString()
                },
                {
                    id: '3',
                    userId: '3',
                    userInitials: 'AS',
                    description: 'Nova mentoria iniciada - João Silva & Maria Santos',
                    type: 'mentorship_created',
                    timestamp: new Date(Date.now() - 25 * 60000).toISOString()
                },
                {
                    id: '4',
                    userId: '4',
                    userInitials: 'PL',
                    description: 'Mentoria concluída - Pedro Oliveira & Ana Costa',
                    type: 'mentorship_completed',
                    timestamp: new Date(Date.now() - 45 * 60000).toISOString()
                },
                {
                    id: '5',
                    userId: '5',
                    userInitials: 'CA',
                    description: 'Artigo publicado - "Introdução ao React"',
                    type: 'content_published',
                    timestamp: new Date(Date.now() - 60 * 60000).toISOString()
                }
            ]
        }));
    }

    async createMentorship(mentorshipData) {
        return this.request('/admin/mentorships', {
            method: 'POST',
            body: JSON.stringify(mentorshipData)
        });
    }

    async updateMentorship(mentorshipId, mentorshipData) {
        return this.request(`/admin/mentorships/${mentorshipId}`, {
            method: 'PUT',
            body: JSON.stringify(mentorshipData)
        });
    }

    async getContent() {
        return this.request('/admin/content');
    }

    async createArticle(articleData) {
        return this.request('/admin/content/articles', {
            method: 'POST',
            body: JSON.stringify(articleData)
        });
    }

    async updateArticle(articleId, articleData) {
        return this.request(`/admin/content/articles/${articleId}`, {
            method: 'PUT',
            body: JSON.stringify(articleData)
        });
    }

    // Upload de arquivos
    async uploadFile(file, type = 'image') {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', type);

        return this.request('/upload', {
            method: 'POST',
            headers: {
                'Authorization': this.token ? `Bearer ${this.token}` : '',
            },
            body: formData
        });
    }
}

// Singleton instance
const finAPI = new FINAPI();