const express = require('express');
const { authenticate } = require('../middlewares/auth');
const db = require('../config/database');

const router = express.Router();

// ROTA TEMPORÁRIA PARA DEBUG - Adicione no início do arquivo
router.get('/debug/minhas', authenticate, async (req, res) => {
  try {
    console.log('🔍 DEBUG - Iniciando debug da rota /minhas');
    console.log('📋 req.user:', req.user);
    
    const userId = req.user.id;
    
    // Teste 1: Query básica sem JOIN
    console.log('🧪 Teste 1: Query básica sem JOIN');
    const query1 = 'SELECT * FROM mentorias WHERE mentor_id = $1';
    const result1 = await db.query(query1, [userId]);
    console.log('✅ Resultado teste 1:', result1.rows);
    
    // Teste 2: Query com JOIN simplificada
    console.log('🧪 Teste 2: Query com JOIN simplificada');
    const query2 = `
      SELECT m.*, u.first_name, u.last_name 
      FROM mentorias m 
      LEFT JOIN users u ON m.mentor_id = u.id 
      WHERE m.mentor_id = $1
    `;
    const result2 = await db.query(query2, [userId]);
    console.log('✅ Resultado teste 2:', result2.rows);
    
    // Teste 3: Query completa
    console.log('🧪 Teste 3: Query completa');
    const query3 = `
      SELECT 
        m.*,
        u.avatar_url as mentor_avatar,
        u.bio as mentor_bio,
        COALESCE(u.expertise, 'Finanças') as mentor_expertise
      FROM mentorias m
      LEFT JOIN users u ON m.mentor_id = u.id
      WHERE m.mentor_id = $1 
      ORDER BY m.data_criacao DESC
    `;
    const result3 = await db.query(query3, [userId]);
    console.log('✅ Resultado teste 3:', result3.rows);
    
    res.json({
      success: true,
      tests: {
        test1: result1.rows,
        test2: result2.rows,
        test3: result3.rows
      },
      user: req.user
    });
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
    console.error('🔍 Stack trace completo:', error.stack);
    res.status(500).json({
      success: false,
      message: 'Erro no debug: ' + error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET /api/mentorias - Listar todas as mentorias disponíveis
router.get('/', async (req, res) => {
  try {
    const query = `
      SELECT 
        m.*,
        u.avatar_url as mentor_avatar,
        u.bio as mentor_bio,
        COALESCE(u.expertise, 'Especialista em Finanças') as mentor_expertise
      FROM mentorias m
      LEFT JOIN users u ON m.mentor_id = u.id
      WHERE m.disponivel = true
      ORDER BY m.data_criacao DESC
    `;

    const result = await db.query(query);

    res.json({
      success: true,
      data: result.rows,
      total: result.rows.length
    });

  } catch (error) {
    console.error('Erro ao buscar mentorias:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/mentorias/minhas - Mentorias do usuário logado (VERSÃO CORRIGIDA)
router.get('/minhas', authenticate, async (req, res) => {
  try {
    console.log('🔍 Iniciando /api/mentorias/minhas para userId:', req.user.id);
    
    const userId = req.user.id;
    
    // Query mais segura com tratamento de erros
    const query = `
      SELECT 
        m.id,
        m.titulo,
        m.descricao,
        m.area,
        m.duracao,
        m.preco,
        m.disponivel,
        m.mentor_id,
        m.mentor_nome,
        m.mentor_role,
        m.data_criacao,
        m.data_atualizacao,
        COALESCE(u.avatar_url, '') as mentor_avatar,
        COALESCE(u.bio, '') as mentor_bio,
        COALESCE(u.expertise, 'Especialista em Finanças') as mentor_expertise
      FROM mentorias m
      LEFT JOIN users u ON m.mentor_id = u.id
      WHERE m.mentor_id = $1 
      ORDER BY m.data_criacao DESC
    `;

    console.log('📋 Executando query para userId:', userId);
    
    const result = await db.query(query, [userId]);

    console.log('✅ Query executada com sucesso. Mentorias encontradas:', result.rows.length);
    
    // Log das mentorias encontradas (apenas IDs para não poluir)
    if (result.rows.length > 0) {
      console.log('📊 IDs das mentorias:', result.rows.map(m => m.id));
    }

    res.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
      message: result.rows.length === 0 ? 'Nenhuma mentoria encontrada' : 'Mentorias carregadas com sucesso'
    });

  } catch (error) {
    console.error('❌ ERRO CRÍTICO em /api/mentorias/minhas:', error);
    console.error('🔍 Detalhes do erro:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      table: error.table,
      constraint: error.constraint
    });
    
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor ao carregar mentorias',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erro no servidor'
    });
  }
});

// GET /api/mentorias/:id - Buscar mentoria específica
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const query = `
      SELECT 
        m.*,
        u.avatar_url as mentor_avatar,
        u.bio as mentor_bio,
        COALESCE(u.expertise, 'Especialista em Finanças') as mentor_expertise,
        u.email as mentor_email
      FROM mentorias m
      LEFT JOIN users u ON m.mentor_id = u.id
      WHERE m.id = $1
    `;

    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mentoria não encontrada'
      });
    }

    res.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao buscar mentoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// POST /api/mentorias - Criar nova mentoria (VERSÃO CORRIGIDA)
router.post('/', authenticate, async (req, res) => {
  try {
    console.log('📍 POST /api/mentorias - Criando nova mentoria');
    console.log('👤 Usuário:', req.user.id, req.user.email, 'Role:', req.user.role);
    console.log('📦 Dados recebidos:', req.body);

    const {
      titulo,
      descricao,
      area,
      duracao,
      preco,
      disponivel = true
    } = req.body;

    // Verificação de role (agora deve passar)
    if (req.user.role !== 'mentor') {
      console.log('🚫 ACESSO NEGADO - Usuário não é mentor. Role:', req.user.role);
      return res.status(403).json({
        success: false,
        message: 'Apenas mentores podem criar mentorias'
      });
    }

    console.log('✅ Usuário é mentor, prosseguindo...');

    // Validações
    const errors = [];
    if (!titulo) errors.push('título');
    if (!descricao) errors.push('descrição');
    if (!area) errors.push('área');
    if (!duracao) errors.push('duração');
    if (preco === undefined) errors.push('preço');

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Campos obrigatórios: ${errors.join(', ')}`
      });
    }

    // Preparar dados para inserção
    const mentorNome = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim() || 'Mentor';
    
    const query = `
      INSERT INTO mentorias 
        (titulo, descricao, area, duracao, preco, disponivel, mentor_id, mentor_nome, mentor_role)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      titulo.trim(),
      descricao.trim(),
      area,
      parseInt(duracao),
      parseFloat(preco),
      disponivel,
      req.user.id,
      mentorNome,
      req.user.role
    ];

    console.log('💾 Inserindo no banco com valores:', values);

    const result = await db.query(query, values);
    const mentoriaCriada = result.rows[0];

    console.log('🎉 Mentoria criada com sucesso! ID:', mentoriaCriada.id);

    res.status(201).json({
      success: true,
      message: 'Mentoria criada com sucesso!',
      data: mentoriaCriada
    });

  } catch (error) {
    console.error('💥 ERRO ao criar mentoria:', error);
    console.error('🔍 Detalhes do erro DB:', {
      message: error.message,
      code: error.code,
      detail: error.detail
    });
    
    res.status(500).json({
      success: false,
      message: 'Erro ao criar mentoria: ' + error.message
    });
  }
});

