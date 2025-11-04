// backend/routes/admin.js
const express = require('express');
const router = express.Router();

const adminController = require('../controllers/adminController');
const { authenticate } = require('../middlewares/auth');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Todas as rotas exigem autenticação e privilégios de admin
router.use(authenticate);
router.use(adminMiddleware);

// Rota de teste (pode remover depois)
router.get('/test', (req, res) => {
    res.json({
        success: true,
        message: '✅ Rota de admin funcionando!',
        user: req.user
    });
});

// Estatísticas
router.get('/stats', adminController.getStats);

// Gestão de usuários
router.get('/users', adminController.getUsers);
router.get('/users/:id', adminController.getUser);
router.put('/users/:id', adminController.updateUser);
router.patch('/users/:id/promote', adminController.promoteToMentor);
router.patch('/users/:id/status', adminController.toggleUserStatus);

// Gestão de mentores
router.get('/mentors', adminController.getMentors);
router.patch('/mentors/:id/verify', adminController.verifyMentor);

// Gestão de mentorias
router.get('/mentorships', adminController.getMentorships);
router.post('/mentorships', adminController.createMentorship);
router.put('/mentorships/:id', adminController.updateMentorship);

// Atividades
router.get('/activity', adminController.getRecentActivity);

module.exports = router;