// routes/chatMentor.js
const express = require('express');
const router = express.Router();
const { OpenAI } = require('openai');  // Novo import

// Criação do cliente OpenAI
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

router.post('/', async (req, res) => {
  try {
    const { pergunta } = req.body;
    console.log('🧠 Recebida pergunta:', pergunta);

    if (!pergunta) {
      console.log('❌ Nenhuma pergunta recebida.');
      return res.status(400).json({ error: 'Pergunta obrigatória.' });
    }

    // Chamada para o OpenAI (ChatGPT)
    const response = await openai.chat.completions.create({
      messages: [{ role: 'user', content: pergunta }],
      model: 'gpt-3.5-turbo', // Ou outro modelo desejado
    });

    const resposta = response.choices[0].message.content;
    console.log('✅ Resposta gerada:', resposta);

    res.json({ resposta });
  } catch (error) {
    console.error('🔥 Erro no chatMentor:', error);
    res.status(500).json({ error: 'Erro interno no servidor (chatMentor).' });
  }
});

module.exports = router;
