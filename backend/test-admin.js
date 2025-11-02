// backend/test-admin.js
const request = require('supertest');
const app = require('./app');
const db = require('./config/database');

// Primeiro, vamos fazer login como admin
async function testAdminRoutes() {
  console.log('🧪 Testando rotas de administração...\n');

  // 1. Login como admin
  console.log('1. Fazendo login como admin...');
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'admin@fin.com',
      password: 'admin123'
    });

  if (!loginRes.body.success) {
    console.log('❌ Falha no login:', loginRes.body.message);
    return;
  }

  const token = loginRes.body.data.token;
  console.log('✅ Login bem-sucedido\n');

  // 2. Testar estatísticas
  console.log('2. Buscando estatísticas...');
  const statsRes = await request(app)
    .get('/api/admin/stats')
    .set('Authorization', `Bearer ${token}`);

  if (statsRes.body.success) {
    console.log('✅ Estatísticas:', statsRes.body.data);
  } else {
    console.log('❌ Erro nas estatísticas:', statsRes.body.message);
  }
  console.log('');

  // 3. Testar listagem de usuários
  console.log('3. Listando usuários...');
  const usersRes = await request(app)
    .get('/api/admin/users')
    .set('Authorization', `Bearer ${token}`);

  if (usersRes.body.success) {
    console.log(`✅ Usuários encontrados: ${usersRes.body.data.users.length}`);
    console.log('📋 Usuários:', usersRes.body.data.users.map(u => ({
      id: u.id,
      name: `${u.first_name} ${u.last_name}`,
      email: u.email,
      role: u.role,
      status: u.status
    })));
  } else {
    console.log('❌ Erro ao listar usuários:', usersRes.body.message);
  }
  console.log('');

  // 4. Testar listagem de mentores
  console.log('4. Listando mentores...');
  const mentorsRes = await request(app)
    .get('/api/admin/mentors')
    .set('Authorization', `Bearer ${token}`);

  if (mentorsRes.body.success) {
    console.log(`✅ Mentores encontrados: ${mentorsRes.body.data.mentors.length}`);
  } else {
    console.log('❌ Erro ao listar mentores:', mentorsRes.body.message);
  }

  console.log('\n🎉 Teste de admin concluído!');
}

// Executar teste
testAdminRoutes().catch(console.error);