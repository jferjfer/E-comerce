const { MongoClient } = require('mongodb');

class BaseDatos {
  constructor() {
    this.cliente = null;
    this.bd = null;
  }

  async conectar() {
    try {
      const host = process.env.MONGO_HOST || 'localhost';
      const puerto = process.env.MONGO_PUERTO || 27017;
      const nombreBD = process.env.MONGO_BD || 'bd_social';
      
      const uri = `mongodb://${host}:${puerto}`;
      
      this.cliente = new MongoClient(uri);
      await this.cliente.connect();
      this.bd = this.cliente.db(nombreBD);
      
      console.log('✅ Conectado a MongoDB Social');
    } catch (error) {
      console.error('❌ Error conectando a MongoDB:', error);
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
      console.log('❌ Conexión a MongoDB cerrada');
    }
  }
}

const baseDatos = new BaseDatos();

// Conectar al iniciar
baseDatos.conectar().catch(console.error);

module.exports = baseDatos;