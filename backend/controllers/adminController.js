// backend/controllers/adminController.js
const User = require('../models/User');

class AdminController {
  // Estatísticas do admin
  async getStats(req, res) {
    try {
      const db = require('../config/database');
      
      const [
        totalUsers,
        activeMentors,
        activeMentorships,
        completionRate
      ] = await Promise.all([
        db.query('SELECT COUNT(*) FROM users'),
        db.query('SELECT COUNT(*) FROM users WHERE role = $1 AND status = $2', ['mentor', 'active']),
        db.query('SELECT COUNT(*) FROM mentorships WHERE status = $1', ['active']),
        db.query(`SELECT 
          COALESCE(
            ROUND(
              (SELECT COUNT(*) FROM mentorships WHERE status = 'completed')::decimal / 
              NULLIF((SELECT COUNT(*) FROM mentorships WHERE status IN ('completed', 'cancelled')), 0) * 100, 2
            ), 0
          ) as rate`)
      ]);

      res.json({
        success: true,
        data: {
          totalUsers: parseInt(totalUsers.rows[0].count),
          activeMentors: parseInt(activeMentors.rows[0].count),
          activeMentorships: parseInt(activeMentorships.rows[0].count) || 0,
          completionRate: `${completionRate.rows[0].rate}%` || '0%'
        }
      });
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Listar usuários
  async getUsers(req, res) {
    try {
      const users = await User.findAll(req.query);
      res.json({
        success: true,
        data: users
      });
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Buscar usuário específico
  async getUser(req, res) {
    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado'
        });
      }

      res.json({
        success: true,
        data: { user }
      });
    } catch (error) {
      console.error('Erro ao buscar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar usuário
  async updateUser(req, res) {
    try {
      const user = await User.update(req.params.id, req.body);
      res.json({
        success: true,
        data: { user },
        message: 'Usuário atualizado com sucesso'
      });
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Promover para mentor
  async promoteToMentor(req, res) {
    try {
      const result = await User.promoteToMentor(req.params.id, req.body);
      res.json({
        success: true,
        data: result,
        message: 'Usuário promovido a mentor com sucesso'
      });
    } catch (error) {
      console.error('Erro ao promover usuário:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Alterar status do usuário
  async toggleUserStatus(req, res) {
    try {
      const { status } = req.body;
      const user = await User.update(req.params.id, { status });
      
      res.json({
        success: true,
        data: { user },
        message: `Usuário ${status === 'active' ? 'ativado' : 'suspenso'} com sucesso`
      });
    } catch (error) {
      console.error('Erro ao alterar status:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Listar mentores
  async getMentors(req, res) {
    try {
      const db = require('../config/database');
      const result = await db.query(`
        SELECT u.id, u.first_name, u.last_name, u.email, u.status, u.created_at,
               mp.specialization, mp.experience_years, mp.rating, mp.total_sessions, mp.is_verified
        FROM users u
        LEFT JOIN mentor_profiles mp ON u.id = mp.user_id
        WHERE u.role = 'mentor'
        ORDER BY u.created_at DESC
      `);

      res.json({
        success: true,
        data: {
          mentors: result.rows
        }
      });
    } catch (error) {
      console.error('Erro ao listar mentores:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Listar mentorias (placeholder)
  async getMentorships(req, res) {
    try {
      // Implementar quando tiver tabela de mentorias
      res.json({
        success: true,
        data: {
          mentorships: [],
          pagination: {
            page: 1,
            limit: 10,
            total: 0,
            pages: 0
          }
        }
      });
    } catch (error) {
      console.error('Erro ao listar mentorias:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Criar mentoria (placeholder)
  async createMentorship(req, res) {
    try {
      res.json({
        success: true,
        message: 'Funcionalidade em desenvolvimento',
        data: req.body
      });
    } catch (error) {
      console.error('Erro ao criar mentoria:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar mentoria (placeholder)
  async updateMentorship(req, res) {
    try {
      res.json({
        success: true,
        message: 'Funcionalidade em desenvolvimento',
        data: req.body
      });
    } catch (error) {
      console.error('Erro ao atualizar mentoria:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Gestão de conteúdo (placeholder)
  async getContent(req, res) {
    try {
      res.json({
        success: true,
        data: {
          articles: [],
          suggestions: [
            'Mentoria para carreira em tecnologia',
            'Como fazer transição de carreira', 
            'Desenvolvimento de soft skills'
          ]
        }
      });
    } catch (error) {
      console.error('Erro ao buscar conteúdo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Criar artigo (placeholder)
  async createArticle(req, res) {
    try {
      res.json({
        success: true,
        message: 'Funcionalidade em desenvolvimento',
        data: req.body
      });
    } catch (error) {
      console.error('Erro ao criar artigo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }

  // Atualizar artigo (placeholder)
  async updateArticle(req, res) {
    try {
      res.json({
        success: true,
        message: 'Funcionalidade em desenvolvimento', 
        data: req.body
      });
    } catch (error) {
      console.error('Erro ao atualizar artigo:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor'
      });
    }
  }
}

module.exports = new AdminController();