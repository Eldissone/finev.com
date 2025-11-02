// backend/scripts/checkUsers.js
const db = require('./config/database');

async function checkUsersTable() {
  try {
    console.log('🔍 INICIANDO CONSULTA DA TABELA USERS...\n');

    // 1. VERIFICAR ESTRUTURA DA TABELA
    console.log('📋 ESTRUTURA DA TABELA USERS:');
    const structure = await db.query(`
      SELECT 
        column_name,
        data_type,
        is_nullable,
        column_default,
        character_maximum_length
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.table(structure.rows);

    // 2. VERIFICAR TODOS OS USUÁRIOS
    console.log('\n👥 TODOS OS USUÁRIOS:');
    const allUsers = await db.query(`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        role,
        status,
        email_verified,
        created_at,
        last_login
      FROM users 
      ORDER BY id
    `);
    
    console.table(allUsers.rows);

    // 3. VERIFICAR USUÁRIO ADMIN ESPECÍFICO
    console.log('\n👑 USUÁRIO ADMIN:');
    const adminUser = await db.query(`
      SELECT 
        id,
        first_name,
        last_name,
        email,
        role,
        status,
        email_verified,
        created_at,
        last_login
      FROM users 
      WHERE email = 'admin@fin.com'
    `);
    
    if (adminUser.rows.length > 0) {
      console.table(adminUser.rows);
    } else {
      console.log('❌ Usuário admin@fin.com não encontrado!');
    }

    // 4. CONTAGEM DE USUÁRIOS POR ROLE
    console.log('\n📊 DISTRIBUIÇÃO DE ROLES:');
    const roleDistribution = await db.query(`
      SELECT 
        COALESCE(role, 'NULL') as role,
        COUNT(*) as total_usuarios,
        ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM users), 2) as percentual
      FROM users 
      GROUP BY role
      ORDER BY total_usuarios DESC
    `);
    
    console.table(roleDistribution.rows);

    // 5. VERIFICAR USUÁRIOS COM PROBLEMAS DE ROLE
    console.log('\n🔍 PROBLEMAS IDENTIFICADOS:');

    // Usuários admin com role incorreta
    const adminWithWrongRole = await db.query(`
      SELECT id, email, first_name, last_name, role
      FROM users 
      WHERE email = 'admin@fin.com' AND role != 'admin'
    `);

    if (adminWithWrongRole.rows.length > 0) {
      console.log('❌ USUÁRIO ADMIN COM ROLE INCORRETA:');
      console.table(adminWithWrongRole.rows);
    } else {
      console.log('✅ Usuário admin tem role correta');
    }

    // Usuários sem role
    const usersWithoutRole = await db.query(`
      SELECT id, email, first_name, last_name
      FROM users 
      WHERE role IS NULL OR role = ''
    `);

    if (usersWithoutRole.rows.length > 0) {
      console.log('⚠️  USUÁRIOS SEM ROLE DEFINIDA:');
      console.table(usersWithoutRole.rows);
    } else {
      console.log('✅ Todos os usuários têm role definida');
    }

    // 6. VERIFICAR ÍNDICES
    console.log('\n🔑 ÍNDICES DA TABELA USERS:');
    const indexes = await db.query(`
      SELECT 
        indexname,
        indexdef
      FROM pg_indexes 
      WHERE tablename = 'users'
      ORDER BY indexname
    `);
    
    console.table(indexes.rows);

    // 7. ESTATÍSTICAS GERAIS
    console.log('\n📈 ESTATÍSTICAS GERAIS:');
    const stats = await db.query(`
      SELECT 
        COUNT(*) as total_usuarios,
        COUNT(DISTINCT role) as roles_diferentes,
        COUNT(CASE WHEN email_verified = true THEN 1 END) as emails_verificados,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as usuarios_ativos,
        COUNT(CASE WHEN last_login IS NOT NULL THEN 1 END) as usuarios_com_login,
        MIN(created_at) as primeiro_registro,
        MAX(created_at) as ultimo_registro
      FROM users
    `);
    
    console.table(stats.rows);

    // 8. SUGESTÕES DE CORREÇÃO
    console.log('\n💡 SUGESTÕES DE CORREÇÃO:');

    if (adminWithWrongRole.rows.length > 0) {
      console.log(`
🚨 PROBLEMA CRÍTICO: Usuário admin com role incorreta!
💡 SOLUÇÃO: Execute no banco:
   UPDATE users SET role = 'admin' WHERE email = 'admin@fin.com';
      `);
    }

    if (usersWithoutRole.rows.length > 0) {
      console.log(`
⚠️  USUÁRIOS SEM ROLE:
💡 SOLUÇÃO: Execute no banco:
   UPDATE users SET role = 'mentee' WHERE role IS NULL OR role = '';
      `);
    }

    // Verificar se o admin existe
    if (adminUser.rows.length === 0) {
      console.log(`
❌ USUÁRIO ADMIN NÃO ENCONTRADO!
💡 SOLUÇÃO: Execute a migração novamente ou crie manualmente:
   INSERT INTO users (first_name, last_name, email, password_hash, role, email_verified) 
   VALUES ('Admin', 'FIN', 'admin@fin.com', '<hash_da_senha>', 'admin', true);
      `);
    }

  } catch (error) {
    console.error('❌ Erro durante a consulta:', error);
  }
}

// Função para correção automática
async function fixUserRoles() {
  try {
    console.log('🔧 INICIANDO CORREÇÃO AUTOMÁTICA...\n');

    // 1. Corrigir usuário admin
    console.log('👑 Corrigindo role do usuário admin...');
    const adminFix = await db.query(`
      UPDATE users 
      SET role = 'admin', updated_at = CURRENT_TIMESTAMP
      WHERE email = 'admin@fin.com'
      RETURNING id, email, role
    `);
    
    if (adminFix.rows.length > 0) {
      console.log('✅ Usuário admin corrigido:');
      console.table(adminFix.rows);
    }

    // 2. Corrigir usuários sem role
    console.log('\n🔧 Corrigindo usuários sem role...');
    const nullFix = await db.query(`
      UPDATE users 
      SET role = 'mentee', updated_at = CURRENT_TIMESTAMP
      WHERE role IS NULL OR role = ''
      RETURNING COUNT(*) as usuarios_corrigidos
    `);
    
    console.log(`✅ ${nullFix.rows[0].usuarios_corrigidos} usuários sem role corrigidos`);

    // 3. Verificar resultado final
    console.log('\n📊 SITUAÇÃO FINAL:');
    const finalCount = await db.query(`
      SELECT role, COUNT(*) as total
      FROM users 
      GROUP BY role
      ORDER BY role
    `);
    
    console.table(finalCount.rows);
    console.log('\n🎯 CORREÇÃO CONCLUÍDA!');

  } catch (error) {
    console.error('❌ Erro durante a correção:', error);
  }
}

// Script de consulta rápida
async function quickCheck() {
  try {
    console.log('⚡ CONSULTA RÁPIDA - USUÁRIO ADMIN\n');

    const adminUser = await db.query(`
      SELECT id, first_name, last_name, email, role, status
      FROM users 
      WHERE email = 'admin@fin.com'
    `);

    if (adminUser.rows.length > 0) {
      console.table(adminUser.rows);
      
      const user = adminUser.rows[0];
      if (user.role === 'admin') {
        console.log('✅ Role do admin está CORRETA!');
      } else {
        console.log(`❌ PROBLEMA: Role do admin é "${user.role}" mas deveria ser "admin"`);
        console.log('\n💡 Execute: node checkUsers.js --fix para corrigir automaticamente');
      }
    } else {
      console.log('❌ Usuário admin não encontrado!');
    }

  } catch (error) {
    console.error('Erro:', error.message);
  }
}

// Executar baseado nos argumentos
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--quick') || args.includes('-q')) {
    await quickCheck();
  } else if (args.includes('--fix') || args.includes('-f')) {
    await fixUserRoles();
  } else {
    await checkUsersTable();
  }
  
  process.exit(0);
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  checkUsersTable,
  fixUserRoles,
  quickCheck
};