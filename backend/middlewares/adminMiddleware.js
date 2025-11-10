// backend/middlewares/adminMiddleware.js
const User = require('../models/User');

const adminMiddleware = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);
    
    if (!user || (user.role !== 'admin' && user.role !== 'administrator')) {
      return res.status(403).json({
        success: false,
        message: 'Acesso negado. Permissões de administrador necessárias.'
      });
    }

    next();
  } catch (error) {
    console.error('Erro no middleware de admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = adminMiddleware;