// PUT /api/mentorias/:id - Atualizar mentoria
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      titulo,
      descricao,
      area,
      duracao,
      preco,
      disponivel
    } = req.body;

    // Verificar se a mentoria existe e pertence ao usuário
    const checkQuery = `
      SELECT * FROM mentorias 
      WHERE id = $1 AND mentor_id = $2
    `;
    const checkResult = await db.query(checkQuery, [id, req.user.id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mentoria não encontrada ou você não tem permissão para editá-la'
      });
    }

    // Atualizar mentoria
    const updateQuery = `
      UPDATE mentorias 
      SET titulo = $1, descricao = $2, area = $3, duracao = $4, 
          preco = $5, disponivel = $6, data_atualizacao = CURRENT_TIMESTAMP
      WHERE id = $7 AND mentor_id = $8
      RETURNING *
    `;

    const values = [
      titulo,
      descricao,
      area,
      duracao,
      preco,
      disponivel,
      id,
      req.user.id
    ];

    const result = await db.query(updateQuery, values);

    res.json({
      success: true,
      message: 'Mentoria atualizada com sucesso!',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar mentoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// DELETE /api/mentorias/:id - Deletar mentoria
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar se a mentoria existe e pertence ao usuário
    const checkQuery = `
      SELECT * FROM mentorias 
      WHERE id = $1 AND mentor_id = $2
    `;
    const checkResult = await db.query(checkQuery, [id, req.user.id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mentoria não encontrada ou você não tem permissão para deletá-la'
      });
    }

    // Deletar mentoria
    const deleteQuery = `
      DELETE FROM mentorias 
      WHERE id = $1 AND mentor_id = $2
    `;
    await db.query(deleteQuery, [id, req.user.id]);

    res.json({
      success: true,
      message: 'Mentoria deletada com sucesso!'
    });

  } catch (error) {
    console.error('Erro ao deletar mentoria:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/mentorias/mentor/:mentorId - Mentorias de um mentor específico
router.get('/mentor/:mentorId', async (req, res) => {
  try {
    const { mentorId } = req.params;

    const query = `
      SELECT 
        m.*,
        u.avatar_url as mentor_avatar,
        u.bio as mentor_bio,
        COALESCE(u.expertise, 'Especialista em Finanças') as mentor_expertise
      FROM mentorias m
      LEFT JOIN users u ON m.mentor_id = u.id
      WHERE m.mentor_id = $1 AND m.disponivel = true
      ORDER BY m.data_criacao DESC
    `;

    const result = await db.query(query, [mentorId]);

    res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Erro ao buscar mentorias do mentor:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// PATCH /api/mentorias/:id/disponibilidade - Atualizar apenas disponibilidade
router.patch('/:id/disponibilidade', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const { disponivel } = req.body;

    // Verificar se a mentoria existe e pertence ao usuário
    const checkQuery = `
      SELECT * FROM mentorias 
      WHERE id = $1 AND mentor_id = $2
    `;
    const checkResult = await db.query(checkQuery, [id, req.user.id]);

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Mentoria não encontrada'
      });
    }

    // Atualizar disponibilidade
    const updateQuery = `
      UPDATE mentorias 
      SET disponivel = $1, data_atualizacao = CURRENT_TIMESTAMP
      WHERE id = $2 AND mentor_id = $3
      RETURNING *
    `;

    const result = await db.query(updateQuery, [disponivel, id, req.user.id]);

    res.json({
      success: true,
      message: `Mentoria ${disponivel ? 'ativada' : 'desativada'} com sucesso!`,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erro ao atualizar disponibilidade:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

// GET /api/mentorias/areas/list - Listar áreas disponíveis
router.get('/areas/list', async (req, res) => {
  try {
    const query = `
      SELECT DISTINCT area 
      FROM mentorias 
      WHERE disponivel = true 
      ORDER BY area
    `;

    const result = await db.query(query);

    const areas = result.rows.map(row => row.area);

    res.json({
      success: true,
      data: areas
    });

  } catch (error) {
    console.error('Erro ao buscar áreas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
});

module.exports = router;