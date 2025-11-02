const db = require('../config/database');

async function createTables() {
  try {
    console.log('🗄️  Criando tabelas no banco de dados...');

    // Criar tabela de usuários
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Criar índice para email
    await db.query(`
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)
    `);

    console.log('✅ Tabelas criadas com sucesso!');

    // Verificar dados
    const userCount = await db.query('SELECT COUNT(*) FROM users');
    console.log(`👥 Total de usuários: ${userCount.rows[0].count}`);

  } catch (error) {
    console.error('❌ Erro ao criar tabelas:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  createTables()
    .then(() => {
      console.log('🎉 Migração concluída!');
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Falha na migração:', error);
      process.exit(1);
    });
}

module.exports = createTables;