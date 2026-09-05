-- ====================================================
-- ACTUALIZAR IDs A FORMATO PERSONALIZADO
-- ====================================================
-- Ejecutar SOLO en base de datos nueva o de desarrollo
-- NO ejecutar en producción con datos existentes

-- 1. Modificar tabla carrito
ALTER TABLE carrito ALTER COLUMN id TYPE VARCHAR(20);
ALTER TABLE carrito ALTER COLUMN id SET DEFAULT NULL;

-- 2. Modificar tabla pedido
ALTER TABLE pedido ALTER COLUMN id TYPE VARCHAR(20);
ALTER TABLE pedido ALTER COLUMN id SET DEFAULT NULL;

-- 3. Modificar tabla pago
ALTER TABLE pago ALTER COLUMN id TYPE VARCHAR(20);
ALTER TABLE pago ALTER COLUMN id SET DEFAULT NULL;

-- 4. Modificar tabla pedido_producto (FK)
ALTER TABLE pedido_producto ALTER COLUMN id_pedido TYPE VARCHAR(20);

-- 5. Modificar tabla carrito_producto (FK)
ALTER TABLE carrito_producto ALTER COLUMN id_carrito TYPE VARCHAR(20);

-- 6. Modificar tabla pago (FK)
ALTER TABLE pago ALTER COLUMN id_pedido TYPE VARCHAR(20);

-- 7. Modificar tabla pedido_historial (FK)
ALTER TABLE pedido_historial ALTER COLUMN id_pedido TYPE VARCHAR(20);

-- Verificar cambios
SELECT 
    table_name, 
    column_name, 
    data_type 
FROM information_schema.columns 
WHERE table_name IN ('carrito', 'pedido', 'pago', 'pedido_producto', 'carrito_producto', 'pedido_historial')
    AND column_name LIKE '%id%'
ORDER BY table_name, column_name;
