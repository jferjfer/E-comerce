const { MongoClient } = require('mongodb');

// Configuración MongoDB Atlas
const MONGODB_URI = process.env.MONGODB_SOCIAL_URI || process.env.MONGODB_URI;

class DatabaseManager {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async conectar() {
    let intentos = 5;
    let delay = 2000;
    
    while (intentos > 0) {
      try {
        this.client = new MongoClient(MONGODB_URI);
        await this.client.connect();
        this.db = this.client.db('social_db');
        
        console.log('✅ Social Service conectado a MongoDB Atlas');
        return this.db;
      } catch (error) {
        intentos--;
        console.error(`❌ Error conectando (${intentos} intentos restantes):`, error.message);
        
        if (intentos > 0) {
          console.log(`🔄 Reintentando en ${delay/1000}s...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 1.5;
        } else {
          console.error('❌ No se pudo conectar a MongoDB después de varios intentos');
          throw error;
        }
      }
    }
  }

  async desconectar() {
    if (this.client) {
      await this.client.close();
      console.log('🔌 Social Service desconectado de MongoDB');
    }
  }

  getDb() {
    return this.db;
  }
}

const dbManager = new DatabaseManager();

module.exports = dbManager;