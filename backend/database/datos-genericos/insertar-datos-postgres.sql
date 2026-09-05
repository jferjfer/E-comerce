-- Insertar datos genéricos en PostgreSQL
-- Ejecutar después de crear las tablas

-- AUTH SERVICE - Usuarios
INSERT INTO usuarios (nombre_usuario, email, contrasena_hash, nombre_completo, telefono, fecha_nacimiento, genero, estado) VALUES
('admin', 'admin@tienda.com', '$2b$10$rQZ8kqVZ9QZ8kqVZ9QZ8kOZ8kqVZ9QZ8kqVZ9QZ8kqVZ9QZ8kqVZ9Q', 'Administrador Sistema', '+34600000001', '1990-01-01', 'otro', 'activo'),
('maria_garcia', 'maria@email.com', '$2b$10$rQZ8kqVZ9QZ8kqVZ9QZ8kOZ8kqVZ9QZ8kqVZ9QZ8kqVZ9QZ8kqVZ9Q', 'María García López', '+34600000002', '1985-05-15', 'femenino', 'activo'),
('juan_perez', 'juan@email.com', '$2b$10$rQZ8kqVZ9QZ8kqVZ9QZ8kOZ8kqVZ9QZ8kqVZ9QZ8kqVZ9QZ8kqVZ9Q', 'Juan Pérez Martín', '+34600000003', '1992-08-20', 'masculino', 'activo'),
('ana_rodriguez', 'ana@email.com', '$2b$10$rQZ8kqVZ9QZ8kqVZ9QZ8kOZ8kqVZ9QZ8kqVZ9QZ8kqVZ9QZ8kqVZ9Q', 'Ana Rodríguez Silva', '+34600000004', '1988-12-10', 'femenino', 'activo'),
('carlos_lopez', 'carlos@email.com', '$2b$10$rQZ8kqVZ9QZ8kqVZ9QZ8kOZ8kqVZ9QZ8kqVZ9QZ8kqVZ9QZ8kqVZ9Q', 'Carlos López Fernández', '+34600000005', '1995-03-25', 'masculino', 'activo');

-- Direcciones de usuarios
INSERT INTO direcciones_usuario (usuario_id, tipo, nombre_completo, direccion, ciudad, codigo_postal, pais, telefono, es_predeterminada) VALUES
(2, 'envio', 'María García López', 'Calle Mayor 123, 2º A', 'Madrid', '28001', 'España', '+34600000002', true),
(2, 'facturacion', 'María García López', 'Calle Mayor 123, 2º A', 'Madrid', '28001', 'España', '+34600000002', true),
(3, 'envio', 'Juan Pérez Martín', 'Avenida Libertad 45', 'Barcelona', '08001', 'España', '+34600000003', true),
(4, 'envio', 'Ana Rodríguez Silva', 'Plaza España 12', 'Valencia', '46001', 'España', '+34600000004', true),
(5, 'envio', 'Carlos López Fernández', 'Calle Alcalá 200', 'Madrid', '28028', 'España', '+34600000005', true);

-- TRANSACTION SERVICE - Carritos y pedidos
INSERT INTO carritos (usuario_id, estado) VALUES
(2, 'activo'),
(3, 'activo'),
(4, 'activo');

INSERT INTO pedidos (usuario_id, numero_pedido, estado, subtotal, impuestos, gastos_envio, total, direccion_envio, direccion_facturacion, metodo_pago) VALUES
(2, 'PED-2024-001', 'entregado', 69.99, 14.70, 5.99, 90.68, '{"nombre":"María García López","direccion":"Calle Mayor 123, 2º A","ciudad":"Madrid","codigo_postal":"28001","pais":"España"}', '{"nombre":"María García López","direccion":"Calle Mayor 123, 2º A","ciudad":"Madrid","codigo_postal":"28001","pais":"España"}', 'tarjeta'),
(3, 'PED-2024-002', 'enviado', 49.98, 10.50, 0.00, 60.48, '{"nombre":"Juan Pérez Martín","direccion":"Avenida Libertad 45","ciudad":"Barcelona","codigo_postal":"08001","pais":"España"}', '{"nombre":"Juan Pérez Martín","direccion":"Avenida Libertad 45","ciudad":"Barcelona","codigo_postal":"08001","pais":"España"}', 'paypal'),
(4, 'PED-2024-003', 'procesando', 59.99, 12.60, 5.99, 78.58, '{"nombre":"Ana Rodríguez Silva","direccion":"Plaza España 12","ciudad":"Valencia","codigo_postal":"46001","pais":"España"}', '{"nombre":"Ana Rodríguez Silva","direccion":"Plaza España 12","ciudad":"Valencia","codigo_postal":"46001","pais":"España"}', 'transferencia');

