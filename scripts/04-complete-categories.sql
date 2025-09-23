-- Script para inserir todas as categorias necessárias para o cardápio
-- A cláusula ON CONFLICT garante que não haverá duplicatas se o script for executado mais de uma vez.

INSERT INTO public.categories (name, display_order) VALUES
  ('Espetinhos', 1),
  ('Petiscos', 2),
  ('Pratos', 3),
  ('Sopas', 4),
  ('Cervejas 600', 5),
  ('Refris', 6),
  ('Sucos', 7),
  ('Caldinhos', 8)
ON CONFLICT (name) DO NOTHING;
