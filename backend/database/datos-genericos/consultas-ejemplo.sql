-- CONSULTAS DE EJEMPLO PARA VER LOS DATOS

-- ========================================
-- AUTH SERVICE - Ver usuarios registrados
-- ========================================
-- docker exec -it postgres_auth psql -U postgres -d auth_db

SELECT 
    id,
    nombre_usuario,
    email,
    nombre_completo,
    telefono,
    estado,
    fecha_creacion
FROM usuarios 
ORDER BY fecha_creacion DESC;

-- Ver direcciones de usuarios
SELECT 
    u.nombre_completo,
    d.tipo,
    d.direccion,
    d.ciudad,
    d.codigo_postal
FROM usuarios u
JOIN direcciones_usuario d ON u.id = d.usuario_id
ORDER BY u.nombre_completo;

-- ========================================
-- TRANSACTION SERVICE - Ver pedidos
-- ========================================
-- docker exec -it postgres_transactions psql -U postgres -d transactions_db

SELECT 
    p.numero_pedido,
    u.nombre_completo,
    p.estado,
    p.total,
    p.metodo_pago,
    p.fecha_creacion
FROM pedidos p
JOIN usuarios u ON p.usuario_id = u.id
ORDER BY p.fecha_creacion DESC;

-- Ver carritos activos
SELECT 
    c.id as carrito_id,
    u.nombre_completo,
    c.estado,
    c.fecha_creacion
FROM carritos c
JOIN usuarios u ON c.usuario_id = u.id
WHERE c.estado = 'activo';

-- ========================================
-- LOGISTICS SERVICE - Ver inventario
-- ========================================
-- docker exec -it postgres_logistics psql -U postgres -d logistics_db

SELECT 
    a.nombre as almacen,
    i.producto_id,
    i.cantidad_disponible,
    i.cantidad_reservada,
    i.stock_minimo,
    a.ciudad
FROM inventario i
JOIN almacenes a ON i.almacen_id = a.id
ORDER BY a.nombre, i.producto_id;

-- Ver almacenes
SELECT 
    nombre,
    ciudad,
    capacidad_maxima,
    estado
FROM almacenes
ORDER BY nombre;

-- ========================================
-- CREDIT SERVICE - Ver líneas de crédito
-- ========================================
-- docker exec -it postgres_credit psql -U postgres -d credit_db

SELECT 
    u.nombre_completo,
    lc.tipo_credito,
    lc.limite_credito,
    lc.credito_disponible,
    lc.tasa_interes,
    lc.estado
FROM lineas_credito lc
JOIN usuarios u ON lc.usuario_id = u.id
ORDER BY lc.limite_credito DESC;

-- Ver transacciones de crédito
SELECT 
    u.nombre_completo,
    tc.tipo_transaccion,
    tc.monto,
    tc.descripcion,
    tc.fecha_transaccion
FROM transacciones_credito tc
JOIN lineas_credito lc ON tc.linea_credito_id = lc.id
JOIN usuarios u ON lc.usuario_id = u.id
ORDER BY tc.fecha_transaccion DESC;

-- ========================================
-- MARKETING SERVICE - Ver cupones y fidelización
-- ========================================
-- docker exec -it postgres_marketing psql -U postgres -d marketing_db

SELECT 
    codigo,
    tipo,
    valor,
    valor_minimo_pedido,
    usos_actuales,
    usos_maximos,
    estado
FROM cupones
ORDER BY fecha_inicio DESC;

-- Ver programas de fidelización
SELECT 
    u.nombre_completo,
    pf.puntos_totales,
    pf.puntos_disponibles,
    pf.nivel,
    pf.fecha_ultimo_uso
FROM programas_fidelizacion pf
JOIN usuarios u ON pf.usuario_id = u.id
ORDER BY pf.puntos_totales DESC;