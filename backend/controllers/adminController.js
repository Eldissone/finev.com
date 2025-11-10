// backend/controllers/adminController.js
const db = require('../config/database');

const adminController = {
    
    // GET /api/admin/stats - Estatísticas gerais (REAL)
    async getStats(req, res) {
        try {
            console.log('📊 Buscando estatísticas do banco para admin:', req.user.id);
            
            // Contar usuários totais
            const totalUsersResult = await db.query('SELECT COUNT(*) as count FROM users');
            const totalUsers = parseInt(totalUsersResult.rows[0].count);
            
            // Contar mentores ativos
            const activeMentorsResult = await db.query(
                'SELECT COUNT(*) as count FROM users WHERE role = $1 AND status = $2',
                ['mentor', 'active']
            );
            const activeMentors = parseInt(activeMentorsResult.rows[0].count);
            
            // Contar mentorados ativos
            const activeMenteesResult = await db.query(
                'SELECT COUNT(*) as count FROM users WHERE role = $1 AND status = $2',
                ['mentee', 'active']
            );
            const activeMentees = parseInt(activeMenteesResult.rows[0].count);

            // Contar admins
            const adminsResult = await db.query(
                'SELECT COUNT(*) as count FROM users WHERE role = $1',
                ['admin']
            );
            const admins = parseInt(adminsResult.rows[0].count);

            // Usuários inativos/suspensos
            const inactiveUsersResult = await db.query(
                'SELECT COUNT(*) as count FROM users WHERE status != $1',
                ['active']
            );
            const inactiveUsers = parseInt(inactiveUsersResult.rows[0].count);

            // Novos usuários este mês
            const newUsersThisMonthResult = await db.query(
                `SELECT COUNT(*) as count 
                 FROM users 
                 WHERE EXTRACT(MONTH FROM created_at) = EXTRACT(MONTH FROM CURRENT_DATE) 
                 AND EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM CURRENT_DATE)`
            );
            const newUsersThisMonth = parseInt(newUsersThisMonthResult.rows[0].count);

            // Mentores verificados
            let verifiedMentors = 0;
            try {
                const verifiedMentorsResult = await db.query(`
                    SELECT COUNT(*) as count 
                    FROM mentor_profiles mp
                    JOIN users u ON mp.user_id = u.id
                    WHERE mp.is_verified = true AND u.status = 'active'
                `);
                verifiedMentors = parseInt(verifiedMentorsResult.rows[0].count);
            } catch (error) {
                console.log('⚠️ Tabela mentor_profiles não encontrada');
            }

            res.json({
                success: true,
                data: {
                    totalUsers,
                    activeMentors,
                    activeMentorships: 0, // Implementar quando tiver tabela de mentorias
                    completionRate: '0%', // Implementar quando tiver mentorias
                    newUsersThisMonth,
                    pendingMentorships: 0, // Implementar quando tiver mentorias
                    activeMentees,
                    admins,
                    inactiveUsers,
                    verifiedMentors,
                    revenue: 0 // Implementar se tiver sistema de pagamento
                }
            });
        } catch (error) {
            console.error('❌ Erro em getStats:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar estatísticas',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // GET /api/admin/users - Listar usuários com paginação e filtros (REAL)
    async getUsers(req, res) {
        try {
            const { search = '', status = '', role = '', page = 1, limit = 10 } = req.query;
            
            console.log('👥 Buscando usuários do banco. Admin:', req.user.id, 'Filtros:', { search, status, role });

            // Construir a query base
            let query = `
                SELECT 
                    u.id,
                    u.first_name as "firstName",
                    u.last_name as "lastName", 
                    u.email,
                    u.role,
                    u.status,
                    u.created_at as "createdAt",
                    u.updated_at as "updatedAt",
                    u.last_login as "lastLogin",
                    u.phone,
                    u.bio,
                    u.avatar_url as "avatarUrl",
                    u.email_verified as "emailVerified",
                    mp.specialization,
                    mp.experience_years as "experienceYears",
                    mp.rating,
                    mp.is_verified as "isVerified"
                FROM users u
                LEFT JOIN mentor_profiles mp ON u.id = mp.user_id
                WHERE 1=1
            `;
            const params = [];

            // Aplicar filtros
            if (search) {
                query += ' AND (u.first_name ILIKE $' + (params.length + 1) + 
                         ' OR u.last_name ILIKE $' + (params.length + 1) + 
                         ' OR u.email ILIKE $' + (params.length + 1) + ')';
                const searchTerm = `%${search}%`;
                params.push(searchTerm);
            }

            if (status && status !== '') {
                query += ' AND u.status = $' + (params.length + 1);
                params.push(status);
            }

            if (role && role !== '') {
                query += ' AND u.role = $' + (params.length + 1);
                params.push(role);
            }

            // Ordenação
            query += ' ORDER BY u.created_at DESC';

            // Paginação
            const offset = (page - 1) * limit;
            query += ' LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
            params.push(parseInt(limit), offset);

            console.log('📋 Query:', query);
            console.log('🔢 Parâmetros:', params);

            // Executar query principal
            const result = await db.query(query, params);
            const users = result.rows;

            // Contar total para paginação
            let countQuery = `
                SELECT COUNT(*) as total 
                FROM users u
                WHERE 1=1
            `;
            const countParams = [];

            if (search) {
                countQuery += ' AND (u.first_name ILIKE $' + (countParams.length + 1) + 
                            ' OR u.last_name ILIKE $' + (countParams.length + 1) + 
                            ' OR u.email ILIKE $' + (countParams.length + 1) + ')';
                const searchTerm = `%${search}%`;
                countParams.push(searchTerm);
            }

            if (status && status !== '') {
                countQuery += ' AND u.status = $' + (countParams.length + 1);
                countParams.push(status);
            }

            if (role && role !== '') {
                countQuery += ' AND u.role = $' + (countParams.length + 1);
                countParams.push(role);
            }

            const countResult = await db.query(countQuery, countParams);
            const total = parseInt(countResult.rows[0].total);

            // Formatar dados para o frontend
            const formattedUsers = users.map(user => ({
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                status: user.status,
                createdAt: user.createdAt,
                lastLogin: user.lastLogin,
                phone: user.phone,
                bio: user.bio,
                avatarUrl: user.avatarUrl,
                emailVerified: user.emailVerified,
                specialization: user.specialization || null,
                experienceYears: user.experienceYears || 0,
                rating: user.rating || 0,
                isVerified: Boolean(user.isVerified)
            }));

            console.log(`✅ Encontrados ${formattedUsers.length} usuários de ${total} total`);

            res.json({
                success: true,
                data: {
                    users: formattedUsers,
                    pagination: {
                        total,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        pages: Math.ceil(total / limit)
                    }
                }
            });

        } catch (error) {
            console.error('❌ Erro ao buscar usuários do banco:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar usuários',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // GET /api/admin/users/:id - Buscar usuário específico (REAL)
    async getUser(req, res) {
        try {
            const { id } = req.params;
            console.log('🔍 Buscando usuário específico do banco:', id, 'Admin:', req.user.id);

            const result = await db.query(`
                SELECT 
                    u.id,
                    u.first_name as "firstName",
                    u.last_name as "lastName",
                    u.email,
                    u.role,
                    u.status,
                    u.created_at as "createdAt",
                    u.updated_at as "updatedAt",
                    u.last_login as "lastLogin",
                    u.phone,
                    u.bio,
                    u.avatar_url as "avatarUrl",
                    u.email_verified as "emailVerified",
                    mp.specialization,
                    mp.experience_years as "experienceYears",
                    mp.rating,
                    mp.is_verified as "isVerified",
                    mp.hourly_rate as "hourlyRate",
                    mp.bio as "mentorBio",
                    mp.expertise_areas as "expertiseAreas",
                    mp.availability
                FROM users u
                LEFT JOIN mentor_profiles mp ON u.id = mp.user_id
                WHERE u.id = $1
            `, [id]);

            if (result.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado'
                });
            }

            const user = result.rows[0];

            res.json({
                success: true,
                data: {
                    user: {
                        ...user,
                        isVerified: Boolean(user.isVerified),
                        emailVerified: Boolean(user.emailVerified)
                    }
                }
            });
        } catch (error) {
            console.error('❌ Erro em getUser:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao buscar usuário',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // PUT /api/admin/users/:id - Atualizar usuário (REAL)
    async updateUser(req, res) {
        try {
            const { id } = req.params;
            const { firstName, lastName, email, role, status, phone, bio } = req.body;

            console.log('✏️ Atualizando usuário no banco:', id, 'Admin:', req.user.id);

            // Verificar se usuário existe
            const existingUser = await db.query('SELECT id FROM users WHERE id = $1', [id]);
            if (existingUser.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado'
                });
            }

            // Atualizar usuário
            const updateQuery = `
                UPDATE users 
                SET 
                    first_name = COALESCE($1, first_name),
                    last_name = COALESCE($2, last_name),
                    email = COALESCE($3, email),
                    role = COALESCE($4, role),
                    status = COALESCE($5, status),
                    phone = COALESCE($6, phone),
                    bio = COALESCE($7, bio),
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = $8
                RETURNING *
            `;
            
            const updateResult = await db.query(updateQuery, [
                firstName, lastName, email, role, status, phone, bio, id
            ]);

            const updatedUser = updateResult.rows[0];

            res.json({
                success: true,
                message: 'Usuário atualizado com sucesso',
                data: {
                    user: {
                        id: updatedUser.id,
                        firstName: updatedUser.first_name,
                        lastName: updatedUser.last_name,
                        email: updatedUser.email,
                        role: updatedUser.role,
                        status: updatedUser.status,
                        phone: updatedUser.phone,
                        bio: updatedUser.bio,
                        updatedAt: updatedUser.updated_at
                    }
                }
            });
        } catch (error) {
            console.error('❌ Erro em updateUser:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao atualizar usuário',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // PATCH /api/admin/users/:id/promote - Promover para mentor (REAL)
    async promoteToMentor(req, res) {
        try {
            const { id } = req.params;
            console.log('⭐ Promovendo usuário a mentor:', id, 'Admin:', req.user.id);

            // Verificar se usuário existe
            const userResult = await db.query('SELECT id, role FROM users WHERE id = $1', [id]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado'
                });
            }

            const user = userResult.rows[0];

            if (user.role === 'mentor') {
                return res.status(400).json({
                    success: false,
                    message: 'Usuário já é um mentor'
                });
            }

            // Atualizar role para mentor
            await db.query(
                'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                ['mentor', id]
            );

            // Criar perfil de mentor básico se não existir
            try {
                const mentorProfileExists = await db.query(
                    'SELECT id FROM mentor_profiles WHERE user_id = $1',
                    [id]
                );

                if (mentorProfileExists.rows.length === 0) {
                    await db.query(
                        `INSERT INTO mentor_profiles (user_id, specialization, bio, is_verified) 
                         VALUES ($1, $2, $3, $4)`,
                        [id, 'Geral', 'Mentor promovido pelo administrador', false]
                    );
                }
            } catch (error) {
                console.log('⚠️ Não foi possível criar perfil de mentor:', error.message);
            }

            res.json({
                success: true,
                message: 'Usuário promovido a mentor com sucesso',
                data: { userId: id, role: 'mentor' }
            });
        } catch (error) {
            console.error('❌ Erro em promoteToMentor:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao promover usuário',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // PATCH /api/admin/users/:id/status - Alterar status do usuário (REAL)
    async toggleUserStatus(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            console.log('🔄 Alterando status do usuário:', id, 'Para:', status, 'Admin:', req.user.id);

            // Validar status
            const validStatuses = ['active', 'inactive', 'suspended'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Status inválido. Use: active, inactive ou suspended'
                });
            }

            // Verificar se usuário existe
            const userResult = await db.query('SELECT id FROM users WHERE id = $1', [id]);
            if (userResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Usuário não encontrado'
                });
            }

            // Atualizar status
            await db.query(
                'UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
                [status, id]
            );

            res.json({
                success: true,
                message: `Status do usuário alterado para ${status}`,
                data: { userId: id, status }
            });
        } catch (error) {
            console.error('❌ Erro em toggleUserStatus:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao alterar status do usuário',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // GET /api/admin/mentors - Listar mentores (REAL)
    async getMentors(req, res) {
        try {
            const { search = '', status = '', page = 1, limit = 10 } = req.query;
            console.log('👨‍🏫 Buscando mentores do banco. Admin:', req.user.id);

            let query = `
                SELECT 
                    u.id,
                    u.first_name as "firstName",
                    u.last_name as "lastName",
                    u.email,
                    u.status,
                    u.created_at as "createdAt",
                    u.last_login as "lastLogin",
                    mp.specialization,
                    mp.experience_years as "experienceYears",
                    mp.rating,
                    mp.is_verified as "isVerified",
                    mp.bio,
                    mp.hourly_rate as "hourlyRate",
                    mp.total_sessions as "totalSessions"
                FROM users u
                INNER JOIN mentor_profiles mp ON u.id = mp.user_id
                WHERE u.role = 'mentor'
            `;
            const params = [];

            if (search) {
                query += ' AND (u.first_name ILIKE $' + (params.length + 1) + 
                         ' OR u.last_name ILIKE $' + (params.length + 1) + 
                         ' OR u.email ILIKE $' + (params.length + 1) + 
                         ' OR mp.specialization ILIKE $' + (params.length + 1) + ')';
                const searchTerm = `%${search}%`;
                params.push(searchTerm);
            }

            if (status && status !== '') {
                query += ' AND u.status = $' + (params.length + 1);
                params.push(status);
            }

            query += ' ORDER BY u.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
            const offset = (page - 1) * limit;
            params.push(parseInt(limit), offset);

            const result = await db.query(query, params);
            const mentors = result.rows;

            // Contar total
            let countQuery = `
                SELECT COUNT(*) as total 
                FROM users u
                INNER JOIN mentor_profiles mp ON u.id = mp.user_id
                WHERE u.role = 'mentor'
            `;
            const countParams = [];

            if (search) {
                countQuery += ' AND (u.first_name ILIKE $' + (countParams.length + 1) + 
                            ' OR u.last_name ILIKE $' + (countParams.length + 1) + 
                            ' OR u.email ILIKE $' + (countParams.length + 1) + 
                            ' OR mp.specialization ILIKE $' + (countParams.length + 1) + ')';
                const searchTerm = `%${search}%`;
                countParams.push(searchTerm);
            }

            if (status && status !== '') {
                countQuery += ' AND u.status = $' + (countParams.length + 1);
                countParams.push(status);
            }

            const countResult = await db.query(countQuery, countParams);
            const total = parseInt(countResult.rows[0].total);

            res.json({
                success: true,
                data: {
                    mentors: mentors.map(mentor => ({
                        ...mentor,
                        isVerified: Boolean(mentor.isVerified),
                        rating: mentor.rating || 0,
                        experienceYears: mentor.experienceYears || 0,
                        totalSessions: mentor.totalSessions || 0
                    })),
                    pagination: {
                        total,
                        page: parseInt(page),
                        limit: parseInt(limit),
                        pages: Math.ceil(total / limit)
                    }
                }
            });
        } catch (error) {
            console.error('❌ Erro em getMentors:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar mentores',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // PATCH /api/admin/mentors/:id/verify - Verificar mentor (REAL)
    async verifyMentor(req, res) {
        try {
            const { id } = req.params;
            console.log('✅ Verificando mentor:', id, 'Admin:', req.user.id);

            // Verificar se é um mentor
            const mentorResult = await db.query(
                'SELECT id FROM users WHERE id = $1 AND role = $2',
                [id, 'mentor']
            );

            if (mentorResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Mentor não encontrado'
                });
            }

            // Verificar se tem perfil de mentor
            const profileResult = await db.query(
                'SELECT is_verified FROM mentor_profiles WHERE user_id = $1',
                [id]
            );

            if (profileResult.rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Perfil de mentor não encontrado'
                });
            }

            const currentVerification = profileResult.rows[0].is_verified;
            const newVerificationStatus = !currentVerification;

            // Atualizar verificação
            await db.query(
                `UPDATE mentor_profiles 
                 SET is_verified = $1, 
                     verified_at = $2,
                     updated_at = CURRENT_TIMESTAMP 
                 WHERE user_id = $3`,
                [newVerificationStatus, newVerificationStatus ? new Date() : null, id]
            );

            res.json({
                success: true,
                message: `Mentor ${newVerificationStatus ? 'verificado' : 'desverificado'} com sucesso`,
                data: { 
                    mentorId: id, 
                    isVerified: newVerificationStatus 
                }
            });
        } catch (error) {
            console.error('❌ Erro em verifyMentor:', error);
            res.status(500).json({
                success: false,
                message: 'Erro ao verificar mentor',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    },

    // GET /api/admin/mentorships - Listar mentorias (MOCK - implementar quando tiver tabela)
    async getMentorships(req, res) {
        try {
            const { search = '', status = '', page = 1, limit = 10 } = req.query;
            console.log('🤝 Buscando mentorias. Admin:', req.user.id);

            // Dados mock - implementar quando tiver tabela de mentorias
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

    // POST /api/admin/mentorships - Criar mentoria (MOCK - implementar quando tiver tabela)
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

    // PUT /api/admin/mentorships/:id - Atualizar mentoria (MOCK - implementar quando tiver tabela)
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

    // GET /api/admin/activity - Atividades recentes (REAL)
    async getRecentActivity(req, res) {
        try {
            console.log('📝 Buscando atividades recentes do banco. Admin:', req.user.id);

            // Buscar últimos usuários registrados
            const recentUsersResult = await db.query(`
                SELECT 
                    id, 
                    first_name as "firstName", 
                    last_name as "lastName", 
                    email, 
                    role, 
                    created_at as "createdAt"
                FROM users 
                ORDER BY created_at DESC 
                LIMIT 10
            `);

            const activities = recentUsersResult.rows.map((user) => ({
                id: `user_${user.id}`,
                userId: user.id,
                userInitials: (user.firstName[0] + user.lastName[0]).toUpperCase(),
                description: `Novo usuário registrado - ${user.firstName} ${user.lastName} (${user.role})`,
                type: 'user_registered',
                timestamp: user.createdAt
            }));

            // Buscar atualizações de perfis de mentores
            try {
                const recentMentorUpdates = await db.query(`
                    SELECT 
                        mp.updated_at as "updatedAt",
                        u.id,
                        u.first_name as "firstName",
                        u.last_name as "lastName"
                    FROM mentor_profiles mp
                    JOIN users u ON mp.user_id = u.id
                    WHERE mp.updated_at > mp.created_at
                    ORDER BY mp.updated_at DESC
                    LIMIT 5
                `);

                recentMentorUpdates.rows.forEach(mentor => {
                    activities.push({
                        id: `mentor_update_${mentor.id}`,
                        userId: mentor.id,
                        userInitials: (mentor.firstName[0] + mentor.lastName[0]).toUpperCase(),
                        description: `Perfil de mentor atualizado - ${mentor.firstName} ${mentor.lastName}`,
                        type: 'mentor_updated',
                        timestamp: mentor.updatedAt
                    });
                });
            } catch (error) {
                console.log('⚠️ Não foi possível buscar atualizações de mentores:', error.message);
            }

            // Ordenar por timestamp (mais recente primeiro) e pegar apenas 10
            const sortedActivities = activities
                .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                .slice(0, 10);

            res.json({
                success: true,
                data: sortedActivities
            });
        } catch (error) {
            console.error('❌ Erro em getRecentActivity:', error);
            res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar atividades',
                error: process.env.NODE_ENV === 'development' ? error.message : undefined
            });
        }
    }
};

module.exports = adminController;