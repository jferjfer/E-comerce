-- Insertar datos en bd_autenticacion
\c bd_autenticacion;

INSERT INTO usuario (nombre_usuario, email, contrasena_hash, nombre_completo, telefono, fecha_nacimiento, genero, estado) VALUES
('admin', 'admin@tienda.com', '$2b$10$rQZ8kqVZ9QZ8kqVZ9QZ8kOZ8kqVZ9QZ8kqVZ9QZ8kqVZ9QZ8kqVZ9Q', 'Administrador Sistema', '+34600000001', '1990-01-01', 'otro', 'activo'),
('maria_garcia', 'maria@email.com', '$2b$10$rQZ8kqVZ9QZ8kqVZ9QZ8kOZ8kqVZ9QZ8kqVZ9QZ8kqVZ9QZ8kqVZ9Q', 'María García López', '+34600000002', '1985-05-15', 'femenino', 'activo'),
('juan_perez', 'juan@email.com', '$2b$10$rQZ8kqVZ9QZ8kqVZ9QZ8kOZ8kqVZ9QZ8kqVZ9QZ8kqVZ9QZ8kqVZ9Q', 'Juan Pérez Martín', '+34600000003', '1992-08-20', 'masculino', 'activo'),
('ana_rodriguez', 'ana@email.com', '$2b$10$rQZ8kqVZ9QZ8kqVZ9QZ8kOZ8kqVZ9QZ8kqVZ9QZ8kqVZ9QZ8kqVZ9Q', 'Ana Rodríguez Silva', '+34600000004', '1988-12-10', 'femenino', 'activo'),
('carlos_lopez', 'carlos@email.com', '$2b$10$rQZ8kqVZ9QZ8kqVZ9QZ8kOZ8kqVZ9QZ8kqVZ9QZ8kqVZ9QZ8kqVZ9Q', 'Carlos López Fernández', '+34600000005', '1995-03-25', 'masculino', 'activo');

-- Insertar datos en bd_transacciones
\c bd_transacciones;

INSERT INTO carrito (usuario_id, estado) VALUES
(2, 'activo'),
(3, 'activo'),
(4, 'activo');

INSERT INTO pedido (usuario_id, numero_pedido, estado, subtotal, impuestos, gastos_envio, total, direccion_envio, direccion_facturacion, metodo_pago) VALUES
(2, 'PED-2024-001', 'entregado', 69.99, 14.70, 5.99, 90.68, '{"nombre":"María García López","direccion":"Calle Mayor 123, 2º A","ciudad":"Madrid","codigo_postal":"28001","pais":"España"}', '{"nombre":"María García López","direccion":"Calle Mayor 123, 2º A","ciudad":"Madrid","codigo_postal":"28001","pais":"España"}', 'tarjeta'),
(3, 'PED-2024-002', 'enviado', 49.98, 10.50, 0.00, 60.48, '{"nombre":"Juan Pérez Martín","direccion":"Avenida Libertad 45","ciudad":"Barcelona","codigo_postal":"08001","pais":"España"}', '{"nombre":"Juan Pérez Martín","direccion":"Avenida Libertad 45","ciudad":"Barcelona","codigo_postal":"08001","pais":"España"}', 'paypal');