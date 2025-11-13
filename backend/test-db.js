const db = require('./config/database');

async function testDatabase() {
  try {
    console.log('🧪 Testando conexão com o banco...');
    
    // Teste 1: Conexão básica
    const result1 = await db.query('SELECT NOW() as current_time');
    console.log('✅ Conexão OK. Hora atual:', result1.rows[0].current_time);
    
    // Teste 2: Tabela mentorias
    const result2 = await db.query('SELECT COUNT(*) as count FROM mentorias');
    console.log('✅ Tabela mentorias OK. Total:', result2.rows[0].count);
    
    // Teste 3: Tabela users
    const result3 = await db.query('SELECT COUNT(*) as count FROM users');
    console.log('✅ Tabela users OK. Total:', result3.rows[0].count);
    
    // Teste 4: Usuário específico
    const result4 = await db.query('SELECT id, email, role FROM users WHERE id = 2');
    console.log('✅ Usuário 2:', result4.rows[0]);
    
  } catch (error) {
    console.error('❌ Erro no teste do banco:', error);
  }
}

testDatabase();