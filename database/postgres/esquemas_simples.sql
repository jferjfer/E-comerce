-- Esquemas simplificados para configuración rápida

-- Auth Service
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(100) NOT NULL,
    apellido VARCHAR(100) NOT NULL,
    telefono VARCHAR(20),
    fecha_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true,
    rol VARCHAR(50) DEFAULT 'cliente'
);

-- Catalog Service  
CREATE TABLE IF NOT EXISTS categorias (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activa BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS productos (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(200) NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    categoria_id INTEGER REFERENCES categorias(id),
    stock INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Transaction Service
CREATE TABLE IF NOT EXISTS carritos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS carrito_items (
    id SERIAL PRIMARY KEY,
    carrito_id INTEGER REFERENCES carritos(id),
    producto_id INTEGER REFERENCES productos(id),
    cantidad INTEGER NOT NULL,
    precio_unitario DECIMAL(10,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS pedidos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    total DECIMAL(10,2) NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    fecha_pedido TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Logistics Service
CREATE TABLE IF NOT EXISTS almacenes (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    direccion TEXT,
    activo BOOLEAN DEFAULT true
);

CREATE TABLE IF NOT EXISTS inventario (
    id SERIAL PRIMARY KEY,
    producto_id INTEGER REFERENCES productos(id),
    almacen_id INTEGER REFERENCES almacenes(id),
    cantidad INTEGER DEFAULT 0,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Credit Service
CREATE TABLE IF NOT EXISTS creditos (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id),
    limite_credito DECIMAL(10,2) DEFAULT 0,
    credito_usado DECIMAL(10,2) DEFAULT 0,
    activo BOOLEAN DEFAULT true
);

-- Insertar datos básicos
INSERT INTO categorias (nombre, descripcion) VALUES 
('Ropa Mujer', 'Ropa y accesorios para mujer'),
('Ropa Hombre', 'Ropa y accesorios para hombre'),
('Calzado', 'Zapatos y calzado en general')
ON CONFLICT DO NOTHING;

INSERT INTO almacenes (nombre, direccion) VALUES 
('Almacén Central', 'Av. Principal 123, Ciudad'),
('Almacén Norte', 'Calle Norte 456, Ciudad')
ON CONFLICT DO NOTHING;