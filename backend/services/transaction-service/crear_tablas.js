const pool = require('./src/config/baseDatos');

async function crearTablas() {
    try {
        console.log('🔄 Creando tablas del transaction service...');
        
        // Crear tabla carrito si no existe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS carrito (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                id_usuario VARCHAR(50) NOT NULL UNIQUE,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Crear tabla carrito_producto si no existe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS carrito_producto (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                id_carrito UUID NOT NULL REFERENCES carrito(id) ON DELETE CASCADE,
                id_producto VARCHAR(50) NOT NULL,
                cantidad INTEGER NOT NULL DEFAULT 1,
                precio_unitario DECIMAL(10, 2) NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Crear tabla pedido si no existe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pedido (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                id_usuario VARCHAR(50) NOT NULL,
                estado VARCHAR(50) NOT NULL DEFAULT 'Creado',
                total DECIMAL(12, 2) NOT NULL,
                fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        // Crear tabla pedido_producto si no existe
        await pool.query(`
            CREATE TABLE IF NOT EXISTS pedido_producto (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                id_pedido UUID NOT NULL REFERENCES pedido(id) ON DELETE CASCADE,
                id_producto VARCHAR(50) NOT NULL,
                cantidad INTEGER NOT NULL,
                precio_unitario DECIMAL(10, 2) NOT NULL,
                subtotal DECIMAL(10, 2) NOT NULL
            );
        `);
        
        // Crear índices
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_carrito_usuario ON carrito(id_usuario);
            CREATE INDEX IF NOT EXISTS idx_carrito_producto_carrito ON carrito_producto(id_carrito);
            CREATE INDEX IF NOT EXISTS idx_pedido_usuario ON pedido(id_usuario);
            CREATE INDEX IF NOT EXISTS idx_pedido_producto_pedido ON pedido_producto(id_pedido);
        `);
        
        console.log('✅ Tablas creadas exitosamente');
        
        // Verificar tablas
        const tablas = await pool.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name IN ('carrito', 'carrito_producto', 'pedido', 'pedido_producto')
            ORDER BY table_name;
        `);
        
        console.log('📊 Tablas disponibles:');
        tablas.rows.forEach(tabla => {
            console.log(`   • ${tabla.table_name}`);
        });
        
        await pool.end();
        console.log('🎉 ¡Transaction Service configurado exitosamente!');
        
    } catch (error) {
        console.error('❌ Error creando tablas:', error);
        process.exit(1);
    }
}

crearTablas();