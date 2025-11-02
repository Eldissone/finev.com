// controllers/authController.js - VERSÃO CORRIGIDA
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

// Gerar token JWT
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '7d' // 7 dias
  });
};

// Registrar usuário
exports.register = async (req, res) => {
  try {
    console.log('📨 Recebendo requisição de registro...');

    // Validar dados
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      console.log('❌ Dados inválidos:', errors.array());
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { firstName, lastName, email, password } = req.body;

    console.log('👤 Tentando registrar:', { firstName, lastName, email });

    // Criar usuário
    const user = await User.create({
      firstName,
      lastName,
      email,
      password
    });

    // Gerar token
    const token = generateToken(user.id);

    console.log('🎉 Usuário registrado com sucesso:', email);
    console.log('🔑 Token gerado:', token ? 'SIM' : 'NÃO');

    res.status(201).json({
      success: true,
      message: 'Usuário criado com sucesso',
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role, // ✅ CORREÇÃO: INCLUIR ROLE
          status: user.status,
          emailVerified: user.email_verified,
          createdAt: user.created_at
        },
        token
      }
    });

  } catch (error) {
    console.error('💥 Erro no registro:', error.message);

    if (error.message === 'Usuário já existe') {
      return res.status(409).json({
        success: false,
        message: 'Este email já está cadastrado'
      });
    }

    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Login do usuário
exports.login = async (req, res) => {
  try {
    console.log('📨 Recebendo requisição de login...');

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Dados inválidos',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    console.log('🔐 Tentando login:', email);

    // Buscar usuário
    const user = await User.findByEmail(email);
    if (!user) {
      console.log('❌ Usuário não encontrado:', email);
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos'
      });
    }

    // Verificar senha
    const isPasswordValid = await User.verifyPassword(password, user.password_hash);
    if (!isPasswordValid) {
      console.log('❌ Senha inválida para:', email);
      return res.status(401).json({
        success: false,
        message: 'Email ou senha incorretos'
      });
    }

    // Gerar token
    const token = generateToken(user.id);

    console.log('🎉 Login realizado com sucesso:', email);
    console.log('🔑 Token gerado:', token ? 'SIM' : 'NÃO');
    console.log('🎯 Role do usuário:', user.role); // ✅ LOG DA ROLE

    res.json({
      success: true,
      message: 'Login realizado com sucesso',
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role, // ✅ CORREÇÃO: INCLUIR ROLE
          status: user.status,
          emailVerified: user.email_verified,
          createdAt: user.created_at
        },
        token
      }
    });

  } catch (error) {
    console.error('💥 Erro no login:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Obter perfil do usuário
exports.getProfile = async (req, res) => {
  try {
    console.log('👤 Buscando perfil para userId:', req.userId);
    
    const user = await User.findById(req.userId);

    if (!user) {
      console.log('❌ Usuário não encontrado no perfil');
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    console.log('✅ Perfil encontrado:', user.email);
    console.log('🎯 Role do usuário:', user.role); // ✅ LOG DA ROLE

    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role, // ✅ CORREÇÃO: INCLUIR ROLE
          status: user.status,
          phone: user.phone,
          bio: user.bio,
          avatarUrl: user.avatar_url,
          emailVerified: user.email_verified,
          lastLogin: user.last_login,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      }
    });

  } catch (error) {
    console.error('💥 Erro ao buscar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Listar usuários (apenas para debug)
exports.listUsers = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({
      success: true,
      data: {
        users,
        total: users.length
      }
    });
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Atualizar perfil do usuário
exports.updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone, bio } = req.body;
    const userId = req.userId;

    console.log('🔄 Atualizando perfil para userId:', userId);

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }

    // Atualizar campos permitidos
    const updatedFields = {};
    if (firstName) updatedFields.first_name = firstName;
    if (lastName) updatedFields.last_name = lastName;
    if (phone !== undefined) updatedFields.phone = phone;
    if (bio !== undefined) updatedFields.bio = bio;

    await User.update(userId, updatedFields);

    // Buscar usuário atualizado
    const updatedUser = await User.findById(userId);

    res.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      data: {
        user: {
          id: updatedUser.id,
          firstName: updatedUser.first_name,
          lastName: updatedUser.last_name,
          email: updatedUser.email,
          role: updatedUser.role, // ✅ INCLUIR ROLE
          status: updatedUser.status,
          phone: updatedUser.phone,
          bio: updatedUser.bio,
          avatarUrl: updatedUser.avatar_url,
          emailVerified: updatedUser.email_verified,
          createdAt: updatedUser.created_at,
          updatedAt: updatedUser.updated_at
        }
      }
    });

  } catch (error) {
    console.error('💥 Erro ao atualizar perfil:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};