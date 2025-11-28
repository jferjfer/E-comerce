-- Arreglar tipos de datos para compatibilidad
ALTER TABLE carrito ALTER COLUMN id_usuario TYPE integer USING id_usuario::text::integer;
ALTER TABLE pedido ALTER COLUMN id_usuario TYPE integer USING id_usuario::text::integer;

-- Verificar estructura
\d carrito;
\d pedido;