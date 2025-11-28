const { MongoClient } = require('mongodb');

async function verificarProductos() {
    const uri = "mongodb+srv://Vercel-Admin-ecomerce:phva2EOCWSW1cybE@ecomerce.ckxq5b1.mongodb.net/?retryWrites=true&w=majority";
    const client = new MongoClient(uri);
    
    try {
        await client.connect();
        const db = client.db('ecomerce');
        const collection = db.collection('productos');
        
        const count = await collection.countDocuments();
        console.log(`📊 Total productos en MongoDB: ${count}`);
        
        // Mostrar algunos productos
        const productos = await collection.find({}).limit(5).toArray();
        console.log('\n🛍️ Productos de muestra:');
        productos.forEach(p => {
            console.log(`   • ${p.nombre} - $${p.precio} (${p.categoria})`);
        });
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await client.close();
    }
}

verificarProductos();