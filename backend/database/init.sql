-- Conectar ao banco FINMENT_DB (assumindo que já foi criado)
\c FINMENT_DB;

-- Criar tabela de usuários
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Criar índice para email
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Inserir usuário de teste para demonstração
INSERT INTO users (first_name, last_name, email, password_hash) 
VALUES ('Admin', 'FIN', 'admin@fin.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj89OF4MQDVC')
ON CONFLICT (email) DO NOTHING;

-- Verificar tabela criada
SELECT * FROM users;