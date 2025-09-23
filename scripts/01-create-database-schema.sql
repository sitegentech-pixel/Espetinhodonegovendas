-- Habilita a extensão pgcrypto se ainda não estiver habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Tabela de Configurações do Negócio
-- Armazena informações chave do restaurante
CREATE TABLE business_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE business_settings IS 'Armazena configurações gerais do negócio como número do WhatsApp, endereço, etc.';

-- Tabela de Categorias
-- Organiza os produtos em seções no cardápio
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE categories IS 'Categorias dos produtos (Ex: Espetinhos, Petiscos, Bebidas).';

-- Tabela de Produtos
-- Contém todos os itens do cardápio
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC(10, 2), -- Permite valores NULL para itens com preço a combinar
  image_url TEXT,
  is_available BOOLEAN NOT NULL DEFAULT TRUE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
COMMENT ON TABLE products IS 'Itens individuais do cardápio. O preço pode ser nulo.';

-- Ativação do Row Level Security (RLS) para todas as tabelas
ALTER TABLE business_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Políticas de Acesso (Policies)
-- Por padrão, nega todo o acesso. Estas políticas liberam a leitura para todos.
CREATE POLICY "Enable read access for all users" ON public.business_settings
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.categories
FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON public.products
FOR SELECT USING (true);

-- No futuro, adicionaremos políticas para permitir que apenas administradores autenticados possam inserir/atualizar/deletar.

-- Inserção de dados de exemplo para iniciar o cardápio (Opcional, mas recomendado)
INSERT INTO categories (name, display_order) VALUES
  ('Espetinhos', 1),
  ('Petiscos', 2),
  ('Bebidas', 3);
