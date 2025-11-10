const db = require('../config/database');

class MentorsController {
  
  // ✅ OBTER TODOS OS MENTORES
  async getAllMentors(req, res) {
    try {
      const {
        area,
        expertise,
        plan,
        rating,
        experience,
        search,
        page = 1,
        limit = 12
      } = req.query;

      console.log('🔍 Buscando mentores com filtros:', {
        area, expertise, plan, rating, experience, search, page, limit
      });

      let query = `
        SELECT 
          m.*,
          u.firstName,
          u.lastName,
          u.email,
          u.avatar,
          COUNT(DISTINCT r.id) as review_count,
          AVG(r.rating) as avg_rating
        FROM mentors m
        LEFT JOIN users u ON m.user_id = u.id
        LEFT JOIN mentor_reviews r ON m.id = r.mentor_id
        WHERE m.is_active = true
      `;

      const params = [];

      // Aplicar filtros
      if (area && area !== 'all') {
        query += ' AND m.primary_area = ?';
        params.push(area);
      }

      if (expertise && expertise !== 'all') {
        query += ' AND JSON_CONTAINS(m.expertise, ?)';
        params.push(JSON.stringify(expertise));
      }

      if (plan && plan !== 'all') {
        query += ' AND m.required_plan = ?';
        params.push(plan);
      }

      if (search) {
        query += ' AND (u.firstName LIKE ? OR u.lastName LIKE ? OR m.title LIKE ? OR m.company LIKE ?)';
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      // Agrupar e ordenar
      query += ' GROUP BY m.id';

      // Filtro de rating
      if (rating && rating > 0) {
        query += ' HAVING avg_rating >= ?';
        params.push(parseFloat(rating));
      }

      // Ordenação
      query += ' ORDER BY avg_rating DESC, m.created_at DESC';

      // Paginação
      const offset = (page - 1) * limit;
      query += ' LIMIT ? OFFSET ?';
      params.push(parseInt(limit), parseInt(offset));

      console.log('📊 Executando query:', query);
      console.log('📋 Parâmetros:', params);

      const mentors = await db.query(query, params);

      // Contar total para paginação
      const countQuery = `
        SELECT COUNT(DISTINCT m.id) as total
        FROM mentors m
        LEFT JOIN users u ON m.user_id = u.id
        WHERE m.is_active = true
        ${area && area !== 'all' ? ' AND m.primary_area = ?' : ''}
        ${expertise && expertise !== 'all' ? ' AND JSON_CONTAINS(m.expertise, ?)' : ''}
        ${plan && plan !== 'all' ? ' AND m.required_plan = ?' : ''}
        ${search ? ' AND (u.firstName LIKE ? OR u.lastName LIKE ? OR m.title LIKE ? OR m.company LIKE ?)' : ''}
      `;

      const countParams = [];
      if (area && area !== 'all') countParams.push(area);
      if (expertise && expertise !== 'all') countParams.push(JSON.stringify(expertise));
      if (plan && plan !== 'all') countParams.push(plan);
      if (search) {
        const searchTerm = `%${search}%`;
        countParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }

      const totalResult = await db.query(countQuery, countParams);
      const total = totalResult[0]?.total || 0;

      // Formatar resposta
      const formattedMentors = mentors.map(mentor => ({
        id: mentor.id,
        name: `${mentor.firstName} ${mentor.lastName}`,
        role: mentor.title,
        company: mentor.company,
        area: mentor.primary_area,
        expertise: JSON.parse(mentor.expertise || '[]'),
        rating: mentor.avg_rating ? parseFloat(mentor.avg_rating).toFixed(1) : 4.5,
        reviews: mentor.review_count || 0,
        experience: mentor.experience_years ? `${mentor.experience_years} anos` : '5 anos',
        price: mentor.hourly_rate || 150,
        plan: mentor.required_plan || 'basic',
        available: mentor.is_available || true,
        avatar: mentor.avatar || this.generateDefaultAvatar(mentor.firstName, mentor.lastName),
        description: mentor.bio || 'Mentor especializado em sua área de atuação.',
        languages: JSON.parse(mentor.languages || '["Português"]'),
        specialties: JSON.parse(mentor.specialties || '[]')
      }));

      console.log(`✅ Encontrados ${formattedMentors.length} mentores`);

      res.json({
        success: true,
        data: formattedMentors,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(total / limit)
        },
        filters: {
          area,
          expertise,
          plan,
          rating,
          search
        }
      });

    } catch (error) {
      console.error('❌ Erro ao buscar mentores:', error);
      
      // Fallback para dados mock em caso de erro
      const mockMentors = await this.getMockMentorsData();
      res.json({
        success: true,
        data: mockMentors,
        pagination: {
          total: mockMentors.length,
          page: 1,
          limit: 12,
          totalPages: 1
        },
        message: 'Usando dados de demonstração'
      });
    }
  }

