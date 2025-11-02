const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth'); // Middleware atualizado

const router = express.Router();

// Validações de registro
const registerValidation = [
  body('firstName')
    .notEmpty()
    .withMessage('Nome é obrigatório')
    .isLength({ min: 2 })
    .withMessage('Nome deve ter pelo menos 2 caracteres'),
  body('lastName')
    .notEmpty()
    .withMessage('Sobrenome é obrigatório')
    .isLength({ min: 2 })
    .withMessage('Sobrenome deve ter pelo menos 2 caracteres'),
  body('email')
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Senha deve ter pelo menos 8 caracteres')
];

// Validações de login
const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('Email deve ser válido')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Senha é obrigatória')
];

// Rotas de autenticação
router.post('/register', registerValidation, authController.register);
router.post('/login', loginValidation, authController.login);

// Rotas protegidas
router.get('/profile', authenticate, authController.getProfile);

// Rota de debug (listar usuários)
router.get('/users', authController.listUsers);

module.exports = router;
