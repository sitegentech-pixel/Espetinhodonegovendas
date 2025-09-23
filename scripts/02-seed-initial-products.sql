-- Inserção de produtos iniciais para o cardápio
-- Obtém os IDs das categorias criadas anteriormente

-- Espetinhos
INSERT INTO products (name, description, price, category_id, image_url) VALUES
  ('Espetinho de Picanha', 'Suculenta picanha grelhada no espeto', 18.00, 
   (SELECT id FROM categories WHERE name = 'Espetinhos'), 
   '/placeholder.svg?height=200&width=200'),
  
  ('Espetinho de Frango', 'Frango temperado e grelhado na brasa', 12.00, 
   (SELECT id FROM categories WHERE name = 'Espetinhos'), 
   '/placeholder.svg?height=200&width=200'),
  
  ('Espetinho de Linguiça', 'Linguiça artesanal grelhada', 15.00, 
   (SELECT id FROM categories WHERE name = 'Espetinhos'), 
   '/placeholder.svg?height=200&width=200'),
  
  ('Espetinho Misto', 'Combinação de carnes variadas', NULL, 
   (SELECT id FROM categories WHERE name = 'Espetinhos'), 
   '/placeholder.svg?height=200&width=200');

-- Petiscos
INSERT INTO products (name, description, price, category_id, image_url) VALUES
  ('Batata Frita', 'Batata frita crocante temperada', 8.00, 
   (SELECT id FROM categories WHERE name = 'Petiscos'), 
   '/placeholder.svg?height=200&width=200'),
  
  ('Mandioca Frita', 'Mandioca dourada e crocante', 7.00, 
   (SELECT id FROM categories WHERE name = 'Petiscos'), 
   '/placeholder.svg?height=200&width=200'),
  
  ('Porção de Torresmo', 'Torresmo crocante da casa', NULL, 
   (SELECT id FROM categories WHERE name = 'Petiscos'), 
   '/placeholder.svg?height=200&width=200');

-- Bebidas
INSERT INTO products (name, description, price, category_id, image_url) VALUES
  ('Coca-Cola Lata', 'Refrigerante gelado 350ml', 5.00, 
   (SELECT id FROM categories WHERE name = 'Bebidas'), 
   '/placeholder.svg?height=200&width=200'),
  
  ('Cerveja Skol', 'Cerveja gelada long neck', 6.00, 
   (SELECT id FROM categories WHERE name = 'Bebidas'), 
   '/placeholder.svg?height=200&width=200'),
  
  ('Água Mineral', 'Água mineral 500ml', 3.00, 
   (SELECT id FROM categories WHERE name = 'Bebidas'), 
   '/placeholder.svg?height=200&width=200');