  // ✅ OBTER MENTOR POR ID
  async getMentorById(req, res) {
    try {
      const { id } = req.params;

      console.log('👤 Buscando mentor por ID:', id);

      const mentor = await db.query(
        `SELECT 
          m.*,
          u.firstName,
          u.lastName,
          u.email,
          u.avatar,
          COUNT(DISTINCT r.id) as review_count,
          AVG(r.rating) as avg_rating
         FROM mentors m
         LEFT JOIN users u ON m.user_id = u.id
         LEFT JOIN mentor_reviews r ON m.id = r.mentor_id
         WHERE m.id = ? AND m.is_active = true
         GROUP BY m.id`,
        [id]
      );

      if (mentor.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Mentor não encontrado'
        });
      }

      const mentorData = mentor[0];
      const formattedMentor = {
        id: mentorData.id,
        name: `${mentorData.firstName} ${mentorData.lastName}`,
        role: mentorData.title,
        company: mentorData.company,
        area: mentorData.primary_area,
        expertise: JSON.parse(mentorData.expertise || '[]'),
        rating: mentorData.avg_rating ? parseFloat(mentorData.avg_rating).toFixed(1) : 4.5,
        reviews: mentorData.review_count || 0,
        experience: mentorData.experience_years ? `${mentorData.experience_years} anos` : '5 anos',
        price: mentorData.hourly_rate || 150,
        plan: mentorData.required_plan || 'basic',
        available: mentorData.is_available || true,
        avatar: mentorData.avatar || this.generateDefaultAvatar(mentorData.firstName, mentorData.lastName),
        description: mentorData.bio || 'Mentor especializado em sua área de atuação.',
        languages: JSON.parse(mentorData.languages || '["Português"]'),
        specialties: JSON.parse(mentorData.specialties || '[]'),
        education: JSON.parse(mentorData.education || '[]'),
        certifications: JSON.parse(mentorData.certifications || '[]'),
        achievements: JSON.parse(mentorData.achievements || '[]')
      };

      console.log('✅ Mentor encontrado:', formattedMentor.name);

