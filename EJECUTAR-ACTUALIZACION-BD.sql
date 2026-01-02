-- ====================================================
-- SCRIPT DE ACTUALIZACIÓN TABLA DEVOLUCION
-- Ejecutar en PostgreSQL (Transaction Service Database)
-- ====================================================

-- 1. Agregar columnas nuevas
ALTER TABLE devolucion 
ADD COLUMN IF NOT EXISTS comentario_aprobacion TEXT,
ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT,
ADD COLUMN IF NOT EXISTS comentario_completado TEXT;

-- 2. Actualizar constraint de estado
ALTER TABLE devolucion 
DROP CONSTRAINT IF EXISTS devolucion_estado_check;

ALTER TABLE devolucion 
ADD CONSTRAINT devolucion_estado_check 
CHECK (estado IN ('Solicitada', 'Aprobada', 'Rechazada', 'Completada'));

-- 3. Verificar estructura
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'devolucion'
ORDER BY ordinal_position;

-- 4. Resultado esperado:
-- id                      | integer               | NO
-- id_pedido               | uuid                  | NO
-- usuario_id              | integer               | NO
-- razon                   | text                  | NO
-- estado                  | character varying(50) | NO
-- fecha_creacion          | timestamp             | YES
-- fecha_actualizacion     | timestamp             | YES
-- comentario_aprobacion   | text                  | YES
-- motivo_rechazo          | text                  | YES
-- comentario_completado   | text                  | YES

SELECT '✅ Tabla devolucion actualizada correctamente' AS resultado;
