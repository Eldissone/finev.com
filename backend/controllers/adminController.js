// backend/controllers/adminController.js
const adminController = {
    
    // GET /api/admin/stats - Estatísticas gerais
    async getStats(req, res) {
        try {
            console.log('📊 Buscando estatísticas para admin:', req.user.id);
            
            res.json({
                success: true,
                data: {
                    totalUsers: 1542,
                    activeMentors: 89,
                    activeMentorships: 234,
                    completionRate: '78%',
                    newUsersThisMonth: 142,
                    pendingMentorships: 23,
                    revenue: 125000
                }
            });
        } catch (error) {
            console.error('Erro em getStats:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar estatísticas' 
            });
        }
    },

    // GET /api/admin/users - Listar usuários com paginação e filtros
    async getUsers(req, res) {
        try {
            const { search = '', status = '', role = '', page = 1, limit = 10 } = req.query;
            
            console.log('👥 Buscando usuários. Admin:', req.user.id, 'Filtros:', { search, status, role });

            // Dados mock
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
                    firstName: 'Admin',
                    lastName: 'FIN',
                    email: 'admin@fin.com',
                    role: 'admin',
                    status: 'active',
                    createdAt: '2024-01-01T08:00:00Z',
                    lastLogin: '2024-01-28T08:30:00Z'
                }
            ];

            // Aplicar filtros
            let filteredUsers = mockUsers.filter(user => {
                let include = true;
                
                if (search) {
                    const searchTerm = search.toLowerCase();
                    include = include && (
                        user.firstName.toLowerCase().includes(searchTerm) ||
                        user.lastName.toLowerCase().includes(searchTerm) ||
                        user.email.toLowerCase().includes(searchTerm)
                    );
                }
                
                if (status) {
                    include = include && (user.status === status);
                }
                
                if (role) {
                    include = include && (user.role === role);
                }
                
                return include;
            });

            // Paginação
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);
            const startIndex = (pageNum - 1) * limitNum;
            const endIndex = startIndex + limitNum;
            const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

            res.json({
                success: true,
                data: {
                    users: paginatedUsers,
                    pagination: {
                        total: filteredUsers.length,
                        page: pageNum,
                        limit: limitNum,
                        pages: Math.ceil(filteredUsers.length / limitNum)
                    }
                }
            });
        } catch (error) {
            console.error('Erro em getUsers:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar usuários' 
            });
        }
    },

    // GET /api/admin/users/:id - Buscar usuário específico
    async getUser(req, res) {
        try {
            const { id } = req.params;
            console.log('🔍 Buscando usuário:', id, 'Admin:', req.user.id);

            const mockUser = {
                id: id,
                firstName: 'Usuário',
                lastName: 'Exemplo',
                email: 'usuario@exemplo.com',
                role: 'mentee',
                status: 'active',
                createdAt: '2024-01-01T00:00:00Z',
                lastLogin: '2024-01-28T12:00:00Z'
            };

            res.json({
                success: true,
                data: {
                    user: mockUser
                }
            });
        } catch (error) {
            console.error('Erro em getUser:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar usuário'
            });
        }
    },

    // PUT /api/admin/users/:id - Atualizar usuário
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const userData = req.body;
            console.log('✏️ Atualizando usuário:', id, 'Admin:', req.user.id);

            res.json({
                success: true,
                message: 'Usuário atualizado com sucesso',
                data: {
                    user: { id, ...userData }
                }
            });
        } catch (error) {
            console.error('Erro em updateUser:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao atualizar usuário'
            });
        }
    },

    // PATCH /api/admin/users/:id/promote - Promover para mentor
    async promoteToMentor(req, res) {
        try {
            const { id } = req.params;
            console.log('⭐ Promovendo usuário a mentor:', id, 'Admin:', req.user.id);

            res.json({
                success: true,
                message: 'Usuário promovido a mentor com sucesso',
                data: { userId: id, role: 'mentor' }
            });
        } catch (error) {
            console.error('Erro em promoteToMentor:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao promover usuário'
            });
        }
    },

    // PATCH /api/admin/users/:id/status - Alterar status do usuário
    async toggleUserStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            console.log('🔄 Alterando status do usuário:', id, 'Para:', status, 'Admin:', req.user.id);

            res.json({
                success: true,
                message: `Status do usuário alterado para ${status}`,
                data: { userId: id, status }
            });
        } catch (error) {
            console.error('Erro em toggleUserStatus:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao alterar status do usuário'
            });
        }
    },

    // GET /api/admin/mentors - Listar mentores
    async getMentors(req, res) {
        try {
            const { search = '', status = '', page = 1, limit = 10 } = req.query;
            console.log('👨‍🏫 Buscando mentores. Admin:', req.user.id);

            const mockMentors = [
                {
                    id: '2',
                    firstName: 'Maria',
                    lastName: 'Santos',
                    email: 'maria.santos@email.com',
                    status: 'active',
                    createdAt: '2024-01-10T14:30:00Z',
                    specialization: 'Desenvolvimento Web',
                    experienceYears: 5,
                    rating: 4.8,
                    isVerified: true
                }
            ];

            res.json({
                success: true,
                data: {
                    mentors: mockMentors,
                    pagination: {
                        total: mockMentors.length,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        pages: 1
                    }
                }
            });
        } catch (error) {
            console.error('Erro em getMentors:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar mentores' 
            });
        }
    },

    // PATCH /api/admin/mentors/:id/verify - Verificar mentor
    async verifyMentor(req, res) {
        try {
            const { id } = req.params;
            console.log('✅ Verificando mentor:', id, 'Admin:', req.user.id);

            res.json({
                success: true,
                message: 'Mentor verificado com sucesso',
                data: { mentorId: id, isVerified: true }
            });
        } catch (error) {
            console.error('Erro em verifyMentor:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao verificar mentor'
            });
        }
    },

    // GET /api/admin/mentorships - Listar mentorias
    async getMentorships(req, res) {
        try {
            const { search = '', status = '', page = 1, limit = 10 } = req.query;
            console.log('🤝 Buscando mentorias. Admin:', req.user.id);

            const mockMentorships = [
                {
                    id: '1',
                    menteeFirstName: 'João',
                    menteeLastName: 'Silva',
                    mentorFirstName: 'Maria',
                    mentorLastName: 'Santos',
                    status: 'active',
                    progress: 65,
                    startDate: '2024-01-20T10:00:00Z'
                }
            ];

            res.json({
                success: true,
                data: {
                    mentorships: mockMentorships,
                    pagination: {
                        total: mockMentorships.length,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        pages: 1
                    }
                }
            });
        } catch (error) {
            console.error('Erro em getMentorships:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar mentorias' 
            });
        }
    },

    // POST /api/admin/mentorships - Criar mentoria
    async createMentorship(req, res) {
        try {
            const mentorshipData = req.body;
            console.log('➕ Criando mentoria. Admin:', req.user.id);

            res.status(201).json({
                success: true,
                message: 'Mentoria criada com sucesso',
                data: {
                    mentorshipId: 'new-' + Date.now()
                }
            });
        } catch (error) {
            console.error('Erro em createMentorship:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao criar mentoria'
            });
        }
    },

    // PUT /api/admin/mentorships/:id - Atualizar mentoria
    async updateMentorship(req, res) {
        try {
            const { id } = req.params;
            const mentorshipData = req.body;
            console.log('✏️ Atualizando mentoria:', id, 'Admin:', req.user.id);

            res.json({
                success: true,
                message: 'Mentoria atualizada com sucesso',
                data: { mentorshipId: id }
            });
        } catch (error) {
            console.error('Erro em updateMentorship:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao atualizar mentoria'
            });
        }
    },

    // GET /api/admin/activity - Atividades recentes
    async getRecentActivity(req, res) {
        try {
            console.log('📝 Buscando atividades recentes. Admin:', req.user.id);

            const activities = [
                {
                    id: '1',
                    userInitials: 'JS',
                    description: 'Novo usuário registrado - João Silva',
                    type: 'user_registered',
                    timestamp: new Date().toISOString()
                }
            ];

            res.json({
                success: true,
                data: activities
            });
        } catch (error) {
            console.error('Erro em getRecentActivity:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar atividades' 
            });
        }
    }
};

module.exports = adminController;