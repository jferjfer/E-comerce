-- ====================================================
-- STYLEHUB AUTH SERVICE - SISTEMA DE AUTENTICACIÓN EMPRESARIAL
-- ====================================================

\c stylehub_auth;

-- Enum para roles del sistema
CREATE TYPE rol_sistema AS ENUM (
    'CEO',
    'DIRECTOR_GENERAL',
    'DIRECTOR_COMERCIAL', 
    'DIRECTOR_MARKETING',
    'DIRECTOR_TECNOLOGIA',
    'GERENTE_VENTAS',
    'GERENTE_INVENTARIO',
    'GERENTE_LOGISTICA',
    'GERENTE_ATENCION_CLIENTE',
    'SUPERVISOR_VENTAS',
    'SUPERVISOR_ALMACEN',
    'EMPLEADO_VENTAS',
    'EMPLEADO_ALMACEN',
    'EMPLEADO_ATENCION_CLIENTE',
    'CLIENTE_PREMIUM',
    'CLIENTE_REGULAR',
    'CLIENTE_NUEVO',
    'INVITADO'
);

-- Enum para estados de usuario
CREATE TYPE estado_usuario AS ENUM ('ACTIVO', 'INACTIVO', 'SUSPENDIDO', 'PENDIENTE');

-- Tabla: Roles y Permisos
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre rol_sistema UNIQUE NOT NULL,
    descripcion TEXT,
    nivel_jerarquia INTEGER NOT NULL,
    activo BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Permisos del sistema
CREATE TABLE permisos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    modulo VARCHAR(50) NOT NULL,
    accion VARCHAR(50) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Relación Roles-Permisos
CREATE TABLE roles_permisos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rol_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permiso_id UUID NOT NULL REFERENCES permisos(id) ON DELETE CASCADE,
    fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(rol_id, permiso_id)
);

-- Tabla: Usuarios del sistema
CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    telefono VARCHAR(20),
    contrasena_hash VARCHAR(255) NOT NULL,
    rol_id UUID NOT NULL REFERENCES roles(id),
    estado estado_usuario DEFAULT 'ACTIVO',
    ultimo_acceso TIMESTAMP,
    intentos_fallidos INTEGER DEFAULT 0,
    bloqueado_hasta TIMESTAMP,
    debe_cambiar_contrasena BOOLEAN DEFAULT false,
    avatar_url TEXT,
    departamento VARCHAR(100),
    jefe_directo_id UUID REFERENCES usuarios(id),
    fecha_contratacion DATE,
    salario DECIMAL(12,2),
    total_compras_historico DECIMAL(12, 2) DEFAULT 0.00,
    puntos_fidelidad INTEGER DEFAULT 0,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Sesiones de usuario
