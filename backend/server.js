// backend/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
require('dotenv').config();

console.log('🚀 Iniciando servidor FIN Mentorship...');

// Importar migração
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
  'http://127.0.0.1:5500',
  'http://localhost:5000',
  'http://127.0.0.1:5000'
];

app.use(cors({
  origin: function(origin, callback) {
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

// 🔥 MIDDLEWARE DE DEBUG PARA IDENTIFICAR ROTAS
app.use((req, res, next) => {
  console.log(`📍 ${req.method} ${req.originalUrl}`);
  next();
});

// 🔥 CARREGAR ROTAS COM VERIFICAÇÃO DE ERRO
try {
  const authRoutes = require('./routes/auth');
  app.use('/api/auth', authRoutes);
  console.log('✅ Rotas de auth carregadas com sucesso');
} catch (error) {
  console.error('❌ ERRO CRÍTICO: Falha ao carregar rotas de auth:', error.message);
  console.log('💡 Verifique se o arquivo routes/auth.js existe e está correto');
}

try {
  const userRoutes = require('./routes/users');
  app.use('/api/users', userRoutes);
  console.log('✅ Rotas de usuários carregadas');
} catch (error) {
  console.log('⚠️  Rotas de usuários não disponíveis:', error.message);
}

try {
  const adminRoutes = require('./routes/admin');
  app.use('/api/admin', adminRoutes);
  console.log('✅ Rotas de admin carregadas');
} catch (error) {
  console.log('❌ Erro ao carregar rotas de admin:', error.message);
}

// 🔥 ADICIONAR ROTAS DE MENTORES AQUI
try {
  const mentorRoutes = require('./routes/mentors');
  app.use('/api/mentors', mentorRoutes);
  console.log('✅ Rotas de mentor (IA) carregadas');
} catch (error) {
  console.log('⚠️  Rotas de mentor (IA) não disponíveis:', error.message);
}

// 🔥 ADICIONAR ROTAS DE MENTORES (LISTAGEM) - ESSA É A QUE ESTÁ FALTANDO!
try {
  const mentorsRoutes = require('./routes/mentors');
  app.use('/api/mentors', mentorsRoutes);
  console.log('✅ Rotas de mentores (listagem) carregadas');
} catch (error) {
  console.error('❌ ERRO CRÍTICO: Falha ao carregar rotas de mentores:', error.message);
  console.log('💡 Verifique se o arquivo routes/mentors.js existe');
  
  // Criar rota básica de fallback para evitar 404
  app.get('/api/mentors', (req, res) => {
    console.log('⚠️  Rota /api/mentors chamada, mas controlador não carregado');
    res.json({
      success: true,
      data: getFallbackMentors(),
      message: 'Usando dados de fallback - configure as rotas de mentores'
    });
  });
}

// 🔥 ROTA DE HEALTH CHECK PARA TESTE
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Servidor funcionando!',
    timestamp: new Date().toISOString()
  });
});

// 🔥 ROTA PARA LISTAR TODAS AS ROTAS REGISTRADAS
app.get('/api/routes', (req, res) => {
  const routes = [];
  
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      // Rotas diretas
      routes.push({
        path: middleware.route.path,
        method: Object.keys(middleware.route.methods)[0]?.toUpperCase()
      });
    } else if (middleware.name === 'router') {
      // Rotas do router
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const routePath = handler.route.path;
          const basePath = middleware.regexp.toString()
            .replace('/^', '')
            .replace('\\/?(?=\\/|$)/i', '')
            .replace(/\\/g, '')
            .replace('/^', '')
            .replace('(?=\\/|$)/i', '');
          
          routes.push({
            path: basePath + routePath,
            method: Object.keys(handler.route.methods)[0]?.toUpperCase()
          });
        }
      });
    }
  });
  
  res.json({ success: true, routes });
});

// 🔥 ROTA DE FALLBACK PARA 404
app.use('/api/*', (req, res) => {
  console.log(`❌ Rota não encontrada: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ 
    success: false, 
    message: 'Rota não encontrada',
    path: req.originalUrl,
    availableRoutes: [
      '/api/health',
      '/api/routes', 
      '/api/auth/*',
      '/api/users/*',
      '/api/admin/*',
      '/api/mentor/*',
      '/api/mentors/*'
    ]
  });
});

// 🔥 DADOS DE FALLBACK PARA MENTORES
function getFallbackMentors() {
  return [
    {
      id: 1,
      name: 'Carlos Mendes',
      role: 'Analista Sênior de Investimentos',
      company: 'XP Investimentos',
      area: 'FIN',
      expertise: ['investimentos', 'mercado financeiro', 'análise técnica'],
      rating: 4.8,
      reviews: 127,
      experience: '12 anos',
      price: 150,
      plan: 'basic',
      available: true,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      description: 'Especialista em análise de investimentos e gestão de carteiras. Mais de 10 anos de experiência no mercado financeiro.',
      languages: ['Português', 'Inglês'],
      specialties: ['Ações', 'Fundos Imobiliários', 'Renda Fixa']
    },
    {
      id: 2,
      name: 'Ana Silva',
      role: 'Gestora de Carteiras',
      company: 'BTG Pactual',
      area: 'FIN',
      expertise: ['gestao', 'wealth management', 'planejamento'],
      rating: 4.9,
      reviews: 89,
      experience: '8 anos',
      price: 200,
      plan: 'pro',
      available: true,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      description: 'Gestora de patrimônio com foco em planejamento financeiro familiar e investimentos de longo prazo.',
      languages: ['Português', 'Inglês', 'Espanhol'],
      specialties: ['Gestão Patrimonial', 'Sucessão Familiar', 'Investimentos Internacionais']
    }
  ];
}

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
      console.log(`   GET  http://localhost:${PORT}/api/routes`);
      console.log(`   POST http://localhost:${PORT}/api/auth/register`);
      console.log(`   POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   GET  http://localhost:${PORT}/api/auth/profile`);
      console.log(`   GET  http://localhost:${PORT}/api/mentors`);
      
      console.log('\n👑 Endpoints Admin:');
      console.log(`   GET  http://localhost:${PORT}/api/admin/stats`);
      console.log(`   GET  http://localhost:${PORT}/api/admin/users`);
      
      console.log('\n🤖 Endpoints Mentor IA:');
      console.log(`   POST http://localhost:${PORT}/api/mentor/analyze`);
      console.log(`   GET  http://localhost:${PORT}/api/mentor/profile`);
      
      console.log('\n🔐 Credenciais de teste:');
      console.log('   Email: admin@fin.com');
      console.log('   Senha: admin123');
      
      console.log('\n🔍 Para debug, acesse:');
      console.log(`   GET  http://localhost:${PORT}/api/routes - Lista todas as rotas`);
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