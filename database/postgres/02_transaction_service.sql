-- ====================================================
-- 3. BASE DE DATOS SERVICIO TRANSACCIONES
-- ====================================================

CREATE DATABASE bd_transacciones;
\c bd_transacciones;

-- Tabla: Carrito
CREATE TABLE carrito (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: CarritoProducto (relación muchos a muchos)
CREATE TABLE carrito_producto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_carrito UUID NOT NULL REFERENCES carrito(id) ON DELETE CASCADE,
    id_producto UUID NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Pedido
CREATE TABLE pedido (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    estado VARCHAR(50) NOT NULL CHECK (estado IN ('Creado', 'Enviado', 'Entregado', 'Cancelado')),
    fecha_entrega DATE,
    total DECIMAL(12, 2) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: PedidoProducto
CREATE TABLE pedido_producto (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pedido UUID NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
    id_producto UUID NOT NULL,
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10, 2) NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL
);

-- Tabla: Pago
CREATE TABLE pago (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pedido UUID NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
    tipo_pago VARCHAR(50) NOT NULL CHECK (tipo_pago IN ('Tarjeta', 'PSE', 'Credito_Interno', 'Credito_Externo')),
    monto DECIMAL(12, 2) NOT NULL,
    estado VARCHAR(50) NOT NULL CHECK (estado IN ('Aprobado', 'Pendiente', 'Rechazado')),
    metodo VARCHAR(100),
    referencia_transaccion VARCHAR(255),
    id_credito_interno UUID,
    id_credito_externo UUID,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Devolucion
CREATE TABLE devolucion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pedido UUID NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
    id_usuario UUID NOT NULL,
    razon TEXT NOT NULL,
    estado VARCHAR(50) NOT NULL CHECK (estado IN ('Solicitada', 'Aprobada', 'Rechazada')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX idx_carrito_usuario ON carrito(id_usuario);
CREATE INDEX idx_pedido_usuario ON pedido(id_usuario);
CREATE INDEX idx_pedido_estado ON pedido(estado);
CREATE INDEX idx_pago_pedido ON pago(id_pedido);
CREATE INDEX idx_devolucion_pedido ON devolucion(id_pedido);
