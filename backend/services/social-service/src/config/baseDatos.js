const { MongoClient } = require('mongodb');

class BaseDatos {
  constructor() {
    this.cliente = null;
    this.bd = null;
  }

  async conectar() {
    try {
      // Conexión directa a MongoDB Atlas para producción
      const uri = "mongodb+srv://Vercel-Admin-ecomerce:phva2EOCWSW1cybE@ecomerce.ckxq5b1.mongodb.net/?retryWrites=true&w=majority";
      
      this.cliente = new MongoClient(uri);
      await this.cliente.connect();
      this.bd = this.cliente.db('ecomerce');
      
      console.log('✅ Social Service conectado a MongoDB Atlas (Producción)');
    } catch (error) {
      console.error('❌ Error conectando Social Service a MongoDB:', error);
      throw error;
    }
  }

  obtenerBD() {
    if (!this.bd) {
      throw new Error('Base de datos no conectada');
    }
    return this.bd;
  }

  async cerrar() {
    if (this.cliente) {
      await this.cliente.close();
      console.log('❌ Social Service desconectado de MongoDB');
    }
  }
}

const baseDatos = new BaseDatos();

// Conectar al iniciar
baseDatos.conectar().catch(console.error);

module.exports = baseDatos;