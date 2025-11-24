-- Tablas para Marketing Service
-- Base de datos: PostgreSQL Neon

-- Tabla de cupones
CREATE TABLE IF NOT EXISTS cupon (
    id SERIAL PRIMARY KEY,
    codigo VARCHAR(20) NOT NULL UNIQUE,
    descripcion TEXT,
    tipo VARCHAR(20) NOT NULL, -- 'porcentaje' o 'monto_fijo'
    valor DECIMAL(10,2) NOT NULL,
    minimo_compra DECIMAL(10,2) DEFAULT 0,
    usos_maximos INTEGER DEFAULT 1,
    usos_actuales INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_expiracion TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de campañas
CREATE TABLE IF NOT EXISTS campana (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) NOT NULL,
    estado VARCHAR(20) DEFAULT 'activa',
    fecha_inicio TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_fin TIMESTAMP,
    presupuesto DECIMAL(10,2),
    gasto_actual DECIMAL(10,2) DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de programa de fidelización
CREATE TABLE IF NOT EXISTS fidelizacion (
    id SERIAL PRIMARY KEY,
    usuario_id VARCHAR(50) NOT NULL UNIQUE,
    puntos_acumulados INTEGER DEFAULT 0,
    nivel VARCHAR(20) DEFAULT 'bronce',
    compras_totales INTEGER DEFAULT 0,
    monto_total_gastado DECIMAL(10,2) DEFAULT 0,
    fecha_ultimo_nivel TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de uso de cupones
CREATE TABLE IF NOT EXISTS uso_cupon (
    id SERIAL PRIMARY KEY,
    cupon_id INTEGER REFERENCES cupon(id),
    usuario_id VARCHAR(50) NOT NULL,
    pedido_id VARCHAR(50),
    descuento_aplicado DECIMAL(10,2),
    fecha_uso TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX IF NOT EXISTS idx_cupon_codigo ON cupon(codigo);
CREATE INDEX IF NOT EXISTS idx_cupon_activo ON cupon(activo);
CREATE INDEX IF NOT EXISTS idx_fidelizacion_usuario ON fidelizacion(usuario_id);
CREATE INDEX IF NOT EXISTS idx_uso_cupon_usuario ON uso_cupon(usuario_id);

-- Insertar datos de prueba
INSERT INTO cupon (codigo, descripcion, tipo, valor, minimo_compra, usos_maximos) VALUES 
('BIENVENIDO10', 'Descuento de bienvenida', 'porcentaje', 10.00, 50.00, 100),
('ENVIOGRATIS', 'Envío gratuito', 'monto_fijo', 15.00, 30.00, 50)
ON CONFLICT (codigo) DO NOTHING;

INSERT INTO fidelizacion (usuario_id, puntos_acumulados, nivel) VALUES 
('1', 0, 'bronce') ON CONFLICT (usuario_id) DO NOTHING;