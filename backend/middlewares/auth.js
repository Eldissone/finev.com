// middleware/auth.js - CORRIGIDO
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
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

    // Verificar formato do token
    if (!authHeader.startsWith('Bearer ')) {
      console.log('❌ Formato de token inválido');
      return res.status(401).json({
        success: false,
        message: 'Formato de token inválido'
      });
    }

    const token = authHeader.substring(7); // Remove "Bearer "
    
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
    
    req.userId = decoded.userId;
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
      message: 'Erro na autenticação'
    });
  }
};

module.exports = { authenticate };