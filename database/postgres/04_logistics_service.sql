-- ====================================================
-- STYLEHUB LOGISTICS SERVICE - INVENTARIO, ALMACENES Y ENTREGAS
-- ====================================================

\c stylehub_logistics;

-- Enum para tipos de almacén
CREATE TYPE tipo_almacen AS ENUM ('PRINCIPAL', 'SECUNDARIO', 'TIENDA_FISICA', 'DROPSHIPPING');

-- Enum para tipos de movimiento de inventario
CREATE TYPE tipo_movimiento AS ENUM (
    'ENTRADA', 'SALIDA', 'TRANSFERENCIA', 'AJUSTE', 'DEVOLUCION', 'MERMA', 'RESERVA'
);

-- Enum para estados de envío
CREATE TYPE estado_envio AS ENUM (
    'PENDIENTE', 'PREPARANDO', 'EMPACADO', 'DESPACHADO', 
    'EN_TRANSITO', 'EN_REPARTO', 'ENTREGADO', 'FALLIDO', 'DEVUELTO'
);

-- Tabla: Almacenes
CREATE TABLE almacenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    tipo tipo_almacen NOT NULL,
    direccion TEXT NOT NULL,
    ciudad VARCHAR(100) NOT NULL,
    estado VARCHAR(100),
    codigo_postal VARCHAR(20) NOT NULL,
    pais VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    email VARCHAR(255),
    capacidad_maxima INTEGER,
    activo BOOLEAN DEFAULT true,
    es_principal BOOLEAN DEFAULT false,
    coordenadas POINT, -- Para geolocalización
    horario_operacion JSONB, -- Horarios de funcionamiento
    responsable_id UUID, -- ID del responsable del almacén
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Zonas dentro del almacén
CREATE TABLE zonas_almacen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    almacen_id UUID NOT NULL REFERENCES almacenes(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(50) NOT NULL,
    descripcion TEXT,
    capacidad INTEGER,
    temperatura_min DECIMAL(5,2),
    temperatura_max DECIMAL(5,2),
    humedad_min DECIMAL(5,2),
    humedad_max DECIMAL(5,2),
    activa BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(almacen_id, codigo)
);

-- Tabla: Ubicaciones específicas (estantes, compartimentos)
CREATE TABLE ubicaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    zona_id UUID NOT NULL REFERENCES zonas_almacen(id) ON DELETE CASCADE,
    codigo VARCHAR(50) NOT NULL,
    descripcion TEXT,
    capacidad_maxima INTEGER DEFAULT 1,
    ocupada BOOLEAN DEFAULT false,
    coordenada_x INTEGER,
    coordenada_y INTEGER,
    coordenada_z INTEGER,
    activa BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(zona_id, codigo)
);

-- Tabla: Inventario por ubicación
CREATE TABLE inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL,
    variante_id UUID,
    almacen_id UUID NOT NULL REFERENCES almacenes(id),
    ubicacion_id UUID REFERENCES ubicaciones(id),
    sku VARCHAR(100) NOT NULL,
    stock_actual INTEGER NOT NULL DEFAULT 0,
    stock_reservado INTEGER NOT NULL DEFAULT 0,
    stock_disponible INTEGER GENERATED ALWAYS AS (stock_actual - stock_reservado) STORED,
    stock_minimo INTEGER DEFAULT 0,
    stock_maximo INTEGER,
    punto_reorden INTEGER,
    costo_promedio DECIMAL(12,2),
    fecha_ultimo_movimiento TIMESTAMP,
    fecha_vencimiento DATE, -- Para productos perecederos
    lote VARCHAR(100),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(producto_id, variante_id, almacen_id, ubicacion_id)
);

