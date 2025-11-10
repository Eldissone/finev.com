import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, TrendingUp, Code, Briefcase, Sprout } from 'lucide-react';

const FINMentorBot = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: '',
    interests: [],
    level: '',
    goals: [],
    area: ''
  });
  const [stage, setStage] = useState('greeting');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Mensagem inicial
    setTimeout(() => {
      addBotMessage(
        "Olá! 👋 Eu sou o FIN, seu mentor de onboarding aqui na plataforma.\n\nEstou aqui para te conhecer melhor e te guiar para o caminho ideal de crescimento. Vamos começar?\n\n**Qual é o seu nome?**"
      );
    }, 500);
  }, []);

  const addBotMessage = (text, delay = 1000) => {
    setIsTyping(true);
    setTimeout(() => {
      setMessages(prev => [...prev, { text, sender: 'bot' }]);
      setIsTyping(false);
    }, delay);
  };

  const addUserMessage = (text) => {
    setMessages(prev => [...prev, { text, sender: 'user' }]);
  };

  const analyzeProfile = async (userInput) => {
    const prompt = `Você é o FIN Mentor, um assistente de onboarding inteligente e empático da plataforma FIN.

Perfil do usuário coletado:
- Nome: ${userProfile.name}
- Resposta atual: ${userInput}
- Estágio: ${stage}
- Interesses registrados: ${userProfile.interests.join(', ') || 'nenhum ainda'}
- Objetivos: ${userProfile.goals.join(', ') || 'nenhum ainda'}

Sua missão agora é:
1. Se estágio = 'goals', analise o que o usuário quer alcançar
2. Se estágio = 'experience', entenda o nível de experiência dele
3. Se estágio = 'final', faça a classificação final e recomendação

ÁREAS DISPONÍVEIS:
- **Financeira** (FIN): investimentos, educação financeira, independência
- **Tech** (TECH): programação, tecnologia, desenvolvimento
- **Business** (BIZ): empreendedorismo, negócios, gestão
- **Agro** (AGRO): agronegócio, agricultura, pecuária

NÍVEIS:
- Iniciante: começando agora, pouca experiência
- Intermediário: já tem base, quer evoluir
- Avançado: experiência sólida, busca especialização

Responda de forma:
- Empática e inspiradora
- Prática e direta
- Use emojis moderadamente
- Faça 1 pergunta por vez
- Se for a classificação final, apresente em formato estruturado com área, nível e próximos passos

Responda APENAS com a próxima mensagem para o usuário (sem tags JSON, só o texto da conversa).`;

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            { role: 'user', content: prompt }
          ],
        }),
      });

      const data = await response.json();
      const botResponse = data.content[0].text;
      
      return botResponse;
    } catch (error) {
      console.error('Erro ao processar:', error);
      return "Desculpe, tive um problema técnico. Pode repetir?";
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userInput = input.trim();
    addUserMessage(userInput);
    setInput('');

    // Lógica de fluxo conversacional
    if (stage === 'greeting') {
      setUserProfile(prev => ({ ...prev, name: userInput }));
      setStage('goals');
      addBotMessage(
        `Prazer, ${userInput}! 🌟\n\nAgora me conta: **o que você quer alcançar?** O que te trouxe até aqui?\n\n_(Pode ser mais de uma coisa: independência financeira, aprender a programar, abrir um negócio, etc)_`,
        800
      );
    } else if (stage === 'goals') {
      const goalsArray = userInput.toLowerCase().split(/,|e|\n/).map(s => s.trim()).filter(Boolean);
      setUserProfile(prev => ({ ...prev, goals: goalsArray }));
      setStage('experience');
      addBotMessage(
        `Entendi! ${userInput.includes('financ') ? '💰' : userInput.includes('program') || userInput.includes('tech') ? '💻' : userInput.includes('negóc') || userInput.includes('empresa') ? '📊' : userInput.includes('agro') ? '🌾' : '🎯'}\n\n**Como você se definiria hoje?**\n\n• Iniciante (começando do zero)\n• Intermediário (já tenho alguma base)\n• Avançado (tenho experiência sólida)`,
        800
      );
    } else if (stage === 'experience') {
      const level = userInput.toLowerCase().includes('inicia') ? 'Iniciante' 
                  : userInput.toLowerCase().includes('intermed') ? 'Intermediário'
                  : userInput.toLowerCase().includes('avanç') ? 'Avançado'
                  : 'Intermediário';
      
      setUserProfile(prev => ({ ...prev, level }));
      setStage('analyzing');
      
      addBotMessage(
        `Perfeito! Só mais um momento enquanto eu analiso o melhor caminho para você... 🎯`,
        500
      );

      // Análise com IA
      setTimeout(async () => {
        const analysis = await analyzeProfile(userInput);
        addBotMessage(analysis, 1500);
        setStage('complete');
      }, 2000);
    } else if (stage === 'complete') {
      const response = await analyzeProfile(userInput);
      addBotMessage(response, 800);
    }
  };

  const getMentorIcon = (area) => {
    switch(area) {
      case 'fin': return <TrendingUp className="w-5 h-5" />;
      case 'tech': return <Code className="w-5 h-5" />;
      case 'biz': return <Briefcase className="w-5 h-5" />;
      case 'agro': return <Sprout className="w-5 h-5" />;
      default: return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Header */}
      <div className="bg-black/30 backdrop-blur-lg border-b border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg">FIN Mentor</h1>
            <p className="text-purple-300 text-sm">Seu guia de onboarding inteligente</p>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-2xl p-4 ${
                  msg.sender === 'user'
                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                    : 'bg-white/10 backdrop-blur-md text-white border border-white/20'
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{msg.text}</p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
                <div className="flex gap-1">
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-black/30 backdrop-blur-lg border-t border-white/10 p-4">
        <div className="max-w-4xl mx-auto flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Digite sua resposta..."
            className="flex-1 bg-white/10 border border-white/20 rounded-full px-6 py-3 text-white placeholder-purple-300 focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={isTyping || stage === 'analyzing'}
          />
          <button
            onClick={handleSend}
            disabled={isTyping || !input.trim() || stage === 'analyzing'}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full p-3 hover:from-purple-700 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FINMentorBot;