// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

console.log('🚀 Iniciando servidor FIN Mentorship...');

// Importar rotas e migração
const authRoutes = require('./routes/auth');
const runMigrations = require('./database/migrate');

const app = express();
app.use(express.static('public'));

// Middleware
app.use(helmet());

// Configuração CORS para múltiplas origens
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5500',
  'http://127.0.0.1:5500'
];

app.use(cors({
  origin: function(origin, callback) {
    // Permite requests sem origem (ex: Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log('⚠️  CORS bloqueado para origem:', origin);
      callback(new Error('Não autorizado pelo CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Log de requisições
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware para log de rotas (útil para debug)
app.use((req, res, next) => {
  if (req.method !== 'GET' || req.path.includes('/api/')) {
    console.log(`📨 ${req.method} ${req.path}`, {
      body: req.method !== 'GET' ? req.body : {},
      query: req.query
    });
  }
  next();
});

// Rotas públicas
app.use('/api/auth', authRoutes);

// Importar e usar rotas de users e admin
try {
  const userRoutes = require('./routes/users');
  app.use('/api/users', userRoutes);
  console.log('✅ Rotas de usuários carregadas');
} catch (error) {
  console.log('⚠️  Rotas de usuários não disponíveis');
}

try {
  const adminRoutes = require('./routes/admin');
  app.use('/api/admin', adminRoutes);
  console.log('✅ Rotas de admin carregadas');
} catch (error) {
  console.log('❌ Erro ao carregar rotas de admin:', error.message);
  console.log('💡 Verifique se o arquivo routes/admin.js existe e está correto');
}

// ... resto do server.js permanece igual (health, info, routes, etc.)

const PORT = process.env.PORT || 5000;

// Iniciar servidor
async function startServer() {
  try {
    console.log('🗄️  Executando migrações...');
    await runMigrations();
    
    app.listen(PORT, () => {
      console.log('\n🎉 Servidor FIN Mentorship iniciado com sucesso!');
      console.log(`📍 Porta: ${PORT}`);
      console.log(`📍 Ambiente: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📍 Banco: ${process.env.DB_NAME}`);
      console.log('\n📋 Endpoints principais:');
      console.log(`   GET  http://localhost:${PORT}/api/health`);
      console.log(`   GET  http://localhost:${PORT}/api/info`);
      console.log(`   GET  http://localhost:${PORT}/api/routes`);
      console.log(`   POST http://localhost:${PORT}/api/auth/register`);
      console.log(`   POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   GET  http://localhost:${PORT}/api/auth/profile`);
      
      console.log('\n👑 Endpoints Admin:');
      console.log(`   GET  http://localhost:${PORT}/api/admin/stats`);
      console.log(`   GET  http://localhost:${PORT}/api/admin/users`);
      console.log(`   GET  http://localhost:${PORT}/api/admin/activity`);
      console.log(`   GET  http://localhost:${PORT}/api/admin/mentors`);
      console.log(`   GET  http://localhost:${PORT}/api/admin/mentorships`);
      
      console.log('\n🔐 Credenciais de teste:');
      console.log('   Email: admin@fin.com');
      console.log('   Senha: admin123');
    });
    
  } catch (error) {
    console.error('💥 Falha ao iniciar servidor:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Recebido SIGTERM, encerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('🛑 Recebido SIGINT, encerrando servidor...');
  process.exit(0);
});

startServer();