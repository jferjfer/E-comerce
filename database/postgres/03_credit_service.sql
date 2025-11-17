-- ====================================================
-- 8. BASE DE DATOS SERVICIO CRÉDITO
-- ====================================================

CREATE DATABASE bd_credito;
\c bd_credito;

-- Tabla: CreditoInterno
CREATE TABLE credito_interno (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL UNIQUE,
    limite_credito DECIMAL(12, 2) NOT NULL,
    saldo_usado DECIMAL(12, 2) DEFAULT 0.00,
    saldo_disponible DECIMAL(12, 2) GENERATED ALWAYS AS (limite_credito - saldo_usado) STORED,
    estado VARCHAR(50) NOT NULL CHECK (estado IN ('Aprobado', 'Bloqueado', 'Suspendido')),
    fecha_aprobacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: SolicitudCreditoExterno
CREATE TABLE solicitud_credito_externo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    proveedor VARCHAR(100) NOT NULL,
    monto_solicitado DECIMAL(12, 2) NOT NULL,
    estado VARCHAR(50) NOT NULL CHECK (estado IN ('Pendiente', 'Aprobado', 'Rechazado')),
    referencia_externa VARCHAR(255),
    respuesta_proveedor JSONB,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: TransaccionCredito
CREATE TABLE transaccion_credito (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_credito_interno UUID REFERENCES credito_interno(id) ON DELETE CASCADE,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('Cargo', 'Pago', 'Ajuste')),
    monto DECIMAL(12, 2) NOT NULL,
    id_pedido UUID,
    descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimizar consultas
CREATE INDEX idx_credito_usuario ON credito_interno(id_usuario);
CREATE INDEX idx_solicitud_usuario ON solicitud_credito_externo(id_usuario);
CREATE INDEX idx_solicitud_estado ON solicitud_credito_externo(estado);
CREATE INDEX idx_transaccion_credito ON transaccion_credito(id_credito_interno);
