-- Crear tabla carrito simple para el transaction service
DROP TABLE IF EXISTS carrito CASCADE;

CREATE TABLE carrito (
    id SERIAL PRIMARY KEY,
    usuario_id VARCHAR(50) NOT NULL,
    productos JSONB DEFAULT '[]'::jsonb,
    total DECIMAL(10, 2) DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(usuario_id)
);

-- Insertar carrito vacío para usuario demo
INSERT INTO carrito (usuario_id, productos, total) 
VALUES ('1', '[]'::jsonb, 0)
ON CONFLICT (usuario_id) DO NOTHING;

SELECT 'Tabla carrito creada exitosamente' as resultado;