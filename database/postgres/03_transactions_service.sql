-- ====================================================
-- STYLEHUB TRANSACTIONS SERVICE - CARRITOS, PEDIDOS Y PAGOS
-- ====================================================

\c stylehub_transactions;

-- Enum para estados de carrito
CREATE TYPE estado_carrito AS ENUM ('ACTIVO', 'ABANDONADO', 'CONVERTIDO', 'EXPIRADO');

-- Enum para estados de pedido
CREATE TYPE estado_pedido AS ENUM (
    'PENDIENTE', 'CONFIRMADO', 'PROCESANDO', 'EMPACADO', 
    'ENVIADO', 'EN_TRANSITO', 'ENTREGADO', 'CANCELADO', 'DEVUELTO'
);

-- Enum para métodos de pago
CREATE TYPE metodo_pago AS ENUM (
    'TARJETA_CREDITO', 'TARJETA_DEBITO', 'PAYPAL', 'TRANSFERENCIA', 
    'EFECTIVO', 'CREDITO_INTERNO', 'PUNTOS_FIDELIDAD'
);

-- Enum para estados de pago
CREATE TYPE estado_pago AS ENUM ('PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'FALLIDO', 'REEMBOLSADO');

-- Tabla: Carritos de compra
CREATE TABLE carritos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID, -- Puede ser NULL para carritos de invitados
    session_id VARCHAR(255), -- Para carritos de invitados
    estado estado_carrito DEFAULT 'ACTIVO',
    subtotal DECIMAL(12,2) DEFAULT 0.00,
    descuentos DECIMAL(12,2) DEFAULT 0.00,
    impuestos DECIMAL(12,2) DEFAULT 0.00,
    envio DECIMAL(12,2) DEFAULT 0.00,
    total DECIMAL(12,2) DEFAULT 0.00,
    moneda VARCHAR(3) DEFAULT 'USD',
    cupon_aplicado VARCHAR(100),
    fecha_expiracion TIMESTAMP,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Items del carrito
CREATE TABLE items_carrito (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    carrito_id UUID NOT NULL REFERENCES carritos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL,
    variante_id UUID,
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(12,2) NOT NULL,
    precio_total DECIMAL(12,2) NOT NULL,
    descuento_aplicado DECIMAL(12,2) DEFAULT 0.00,
    fecha_agregado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Cupones de descuento
CREATE TABLE cupones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    codigo VARCHAR(50) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(20) NOT NULL CHECK (tipo IN ('PORCENTAJE', 'FIJO', 'ENVIO_GRATIS')),
    valor DECIMAL(12,2) NOT NULL,
    monto_minimo DECIMAL(12,2),
    monto_maximo_descuento DECIMAL(12,2),
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    limite_uso INTEGER,
    usos_actuales INTEGER DEFAULT 0,
    limite_por_usuario INTEGER DEFAULT 1,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Uso de cupones
CREATE TABLE cupones_uso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cupon_id UUID NOT NULL REFERENCES cupones(id),
    usuario_id UUID,
    pedido_id UUID,
    descuento_aplicado DECIMAL(12,2) NOT NULL,
    fecha_uso TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Pedidos
CREATE TABLE pedidos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_pedido VARCHAR(50) UNIQUE NOT NULL,
    usuario_id UUID,
    carrito_id UUID REFERENCES carritos(id),
    estado estado_pedido DEFAULT 'PENDIENTE',
    subtotal DECIMAL(12,2) NOT NULL,
    descuentos DECIMAL(12,2) DEFAULT 0.00,
    impuestos DECIMAL(12,2) DEFAULT 0.00,
    envio DECIMAL(12,2) DEFAULT 0.00,
    total DECIMAL(12,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'USD',
    
    -- Información de facturación
    facturacion_nombre VARCHAR(255) NOT NULL,
    facturacion_apellido VARCHAR(255) NOT NULL,
    facturacion_email VARCHAR(255) NOT NULL,
    facturacion_telefono VARCHAR(20),
    facturacion_direccion TEXT NOT NULL,
    facturacion_ciudad VARCHAR(100) NOT NULL,
    facturacion_estado VARCHAR(100),
    facturacion_codigo_postal VARCHAR(20) NOT NULL,
    facturacion_pais VARCHAR(100) NOT NULL,
    
    -- Información de envío
    envio_nombre VARCHAR(255) NOT NULL,
    envio_apellido VARCHAR(255) NOT NULL,
    envio_direccion TEXT NOT NULL,
    envio_ciudad VARCHAR(100) NOT NULL,
    envio_estado VARCHAR(100),
    envio_codigo_postal VARCHAR(20) NOT NULL,
    envio_pais VARCHAR(100) NOT NULL,
    
    -- Información adicional
    notas_cliente TEXT,
    notas_internas TEXT,
    fecha_estimada_entrega DATE,
    fecha_entrega_real TIMESTAMP,
    numero_seguimiento VARCHAR(100),
    transportadora VARCHAR(100),
    
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Items del pedido
CREATE TABLE items_pedido (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL,
    variante_id UUID,
    sku VARCHAR(100) NOT NULL,
    nombre_producto VARCHAR(255) NOT NULL,
    variante_info JSONB, -- Color, talla, etc.
    cantidad INTEGER NOT NULL CHECK (cantidad > 0),
    precio_unitario DECIMAL(12,2) NOT NULL,
    precio_total DECIMAL(12,2) NOT NULL,
    descuento_aplicado DECIMAL(12,2) DEFAULT 0.00,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Pagos
CREATE TABLE pagos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id),
    metodo_pago metodo_pago NOT NULL,
    estado estado_pago DEFAULT 'PENDIENTE',
    monto DECIMAL(12,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'USD',
    
    -- Información del pago
    referencia_externa VARCHAR(255), -- ID de PayPal, Stripe, etc.
    numero_transaccion VARCHAR(100),
    numero_autorizacion VARCHAR(100),
    
    -- Información de tarjeta (encriptada)
    ultimos_4_digitos VARCHAR(4),
    tipo_tarjeta VARCHAR(20),
    nombre_titular VARCHAR(255),
    
    -- Fechas importantes
    fecha_procesamiento TIMESTAMP,
    fecha_completado TIMESTAMP,
    fecha_vencimiento TIMESTAMP,
    
    -- Información adicional
    comision DECIMAL(12,2) DEFAULT 0.00,
    notas TEXT,
    datos_gateway JSONB, -- Respuesta del gateway de pago
    
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Reembolsos
CREATE TABLE reembolsos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pago_id UUID NOT NULL REFERENCES pagos(id),
    pedido_id UUID NOT NULL REFERENCES pedidos(id),
    monto DECIMAL(12,2) NOT NULL,
    motivo TEXT NOT NULL,
    estado VARCHAR(20) DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE', 'PROCESANDO', 'COMPLETADO', 'RECHAZADO')),
    referencia_externa VARCHAR(255),
    procesado_por UUID, -- ID del usuario que procesó
    fecha_procesamiento TIMESTAMP,
    fecha_completado TIMESTAMP,
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Historial de estados de pedido
CREATE TABLE historial_estados_pedido (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id) ON DELETE CASCADE,
    estado_anterior estado_pedido,
    estado_nuevo estado_pedido NOT NULL,
    comentario TEXT,
    usuario_id UUID, -- Quien hizo el cambio
    fecha_cambio TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Facturas
CREATE TABLE facturas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pedido_id UUID NOT NULL REFERENCES pedidos(id),
    numero_factura VARCHAR(50) UNIQUE NOT NULL,
    fecha_emision DATE NOT NULL,
    fecha_vencimiento DATE,
    subtotal DECIMAL(12,2) NOT NULL,
    impuestos DECIMAL(12,2) NOT NULL,
    total DECIMAL(12,2) NOT NULL,
    moneda VARCHAR(3) DEFAULT 'USD',
    estado VARCHAR(20) DEFAULT 'EMITIDA' CHECK (estado IN ('EMITIDA', 'PAGADA', 'VENCIDA', 'ANULADA')),
    archivo_pdf_url TEXT,
    notas TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX idx_carritos_usuario ON carritos(usuario_id);
CREATE INDEX idx_carritos_session ON carritos(session_id);
CREATE INDEX idx_carritos_estado ON carritos(estado);
CREATE INDEX idx_items_carrito_carrito ON items_carrito(carrito_id);
CREATE INDEX idx_items_carrito_producto ON items_carrito(producto_id);
CREATE INDEX idx_cupones_codigo ON cupones(codigo);
CREATE INDEX idx_cupones_fechas ON cupones(fecha_inicio, fecha_fin);
CREATE INDEX idx_pedidos_usuario ON pedidos(usuario_id);
CREATE INDEX idx_pedidos_numero ON pedidos(numero_pedido);
CREATE INDEX idx_pedidos_estado ON pedidos(estado);
CREATE INDEX idx_pedidos_fecha ON pedidos(fecha_creacion);
CREATE INDEX idx_items_pedido_pedido ON items_pedido(pedido_id);
CREATE INDEX idx_items_pedido_producto ON items_pedido(producto_id);
CREATE INDEX idx_pagos_pedido ON pagos(pedido_id);
CREATE INDEX idx_pagos_estado ON pagos(estado);
CREATE INDEX idx_pagos_referencia ON pagos(referencia_externa);
CREATE INDEX idx_historial_pedido ON historial_estados_pedido(pedido_id);
CREATE INDEX idx_facturas_pedido ON facturas(pedido_id);
CREATE INDEX idx_facturas_numero ON facturas(numero_factura);

-- Función para generar número de pedido
CREATE OR REPLACE FUNCTION generar_numero_pedido()
RETURNS VARCHAR(50) AS $$
DECLARE
    nuevo_numero VARCHAR(50);
    contador INTEGER;
BEGIN
    -- Obtener contador del día actual
    SELECT COUNT(*) + 1 INTO contador
    FROM pedidos 
    WHERE DATE(fecha_creacion) = CURRENT_DATE;
    
    -- Generar número: STH-YYYYMMDD-NNNN
    nuevo_numero := 'STH-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(contador::TEXT, 4, '0');
    
    RETURN nuevo_numero;
END;
$$ LANGUAGE plpgsql;

-- Función para actualizar totales del carrito
CREATE OR REPLACE FUNCTION actualizar_totales_carrito()
RETURNS TRIGGER AS $$
DECLARE
    carrito_id_param UUID;
    nuevo_subtotal DECIMAL(12,2);
BEGIN
    -- Determinar el carrito_id según la operación
    IF TG_OP = 'DELETE' THEN
        carrito_id_param := OLD.carrito_id;
    ELSE
        carrito_id_param := NEW.carrito_id;
    END IF;
    
    -- Calcular nuevo subtotal
    SELECT COALESCE(SUM(precio_total), 0) INTO nuevo_subtotal
    FROM items_carrito 
    WHERE carrito_id = carrito_id_param;
    
    -- Actualizar carrito
    UPDATE carritos 
    SET 
        subtotal = nuevo_subtotal,
        total = nuevo_subtotal + descuentos + impuestos + envio,
        fecha_actualizacion = CURRENT_TIMESTAMP
    WHERE id = carrito_id_param;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualización automática
CREATE TRIGGER trigger_actualizar_carrito_insert
    AFTER INSERT ON items_carrito
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_totales_carrito();

CREATE TRIGGER trigger_actualizar_carrito_update
    AFTER UPDATE ON items_carrito
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_totales_carrito();

CREATE TRIGGER trigger_actualizar_carrito_delete
    AFTER DELETE ON items_carrito
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_totales_carrito();

-- Función para registrar cambios de estado de pedido
CREATE OR REPLACE FUNCTION registrar_cambio_estado_pedido()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.estado IS DISTINCT FROM NEW.estado THEN
        INSERT INTO historial_estados_pedido (pedido_id, estado_anterior, estado_nuevo)
        VALUES (NEW.id, OLD.estado, NEW.estado);
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_historial_estado_pedido
    AFTER UPDATE ON pedidos
    FOR EACH ROW
    EXECUTE FUNCTION registrar_cambio_estado_pedido();

-- Datos iniciales
INSERT INTO cupones (codigo, nombre, descripcion, tipo, valor, fecha_inicio, fecha_fin, limite_uso) VALUES
('BIENVENIDO10', 'Descuento de Bienvenida', '10% de descuento para nuevos clientes', 'PORCENTAJE', 10.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '1 year', 1000),
('ENVIOGRATIS', 'Envío Gratuito', 'Envío gratuito en compras mayores a $50', 'ENVIO_GRATIS', 0.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '6 months', NULL),
('VERANO2024', 'Promoción Verano', '$20 de descuento en compras mayores a $100', 'FIJO', 20.00, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + INTERVAL '3 months', 500);