CREATE TABLE sesiones_usuario (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    token_acceso TEXT NOT NULL,
    token_refresh TEXT,
    ip_address INET,
    user_agent TEXT,
    dispositivo VARCHAR(100),
    ubicacion VARCHAR(255),
    fecha_expiracion TIMESTAMP NOT NULL,
    activa BOOLEAN DEFAULT true,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Historial de contraseñas
CREATE TABLE historial_contrasenas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
    contrasena_hash VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Intentos de acceso
CREATE TABLE intentos_acceso (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    exitoso BOOLEAN NOT NULL,
    motivo_fallo VARCHAR(255),
    fecha_intento TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Auditoría del sistema
CREATE TABLE auditoria_sistema (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    accion VARCHAR(255) NOT NULL,
    entidad VARCHAR(100) NOT NULL,
    entidad_id UUID,
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address INET,
    user_agent TEXT,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla: Configuración de seguridad
CREATE TABLE configuracion_seguridad (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor TEXT NOT NULL,
    descripcion TEXT,
    fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Índices para optimización
CREATE INDEX idx_usuarios_email ON usuarios(email);
CREATE INDEX idx_usuarios_rol ON usuarios(rol_id);
CREATE INDEX idx_usuarios_estado ON usuarios(estado);
CREATE INDEX idx_sesiones_token ON sesiones_usuario(token_acceso);
CREATE INDEX idx_sesiones_usuario ON sesiones_usuario(usuario_id);
CREATE INDEX idx_sesiones_activa ON sesiones_usuario(activa);
CREATE INDEX idx_auditoria_usuario ON auditoria_sistema(usuario_id);
CREATE INDEX idx_auditoria_fecha ON auditoria_sistema(fecha_hora);
CREATE INDEX idx_auditoria_entidad ON auditoria_sistema(entidad, entidad_id);
CREATE INDEX idx_intentos_email ON intentos_acceso(email);
CREATE INDEX idx_intentos_ip ON intentos_acceso(ip_address);
CREATE INDEX idx_intentos_fecha ON intentos_acceso(fecha_intento);

-- Función para actualizar fecha_actualizacion
CREATE OR REPLACE FUNCTION actualizar_fecha_modificacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para usuarios
CREATE TRIGGER trigger_usuarios_actualizacion
    BEFORE UPDATE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION actualizar_fecha_modificacion();

-- Insertar roles del sistema
INSERT INTO roles (nombre, descripcion, nivel_jerarquia) VALUES
('CEO', 'Director Ejecutivo - Máximo nivel de autoridad', 1),
('DIRECTOR_GENERAL', 'Director General - Supervisión general', 2),
('DIRECTOR_COMERCIAL', 'Director Comercial - Estrategia de ventas', 3),
('DIRECTOR_MARKETING', 'Director de Marketing - Estrategia de marketing', 3),
('DIRECTOR_TECNOLOGIA', 'Director de Tecnología - Infraestructura IT', 3),
('GERENTE_VENTAS', 'Gerente de Ventas - Gestión de equipos de venta', 4),
('GERENTE_INVENTARIO', 'Gerente de Inventario - Control de stock', 4),
('GERENTE_LOGISTICA', 'Gerente de Logística - Distribución y envíos', 4),
('GERENTE_ATENCION_CLIENTE', 'Gerente de Atención al Cliente - Servicio', 4),
('SUPERVISOR_VENTAS', 'Supervisor de Ventas - Supervisión directa', 5),
('SUPERVISOR_ALMACEN', 'Supervisor de Almacén - Control operativo', 5),
('EMPLEADO_VENTAS', 'Empleado de Ventas - Atención directa', 6),
('EMPLEADO_ALMACEN', 'Empleado de Almacén - Operaciones', 6),
('EMPLEADO_ATENCION_CLIENTE', 'Empleado Atención Cliente - Soporte', 6),
('CLIENTE_PREMIUM', 'Cliente Premium - Beneficios especiales', 7),
('CLIENTE_REGULAR', 'Cliente Regular - Cliente estándar', 8),
('CLIENTE_NUEVO', 'Cliente Nuevo - Recién registrado', 9),
('INVITADO', 'Invitado - Sin registro', 10);

-- Insertar permisos del sistema
INSERT INTO permisos (nombre, descripcion, modulo, accion) VALUES
-- Gestión de usuarios
('USUARIOS_CREAR', 'Crear nuevos usuarios', 'usuarios', 'crear'),
('USUARIOS_LEER', 'Ver información de usuarios', 'usuarios', 'leer'),
('USUARIOS_ACTUALIZAR', 'Modificar usuarios existentes', 'usuarios', 'actualizar'),
('USUARIOS_ELIMINAR', 'Eliminar usuarios', 'usuarios', 'eliminar'),
('USUARIOS_GESTIONAR_ROLES', 'Asignar y modificar roles', 'usuarios', 'gestionar_roles'),

-- Gestión de productos
('PRODUCTOS_CREAR', 'Crear nuevos productos', 'productos', 'crear'),
('PRODUCTOS_LEER', 'Ver catálogo de productos', 'productos', 'leer'),
('PRODUCTOS_ACTUALIZAR', 'Modificar productos', 'productos', 'actualizar'),
('PRODUCTOS_ELIMINAR', 'Eliminar productos', 'productos', 'eliminar'),
('PRODUCTOS_GESTIONAR_PRECIOS', 'Modificar precios', 'productos', 'gestionar_precios'),

-- Gestión de inventario
('INVENTARIO_LEER', 'Ver niveles de inventario', 'inventario', 'leer'),
('INVENTARIO_ACTUALIZAR', 'Modificar inventario', 'inventario', 'actualizar'),
('INVENTARIO_TRANSFERIR', 'Transferir entre almacenes', 'inventario', 'transferir'),

-- Gestión de pedidos
('PEDIDOS_CREAR', 'Crear nuevos pedidos', 'pedidos', 'crear'),
('PEDIDOS_LEER', 'Ver pedidos', 'pedidos', 'leer'),
('PEDIDOS_ACTUALIZAR', 'Modificar pedidos', 'pedidos', 'actualizar'),
('PEDIDOS_CANCELAR', 'Cancelar pedidos', 'pedidos', 'cancelar'),

-- Reportes y analytics
('REPORTES_VENTAS', 'Ver reportes de ventas', 'reportes', 'ventas'),
('REPORTES_INVENTARIO', 'Ver reportes de inventario', 'reportes', 'inventario'),
('REPORTES_FINANCIEROS', 'Ver reportes financieros', 'reportes', 'financieros'),
('ANALYTICS_AVANZADO', 'Acceso a analytics avanzado', 'analytics', 'avanzado'),

-- Configuración del sistema
('SISTEMA_CONFIGURAR', 'Configurar parámetros del sistema', 'sistema', 'configurar'),
('SISTEMA_AUDITORIA', 'Ver logs de auditoría', 'sistema', 'auditoria'),
('SISTEMA_BACKUP', 'Realizar respaldos', 'sistema', 'backup');

-- Configuración inicial de seguridad
INSERT INTO configuracion_seguridad (clave, valor, descripcion) VALUES
('MAX_INTENTOS_LOGIN', '5', 'Máximo número de intentos de login fallidos'),
('TIEMPO_BLOQUEO_MINUTOS', '30', 'Tiempo de bloqueo tras intentos fallidos'),
('DURACION_SESSION_HORAS', '8', 'Duración de sesión en horas'),
('LONGITUD_MIN_PASSWORD', '8', 'Longitud mínima de contraseña'),
('REQUERIR_MAYUSCULA', 'true', 'Requerir al menos una mayúscula'),
('REQUERIR_NUMERO', 'true', 'Requerir al menos un número'),
('REQUERIR_SIMBOLO', 'true', 'Requerir al menos un símbolo'),
('HISTORIAL_PASSWORDS', '5', 'Número de contraseñas anteriores a recordar');

-- Usuario administrador inicial
INSERT INTO usuarios (nombre, apellido, email, contrasena_hash, rol_id, departamento) 
SELECT 
    'Admin', 
    'Sistema', 
    'admin@stylehub.com', 
    crypt('Admin123!', gen_salt('bf')), 
    r.id,
    'Tecnología'
FROM roles r WHERE r.nombre = 'CEO';