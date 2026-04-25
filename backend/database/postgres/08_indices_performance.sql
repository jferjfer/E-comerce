-- ====================================================
-- ÍNDICES DE PERFORMANCE — EGOS
-- Ejecutar en producción: seguros con IF NOT EXISTS
-- ====================================================

-- ── BD AUTENTICACIÓN ──

-- Búsqueda de usuarios por rol (RRHH dashboard)
CREATE INDEX IF NOT EXISTS idx_usuarios_rol ON usuarios(rol);

-- Usuarios activos por rol (filtro más común)
CREATE INDEX IF NOT EXISTS idx_usuarios_rol_activo ON usuarios(rol, activo);

-- Búsqueda por token de recuperación
CREATE INDEX IF NOT EXISTS idx_usuarios_token_recuperacion ON usuarios(token_recuperacion)
  WHERE token_recuperacion IS NOT NULL;

-- Intentos de login por email y fecha (bloqueo de cuenta)
CREATE INDEX IF NOT EXISTS idx_intentos_login_email_fecha ON intentos_login(email, fecha DESC);

-- Token blacklist por hash
CREATE INDEX IF NOT EXISTS idx_token_blacklist_hash ON token_blacklist(token_hash);
CREATE INDEX IF NOT EXISTS idx_token_blacklist_expiracion ON token_blacklist(fecha_expiracion);

-- ── BD TRANSACCIONES ──

-- Pedidos por usuario ordenados por fecha (más consultado)
CREATE INDEX IF NOT EXISTS idx_pedido_usuario_fecha ON pedido(usuario_id, fecha_creacion DESC);

-- Pedidos por estado (dashboard admin)
CREATE INDEX IF NOT EXISTS idx_pedido_estado_fecha ON pedido(estado, fecha_creacion DESC);

-- Pedidos por usuario Y estado (cliente viendo sus pedidos activos)
CREATE INDEX IF NOT EXISTS idx_pedido_usuario_estado ON pedido(usuario_id, estado);

-- Productos de un pedido
CREATE INDEX IF NOT EXISTS idx_pedido_producto_pedido ON pedido_producto(id_pedido);

-- Carrito por usuario
CREATE INDEX IF NOT EXISTS idx_carrito_usuario ON carrito(usuario_id);

-- Productos en carrito
CREATE INDEX IF NOT EXISTS idx_carrito_producto_carrito ON carrito_producto(id_carrito);

-- Devoluciones por estado (dashboard customer success)
CREATE INDEX IF NOT EXISTS idx_devolucion_estado ON devolucion(estado, fecha_creacion DESC);

-- Devoluciones por usuario
CREATE INDEX IF NOT EXISTS idx_devolucion_usuario ON devolucion(usuario_id);

-- Historial de pedido
CREATE INDEX IF NOT EXISTS idx_pedido_historial_pedido ON pedido_historial(id_pedido, fecha_cambio DESC);

-- Pago por pedido
CREATE INDEX IF NOT EXISTS idx_pago_pedido ON pago(id_pedido);

-- ── BD CONTABILIDAD ──

-- Asientos por período (libro diario)
CREATE INDEX IF NOT EXISTS idx_asiento_periodo ON asiento_contable(periodo, numero DESC);

-- Asientos por tipo y período
CREATE INDEX IF NOT EXISTS idx_asiento_tipo_periodo ON asiento_contable(tipo, periodo);

-- Saldos por cuenta y período (libro mayor)
CREATE INDEX IF NOT EXISTS idx_saldo_cuenta_periodo ON saldo_cuenta(codigo_cuenta, periodo);

-- Compras por período
CREATE INDEX IF NOT EXISTS idx_compra_periodo ON compra(periodo, fecha DESC);

-- ── BD CRÉDITO ──

-- Créditos por usuario
CREATE INDEX IF NOT EXISTS idx_credito_usuario ON credito_interno(usuario_id);

-- Créditos activos
CREATE INDEX IF NOT EXISTS idx_credito_usuario_estado ON credito_interno(usuario_id, estado);

-- Bonos por usuario y estado
CREATE INDEX IF NOT EXISTS idx_bono_usuario_estado ON bono(usuario_id, estado);

-- ── BD FACTURACIÓN ──

-- Facturas por pedido
CREATE INDEX IF NOT EXISTS idx_factura_pedido ON factura(pedido_id);

-- Facturas por usuario
CREATE INDEX IF NOT EXISTS idx_factura_usuario ON factura(usuario_id, fecha_creacion DESC);

-- Facturas por estado
CREATE INDEX IF NOT EXISTS idx_factura_estado ON factura(estado);

-- ── BD MARKETING ──

-- Cupones activos por código
CREATE INDEX IF NOT EXISTS idx_cupon_codigo ON cupon(codigo) WHERE activo = true;

-- Campañas activas
CREATE INDEX IF NOT EXISTS idx_campana_estado ON campana(estado);
