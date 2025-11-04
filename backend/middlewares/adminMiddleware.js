// backend/middlewares/adminMiddleware.js
const adminMiddleware = (req, res, next) => {
    try {
        console.log('👑 Verificando privilégios de admin...');
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Usuário não autenticado'
            });
        }

        // Verificar se o usuário tem role de admin
        if (req.user.role !== 'admin' && req.user.role !== 'administrator') {
            console.log('❌ Acesso negado. Usuário não é admin. Role:', req.user.role);
            return res.status(403).json({
                success: false,
                message: 'Acesso negado. Requer privilégios de administrador.'
            });
        }

        console.log('✅ Usuário é admin. Role:', req.user.role);
        next();
    } catch (error) {
        console.error('❌ Erro no middleware de admin:', error);
        return res.status(500).json({
            success: false,
            message: 'Erro ao verificar privilégios'
        });
    }
};

module.exports = adminMiddleware;