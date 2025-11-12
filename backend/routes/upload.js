const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { authenticate } = require('../middlewares/auth');
const db = require('../config/database');

const router = express.Router();

// Configurar storage do multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/avatars/';
    // Criar diretório se não existir
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Gerar nome único para o arquivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'avatar-' + req.user.id + '-' + uniqueSuffix + ext);
  }
});

// Filtro para aceitar apenas imagens
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Apenas arquivos de imagem são permitidos!'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  }
});

// Rota para upload de avatar
router.post('/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    console.log('📤 Recebendo upload de avatar...');
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Nenhuma imagem foi enviada'
      });
    }

    const userId = req.user.id;
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;

    console.log('📸 Atualizando avatar do usuário:', userId);
    console.log('🖼️ Arquivo salvo como:', req.file.filename);

    // Atualizar no banco de dados
    const result = await db.query(
      'UPDATE users SET avatar_url = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [avatarUrl, userId]
    );

    if (result.rows.length === 0) {
      // Se falhar, deletar o arquivo enviado
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        error: 'Usuário não encontrado'
      });
    }

    const user = result.rows[0];

    res.json({
      success: true,
      data: {
        avatarUrl: avatarUrl,
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
          role: user.role,
          avatarUrl: user.avatar_url
        }
      },
      message: 'Avatar atualizado com sucesso!'
    });

  } catch (error) {
    console.error('❌ Erro no upload do avatar:', error);
    
    // Deletar arquivo em caso de erro
    if (req.file) {
      fs.unlinkSync(req.file.path);
    }
    
    res.status(500).json({
      success: false,
      error: 'Erro ao fazer upload da imagem'
    });
  }
});

// Rota para servir arquivos estáticos
router.use('/uploads', express.static('uploads'));

module.exports = router;