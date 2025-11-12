const bcrypt = require('bcrypt');

// Função para gerar o hash da senha
async function hashPassword(plainPassword) {
    const saltRounds = 10; // Você pode ajustar isso para melhorar a segurança
    const hashedPassword = await bcrypt.hash(plainPassword, saltRounds);
    return hashedPassword;
}

// Exemplo de uso:
const newPassword = 'Bell@123';
hashPassword(newPassword).then((hashedPassword) => {
    console.log('Senha hashada:', hashedPassword);
});