-- LOGISTICS SERVICE - Almacenes e inventario
INSERT INTO almacenes (nombre, direccion, ciudad, codigo_postal, pais, capacidad_maxima, estado) VALUES
('Almacén Central Madrid', 'Polígono Industrial Sur, Nave 15', 'Madrid', '28906', 'España', 10000, 'activo'),
('Almacén Barcelona', 'Zona Franca, Calle A, 25', 'Barcelona', '08040', 'España', 7500, 'activo'),
('Almacén Valencia', 'Polígono Fuente del Jarro, Nave 8', 'Valencia', '46988', 'España', 5000, 'activo');

INSERT INTO inventario (producto_id, almacen_id, cantidad_disponible, cantidad_reservada, stock_minimo, stock_maximo) VALUES
('prod_001', 1, 45, 3, 10, 80),
('prod_002', 1, 120, 8, 20, 200),
('prod_003', 1, 67, 5, 15, 150),
('prod_004', 2, 34, 2, 8, 60),
('prod_005', 2, 89, 4, 15, 120),
('prod_006', 3, 56, 1, 12, 100),
('prod_007', 3, 78, 3, 18, 140);

-- CREDIT SERVICE - Líneas de crédito
INSERT INTO lineas_credito (usuario_id, tipo_credito, limite_credito, credito_disponible, tasa_interes, estado) VALUES
(2, 'interno', 1000.00, 850.00, 12.50, 'activa'),
(3, 'interno', 1500.00, 1500.00, 10.00, 'activa'),
(4, 'externo', 2000.00, 1750.00, 15.75, 'activa'),
(5, 'interno', 800.00, 600.00, 14.25, 'activa');

INSERT INTO transacciones_credito (linea_credito_id, tipo_transaccion, monto, descripcion, saldo_anterior, saldo_nuevo) VALUES
(1, 'uso', 150.00, 'Compra pedido PED-2024-001', 1000.00, 850.00),
(3, 'uso', 250.00, 'Compra pedido PED-2024-003', 2000.00, 1750.00),
(4, 'uso', 200.00, 'Compra productos electrónicos', 800.00, 600.00);

-- Más carritos y elementos de carrito
INSERT INTO elementos_carrito (carrito_id, producto_id, cantidad, precio_unitario, precio_total) VALUES
(1, 'prod_001', 1, 69.99, 69.99),
(1, 'prod_002', 2, 24.99, 49.98),
(2, 'prod_003', 1, 59.99, 59.99),
(3, 'prod_002', 3, 24.99, 74.97);

-- Más pedidos
INSERT INTO pedidos (usuario_id, numero_pedido, estado, subtotal, impuestos, gastos_envio, total, direccion_envio, direccion_facturacion, metodo_pago) VALUES
(5, 'PED-2024-004', 'confirmado', 119.97, 25.19, 5.99, 151.15, '{"nombre":"Carlos López Fernández","direccion":"Calle Alcalá 200","ciudad":"Madrid","codigo_postal":"28028","pais":"España"}', '{"nombre":"Carlos López Fernández","direccion":"Calle Alcalá 200","ciudad":"Madrid","codigo_postal":"28028","pais":"España"}', 'credito'),
(2, 'PED-2024-005', 'cancelado', 74.97, 15.74, 5.99, 96.70, '{"nombre":"María García López","direccion":"Calle Mayor 123, 2º A","ciudad":"Madrid","codigo_postal":"28001","pais":"España"}', '{"nombre":"María García López","direccion":"Calle Mayor 123, 2º A","ciudad":"Madrid","codigo_postal":"28001","pais":"España"}', 'tarjeta');

-- Elementos de pedidos
INSERT INTO elementos_pedido (pedido_id, producto_id, cantidad, precio_unitario, precio_total) VALUES
(1, 'prod_001', 1, 69.99, 69.99),
(2, 'prod_002', 2, 24.99, 49.98),
(3, 'prod_003', 1, 59.99, 59.99),
(4, 'prod_001', 1, 69.99, 69.99),
(5, 'prod_002', 3, 24.99, 74.97);