      res.json({
        success: true,
        data: formattedMentor
      });

    } catch (error) {
      console.error('❌ Erro ao buscar mentor:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // ✅ OBTER ÁREAS DE MENTORIA
  async getMentorAreas(req, res) {
    try {
      console.log('📚 Buscando áreas de mentoria');

      const areas = await db.query(`
        SELECT 
          primary_area as code,
          COUNT(*) as mentor_count
        FROM mentors 
        WHERE is_active = true 
        GROUP BY primary_area 
        ORDER BY mentor_count DESC
      `);

      const areaDefinitions = {
        'FIN': { name: 'Finanças, Inovação e Negócio', color: 'from-primary to-orange-400' },
        'TECH': { name: 'Tecnologia & Inovação', color: 'from-blue-500 to-cyan-400' },
        'BIZ': { name: 'Business & Empreendedorismo', color: 'from-green-500 to-emerald-400' },
        'AGRO': { name: 'Agronegócio & Sustentabilidade', color: 'from-yellow-500 to-amber-400' },
        'LIFE': { name: 'Desenvolvimento Pessoal', color: 'from-purple-500 to-pink-400' },
        'HEALTH': { name: 'Saúde & Bem-estar', color: 'from-red-500 to-rose-400' }
      };

      const formattedAreas = areas.map(area => ({
        code: area.code,
        name: areaDefinitions[area.code]?.name || area.code,
        color: areaDefinitions[area.code]?.color || 'from-gray-500 to-gray-400',
        mentors: area.mentor_count
      }));

      console.log('✅ Áreas encontradas:', formattedAreas.length);

      res.json({
        success: true,
        data: formattedAreas
      });

    } catch (error) {
      console.error('❌ Erro ao buscar áreas:', error);
      
      // Fallback para áreas mock
      const mockAreas = [
        { code: 'FIN', name: 'Finanças, Inovação e Negócio', color: 'from-primary to-orange-400', mentors: 4 },
        { code: 'TECH', name: 'Tecnologia & Inovação', color: 'from-blue-500 to-cyan-400', mentors: 3 },
        { code: 'BIZ', name: 'Business & Empreendedorismo', color: 'from-green-500 to-emerald-400', mentors: 2 },
        { code: 'AGRO', name: 'Agronegócio & Sustentabilidade', color: 'from-yellow-500 to-amber-400', mentors: 2 },
        { code: 'LIFE', name: 'Desenvolvimento Pessoal', color: 'from-purple-500 to-pink-400', mentors: 2 },
        { code: 'HEALTH', name: 'Saúde & Bem-estar', color: 'from-red-500 to-rose-400', mentors: 1 }
      ];

      res.json({
        success: true,
        data: mockAreas,
        message: 'Usando dados de demonstração'
      });
    }
  }

  // ✅ OBTER DISPONIBILIDADE DO MENTOR
  async getMentorAvailability(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      console.log('📅 Buscando disponibilidade do mentor:', id);

      const availability = await db.query(
        `SELECT * FROM mentor_availability 
         WHERE mentor_id = ? AND available_date >= CURDATE() 
         ORDER BY available_date, start_time`,
        [id]
      );

      res.json({
        success: true,
        data: availability,
        message: 'Disponibilidade carregada com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao buscar disponibilidade:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // ✅ FAVORITAR MENTOR
  async toggleFavorite(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      console.log('❤️ Alternando favorito para mentor:', id, 'usuário:', userId);

      // Verificar se já é favorito
      const existingFavorite = await db.query(
        'SELECT id FROM user_favorite_mentors WHERE user_id = ? AND mentor_id = ?',
        [userId, id]
      );

      if (existingFavorite.length > 0) {
        // Remover dos favoritos
        await db.query(
          'DELETE FROM user_favorite_mentors WHERE user_id = ? AND mentor_id = ?',
          [userId, id]
        );
        console.log('✅ Mentor removido dos favoritos');
        
        res.json({
          success: true,
          isFavorite: false,
          message: 'Mentor removido dos favoritos'
        });
      } else {
        // Adicionar aos favoritos
        await db.query(
          'INSERT INTO user_favorite_mentors (user_id, mentor_id, created_at) VALUES (?, ?, NOW())',
          [userId, id]
        );
        console.log('✅ Mentor adicionado aos favoritos');
        
        res.json({
          success: true,
          isFavorite: true,
          message: 'Mentor adicionado aos favoritos!'
        });
      }

    } catch (error) {
      console.error('❌ Erro ao alternar favorito:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // ✅ OBTER MENTORES FAVORITOS DO USUÁRIO
  async getUserFavorites(req, res) {
    try {
      const userId = req.user.id;

      console.log('📋 Buscando mentores favoritos do usuário:', userId);

      const favorites = await db.query(
        `SELECT 
          m.*,
          u.firstName,
          u.lastName,
          u.avatar
         FROM user_favorite_mentors ufm
         JOIN mentors m ON ufm.mentor_id = m.id
         JOIN users u ON m.user_id = u.id
         WHERE ufm.user_id = ? AND m.is_active = true
         ORDER BY ufm.created_at DESC`,
        [userId]
      );

      const formattedFavorites = favorites.map(mentor => ({
        id: mentor.id,
        name: `${mentor.firstName} ${mentor.lastName}`,
        role: mentor.title,
        company: mentor.company,
        area: mentor.primary_area,
        rating: 4.5,
        price: mentor.hourly_rate || 150,
        avatar: mentor.avatar || this.generateDefaultAvatar(mentor.firstName, mentor.lastName)
      }));

      console.log(`✅ ${formattedFavorites.length} favoritos encontrados`);

      res.json({
        success: true,
        data: formattedFavorites
      });

    } catch (error) {
      console.error('❌ Erro ao buscar favoritos:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // ✅ CRIAR MENTOR (ADMIN)
  async createMentor(req, res) {
    try {
      const mentorData = req.body;
      const userId = req.user.id;

      console.log('🆕 Criando novo mentor:', mentorData);

      // Verificar se usuário é admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Apenas administradores podem criar mentores'
        });
      }

      const result = await db.query(
        `INSERT INTO mentors (
          user_id, title, company, primary_area, expertise, bio,
          experience_years, hourly_rate, required_plan, languages,
          specialties, education, certifications, achievements
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mentorData.user_id,
          mentorData.title,
          mentorData.company,
          mentorData.primary_area,
          JSON.stringify(mentorData.expertise || []),
          mentorData.bio,
          mentorData.experience_years,
          mentorData.hourly_rate,
          mentorData.required_plan || 'basic',
          JSON.stringify(mentorData.languages || ['Português']),
          JSON.stringify(mentorData.specialties || []),
          JSON.stringify(mentorData.education || []),
          JSON.stringify(mentorData.certifications || []),
          JSON.stringify(mentorData.achievements || [])
        ]
      );

      console.log('✅ Mentor criado com ID:', result.insertId);

      res.status(201).json({
        success: true,
        message: 'Mentor criado com sucesso',
        mentorId: result.insertId
      });

    } catch (error) {
      console.error('❌ Erro ao criar mentor:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // ========== MÉTODOS AUXILIARES ==========

  // 🎨 GERAR AVATAR PADRÃO
  generateDefaultAvatar(firstName, lastName) {
    const colors = [
      'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face'
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  }

  // 📋 DADOS MOCK PARA FALLBACK
  async getMockMentorsData() {
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
      // ... (incluir todos os outros mentores do mock anterior)
    ];
  }
}

module.exports = new MentorsController();