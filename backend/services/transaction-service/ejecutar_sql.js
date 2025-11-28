const pool = require('./src/config/baseDatos');
const fs = require('fs');
const path = require('path');

async function ejecutarSQL() {
    try {
        console.log('🔄 Conectando a PostgreSQL...');
        
        // Leer el archivo SQL
        const sqlPath = path.join(__dirname, 'arreglar_carrito.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        console.log('📄 Ejecutando script SQL...');
        
        // Ejecutar el SQL
        const resultado = await pool.query(sql);
        
        console.log('✅ Script ejecutado exitosamente');
        console.log('📊 Resultado:', resultado.rows);
        
        // Verificar que la tabla existe
        const verificacion = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'carrito'
            ORDER BY ordinal_position;
        `);
        
        console.log('🔍 Estructura de la tabla carrito:');
        verificacion.rows.forEach(col => {
            console.log(`   • ${col.column_name}: ${col.data_type}`);
        });
        
        await pool.end();
        console.log('🎉 ¡Tabla carrito arreglada exitosamente!');
        
    } catch (error) {
        console.error('❌ Error ejecutando SQL:', error);
        process.exit(1);
    }
}

ejecutarSQL();