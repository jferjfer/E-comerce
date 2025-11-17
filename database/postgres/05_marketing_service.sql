-- ====================================================
-- 6. BASE DE DATOS SERVICIO MARKETING
-- ====================================================

CREATE DATABASE bd_marketing;
\c bd_marketing;

-- Tabla: Fidelizacion
CREATE TABLE fidelizacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_usuario UUID NOT NULL,
    puntos INTEGER DEFAULT 0,
    beneficios TEXT,
    nivel VARCHAR(50) DEFAULT 'Bronce' CHECK (nivel IN ('Bronce', 'Plata', 'Oro', 'Platino')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: CampañaMarketing
CREATE TABLE campana_marketing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    segmento VARCHAR(100),
    estado VARCHAR(50) DEFAULT 'Borrador' CHECK (estado IN ('Borrador', 'Activa', 'Pausada', 'Finalizada')),
    fecha_inicio DATE,
    fecha_fin DATE,
    presupuesto DECIMAL(12, 2),
    metricas JSONB,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Cupon
CREATE TABLE cupon (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255),
    tipo_descuento VARCHAR(50) NOT NULL CHECK (tipo_descuento IN ('Porcentaje', 'MontoFijo', 'EnvioGratis')),
    valor DECIMAL(10, 2) NOT NULL,
    usos_maximos INTEGER,
    usos_actuales INTEGER DEFAULT 0,
    fecha_inicio DATE,
    fecha_expiracion DATE,
    activo BOOLEAN DEFAULT true,
    condiciones JSONB,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: UsosCupon (para seguimiento)
CREATE TABLE usos_cupon (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    id_cupon UUID NOT NULL REFERENCES cupon(id) ON DELETE CASCADE,
    id_usuario UUID NOT NULL,
    id_pedido UUID,
    monto_descuento DECIMAL(10, 2),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: SegmentoUsuario
CREATE TABLE segmento_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    criterios JSONB NOT NULL,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: UsuarioSegmento (relación many-to-many)
CREATE TABLE usuario_segmento (
    id_usuario UUID NOT NULL,
    id_segmento UUID NOT NULL REFERENCES segmento_usuario(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id_usuario, id_segmento)
);

-- Índices para optimizar consultas
CREATE INDEX idx_fidelizacion_usuario ON fidelizacion(id_usuario);
CREATE INDEX idx_fidelizacion_nivel ON fidelizacion(nivel);
CREATE INDEX idx_campana_estado ON campana_marketing(estado);
CREATE INDEX idx_campana_fechas ON campana_marketing(fecha_inicio, fecha_fin);
CREATE INDEX idx_cupon_codigo ON cupon(codigo);
CREATE INDEX idx_cupon_activo ON cupon(activo);
CREATE INDEX idx_cupon_fechas ON cupon(fecha_inicio, fecha_expiracion);
CREATE INDEX idx_usos_cupon_usuario ON usos_cupon(id_usuario);
CREATE INDEX idx_usuario_segmento_usuario ON usuario_segmento(id_usuario);

-- Datos iniciales
INSERT INTO segmento_usuario (nombre, descripcion, criterios) VALUES
('Nuevos Clientes', 'Usuarios registrados en los últimos 30 días', '{"dias_registro": 30, "compras": 0}'),
('Clientes VIP', 'Usuarios con más de $500 en compras', '{"total_compras": 500, "nivel_fidelizacion": "Oro"}'),
('Abandonadores', 'Usuarios con carritos abandonados', '{"carrito_abandonado": true, "dias_inactividad": 7}');

INSERT INTO cupon (codigo, nombre, tipo_descuento, valor, usos_maximos, fecha_inicio, fecha_expiracion, condiciones) VALUES
('BIENVENIDO10', 'Descuento de Bienvenida', 'Porcentaje', 10.00, 1000, CURRENT_DATE, CURRENT_DATE + INTERVAL '30 days', '{"primer_compra": true}'),
('ENVIOGRATIS', 'Envío Gratis', 'EnvioGratis', 0.00, 500, CURRENT_DATE, CURRENT_DATE + INTERVAL '15 days', '{"monto_minimo": 50}');