-- Tabla: Movimientos de inventario
CREATE TABLE movimientos_inventario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    inventario_id UUID NOT NULL REFERENCES inventario(id),
    tipo tipo_movimiento NOT NULL,
    cantidad INTEGER NOT NULL,
    stock_anterior INTEGER NOT NULL,
    stock_nuevo INTEGER NOT NULL,
    costo_unitario DECIMAL(12,2),
    costo_total DECIMAL(12,2),
    referencia_externa VARCHAR(255), -- ID de pedido, transferencia, etc.
    motivo TEXT,
    usuario_id UUID, -- Quien realizó el movimiento
    fecha_movimiento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Para transferencias
    almacen_origen_id UUID REFERENCES almacenes(id),
    almacen_destino_id UUID REFERENCES almacenes(id),
    ubicacion_origen_id UUID REFERENCES ubicaciones(id),
    ubicacion_destino_id UUID REFERENCES ubicaciones(id)
);

-- Tabla: Proveedores
CREATE TABLE proveedores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    razon_social VARCHAR(255),
    nit VARCHAR(50),
    direccion TEXT,
    ciudad VARCHAR(100),
    estado VARCHAR(100),
    codigo_postal VARCHAR(20),
    pais VARCHAR(100),
    telefono VARCHAR(20),
    email VARCHAR(255),
    sitio_web VARCHAR(255),
    contacto_principal VARCHAR(255),
    telefono_contacto VARCHAR(20),
    email_contacto VARCHAR(255),
    terminos_pago VARCHAR(100),
    tiempo_entrega_dias INTEGER,
    calificacion DECIMAL(3,2),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Órdenes de compra
CREATE TABLE ordenes_compra (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_orden VARCHAR(50) UNIQUE NOT NULL,
    proveedor_id UUID NOT NULL REFERENCES proveedores(id),
    almacen_destino_id UUID NOT NULL REFERENCES almacenes(id),
    estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'ENVIADA', 'CONFIRMADA', 'PARCIAL', 'RECIBIDA', 'CANCELADA')),
    subtotal DECIMAL(12,2) NOT NULL,
    impuestos DECIMAL(12,2) DEFAULT 0.00,
    descuentos DECIMAL(12,2) DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'USD',
    fecha_orden DATE NOT NULL,
    fecha_entrega_esperada DATE,
    fecha_entrega_real DATE,
    notas TEXT,
    creado_por UUID, -- ID del usuario que creó la orden
    aprobado_por UUID, -- ID del usuario que aprobó
    fecha_aprobacion TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Items de orden de compra
