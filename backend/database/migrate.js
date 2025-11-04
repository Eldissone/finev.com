// backend/database/migrate.js
const db = require('../config/database');

async function checkTableExists(tableName) {
  try {
    const result = await db.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = $1
      )`,
      [tableName]
    );
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Erro ao verificar tabela ${tableName}:`, error);
    return false;
  }
}

async function checkColumnExists(tableName, columnName) {
  try {
    const result = await db.query(
      `SELECT EXISTS (
        SELECT FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = $1 
        AND column_name = $2
      )`,
      [tableName, columnName]
    );
    return result.rows[0].exists;
  } catch (error) {
    console.error(`Erro ao verificar coluna ${columnName}:`, error);
    return false;
  }
}

async function createTables() {
  try {
    console.log('🗄️  Verificando e atualizando estrutura do banco de dados...');

    // Verificar se a tabela users existe
    const usersTableExists = await checkTableExists('users');
    
    if (!usersTableExists) {
      console.log('📋 Criando tabela users...');
      // Criar tabela de usuários com roles
      await db.query(`
        CREATE TABLE users (
          id SERIAL PRIMARY KEY,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(20) NOT NULL DEFAULT 'mentee',
          status VARCHAR(20) NOT NULL DEFAULT 'active',
          phone VARCHAR(20),
          bio TEXT,
          avatar_url VARCHAR(500),
          last_login TIMESTAMP WITH TIME ZONE,
          email_verified BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        )
      `);
      console.log('✅ Tabela users criada com sucesso!');
    } else {
      console.log('✅ Tabela users já existe. Verificando colunas...');
      
      // Verificar e adicionar colunas que faltam
      const columnsToAdd = [
        { name: 'role', type: 'VARCHAR(20) NOT NULL DEFAULT \'mentee\'' },
        { name: 'status', type: 'VARCHAR(20) NOT NULL DEFAULT \'active\'' },
        { name: 'phone', type: 'VARCHAR(20)' },
        { name: 'bio', type: 'TEXT' },
        { name: 'avatar_url', type: 'VARCHAR(500)' },
        { name: 'last_login', type: 'TIMESTAMP WITH TIME ZONE' },
        { name: 'email_verified', type: 'BOOLEAN DEFAULT FALSE' },
        { name: 'updated_at', type: 'TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP' }
      ];

      for (const column of columnsToAdd) {
        const columnExists = await checkColumnExists('users', column.name);
        if (!columnExists) {
          console.log(`📝 Adicionando coluna ${column.name}...`);
          await db.query(`ALTER TABLE users ADD COLUMN ${column.name} ${column.type}`);
          console.log(`✅ Coluna ${column.name} adicionada com sucesso!`);
        } else {
          console.log(`✅ Coluna ${column.name} já existe`);
        }
      }
    }

    // Criar tabela de perfis de mentores
    const mentorProfilesExists = await checkTableExists('mentor_profiles');
    
    if (!mentorProfilesExists) {
      console.log('📋 Criando tabela mentor_profiles...');
      await db.query(`
        CREATE TABLE mentor_profiles (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          specialization VARCHAR(200) NOT NULL,
          experience_years INTEGER NOT NULL DEFAULT 0,
          hourly_rate DECIMAL(10,2),
          bio TEXT,
          expertise_areas JSONB,
          availability JSONB,
          rating DECIMAL(3,2) DEFAULT 0.0,
          total_sessions INTEGER DEFAULT 0,
          is_verified BOOLEAN DEFAULT FALSE,
          verified_at TIMESTAMP WITH TIME ZONE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(user_id)
        )
      `);
      console.log('✅ Tabela mentor_profiles criada com sucesso!');
    } else {
      console.log('✅ Tabela mentor_profiles já existe');
    }

    // Criar/verificar índices
    console.log('🔍 Verificando índices...');
    
    const indices = [
      { name: 'idx_users_email', query: 'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)' },
      { name: 'idx_users_role', query: 'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)' },
      { name: 'idx_users_status', query: 'CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)' },
      { name: 'idx_users_role_status', query: 'CREATE INDEX IF NOT EXISTS idx_users_role_status ON users(role, status)' },
      { name: 'idx_mentor_profiles_user_id', query: 'CREATE INDEX IF NOT EXISTS idx_mentor_profiles_user_id ON mentor_profiles(user_id)' },
      { name: 'idx_mentor_profiles_specialization', query: 'CREATE INDEX IF NOT EXISTS idx_mentor_profiles_specialization ON mentor_profiles(specialization)' },
      { name: 'idx_mentor_profiles_verified', query: 'CREATE INDEX IF NOT EXISTS idx_mentor_profiles_verified ON mentor_profiles(is_verified)' }
    ];

    for (const index of indices) {
      try {
        await db.query(index.query);
        console.log(`✅ Índice ${index.name} verificado/criado`);
      } catch (error) {
        console.log(`⚠️  Índice ${index.name} já existe ou erro: ${error.message}`);
      }
    }

    console.log('✅ Estrutura do banco verificada e atualizada com sucesso!');

    // Verificar dados
    const userCount = await db.query('SELECT COUNT(*) FROM users');
    console.log(`👥 Total de usuários: ${userCount.rows[0].count}`);

    // Criar usuário admin padrão se não existir
    const adminExists = await db.query('SELECT id FROM users WHERE email = $1', ['admin@fin.com']);
    if (adminExists.rows.length === 0) {
      const bcrypt = require('bcrypt');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      await db.query(
        `INSERT INTO users (first_name, last_name, email, password_hash, role, email_verified) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        ['Admin', 'FIN', 'admin@fin.com', hashedPassword, 'admin', true]
      );
      console.log('👑 Usuário admin criado: admin@fin.com / admin123');
    } else {
      // Atualizar usuário admin existente para ter role de admin
      await db.query(
        'UPDATE users SET role = $1 WHERE email = $2',
        ['admin', 'admin@fin.com']
      );
    }

    // Verificar roles dos usuários existentes
    const usersWithoutRole = await db.query('SELECT COUNT(*) FROM users WHERE role IS NULL');
    if (usersWithoutRole.rows[0].count > 0) {
      console.log(`🔄 Atualizando ${usersWithoutRole.rows[0].count} usuários sem role para 'mentee'...`);
      await db.query('UPDATE users SET role = $1 WHERE role IS NULL', ['mentee']);
    }

  } catch (error) {
    console.error('❌ Erro ao atualizar estrutura do banco:', error);
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