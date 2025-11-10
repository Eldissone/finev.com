// backend/middlewares/auth.js
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
    
    // 🔥 CORREÇÃO: Definir AMBOS req.user E req.userId para compatibilidade
    req.user = {
      id: decoded.userId,
      role: decoded.role || 'user'
    };
    
    // 🔥 CORREÇÃO CRÍTICA: Definir req.userId também
    req.userId = decoded.userId;
    
    console.log('🔍 DEBUG - req.user:', req.user);
    console.log('🔍 DEBUG - req.userId:', req.userId);
    
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