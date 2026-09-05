-- ====================================================
-- 4. BASE DE DATOS SERVICIO LOGÍSTICA
-- ====================================================

CREATE DATABASE bd_logistica;
\c bd_logistica;

-- Tabla: Almacen
CREATE TABLE almacen (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    zona_geografica VARCHAR(255) NOT NULL,
    direccion TEXT,
    capacidad_maxima INTEGER,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: UbicacionStock
CREATE TABLE ubicacion_stock (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_almacen UUID NOT NULL REFERENCES almacen(id) ON DELETE CASCADE,
    id_producto UUID NOT NULL,
    cantidad INTEGER NOT NULL DEFAULT 0,
    stock_minimo INTEGER NOT NULL DEFAULT 10,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(id_almacen, id_producto)
);

-- Tabla: Domicilio
CREATE TABLE domicilio (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT NOT NULL,
    zona VARCHAR(255) NOT NULL,
    ciudad VARCHAR(100),
    codigo_postal VARCHAR(20),
    telefono VARCHAR(50),
    disponibilidad BOOLEAN DEFAULT TRUE,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Logistica
CREATE TABLE logistica (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_pedido UUID NOT NULL UNIQUE,
    id_almacen_origen UUID REFERENCES almacen(id),
    id_domicilio_destino UUID REFERENCES domicilio(id),
    ruta TEXT,
    estado_entrega VARCHAR(50) NOT NULL CHECK (estado_entrega IN ('Preparando', 'En_Transito', 'Entregado', 'Fallido')),
    transportista VARCHAR(255),
    numero_guia VARCHAR(255),
    fecha_despacho TIMESTAMP,
    fecha_entrega_estimada TIMESTAMP,
    fecha_entrega_real TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX idx_stock_producto ON ubicacion_stock(id_producto);
CREATE INDEX idx_stock_almacen ON ubicacion_stock(id_almacen);
CREATE INDEX idx_domicilio_usuario ON domicilio(id_usuario);
CREATE INDEX idx_logistica_pedido ON logistica(id_pedido);
CREATE INDEX idx_logistica_estado ON logistica(estado_entrega);
