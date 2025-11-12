// routes/mentorProfile.js
const express = require('express');
const { authenticate } = require('../middlewares/auth');
const db = require('../config/database');

const router = express.Router();

// GET - Obter perfil completo do mentor
router.get('/:id', async (req, res) => {
  try {
    const mentorId = req.params.id;
    
    console.log('📋 Buscando perfil do mentor:', mentorId);

    const mentorProfile = await db.query(`
      SELECT 
        u.id, 
        u.first_name, 
        u.last_name, 
        u.email, 
        u.phone, 
        u.bio as user_bio, 
        u.avatar_url,
        mp.id as profile_id,
        mp.specialization, 
        mp.experience_years, 
        mp.hourly_rate, 
        mp.bio as mentor_bio,
        mp.expertise_areas, 
        mp.availability, 
        mp.rating, 
        mp.total_sessions,
        mp.is_verified, 
        mp.verified_at,
        mp.created_at,
        mp.updated_at
      FROM users u
      LEFT JOIN mentor_profiles mp ON u.id = mp.user_id
      WHERE u.id = $1 AND u.role = 'mentor'
    `, [mentorId]);

    if (mentorProfile.rows.length === 0) {
      return res.status(404).json({ 
        success: false,
        error: 'Mentor não encontrado' 
      });
    }

    const profile = mentorProfile.rows[0];
    
    // Formatar dados para o frontend
    const formattedProfile = {
      id: profile.id,
      name: `${profile.first_name} ${profile.last_name}`,
      role: profile.specialization || 'Mentor',
      company: profile.company || 'Consultor Independente',
      area: 'FIN', // Default area
      expertise: profile.expertise_areas ? 
        (Array.isArray(profile.expertise_areas) ? 
          profile.expertise_areas : 
          JSON.parse(profile.expertise_areas)) : 
        ['investimentos', 'mercado financeiro'],
      rating: parseFloat(profile.rating) || 4.5,
      reviews: profile.total_sessions || 0,
      experience: `${profile.experience_years || 0} anos`,
      price: profile.hourly_rate || 100,
      plan: profile.is_verified ? 'pro' : 'basic',
      available: true,
      avatar: profile.avatar_url || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      description: profile.mentor_bio || profile.user_bio || 'Mentor especializado em finanças e investimentos.',
      responseRate: 95,
      totalSessions: profile.total_sessions || 0,
      avgSessionTime: 55,
      specialization: profile.specialization,
      experience_years: profile.experience_years,
      hourly_rate: profile.hourly_rate,
      is_verified: profile.is_verified
    };

    res.json({
      success: true,
      data: formattedProfile
    });

  } catch (error) {
    console.error('❌ Erro ao carregar perfil do mentor:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao carregar perfil do mentor' 
    });
  }
});

// POST - Criar/Atualizar perfil do mentor
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      specialization,
      experience_years,
      hourly_rate,
      bio,
      expertise_areas,
      availability
    } = req.body;

    const userId = req.user.id;

    console.log('📝 Salvando perfil do mentor:', userId);

    // Verificar se o usuário é mentor
    const userCheck = await db.query(
      'SELECT role FROM users WHERE id = $1', 
      [userId]
    );
    
    if (userCheck.rows.length === 0 || userCheck.rows[0].role !== 'mentor') {
      return res.status(403).json({ 
        success: false,
        error: 'Apenas mentores podem criar perfis' 
      });
    }

    // Verificar se já existe perfil
    const existingProfile = await db.query(
      'SELECT id FROM mentor_profiles WHERE user_id = $1',
      [userId]
    );

    let result;
    if (existingProfile.rows.length > 0) {
      // Atualizar perfil existente
      result = await db.query(`
        UPDATE mentor_profiles 
        SET specialization = $1, experience_years = $2, hourly_rate = $3,
            bio = $4, expertise_areas = $5, availability = $6, updated_at = NOW()
        WHERE user_id = $7
        RETURNING *
      `, [specialization, experience_years, hourly_rate, bio, expertise_areas, availability, userId]);
    } else {
      // Criar novo perfil
      result = await db.query(`
        INSERT INTO mentor_profiles 
        (user_id, specialization, experience_years, hourly_rate, bio, expertise_areas, availability)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `, [userId, specialization, experience_years, hourly_rate, bio, expertise_areas, availability]);
    }

    res.json({ 
      success: true, 
      data: result.rows[0],
      message: existingProfile.rows.length > 0 ? 'Perfil atualizado com sucesso' : 'Perfil criado com sucesso'
    });

  } catch (error) {
    console.error('❌ Erro ao salvar perfil do mentor:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao salvar perfil do mentor' 
    });
  }
});

// GET - Verificar status do perfil do mentor
router.get('/:id/profile-status', authenticate, async (req, res) => {
  try {
    const userId = req.params.id;

    const profile = await db.query(`
      SELECT mp.* 
      FROM mentor_profiles mp
      WHERE mp.user_id = $1
    `, [userId]);

    const hasCompleteProfile = profile.rows.length > 0 && 
                              profile.rows[0].specialization && 
                              profile.rows[0].experience_years !== null;

    res.json({
      success: true,
      data: {
        hasCompleteProfile,
        profile: profile.rows[0] || null
      }
    });

  } catch (error) {
    console.error('❌ Erro ao verificar status do perfil:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao verificar status do perfil' 
    });
  }
});

// GET - Listar todos os mentores com perfis
router.get('/', async (req, res) => {
  try {
    console.log('📋 Listando mentores com perfis...');

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
      INNER JOIN mentor_profiles mp ON u.id = mp.user_id
      WHERE u.role = 'mentor' AND u.status = 'active'
      ORDER BY mp.rating DESC NULLS LAST, mp.total_sessions DESC
    `);

    console.log(`✅ Encontrados ${mentors.rows.length} mentores com perfil`);

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
        specialization: mentor.specialization
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
    console.error('❌ Erro ao listar mentores:', error);
    res.status(500).json({ 
      success: false,
      error: 'Erro ao carregar lista de mentores' 
    });
  }
});

module.exports = router;