-- ====================================================
-- STYLEHUB CATALOG SERVICE - GESTIÓN DE PRODUCTOS Y CATÁLOGO
-- ====================================================

\c stylehub_catalog;

-- Enum para estados de producto
CREATE TYPE estado_producto AS ENUM ('ACTIVO', 'INACTIVO', 'DESCONTINUADO', 'AGOTADO');

-- Enum para tipos de promoción
CREATE TYPE tipo_promocion AS ENUM ('DESCUENTO', 'OFERTA', 'NUEVO', 'LIMITADO', 'LIQUIDACION');

-- Tabla: Categorías
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    categoria_padre_id UUID REFERENCES categorias(id),
    slug VARCHAR(255) UNIQUE NOT NULL,
    imagen_url TEXT,
    orden_visualizacion INTEGER DEFAULT 0,
    activa BOOLEAN DEFAULT true,
    meta_titulo VARCHAR(255),
    meta_descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Marcas
CREATE TABLE marcas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) UNIQUE NOT NULL,
    descripcion TEXT,
    logo_url TEXT,
    sitio_web VARCHAR(255),
    activa BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Productos
CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    descripcion_corta VARCHAR(500),
    sku VARCHAR(100) UNIQUE NOT NULL,
    codigo_barras VARCHAR(50),
    categoria_id UUID NOT NULL REFERENCES categorias(id),
    marca_id UUID REFERENCES marcas(id),
    precio_base DECIMAL(12,2) NOT NULL,
    precio_venta DECIMAL(12,2) NOT NULL,
    costo DECIMAL(12,2),
    peso DECIMAL(8,3),
    dimensiones JSONB, -- {largo, ancho, alto}
    material VARCHAR(255),
    cuidados TEXT,
    genero VARCHAR(20) CHECK (genero IN ('HOMBRE', 'MUJER', 'UNISEX', 'NIÑO', 'NIÑA')),
    temporada VARCHAR(20) CHECK (temporada IN ('PRIMAVERA', 'VERANO', 'OTOÑO', 'INVIERNO', 'TODO_AÑO')),
    estado estado_producto DEFAULT 'ACTIVO',
    destacado BOOLEAN DEFAULT false,
    nuevo BOOLEAN DEFAULT false,
    puntuacion_promedio DECIMAL(3,2) DEFAULT 0.00,
    total_resenas INTEGER DEFAULT 0,
    total_ventas INTEGER DEFAULT 0,
    fecha_lanzamiento DATE,
    slug VARCHAR(255) UNIQUE NOT NULL,
    meta_titulo VARCHAR(255),
    meta_descripcion TEXT,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Variantes de producto (tallas, colores)
CREATE TABLE variantes_producto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    sku_variante VARCHAR(100) UNIQUE NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    color VARCHAR(100),
    talla VARCHAR(20),
    precio_adicional DECIMAL(12,2) DEFAULT 0.00,
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 0,
    peso_adicional DECIMAL(8,3) DEFAULT 0.000,
    activa BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Imágenes de productos
CREATE TABLE imagenes_producto (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    variante_id UUID REFERENCES variantes_producto(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    orden INTEGER DEFAULT 0,
    es_principal BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Atributos personalizados
CREATE TABLE atributos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) UNIQUE NOT NULL,
    tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('TEXTO', 'NUMERO', 'BOOLEANO', 'LISTA', 'COLOR')),
    opciones JSONB, -- Para tipo LISTA
    requerido BOOLEAN DEFAULT false,
    filtrable BOOLEAN DEFAULT false,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Valores de atributos por producto
CREATE TABLE productos_atributos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    atributo_id UUID NOT NULL REFERENCES atributos(id) ON DELETE CASCADE,
    valor TEXT NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(producto_id, atributo_id)
);

-- Tabla: Promociones
CREATE TABLE promociones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    descripcion TEXT,
    tipo tipo_promocion NOT NULL,
    descuento_porcentaje DECIMAL(5,2),
    descuento_fijo DECIMAL(12,2),
    precio_especial DECIMAL(12,2),
    fecha_inicio TIMESTAMP NOT NULL,
    fecha_fin TIMESTAMP NOT NULL,
    activa BOOLEAN DEFAULT true,
    limite_uso INTEGER,
    usos_actuales INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Productos en promoción
CREATE TABLE productos_promociones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    promocion_id UUID NOT NULL REFERENCES promociones(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(producto_id, promocion_id)
);

-- Tabla: Etiquetas/Tags
CREATE TABLE etiquetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) UNIQUE NOT NULL,
    color VARCHAR(7) DEFAULT '#000000',
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Productos con etiquetas
CREATE TABLE productos_etiquetas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    etiqueta_id UUID NOT NULL REFERENCES etiquetas(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(producto_id, etiqueta_id)
);

-- Tabla: Productos relacionados
CREATE TABLE productos_relacionados (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    producto_relacionado_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
    tipo_relacion VARCHAR(50) NOT NULL CHECK (tipo_relacion IN ('SIMILAR', 'COMPLEMENTARIO', 'ALTERNATIVO')),
    orden INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(producto_id, producto_relacionado_id)
);

