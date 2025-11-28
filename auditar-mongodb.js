const { MongoClient } = require('mongodb');

// Configuración de conexiones a MongoDB
const databases = {
    catalog: {
        name: 'Catalog Service (MongoDB Atlas)',
        uri: 'mongodb+srv://Vercel-Admin-catalogo:92HI0xaJVpfpogCL@catalogo.eocsgaj.mongodb.net/?retryWrites=true&w=majority',
        dbName: 'catalogo_db',
        collections: ['productos', 'categorias']
    },
    social: {
        name: 'Social Service (MongoDB Atlas)',
        uri: 'mongodb+srv://Vercel-Admin-Social:Wl5Vu2lGZvNJdvXa@social.eocsgaj.mongodb.net/?retryWrites=true&w=majority',
        dbName: 'social_db',
        collections: ['resenas', 'preguntas', 'listas_deseos']
    }
};

async function auditarMongoDB() {
    console.log('🔍 AUDITORÍA DE BASES DE DATOS MONGODB\n');
    console.log('='.repeat(80));

    for (const [key, config] of Object.entries(databases)) {
        console.log(`\n📊 ${config.name}`);
        console.log('-'.repeat(80));

        const client = new MongoClient(config.uri);

        try {
            await client.connect();
            console.log('✅ Conexión exitosa\n');

            const db = client.db(config.dbName);

            // Listar todas las colecciones existentes
            const existingCollections = await db.listCollections().toArray();
            console.log(`   📁 Colecciones existentes: ${existingCollections.map(c => c.name).join(', ')}\n`);

            // Auditar cada colección esperada
            for (const collectionName of config.collections) {
                try {
                    const collection = db.collection(collectionName);
                    const count = await collection.countDocuments();
                    console.log(`   📋 Colección: ${collectionName.padEnd(20)} → ${count} documentos`);

                    if (count > 0) {
                        // Mostrar un documento de ejemplo
                        const sample = await collection.findOne();
                        console.log(`      Estructura de ejemplo:`);
                        console.log(`         ${JSON.stringify(sample, null, 2).split('\n').join('\n         ')}`);
                    }
                    console.log('');
                } catch (err) {
                    console.log(`   ❌ Error en colección ${collectionName}: ${err.message}\n`);
                }
            }

            // Mostrar estadísticas de la base de datos
            const stats = await db.stats();
            console.log(`   📊 Estadísticas de la BD:`);
            console.log(`      - Tamaño de datos: ${(stats.dataSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`      - Tamaño de almacenamiento: ${(stats.storageSize / 1024 / 1024).toFixed(2)} MB`);
            console.log(`      - Número de colecciones: ${stats.collections}`);
            console.log('');

        } catch (error) {
            console.log(`❌ Error de conexión: ${error.message}\n`);
        } finally {
            await client.close();
        }
    }

    console.log('='.repeat(80));
    console.log('\n✅ Auditoría completada');
}

auditarMongoDB().catch(console.error);
