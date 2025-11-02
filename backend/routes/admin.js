// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middlewares/authMiddleware');
const adminMiddleware = require('../middlewares/adminMiddleware');

// Todas as rotas exigem autenticação e privilégios de admin
router.use(authMiddleware);
router.use(adminMiddleware);

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

// Gestão de mentorias
router.get('/mentorships', adminController.getMentorships);
router.post('/mentorships', adminController.createMentorship);
router.put('/mentorships/:id', adminController.updateMentorship);

// Gestão de conteúdo
router.get('/content', adminController.getContent);
router.post('/content/articles', adminController.createArticle);
router.put('/content/articles/:id', adminController.updateArticle);

module.exports = router;