-- Índices para optimización
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_marca ON productos(marca_id);
CREATE INDEX idx_productos_estado ON productos(estado);
CREATE INDEX idx_productos_precio ON productos(precio_venta);
CREATE INDEX idx_productos_destacado ON productos(destacado);
CREATE INDEX idx_productos_nuevo ON productos(nuevo);
CREATE INDEX idx_productos_slug ON productos(slug);
CREATE INDEX idx_variantes_producto ON variantes_producto(producto_id);
CREATE INDEX idx_variantes_sku ON variantes_producto(sku_variante);
CREATE INDEX idx_variantes_stock ON variantes_producto(stock_actual);
CREATE INDEX idx_imagenes_producto ON imagenes_producto(producto_id);
CREATE INDEX idx_imagenes_principal ON imagenes_producto(es_principal);
CREATE INDEX idx_promociones_fechas ON promociones(fecha_inicio, fecha_fin);
CREATE INDEX idx_promociones_activa ON promociones(activa);
CREATE INDEX idx_categorias_padre ON categorias(categoria_padre_id);
CREATE INDEX idx_categorias_slug ON categorias(slug);

-- Función para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para actualización automática
CREATE TRIGGER trigger_productos_actualizacion
    BEFORE UPDATE ON productos
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

CREATE TRIGGER trigger_categorias_actualizacion
    BEFORE UPDATE ON categorias
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Función para calcular precio con promoción
CREATE OR REPLACE FUNCTION calcular_precio_promocional(producto_id_param UUID)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    precio_base DECIMAL(12,2);
    mejor_descuento DECIMAL(12,2) := 0;
    precio_final DECIMAL(12,2);
BEGIN
    -- Obtener precio base del producto
    SELECT precio_venta INTO precio_base 
    FROM productos 
    WHERE id = producto_id_param;
    
    -- Buscar la mejor promoción activa
    SELECT COALESCE(MAX(
        CASE 
            WHEN p.descuento_porcentaje IS NOT NULL THEN precio_base * (p.descuento_porcentaje / 100)
            WHEN p.descuento_fijo IS NOT NULL THEN p.descuento_fijo
            WHEN p.precio_especial IS NOT NULL THEN precio_base - p.precio_especial
            ELSE 0
        END
    ), 0) INTO mejor_descuento
    FROM promociones p
    JOIN productos_promociones pp ON p.id = pp.promocion_id
    WHERE pp.producto_id = producto_id_param
    AND p.activa = true
    AND p.fecha_inicio <= CURRENT_TIMESTAMP
    AND p.fecha_fin >= CURRENT_TIMESTAMP;
    
    precio_final := precio_base - mejor_descuento;
    
    RETURN GREATEST(precio_final, 0);
END;
$$ LANGUAGE plpgsql;

-- Datos iniciales
INSERT INTO categorias (nombre, descripcion, slug) VALUES
('Ropa', 'Categoría principal de vestimenta', 'ropa'),
('Calzado', 'Zapatos y calzado en general', 'calzado'),
('Accesorios', 'Complementos y accesorios', 'accesorios'),
('Deportivo', 'Ropa y calzado deportivo', 'deportivo');

INSERT INTO categorias (nombre, descripcion, categoria_padre_id, slug) 
SELECT 'Camisetas', 'Camisetas y tops', c.id, 'camisetas' FROM categorias c WHERE c.slug = 'ropa'
UNION ALL
SELECT 'Pantalones', 'Pantalones y jeans', c.id, 'pantalones' FROM categorias c WHERE c.slug = 'ropa'
UNION ALL
SELECT 'Vestidos', 'Vestidos y faldas', c.id, 'vestidos' FROM categorias c WHERE c.slug = 'ropa'
UNION ALL
SELECT 'Zapatos Casuales', 'Calzado casual', c.id, 'zapatos-casuales' FROM categorias c WHERE c.slug = 'calzado'
UNION ALL
SELECT 'Zapatos Formales', 'Calzado formal', c.id, 'zapatos-formales' FROM categorias c WHERE c.slug = 'calzado';

INSERT INTO marcas (nombre, descripcion) VALUES
('StyleHub Original', 'Marca propia de StyleHub'),
('Fashion Forward', 'Moda contemporánea'),
('Classic Wear', 'Estilo clásico y elegante'),
('Urban Style', 'Moda urbana y casual'),
('Sport Elite', 'Ropa deportiva premium');

INSERT INTO atributos (nombre, tipo, filtrable) VALUES
('Color Principal', 'COLOR', true),
('Talla', 'LISTA', true),
('Material Principal', 'TEXTO', true),
('Ocasión', 'LISTA', true),
('Estilo', 'LISTA', true);

INSERT INTO etiquetas (nombre, color) VALUES
('Nuevo', '#22c55e'),
('Oferta', '#ef4444'),
('Limitado', '#f59e0b'),
('Bestseller', '#8b5cf6'),
('Eco-Friendly', '#10b981');