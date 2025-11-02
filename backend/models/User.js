// backend/models/User.js
const db = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  // Buscar usuário por ID
  static async findById(id) {
    try {
      const result = await db.query(
        `SELECT id, first_name, last_name, email, role, status, phone, bio, avatar_url, 
                last_login, email_verified, created_at, updated_at
         FROM users WHERE id = $1`,
        [id]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao buscar usuário por ID:', error);
      throw error;
    }
  }

  // Buscar usuário por email
  static async findByEmail(email) {
    try {
      const result = await db.query(
        `SELECT * FROM users WHERE email = $1`,
        [email]
      );
      return result.rows[0];
    } catch (error) {
      console.error('Erro ao buscar usuário por email:', error);
      throw error;
    }
  }

  // Criar usuário
  static async create(userData) {
    try {
      const { firstName, lastName, email, password, role = 'mentee', phone } = userData;
      const hashedPassword = await bcrypt.hash(password, 10);

      const result = await db.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, role, phone)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, first_name, last_name, email, role, status, created_at`,
        [firstName, lastName, email, hashedPassword, role, phone]
      );

      return result.rows[0];
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  // Atualizar usuário
  static async update(id, userData) {
    try {
      const allowedFields = ['first_name', 'last_name', 'email', 'phone', 'bio', 'avatar_url', 'role', 'status'];
      const updates = [];
      const values = [];
      let paramCount = 1;

      Object.keys(userData).forEach(key => {
        const dbKey = key === 'firstName' ? 'first_name' : 
                     key === 'lastName' ? 'last_name' : key;
        
        if (allowedFields.includes(dbKey) && userData[key] !== undefined) {
          updates.push(`${dbKey} = $${paramCount}`);
          values.push(userData[key]);
          paramCount++;
        }
      });

      if (updates.length === 0) {
        throw new Error('Nenhum campo válido para atualizar');
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      values.push(id);

      const result = await db.query(
        `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramCount}
         RETURNING id, first_name, last_name, email, role, status, phone, bio, avatar_url, updated_at`,
        values
      );

      return result.rows[0];
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
      throw error;
    }
  }

  // Promover usuário para mentor
  static async promoteToMentor(userId, mentorData = {}) {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Atualizar role do usuário
      await client.query(
        'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['mentor', userId]
      );

      // Criar perfil de mentor
      const { specialization = 'Geral', experienceYears = 0, hourlyRate = 0, bio = '', expertiseAreas = [], availability = {} } = mentorData;
      
      const result = await client.query(
        `INSERT INTO mentor_profiles 
         (user_id, specialization, experience_years, hourly_rate, bio, expertise_areas, availability)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [userId, specialization, experienceYears, hourlyRate, bio, expertiseAreas, availability]
      );

      await client.query('COMMIT');
      
      return {
        user: await this.findById(userId),
        mentorProfile: result.rows[0]
      };
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Erro ao promover para mentor:', error);
      throw error;
    } finally {
      client.release();
    }
  }

  // Listar usuários com filtros
  static async findAll(filters = {}) {
    try {
      const { search, role, status, page = 1, limit = 10 } = filters;
      const whereConditions = [];
      const values = [];
      let paramCount = 1;

      if (search) {
        whereConditions.push(
          `(first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount} OR email ILIKE $${paramCount})`
        );
        values.push(`%${search}%`);
        paramCount++;
      }

      if (role) {
        whereConditions.push(`role = $${paramCount}`);
        values.push(role);
        paramCount++;
      }

      if (status) {
        whereConditions.push(`status = $${paramCount}`);
        values.push(status);
        paramCount++;
      }

      const whereClause = whereConditions.length > 0 
        ? `WHERE ${whereConditions.join(' AND ')}` 
        : '';

      // Query principal
      const result = await db.query(
        `SELECT id, first_name, last_name, email, role, status, phone, 
                avatar_url, last_login, email_verified, created_at
         FROM users 
         ${whereClause}
         ORDER BY created_at DESC
         LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
        [...values, limit, (page - 1) * limit]
      );

      // Query de count para paginação
      const countResult = await db.query(
        `SELECT COUNT(*) FROM users ${whereClause}`,
        values
      );

      return {
        users: result.rows,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: parseInt(countResult.rows[0].count),
          pages: Math.ceil(countResult.rows[0].count / limit)
        }
      };
    } catch (error) {
      console.error('Erro ao listar usuários:', error);
      throw error;
    }
  }

  // Verificar senha
  static async verifyPassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }

  // Atualizar último login
  static async updateLastLogin(userId) {
    try {
      await db.query(
        'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [userId]
      );
    } catch (error) {
      console.error('Erro ao atualizar último login:', error);
      throw error;
    }
  }
}

module.exports = User;