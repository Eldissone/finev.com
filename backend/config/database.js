const { Pool } = require('pg');
require('dotenv').config();

console.log('🔌 Conectando ao PostgreSQL...');
console.log('📊 Banco:', process.env.DB_NAME);
console.log('🏠 Host:', process.env.DB_HOST);
console.log('👤 User:', process.env.DB_USER);

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // Timeout de conexão aumentado
  connectionTimeoutMillis: 10000,
  idleTimeoutMillis: 30000,
  max: 20
});

// Testar conexão
const testConnection = async () => {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as current_time, current_database() as db_name');
    console.log('✅ Conectado ao PostgreSQL com sucesso!');
    console.log('📅 Hora do servidor:', result.rows[0].current_time);
    console.log('🗄️  Banco conectado:', result.rows[0].db_name);
    client.release();
  } catch (err) {
    console.error('❌ ERRO na conexão PostgreSQL:', err.message);
    console.log('💡 Verifique:');
    console.log('   - PostgreSQL está rodando?');
    console.log('   - Banco FINMENT_DB existe?');
    console.log('   - Usuário/senha estão corretos?');
  }
};

testConnection();

pool.on('error', (err) => {
  console.error('❌ Erro inesperado na pool PostgreSQL:', err);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};