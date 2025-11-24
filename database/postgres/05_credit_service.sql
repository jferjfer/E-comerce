-- ====================================================
-- STYLEHUB CREDIT SERVICE - SISTEMA DE CRÉDITO INTERNO
-- ====================================================

\c stylehub_credit;

-- Enum para tipos de crédito
CREATE TYPE tipo_credito AS ENUM ('INTERNO', 'EXTERNO', 'PROMOCIONAL');

-- Enum para estados de solicitud de crédito
CREATE TYPE estado_solicitud AS ENUM ('PENDIENTE', 'EN_REVISION', 'APROBADA', 'RECHAZADA', 'CANCELADA');

-- Enum para estados de crédito
CREATE TYPE estado_credito AS ENUM ('ACTIVO', 'PAGADO', 'VENCIDO', 'CANCELADO', 'SUSPENDIDO');

-- Enum para estados de pago
CREATE TYPE estado_pago_credito AS ENUM ('PENDIENTE', 'PAGADO', 'VENCIDO', 'PARCIAL');

-- Tabla: Configuración de crédito
CREATE TABLE configuracion_credito (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    monto_minimo DECIMAL(12,2) NOT NULL DEFAULT 50000.00,
    monto_maximo DECIMAL(12,2) NOT NULL DEFAULT 5000000.00,
    tasa_interes_mensual DECIMAL(5,4) NOT NULL DEFAULT 0.0299, -- 2.99% mensual
    plazo_minimo_meses INTEGER NOT NULL DEFAULT 3,
    plazo_maximo_meses INTEGER NOT NULL DEFAULT 36,
    score_minimo INTEGER NOT NULL DEFAULT 300,
    ingresos_minimos DECIMAL(12,2) NOT NULL DEFAULT 1000000.00,
    edad_minima INTEGER NOT NULL DEFAULT 18,
    edad_maxima INTEGER NOT NULL DEFAULT 75,
    activa BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Solicitudes de crédito
CREATE TABLE solicitudes_credito (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL,
    numero_solicitud VARCHAR(50) UNIQUE NOT NULL,
    tipo tipo_credito NOT NULL,
    estado estado_solicitud DEFAULT 'PENDIENTE',
    
    -- Información financiera solicitada
    monto_solicitado DECIMAL(12,2) NOT NULL,
    plazo_meses INTEGER NOT NULL,
    tasa_interes DECIMAL(5,4),
    cuota_mensual DECIMAL(12,2),
    
    -- Información personal
    nombres VARCHAR(255) NOT NULL,
    apellidos VARCHAR(255) NOT NULL,
    tipo_documento VARCHAR(20) NOT NULL,
    numero_documento VARCHAR(50) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    genero VARCHAR(10),
    estado_civil VARCHAR(20),
    telefono VARCHAR(20) NOT NULL,
    email VARCHAR(255) NOT NULL,
    
    -- Información de residencia
    direccion_residencia TEXT NOT NULL,
    ciudad_residencia VARCHAR(100) NOT NULL,
    departamento_residencia VARCHAR(100),
    tiempo_residencia_meses INTEGER,
    tipo_vivienda VARCHAR(50), -- Propia, Arrendada, Familiar
    
    -- Información laboral
    empresa VARCHAR(255),
    cargo VARCHAR(255),
    tipo_contrato VARCHAR(50), -- Indefinido, Fijo, Independiente
    ingresos_mensuales DECIMAL(12,2) NOT NULL,
    otros_ingresos DECIMAL(12,2) DEFAULT 0.00,
    tiempo_empresa_meses INTEGER,
    telefono_empresa VARCHAR(20),
    
    -- Referencias personales
    referencia_1_nombre VARCHAR(255),
    referencia_1_telefono VARCHAR(20),
    referencia_1_relacion VARCHAR(100),
    referencia_2_nombre VARCHAR(255),
    referencia_2_telefono VARCHAR(20),
    referencia_2_relacion VARCHAR(100),
    
    -- Referencias comerciales
    referencia_comercial_1 VARCHAR(255),
    referencia_comercial_2 VARCHAR(255),
    
    -- Información adicional
    tiene_otros_creditos BOOLEAN DEFAULT false,
    valor_otros_creditos DECIMAL(12,2) DEFAULT 0.00,
    gastos_mensuales DECIMAL(12,2),
    patrimonio DECIMAL(12,2),
    
    -- Procesamiento
    score_crediticio INTEGER,
    observaciones TEXT,
    motivo_rechazo TEXT,
    evaluado_por UUID, -- ID del usuario que evaluó
    fecha_evaluacion TIMESTAMP,
    aprobado_por UUID, -- ID del usuario que aprobó
    fecha_aprobacion TIMESTAMP,
    
    -- Documentos adjuntos
    documentos JSONB, -- URLs de documentos subidos
    
    fecha_solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Créditos aprobados
CREATE TABLE creditos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    solicitud_id UUID NOT NULL REFERENCES solicitudes_credito(id),
    usuario_id UUID NOT NULL,
    numero_credito VARCHAR(50) UNIQUE NOT NULL,
    tipo tipo_credito NOT NULL,
    estado estado_credito DEFAULT 'ACTIVO',
    
    -- Términos del crédito
    monto_aprobado DECIMAL(12,2) NOT NULL,
    monto_utilizado DECIMAL(12,2) DEFAULT 0.00,
    monto_disponible DECIMAL(12,2) GENERATED ALWAYS AS (monto_aprobado - monto_utilizado) STORED,
    tasa_interes_mensual DECIMAL(5,4) NOT NULL,
    plazo_meses INTEGER NOT NULL,
    cuota_mensual DECIMAL(12,2) NOT NULL,
    
    -- Fechas importantes
    fecha_aprobacion DATE NOT NULL,
    fecha_primer_pago DATE NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    
    -- Control de pagos
    cuotas_pagadas INTEGER DEFAULT 0,
    cuotas_pendientes INTEGER,
    dias_mora INTEGER DEFAULT 0,
    valor_mora DECIMAL(12,2) DEFAULT 0.00,
    
    -- Información adicional
    observaciones TEXT,
    garantias TEXT,
    
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Cuotas del crédito
CREATE TABLE cuotas_credito (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credito_id UUID NOT NULL REFERENCES creditos(id) ON DELETE CASCADE,
    numero_cuota INTEGER NOT NULL,
    fecha_vencimiento DATE NOT NULL,
    valor_capital DECIMAL(12,2) NOT NULL,
    valor_interes DECIMAL(12,2) NOT NULL,
    valor_cuota DECIMAL(12,2) NOT NULL,
    valor_mora DECIMAL(12,2) DEFAULT 0.00,
    valor_total DECIMAL(12,2) GENERATED ALWAYS AS (valor_cuota + valor_mora) STORED,
    estado estado_pago_credito DEFAULT 'PENDIENTE',
    fecha_pago TIMESTAMP,
    valor_pagado DECIMAL(12,2) DEFAULT 0.00,
    saldo_pendiente DECIMAL(12,2),
    dias_mora INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(credito_id, numero_cuota)
);

-- Tabla: Pagos de crédito
CREATE TABLE pagos_credito (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credito_id UUID NOT NULL REFERENCES creditos(id),
    cuota_id UUID REFERENCES cuotas_credito(id),
    numero_pago VARCHAR(50) UNIQUE NOT NULL,
    valor_pago DECIMAL(12,2) NOT NULL,
    valor_capital DECIMAL(12,2) NOT NULL,
    valor_interes DECIMAL(12,2) NOT NULL,
    valor_mora DECIMAL(12,2) DEFAULT 0.00,
    
    -- Información del pago
    metodo_pago VARCHAR(50) NOT NULL,
    referencia_pago VARCHAR(255),
    fecha_pago TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    procesado_por UUID, -- ID del usuario que procesó
    
    -- Información adicional
    observaciones TEXT,
    comprobante_url TEXT,
    
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Uso del crédito (compras realizadas)
CREATE TABLE uso_credito (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    credito_id UUID NOT NULL REFERENCES creditos(id),
    pedido_id UUID NOT NULL, -- Referencia al pedido
    numero_uso VARCHAR(50) UNIQUE NOT NULL,
    monto_utilizado DECIMAL(12,2) NOT NULL,
    descripcion TEXT,
    fecha_uso TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Para reversiones
    revertido BOOLEAN DEFAULT false,
    fecha_reversion TIMESTAMP,
    motivo_reversion TEXT,
    revertido_por UUID
);

-- Tabla: Historial crediticio
CREATE TABLE historial_crediticio (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL,
    credito_id UUID REFERENCES creditos(id),
    tipo_evento VARCHAR(100) NOT NULL, -- SOLICITUD, APROBACION, PAGO, MORA, etc.
    descripcion TEXT NOT NULL,
    valor DECIMAL(12,2),
    fecha_evento TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Información adicional
    datos_adicionales JSONB,
    procesado_por UUID
);

-- Tabla: Configuración de mora
CREATE TABLE configuracion_mora (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dias_gracia INTEGER DEFAULT 5,
    tasa_mora_diaria DECIMAL(6,4) DEFAULT 0.0010, -- 0.10% diario
    valor_minimo_mora DECIMAL(12,2) DEFAULT 5000.00,
    notificacion_dia_5 BOOLEAN DEFAULT true,
    notificacion_dia_15 BOOLEAN DEFAULT true,
    notificacion_dia_30 BOOLEAN DEFAULT true,
    suspension_dia_60 BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Reportes a centrales de riesgo
CREATE TABLE reportes_centrales_riesgo (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL,
    credito_id UUID REFERENCES creditos(id),
    central_riesgo VARCHAR(100) NOT NULL, -- DATACREDITO, CIFIN, etc.
    tipo_reporte VARCHAR(50) NOT NULL, -- POSITIVO, NEGATIVO, ACTUALIZACION
    valor_reportado DECIMAL(12,2),
    dias_mora INTEGER,
    fecha_reporte DATE NOT NULL,
    estado_reporte VARCHAR(20) DEFAULT 'ENVIADO',
    respuesta_central TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX idx_solicitudes_usuario ON solicitudes_credito(usuario_id);
CREATE INDEX idx_solicitudes_estado ON solicitudes_credito(estado);
CREATE INDEX idx_solicitudes_numero ON solicitudes_credito(numero_solicitud);
CREATE INDEX idx_creditos_usuario ON creditos(usuario_id);
CREATE INDEX idx_creditos_estado ON creditos(estado);
CREATE INDEX idx_creditos_numero ON creditos(numero_credito);
CREATE INDEX idx_cuotas_credito ON cuotas_credito(credito_id);
CREATE INDEX idx_cuotas_vencimiento ON cuotas_credito(fecha_vencimiento);
CREATE INDEX idx_cuotas_estado ON cuotas_credito(estado);
CREATE INDEX idx_pagos_credito ON pagos_credito(credito_id);
CREATE INDEX idx_pagos_fecha ON pagos_credito(fecha_pago);
CREATE INDEX idx_uso_credito ON uso_credito(credito_id);
CREATE INDEX idx_historial_usuario ON historial_crediticio(usuario_id);
CREATE INDEX idx_historial_fecha ON historial_crediticio(fecha_evento);

-- Función para generar número de solicitud
CREATE OR REPLACE FUNCTION generar_numero_solicitud()
RETURNS VARCHAR(50) AS $$
DECLARE
    nuevo_numero VARCHAR(50);
    contador INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO contador
    FROM solicitudes_credito 
    WHERE DATE(fecha_solicitud) = CURRENT_DATE;
    
    nuevo_numero := 'SOL-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(contador::TEXT, 4, '0');
    
    RETURN nuevo_numero;
END;
$$ LANGUAGE plpgsql;

-- Función para generar número de crédito
CREATE OR REPLACE FUNCTION generar_numero_credito()
RETURNS VARCHAR(50) AS $$
DECLARE
    nuevo_numero VARCHAR(50);
    contador INTEGER;
BEGIN
    SELECT COUNT(*) + 1 INTO contador
    FROM creditos 
    WHERE DATE(fecha_creacion) = CURRENT_DATE;
    
    nuevo_numero := 'CRE-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LPAD(contador::TEXT, 4, '0');
    
    RETURN nuevo_numero;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular cuotas del crédito
CREATE OR REPLACE FUNCTION generar_cuotas_credito(credito_id_param UUID)
RETURNS VOID AS $$
DECLARE
    credito_info RECORD;
    cuota_num INTEGER;
    fecha_cuota DATE;
    saldo_capital DECIMAL(12,2);
    valor_interes DECIMAL(12,2);
    valor_capital DECIMAL(12,2);
BEGIN
    -- Obtener información del crédito
    SELECT monto_aprobado, tasa_interes_mensual, plazo_meses, cuota_mensual, fecha_primer_pago
    INTO credito_info
    FROM creditos 
    WHERE id = credito_id_param;
    
    saldo_capital := credito_info.monto_aprobado;
    fecha_cuota := credito_info.fecha_primer_pago;
    
    -- Generar cuotas
    FOR cuota_num IN 1..credito_info.plazo_meses LOOP
        -- Calcular interés sobre saldo
        valor_interes := saldo_capital * credito_info.tasa_interes_mensual;
        valor_capital := credito_info.cuota_mensual - valor_interes;
        
        -- Ajustar última cuota si es necesario
        IF cuota_num = credito_info.plazo_meses THEN
            valor_capital := saldo_capital;
        END IF;
        
        -- Insertar cuota
        INSERT INTO cuotas_credito (
            credito_id, numero_cuota, fecha_vencimiento,
            valor_capital, valor_interes, valor_cuota, saldo_pendiente
        ) VALUES (
            credito_id_param, cuota_num, fecha_cuota,
            valor_capital, valor_interes, credito_info.cuota_mensual, saldo_capital - valor_capital
        );
        
        -- Actualizar saldo y fecha
        saldo_capital := saldo_capital - valor_capital;
        fecha_cuota := fecha_cuota + INTERVAL '1 month';
    END LOOP;
    
    -- Actualizar cuotas pendientes en el crédito
    UPDATE creditos 
    SET cuotas_pendientes = credito_info.plazo_meses
    WHERE id = credito_id_param;
END;
$$ LANGUAGE plpgsql;

-- Función para calcular mora
CREATE OR REPLACE FUNCTION calcular_mora()
RETURNS VOID AS $$
DECLARE
    cuota_record RECORD;
    dias_mora_calc INTEGER;
    valor_mora_calc DECIMAL(12,2);
    config_mora RECORD;
BEGIN
    -- Obtener configuración de mora
    SELECT * INTO config_mora FROM configuracion_mora LIMIT 1;
    
    -- Procesar cuotas vencidas
    FOR cuota_record IN 
        SELECT * FROM cuotas_credito 
        WHERE estado IN ('PENDIENTE', 'PARCIAL') 
        AND fecha_vencimiento < CURRENT_DATE
    LOOP
        -- Calcular días de mora
        dias_mora_calc := CURRENT_DATE - cuota_record.fecha_vencimiento - config_mora.dias_gracia;
        
        IF dias_mora_calc > 0 THEN
            -- Calcular valor de mora
            valor_mora_calc := GREATEST(
                cuota_record.valor_cuota * config_mora.tasa_mora_diaria * dias_mora_calc,
                config_mora.valor_minimo_mora
            );
            
            -- Actualizar cuota
            UPDATE cuotas_credito 
            SET 
                dias_mora = dias_mora_calc,
                valor_mora = valor_mora_calc
            WHERE id = cuota_record.id;
            
            -- Actualizar crédito
            UPDATE creditos 
            SET 
                dias_mora = GREATEST(dias_mora, dias_mora_calc),
                valor_mora = valor_mora + (valor_mora_calc - cuota_record.valor_mora)
            WHERE id = cuota_record.credito_id;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Datos iniciales
INSERT INTO configuracion_credito (
    monto_minimo, monto_maximo, tasa_interes_mensual, 
    plazo_minimo_meses, plazo_maximo_meses, score_minimo, ingresos_minimos
) VALUES (
    100000.00, 10000000.00, 0.0299, 
    6, 48, 350, 1500000.00
);

INSERT INTO configuracion_mora (
    dias_gracia, tasa_mora_diaria, valor_minimo_mora
) VALUES (
    5, 0.0015, 10000.00
);