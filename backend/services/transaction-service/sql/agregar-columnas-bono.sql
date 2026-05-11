-- Script para agregar columnas de bono a la tabla pedido
-- Ejecutar este script en la base de datos de producción

-- Agregar columna descuento_bono si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedido' AND column_name = 'descuento_bono'
    ) THEN
        ALTER TABLE pedido ADD COLUMN descuento_bono DECIMAL(10,2) DEFAULT 0;
        RAISE NOTICE 'Columna descuento_bono agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna descuento_bono ya existe';
    END IF;
END $$;

-- Agregar columna codigo_bono si no existe
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'pedido' AND column_name = 'codigo_bono'
    ) THEN
        ALTER TABLE pedido ADD COLUMN codigo_bono VARCHAR(20);
        RAISE NOTICE 'Columna codigo_bono agregada exitosamente';
    ELSE
        RAISE NOTICE 'Columna codigo_bono ya existe';
    END IF;
END $$;

-- Crear índice para búsquedas por código de bono
CREATE INDEX IF NOT EXISTS idx_pedido_codigo_bono ON pedido(codigo_bono);

-- Verificar las columnas agregadas
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'pedido' 
  AND column_name IN ('descuento_bono', 'codigo_bono');
