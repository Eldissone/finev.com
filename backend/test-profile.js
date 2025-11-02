const testProfile = async () => {
    // Substitua pelo seu token real
    const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImlhdCI6MTc2MTgxNzc4MywiZXhwIjoxNzYyNDIyNTgzfQ.wX8Cl9vT4h901fzhmNFSBml6GSYuXwSFwByhChlLi_U';
    
    try {
        console.log('🧪 Testando rota /profile...');
        
        const response = await fetch('http://localhost:5000/api/auth/profile', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        console.log('📊 Status:', response.status);
        console.log('📋 Headers:', Object.fromEntries(response.headers.entries()));
        
        const data = await response.json();
        console.log('📦 Resposta completa:', JSON.stringify(data, null, 2));
        
        if (data.success) {
            console.log('✅ SUCCESS: Perfil carregado com sucesso!');
            console.log('👤 Usuário:', data.data.user);
        } else {
            console.log('❌ ERROR:', data.message);
        }
        
    } catch (error) {
        console.error('💥 Erro na requisição:', error.message);
    }
};

// Executar teste
testProfile();