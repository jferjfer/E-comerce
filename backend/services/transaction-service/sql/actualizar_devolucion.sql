-- Script para actualizar tabla devolucion con columnas necesarias
-- Ejecutar en la base de datos de Transaction Service

-- Agregar columnas si no existen
ALTER TABLE devolucion 
ADD COLUMN IF NOT EXISTS comentario_aprobacion TEXT,
ADD COLUMN IF NOT EXISTS motivo_rechazo TEXT,
ADD COLUMN IF NOT EXISTS comentario_completado TEXT;

-- Actualizar constraint de estado para incluir 'Completada'
ALTER TABLE devolucion 
DROP CONSTRAINT IF EXISTS devolucion_estado_check;

ALTER TABLE devolucion 
ADD CONSTRAINT devolucion_estado_check 
CHECK (estado IN ('Solicitada', 'Aprobada', 'Rechazada', 'Completada'));

-- Verificar estructura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'devolucion'
ORDER BY ordinal_position;

COMMENT ON TABLE devolucion IS 'Tabla de devoluciones con flujo completo: Solicitada → Aprobada/Rechazada → Completada';
COMMENT ON COLUMN devolucion.comentario_aprobacion IS 'Comentario de Customer Success al aprobar';
COMMENT ON COLUMN devolucion.motivo_rechazo IS 'Motivo de Customer Success al rechazar';
COMMENT ON COLUMN devolucion.comentario_completado IS 'Comentario de Logistics al completar';
