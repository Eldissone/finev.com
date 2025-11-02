const User = require('./models/User');

(async () => {
  try {
    const newUser = await User.create({
      firstName: 'Eldissone',
      lastName: 'Vilonga',
      email: 'eldissone@finev.com',
      password: '123456'
    });

    console.log('Usuário criado:', newUser);

    const foundUser = await User.findByEmail('eldissone@finev.com');
    console.log('Usuário encontrado:', foundUser);

  } catch (error) {
    console.error('Erro:', error.message);
  }
})();
