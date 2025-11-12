const express = require('express');
const { authenticate } = require('../middlewares/auth');
const db = require('../config/database');

const router = express.Router();

// Rota para listar mentores (agora busca do banco)
router.get('/', async (req, res) => {
  try {
    console.log('📋 Listando mentores do banco...');
    
    // Buscar mentores com perfis do banco
    const mentors = await db.query(`
      SELECT 
        u.id,
        u.first_name,
        u.last_name,
        u.avatar_url,
        u.bio as user_bio,
        mp.specialization,
        mp.experience_years,
        mp.hourly_rate,
        mp.bio as mentor_bio,
        mp.expertise_areas,
        mp.rating,
        mp.total_sessions,
        mp.is_verified
      FROM users u
      LEFT JOIN mentor_profiles mp ON u.id = mp.user_id
      WHERE u.role = 'mentor' AND u.status = 'active'
      ORDER BY 
        mp.is_verified DESC,
        mp.rating DESC NULLS LAST, 
        mp.total_sessions DESC
    `);

    console.log(`✅ Encontrados ${mentors.rows.length} mentores`);

    // Se não houver mentores no banco, usar dados mock
    if (mentors.rows.length === 0) {
      console.log('ℹ️  Nenhum mentor no banco, usando dados mock');
      return getMockMentores(req, res);
    }

    const formattedMentors = mentors.rows.map(mentor => {
      const expertise = mentor.expertise_areas ? 
        (Array.isArray(mentor.expertise_areas) ? 
          mentor.expertise_areas : 
          JSON.parse(mentor.expertise_areas)) : 
        ['investimentos', 'mercado financeiro'];

      return {
        id: mentor.id,
        name: `${mentor.first_name} ${mentor.last_name}`,
        role: mentor.specialization || 'Mentor',
        company: 'Consultor Independente',
        area: 'FIN',
        expertise: expertise,
        rating: parseFloat(mentor.rating) || 4.5,
        reviews: mentor.total_sessions || 0,
        experience: `${mentor.experience_years || 0} anos`,
        price: mentor.hourly_rate || 100,
        plan: mentor.is_verified ? 'pro' : 'basic',
        available: true,
        avatar: mentor.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
        description: mentor.mentor_bio || mentor.user_bio || 'Mentor especializado em finanças e investimentos.',
        is_verified: mentor.is_verified,
        specialization: mentor.specialization,
        hasProfile: !!mentor.specialization // Indica se tem perfil completo
      };
    });

    res.json({
      success: true,
      data: formattedMentors,
      pagination: {
        total: formattedMentors.length,
        page: 1,
        limit: 12,
        totalPages: 1
      }
    });

  } catch (error) {
    console.error('❌ Erro ao listar mentores do banco:', error);
    // Fallback para dados mock em caso de erro
    getMockMentores(req, res);
  }
});

// Função fallback com dados mock
function getMockMentores(req, res) {
  const mentors = [
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
      hasProfile: true
    },
    // ... outros mentores mock
  ];

  res.json({
    success: true,
    data: mentors,
    pagination: {
      total: mentors.length,
      page: 1,
      limit: 12,
      totalPages: 1
    }
  });
}

// Resto das rotas permanecem iguais...
router.get('/areas', (req, res) => {
  const areas = [
    { code: 'FIN', name: 'Finanças, Inovação e Negócio', color: 'from-primary to-orange-400', mentors: 4 },
    { code: 'TECH', name: 'Tecnologia & Inovação', color: 'from-blue-500 to-cyan-400', mentors: 3 },
    { code: 'BIZ', name: 'Business & Empreendedorismo', color: 'from-green-500 to-emerald-400', mentors: 2 },
    { code: 'AGRO', name: 'Agronegócio & Sustentabilidade', color: 'from-yellow-500 to-amber-400', mentors: 2 },
    { code: 'LIFE', name: 'Desenvolvimento Pessoal', color: 'from-purple-500 to-pink-400', mentors: 2 },
    { code: 'HEALTH', name: 'Saúde & Bem-estar', color: 'from-red-500 to-rose-400', mentors: 1 }
  ];

  res.json({
    success: true,
    data: areas
  });
});

router.post('/:id/favorite', authenticate, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  console.log(`❤️ Usuário ${userId} favoritando mentor ${id}`);
  
  res.json({
    success: true,
    isFavorite: true,
    message: 'Mentor adicionado aos favoritos!'
  });
});

module.exports = router;