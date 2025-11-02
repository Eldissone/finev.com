const db = require('../config/database');
const bcrypt = require('bcryptjs');

class User {
  // Criar usuário
  static async create(userData) {
    const { firstName, lastName, email, password } = userData;

    console.log('📝 Tentando criar usuário:', email);

    try {
      // Verificar se usuário já existe
      const existingUser = await db.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );

      if (existingUser.rows.length > 0) {
        console.log('❌ Usuário já existe:', email);
        throw new Error('Usuário já existe');
      }

      // Hash da senha
      const saltRounds = 12;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Inserir usuário
      const result = await db.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, created_at) 
         VALUES ($1, $2, $3, $4, NOW()) 
         RETURNING id, first_name, last_name, email, created_at`,
        [firstName, lastName, email, hashedPassword]
      );

      console.log('✅ Usuário criado com sucesso:', email);
      return result.rows[0];

    } catch (error) {
      console.error('❌ Erro ao criar usuário:', error.message);
      throw error;
    }
  }

  // Buscar usuário por email
  static async findByEmail(email) {
    try {
      const result = await db.query(
        'SELECT * FROM users WHERE email = $1',
        [email]
      );

      if (result.rows.length > 0) {
        console.log('✅ Usuário encontrado:', email);
        return result.rows[0];
      } else {
        console.log('❌ Usuário não encontrado:', email);
        return null;
      }

    } catch (error) {
      console.error('❌ Erro ao buscar usuário por email:', error.message);
      throw error;
    }
  }

  // Buscar usuário por ID
  static async findById(id) {
    try {
      const result = await db.query(
        'SELECT id, first_name, last_name, email, created_at FROM users WHERE id = $1',
        [id]
      );

      if (result.rows.length > 0) {
        return result.rows[0];
      } else {
        console.log('❌ Usuário não encontrado por ID:', id);
        return null;
      }

    } catch (error) {
      console.error('❌ Erro ao buscar usuário por ID:', error.message);
      throw error;
    }
  }

  // Verificar senha
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      const isValid = await bcrypt.compare(plainPassword, hashedPassword);
      console.log('🔐 Verificação de senha:', isValid ? '✅ Válida' : '❌ Inválida');
      return isValid;
    } catch (error) {
      console.error('❌ Erro ao verificar senha:', error.message);
      return false;
    }
  }

  // Listar todos os usuários (para debug)
  static async findAll() {
    try {
      const result = await db.query(
        'SELECT id, first_name, last_name, email, created_at FROM users ORDER BY created_at DESC'
      );
      return result.rows;
    } catch (error) {
      console.error('❌ Erro ao listar usuários:', error.message);
      throw error;
    }
  }
}

module.exports = User;
