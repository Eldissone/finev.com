const express = require('express');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

// Rota básica para listar mentores
router.get('/', (req, res) => {
  console.log('📋 Listando mentores...');
  
  const mentors = [
    {
      id: 1,
      name: 'Carlos Mendes',
      role: 'Analista Sênior de Investimentos',
      company: 'XP Investimentos',
      area: 'FIN',
      expertise: ['investimentos', 'mercado financeiro', 'análise técnica'],
      rating: 4.8,
      reviews: 127,
      experience: '12 anos',
      price: 150,
      plan: 'basic',
      available: true,
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      description: 'Especialista em análise de investimentos e gestão de carteiras. Mais de 10 anos de experiência no mercado financeiro.',
      languages: ['Português', 'Inglês'],
      specialties: ['Ações', 'Fundos Imobiliários', 'Renda Fixa']
    },
    {
      id: 2,
      name: 'Ana Silva',
      role: 'Gestora de Carteiras',
      company: 'BTG Pactual',
      area: 'FIN',
      expertise: ['gestao', 'wealth management', 'planejamento'],
      rating: 4.9,
      reviews: 89,
      experience: '8 anos',
      price: 200,
      plan: 'pro',
      available: true,
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      description: 'Gestora de patrimônio com foco em planejamento financeiro familiar e investimentos de longo prazo.',
      languages: ['Português', 'Inglês', 'Espanhol'],
      specialties: ['Gestão Patrimonial', 'Sucessão Familiar', 'Investimentos Internacionais']
    },
    {
      id: 3,
      name: 'Roberto Almeida',
      role: 'Especialista em Tech Finance',
      company: 'Nubank',
      area: 'TECH',
      expertise: ['tech', 'fintech', 'tecnologia'],
      rating: 4.7,
      reviews: 64,
      experience: '6 anos',
      price: 180,
      plan: 'pro',
      available: false,
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      description: 'Desenvolvedor e analista especializado em fintechs e soluções tecnológicas para o mercado financeiro.',
      languages: ['Português', 'Inglês'],
      specialties: ['Fintechs', 'APIs Financeiras', 'Blockchain']
    }
  ];

  res.json({
    success: true,
    data: mentors,
    pagination: {
      total: mentors.length,
      page: 1,
      limit: 12,
      totalPages: 1
    }
  });
});

// Rota para obter áreas de mentoria
router.get('/areas', (req, res) => {
  const areas = [
    { code: 'FIN', name: 'Finanças, Inovação e Negócio', color: 'from-primary to-orange-400', mentors: 4 },
    { code: 'TECH', name: 'Tecnologia & Inovação', color: 'from-blue-500 to-cyan-400', mentors: 3 },
    { code: 'BIZ', name: 'Business & Empreendedorismo', color: 'from-green-500 to-emerald-400', mentors: 2 },
    { code: 'AGRO', name: 'Agronegócio & Sustentabilidade', color: 'from-yellow-500 to-amber-400', mentors: 2 },
    { code: 'LIFE', name: 'Desenvolvimento Pessoal', color: 'from-purple-500 to-pink-400', mentors: 2 },
    { code: 'HEALTH', name: 'Saúde & Bem-estar', color: 'from-red-500 to-rose-400', mentors: 1 }
  ];

  res.json({
    success: true,
    data: areas
  });
});

// Rota para favoritar mentor
router.post('/:id/favorite', authenticate, (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;
  
  console.log(`❤️ Usuário ${userId} favoritando mentor ${id}`);
  
  res.json({
    success: true,
    isFavorite: true,
    message: 'Mentor adicionado aos favoritos!'
  });
});

module.exports = router;