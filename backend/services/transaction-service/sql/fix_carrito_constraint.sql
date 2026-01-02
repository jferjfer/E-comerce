-- Migración: Agregar constraint UNIQUE a carrito.id_usuario
-- Fecha: 2024-12-14
-- Propósito: Evitar múltiples carritos por usuario

-- Paso 1: Eliminar carritos duplicados (mantener el más reciente)
DELETE FROM carrito a USING carrito b
WHERE a.id_usuario = b.id_usuario 
  AND a.fecha_actualizacion < b.fecha_actualizacion;

-- Paso 2: Agregar constraint UNIQUE
ALTER TABLE carrito 
ADD CONSTRAINT carrito_id_usuario_unique UNIQUE (id_usuario);

-- Verificación
SELECT 
    id_usuario, 
    COUNT(*) as cantidad_carritos
FROM carrito
GROUP BY id_usuario
HAVING COUNT(*) > 1;
-- Debe retornar 0 filas
