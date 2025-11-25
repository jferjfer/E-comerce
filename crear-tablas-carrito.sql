-- CREAR TABLAS PARA TRANSACTION SERVICE EN NEONDB
-- Ejecutar este script en la base de datos neondb

-- Tabla: Carrito
CREATE TABLE IF NOT EXISTS carrito (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: CarritoProducto (relación muchos a muchos)
CREATE TABLE IF NOT EXISTS carrito_producto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_carrito UUID NOT NULL REFERENCES carrito(id) ON DELETE CASCADE,
    id_producto UUID NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Pedido
CREATE TABLE IF NOT EXISTS pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    estado VARCHAR(50) NOT NULL CHECK (estado IN ('Creado', 'Enviado', 'Entregado', 'Cancelado')),
    fecha_entrega DATE,
    total DECIMAL(12, 2) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX IF NOT EXISTS idx_carrito_usuario ON carrito(id_usuario);
CREATE INDEX IF NOT EXISTS idx_pedido_usuario ON pedido(id_usuario);
CREATE INDEX IF NOT EXISTS idx_pedido_estado ON pedido(estado);

-- Las tablas están listas para usar
-- Los carritos se crearán automáticamente cuando los usuarios los necesiten