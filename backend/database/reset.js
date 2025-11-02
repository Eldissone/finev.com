// backend/database/reset.js
const db = require('../config/database');

async function resetDatabase() {
  try {
    console.log('🔄 Reiniciando banco de dados...');
    
    // Dropar tabelas na ordem correta (devido a foreign keys)
    const tables = ['mentor_profiles', 'users'];
    
    for (const table of tables) {
      try {
        await db.query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✅ Tabela ${table} removida`);
      } catch (error) {
        console.log(`⚠️  Erro ao remover tabela ${table}: ${error.message}`);
      }
    }
    
    console.log('🗄️  Recriando estrutura do banco...');
    
    // Recriar tabelas usando o script de migração
    const migrate = require('./migrate');
    await migrate();
    
  } catch (error) {
    console.error('❌ Erro ao resetar banco:', error);
    throw error;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  console.log('⚠️  ATENÇÃO: Isso irá APAGAR TODOS os dados do banco!');
  console.log('Pressione Ctrl+C para cancelar ou aguarde 5 segundos...');
  
  setTimeout(async () => {
    resetDatabase()
      .then(() => {
        console.log('🎉 Banco resetado com sucesso!');
        process.exit(0);
      })
      .catch(error => {
        console.error('💥 Falha no reset:', error);
        process.exit(1);
      });
  }, 5000);
}

module.exports = resetDatabase;