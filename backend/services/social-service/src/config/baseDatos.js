const { MongoClient } = require('mongodb');

// Configuración MongoDB Atlas
const MONGODB_URI = "mongodb+srv://Vercel-Admin-social_sevice:eEK842ToV46JasUj@social-sevice.rx6mlhq.mongodb.net/?retryWrites=true&w=majority";

class DatabaseManager {
  constructor() {
    this.client = null;
    this.db = null;
  }

  async conectar() {
    try {
      this.client = new MongoClient(MONGODB_URI);
      await this.client.connect();
      this.db = this.client.db('social_db');
      
      console.log('✅ Social Service conectado a MongoDB Atlas');
      return this.db;
    } catch (error) {
      console.error('❌ Error conectando Social Service a MongoDB:', error);
      throw error;
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