-- Más inventario de ropa
INSERT INTO inventario (producto_id, almacen_id, cantidad_disponible, cantidad_reservada, stock_minimo, stock_maximo) VALUES
('vestido_001', 1, 25, 2, 5, 50),
('camiseta_001', 2, 156, 12, 30, 250),
('jean_001', 3, 78, 6, 15, 120),
('blazer_001', 1, 34, 1, 8, 60),
('sneaker_001', 2, 89, 4, 20, 150);

-- Movimientos de inventario
INSERT INTO movimientos_inventario (producto_id, almacen_id, tipo_movimiento, cantidad, motivo, usuario_responsable) VALUES
('prod_001', 1, 'entrada', 50, 'Reposición stock', 1),
('prod_002', 1, 'salida', 5, 'Venta pedido PED-2024-002', 1),
('prod_003', 2, 'entrada', 100, 'Nueva mercancía', 1),
('prod_004', 2, 'salida', 3, 'Venta online', 1),
('prod_005', 3, 'ajuste', -2, 'Producto dañado', 1);

-- MARKETING SERVICE - Cupones y programas de fidelización
INSERT INTO cupones (codigo, tipo, valor, valor_minimo_pedido, fecha_inicio, fecha_fin, usos_maximos, usos_actuales, estado) VALUES
('BIENVENIDO20', 'porcentaje', 20.00, 50.00, '2024-01-01', '2024-12-31', 1000, 45, 'activo'),
('ENVIOGRATIS', 'envio_gratis', 0.00, 30.00, '2024-01-01', '2024-06-30', 500, 123, 'activo'),
('VERANO15', 'porcentaje', 15.00, 75.00, '2024-06-01', '2024-09-30', 200, 67, 'activo'),
('FIJO10', 'fijo', 10.00, 100.00, '2024-01-01', '2024-12-31', 300, 89, 'activo'),
('BLACKFRIDAY', 'porcentaje', 30.00, 100.00, '2024-11-25', '2024-11-30', 1000, 234, 'activo'),
('NAVIDAD25', 'porcentaje', 25.00, 75.00, '2024-12-01', '2024-12-31', 500, 67, 'activo');

-- Campañas de marketing
INSERT INTO campanas (nombre, descripcion, tipo, fecha_inicio, fecha_fin, presupuesto, gasto_actual, estado, segmento_objetivo) VALUES
('Campaña Verano 2024', 'Promoción productos de verano', 'descuento', '2024-06-01', '2024-08-31', 5000.00, 2340.50, 'activa', 'todos'),
('Black Friday 2024', 'Ofertas especiales Black Friday', 'descuento', '2024-11-25', '2024-11-30', 10000.00, 7890.25, 'activa', 'premium'),
('Navidad 2024', 'Campaña navideña', 'regalo', '2024-12-01', '2024-12-31', 8000.00, 3456.78, 'activa', 'familias');

INSERT INTO programas_fidelizacion (usuario_id, puntos_totales, puntos_disponibles, nivel, fecha_ultimo_uso) VALUES
(2, 1250, 850, 'plata', '2024-01-15'),
(3, 2100, 1900, 'oro', '2024-01-10'),
(4, 750, 600, 'bronce', '2024-01-08'),
(5, 450, 450, 'bronce', '2024-01-05');

INSERT INTO historial_puntos (programa_id, tipo_transaccion, puntos, descripcion, pedido_id) VALUES
(1, 'ganados', 150, 'Compra pedido PED-2024-001', 1),
(2, 'ganados', 200, 'Compra pedido PED-2024-002', 2),
(3, 'ganados', 100, 'Compra pedido PED-2024-003', 3),
(1, 'canjeados', 400, 'Canje por descuento', NULL),
(2, 'canjeados', 300, 'Canje por producto gratis', NULL),
(4, 'ganados', 50, 'Registro en programa', NULL),
(3, 'ganados', 75, 'Reseña de producto', NULL);

-- Uso de cupones
INSERT INTO uso_cupones (cupon_id, usuario_id, pedido_id, descuento_aplicado) VALUES
(1, 2, 1, 18.00),
(2, 3, 2, 5.99),
(3, 4, 3, 11.33),
(4, 5, 4, 10.00);