// backend/middlewares/auth.js
const jwt = require('jsonwebtoken');
const db = require('../config/database'); // Adicione esta linha

const authenticate = async (req, res, next) => { // Mude para async
  try {
    console.log('🔐 Iniciando autenticação...');
    
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      console.log('❌ Token não fornecido');
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ Formato de token inválido');
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido'
      });
    }

    const token = authHeader.substring(7);
    console.log('📋 Token recebido:', token ? 'SIM' : 'NÃO');

    if (!token) {
      console.log('❌ Token vazio');
      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido'
      });
    }

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    console.log('✅ Token válido para usuário:', decoded.userId);
    console.log('🔍 Token decodificado completo:', decoded);
    
    // 🔥 CORREÇÃO CRÍTICA: Buscar dados atualizados do banco
    console.log('🗃️  Buscando dados atualizados do usuário no banco...');
    const userQuery = 'SELECT id, email, first_name, last_name, role FROM users WHERE id = $1';
    const userResult = await db.query(userQuery, [decoded.userId]);
    
    if (userResult.rows.length === 0) {
      console.log('❌ Usuário não encontrado no banco');
      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado'
      });
    }
    
    const userFromDB = userResult.rows[0];
    console.log('📊 Dados do banco:', userFromDB);
    
    // 🔥 CORREÇÃO: Usar dados ATUALIZADOS do banco, não do token
    req.user = {
      id: userFromDB.id,
      email: userFromDB.email,
      firstName: userFromDB.first_name,
      lastName: userFromDB.last_name,
      role: userFromDB.role // ⚠️ IMPORTANTE: Role do banco, não do token
    };
    
    // Manter compatibilidade
    req.userId = userFromDB.id;
    
    console.log('🔍 DEBUG - req.user (ATUALIZADO):', req.user);
    console.log('🔍 DEBUG - req.userId:', req.userId);
    console.log('🎯 Role final do usuário:', req.user.role);
    
    next();

  } catch (error) {
    console.error('❌ Erro na autenticação:', error.message);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Token inválido'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'Erro na autenticação: ' + error.message
    });
  }
};

module.exports = { authenticate };