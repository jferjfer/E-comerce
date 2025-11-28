const { Pool } = require('pg');

// Configuración de conexiones a las diferentes bases de datos PostgreSQL
const databases = {
    auth: {
        name: 'Auth Service (Vercel Postgres)',
        connectionString: 'postgres://default:WdZqZQBPEOPe@ep-falling-sun-a4jqpxjt-pooler.us-east-1.aws.neon.tech:5432/verceldb?sslmode=require',
        tables: ['usuario', 'sesion_usuario']
    },
    transaction: {
        name: 'Transaction Service (Neon PostgreSQL)',
        connectionString: 'postgresql://neondb_owner:npg_YNzxWDGMOmFr@ep-weathered-silence-a4iqgvjx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
        tables: ['carrito', 'pedido', 'pago']
    },
    marketing: {
        name: 'Marketing Service (Neon PostgreSQL)',
        connectionString: 'postgresql://neondb_owner:npg_YNzxWDGMOmFr@ep-weathered-silence-a4iqgvjx-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require',
        tables: ['cupon', 'campana', 'fidelizacion', 'uso_cupon']
    }
};

async function auditarBaseDatos() {
    console.log('🔍 AUDITORÍA DE BASES DE DATOS\n');
    console.log('='.repeat(80));

    for (const [key, config] of Object.entries(databases)) {
        console.log(`\n📊 ${config.name}`);
        console.log('-'.repeat(80));

        const pool = new Pool({ connectionString: config.connectionString });

        try {
            // Verificar conexión
            await pool.query('SELECT 1');
            console.log('✅ Conexión exitosa\n');

            // Contar registros en cada tabla
            for (const table of config.tables) {
                try {
                    const result = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
                    const count = parseInt(result.rows[0].count);
                    console.log(`   📋 Tabla: ${table.padEnd(20)} → ${count} registros`);

                    // Mostrar estructura de la tabla
                    const structure = await pool.query(`
            SELECT column_name, data_type, character_maximum_length, is_nullable
            FROM information_schema.columns
            WHERE table_name = $1
            ORDER BY ordinal_position
          `, [table]);

                    console.log(`      Columnas (${structure.rows.length}):`);
                    structure.rows.forEach(col => {
                        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
                        const type = col.character_maximum_length
                            ? `${col.data_type}(${col.character_maximum_length})`
                            : col.data_type;
                        console.log(`         - ${col.column_name}: ${type} ${nullable}`);
                    });
                    console.log('');
                } catch (err) {
                    console.log(`   ❌ Error en tabla ${table}: ${err.message}\n`);
                }
            }
        } catch (error) {
            console.log(`❌ Error de conexión: ${error.message}\n`);
        } finally {
            await pool.end();
        }
    }

    console.log('='.repeat(80));
    console.log('\n✅ Auditoría completada');
}

auditarBaseDatos().catch(console.error);