CREATE TABLE items_orden_compra (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orden_compra_id UUID NOT NULL REFERENCES ordenes_compra(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL,
    variante_id UUID,
    sku VARCHAR(100) NOT NULL,
    descripcion VARCHAR(255) NOT NULL,
    cantidad_ordenada INTEGER NOT NULL,
    cantidad_recibida INTEGER DEFAULT 0,
    precio_unitario DECIMAL(12,2) NOT NULL,
    precio_total DECIMAL(12,2) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Transportadoras
CREATE TABLE transportadoras (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    codigo VARCHAR(50) UNIQUE NOT NULL,
    sitio_web VARCHAR(255),
    api_tracking_url VARCHAR(500),
    telefono VARCHAR(20),
    email VARCHAR(255),
    activa BOOLEAN DEFAULT true,
    configuracion JSONB, -- Configuración específica de la API
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Métodos de envío
CREATE TABLE metodos_envio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transportadora_id UUID NOT NULL REFERENCES transportadoras(id),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tiempo_entrega_min INTEGER, -- En días
    tiempo_entrega_max INTEGER, -- En días
    costo_base DECIMAL(12,2) NOT NULL,
    costo_por_kg DECIMAL(12,2) DEFAULT 0.00,
    peso_maximo DECIMAL(8,3),
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Envíos
CREATE TABLE envios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL, -- Referencia al pedido
    numero_envio VARCHAR(50) UNIQUE NOT NULL,
    transportadora_id UUID NOT NULL REFERENCES transportadoras(id),
    metodo_envio_id UUID NOT NULL REFERENCES metodos_envio(id),
    numero_seguimiento VARCHAR(100),
    estado estado_envio DEFAULT 'PENDIENTE',
    
    -- Información del remitente
    remitente_nombre VARCHAR(255) NOT NULL,
    remitente_direccion TEXT NOT NULL,
    remitente_ciudad VARCHAR(100) NOT NULL,
    remitente_codigo_postal VARCHAR(20) NOT NULL,
    remitente_pais VARCHAR(100) NOT NULL,
    
    -- Información del destinatario
    destinatario_nombre VARCHAR(255) NOT NULL,
    destinatario_direccion TEXT NOT NULL,
    destinatario_ciudad VARCHAR(100) NOT NULL,
    destinatario_codigo_postal VARCHAR(20) NOT NULL,
    destinatario_pais VARCHAR(100) NOT NULL,
    destinatario_telefono VARCHAR(20),
    
    -- Información del paquete
    peso_total DECIMAL(8,3),
    dimensiones JSONB, -- {largo, ancho, alto}
    valor_declarado DECIMAL(12,2),
    contenido_descripcion TEXT,
    
    -- Costos y fechas
    costo_envio DECIMAL(12,2) NOT NULL,
    fecha_despacho TIMESTAMP,
    fecha_entrega_estimada TIMESTAMP,
    fecha_entrega_real TIMESTAMP,
    
    -- Información adicional
    instrucciones_entrega TEXT,
    requiere_firma BOOLEAN DEFAULT false,
    seguro BOOLEAN DEFAULT false,
    notas TEXT,
    
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Items del envío
CREATE TABLE items_envio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    envio_id UUID NOT NULL REFERENCES envios(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL,
    variante_id UUID,
    sku VARCHAR(100) NOT NULL,
    nombre_producto VARCHAR(255) NOT NULL,
    cantidad INTEGER NOT NULL,
    peso_unitario DECIMAL(8,3),
    peso_total DECIMAL(8,3),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Seguimiento de envíos
CREATE TABLE seguimiento_envios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    envio_id UUID NOT NULL REFERENCES envios(id) ON DELETE CASCADE,
    estado estado_envio NOT NULL,
    descripcion TEXT,
    ubicacion VARCHAR(255),
    fecha_evento TIMESTAMP NOT NULL,
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Devoluciones
CREATE TABLE devoluciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL,
    envio_id UUID REFERENCES envios(id),
    numero_devolucion VARCHAR(50) UNIQUE NOT NULL,
    motivo VARCHAR(100) NOT NULL,
    descripcion TEXT,
    estado VARCHAR(20) DEFAULT 'SOLICITADA' CHECK (estado IN ('SOLICITADA', 'APROBADA', 'RECHAZADA', 'EN_TRANSITO', 'RECIBIDA', 'PROCESADA')),
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('REEMBOLSO', 'CAMBIO', 'CREDITO')),
    
    -- Información del cliente
    solicitado_por UUID,
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Procesamiento
    procesado_por UUID,
    fecha_procesamiento TIMESTAMP,
    costo_devolucion DECIMAL(12,2) DEFAULT 0.00,
    
    -- Información de envío de devolución
    numero_seguimiento_devolucion VARCHAR(100),
    transportadora_devolucion_id UUID REFERENCES transportadoras(id),
    
    notas_cliente TEXT,
    notas_internas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Items de devolución
CREATE TABLE items_devolucion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    devolucion_id UUID NOT NULL REFERENCES devoluciones(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL,
    variante_id UUID,
    sku VARCHAR(100) NOT NULL,
    cantidad INTEGER NOT NULL,
    motivo_item VARCHAR(255),
    condicion VARCHAR(50) CHECK (condicion IN ('NUEVO', 'USADO_BUENO', 'USADO_REGULAR', 'DAÑADO')),
    accion VARCHAR(50) CHECK (accion IN ('RESTOCK', 'DESCARTE', 'REPARACION')),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX idx_inventario_producto ON inventario(producto_id);
CREATE INDEX idx_inventario_almacen ON inventario(almacen_id);
CREATE INDEX idx_inventario_sku ON inventario(sku);
CREATE INDEX idx_inventario_stock ON inventario(stock_disponible);
CREATE INDEX idx_movimientos_inventario ON movimientos_inventario(inventario_id);
CREATE INDEX idx_movimientos_fecha ON movimientos_inventario(fecha_movimiento);
CREATE INDEX idx_movimientos_tipo ON movimientos_inventario(tipo);
CREATE INDEX idx_ordenes_proveedor ON ordenes_compra(proveedor_id);
CREATE INDEX idx_ordenes_estado ON ordenes_compra(estado);
CREATE INDEX idx_ordenes_fecha ON ordenes_compra(fecha_orden);
CREATE INDEX idx_envios_pedido ON envios(pedido_id);
CREATE INDEX idx_envios_estado ON envios(estado);
CREATE INDEX idx_envios_seguimiento ON envios(numero_seguimiento);
CREATE INDEX idx_seguimiento_envio ON seguimiento_envios(envio_id);
CREATE INDEX idx_seguimiento_fecha ON seguimiento_envios(fecha_evento);
CREATE INDEX idx_devoluciones_pedido ON devoluciones(pedido_id);
CREATE INDEX idx_devoluciones_estado ON devoluciones(estado);

-- Función para generar número de orden de compra
CREATE OR REPLACE FUNCTION generar_numero_orden_compra()
RETURNS VARCHAR(50) AS $$
DECLARE
    nuevo_numero VARCHAR(50);
    contador INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO contador
    FROM ordenes_compra 
    WHERE DATE(fecha_creacion) = CURRENT_DATE;
    
    nuevo_numero := 'OC-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(contador::TEXT, 4, '0');
    
    RETURN nuevo_numero;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar stock tras movimiento
CREATE OR REPLACE FUNCTION actualizar_stock_movimiento()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventario 
    SET 
        stock_actual = NEW.stock_nuevo,
        fecha_ultimo_movimiento = NEW.fecha_movimiento,
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id = NEW.inventario_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_stock
    AFTER INSERT ON movimientos_inventario
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_stock_movimiento();

-- Datos iniciales
INSERT INTO almacenes (nombre, codigo, tipo, direccion, ciudad, codigo_postal, pais, es_principal) VALUES
('Almacén Central StyleHub', 'ALM-001', 'PRINCIPAL', 'Av. Principal 123', 'Ciudad Principal', '12345', 'Colombia', true),
('Almacén Norte', 'ALM-002', 'SECUNDARIO', 'Calle Norte 456', 'Ciudad Norte', '23456', 'Colombia', false),
('Tienda Centro Comercial', 'TDA-001', 'TIENDA_FISICA', 'Centro Comercial Plaza', 'Ciudad Centro', '34567', 'Colombia', false);

INSERT INTO transportadoras (nombre, codigo, sitio_web) VALUES
('Servientrega', 'SERV', 'https://www.servientrega.com'),
('Coordinadora', 'COORD', 'https://www.coordinadora.com'),
('Envía', 'ENVIA', 'https://www.envia.co'),
('InterRapidísimo', 'INTER', 'https://www.interrapidisimo.com');

INSERT INTO metodos_envio (transportadora_id, nombre, descripcion, tiempo_entrega_min, tiempo_entrega_max, costo_base) 
SELECT t.id, 'Envío Estándar', 'Entrega en días hábiles', 3, 5, 15000.00 FROM transportadoras t WHERE t.codigo = 'SERV'
UNION ALL
SELECT t.id, 'Envío Express', 'Entrega rápida', 1, 2, 25000.00 FROM transportadoras t WHERE t.codigo = 'SERV'
UNION ALL
SELECT t.id, 'Envío Estándar', 'Entrega en días hábiles', 2, 4, 12000.00 FROM transportadoras t WHERE t.codigo = 'COORD';