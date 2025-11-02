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
  'http://127.0.0.1:3000'
];

app.use(cors({
  origin: function(origin, callback) {
    // Permite requests sem origem (ex: Postman, curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Não autorizado pelo CORS'));
    }
  },
  credentials: true
}));

app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Rotas
app.use('/api/auth', authRoutes);

// Rota de saúde
app.get('/api/health', async (req, res) => {
  try {
    const db = require('./config/database');
    await db.query('SELECT 1');
    res.json({ 
      success: true, 
      message: '✅ Servidor e banco estão operacionais',
      database: 'Conectado',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: '⚠️ Servidor online mas banco offline',
      database: 'Desconectado',
      error: error.message
    });
  }
});

// Rota de informações do sistema
app.get('/api/info', (req, res) => {
  res.json({
    success: true,
    data: {
      app: 'FIN Mentorship API',
      version: '1.0.0',
      environment: process.env.NODE_ENV,
      database: {
        name: process.env.DB_NAME,
        host: process.env.DB_HOST,
        port: process.env.DB_PORT
      },
      port: process.env.PORT
    }
  });
});

// Middleware de erro
app.use((error, req, res, next) => {
  console.error('💥 Erro não tratado:', error);
  res.status(500).json({
    success: false,
    message: 'Erro interno do servidor'
  });
});

// Rota não encontrada
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Rota não encontrada'
  });
});

const PORT = process.env.PORT || 5000;

// Iniciar servidor
async function startServer() {
  try {
    console.log('🗄️  Executando migrações...');
    await runMigrations();
    
    app.listen(PORT, () => {
      console.log('\n🎉 Servidor FIN Mentorship iniciado com sucesso!');
      console.log(`📍 Porta: ${PORT}`);
      console.log(`📍 Ambiente: ${process.env.NODE_ENV}`);
      console.log(`📍 Banco: ${process.env.DB_NAME}`);
      console.log('\n📋 Endpoints disponíveis:');
      console.log(`   GET  http://localhost:${PORT}/api/health`);
      console.log(`   GET  http://localhost:${PORT}/api/info`);
      console.log(`   POST http://localhost:${PORT}/api/auth/register`);
      console.log(`   POST http://localhost:${PORT}/api/auth/login`);
      console.log(`   GET  http://localhost:${PORT}/api/auth/profile`);
      console.log(`   GET  http://localhost:${PORT}/api/auth/users (debug)`);
    });
    
  } catch (error) {
    console.error('💥 Falha ao iniciar servidor:', error);
    process.exit(1);
  }
}

startServer();
