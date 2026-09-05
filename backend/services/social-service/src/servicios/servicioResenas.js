const { ObjectId } = require('mongodb');
const baseDatos = require('../config/baseDatos');

class ServicioResenas {
  constructor() {
    this.coleccion = 'resenas';
  }

  async crearResena(datosResena) {
    const bd = baseDatos.obtenerBD();
    
    const resena = {
      ...datosResena,
      utilidad: 0,
      verificado: false,
      fecha_creacion: new Date(),
      fecha_actualizacion: new Date()
    };

    const resultado = await bd.collection(this.coleccion).insertOne(resena);
    return await bd.collection(this.coleccion).findOne({ _id: resultado.insertedId });
  }

  async obtenerResenasPorProducto(idProducto, limite = 10, pagina = 1) {
    const bd = baseDatos.obtenerBD();
    const saltar = (pagina - 1) * limite;

    const resenas = await bd.collection(this.coleccion)
      .find({ id_producto: idProducto })
      .sort({ utilidad: -1, fecha_creacion: -1 })
      .skip(saltar)
      .limit(limite)
      .toArray();

    const total = await bd.collection(this.coleccion).countDocuments({ id_producto: idProducto });

    return {
      resenas,
      total,
      pagina,
      limite,
      total_paginas: Math.ceil(total / limite)
    };
  }

  async obtenerResenasPorUsuario(idUsuario, limite = 10, pagina = 1) {
    const bd = baseDatos.obtenerBD();
    const saltar = (pagina - 1) * limite;

    const resenas = await bd.collection(this.coleccion)
      .find({ id_usuario: idUsuario })
      .sort({ fecha_creacion: -1 })
      .skip(saltar)
      .limit(limite)
      .toArray();

    const total = await bd.collection(this.coleccion).countDocuments({ id_usuario: idUsuario });

    return {
      resenas,
      total,
      pagina,
      limite,
      total_paginas: Math.ceil(total / limite)
    };
  }

  async marcarUtilidad(idResena, incremento = 1) {
    const bd = baseDatos.obtenerBD();
    
    if (!ObjectId.isValid(idResena)) {
      throw new Error('ID de reseña inválido');
    }

    const resultado = await bd.collection(this.coleccion).updateOne(
      { _id: new ObjectId(idResena) },
      { 
        $inc: { utilidad: incremento },
        $set: { fecha_actualizacion: new Date() }
      }
    );

    if (resultado.matchedCount === 0) {
      throw new Error('Reseña no encontrada');
    }

    return await bd.collection(this.coleccion).findOne({ _id: new ObjectId(idResena) });
  }

  async obtenerEstadisticasProducto(idProducto) {
    const bd = baseDatos.obtenerBD();

    const estadisticas = await bd.collection(this.coleccion).aggregate([
      { $match: { id_producto: idProducto } },
      {
        $group: {
          _id: null,
          total_resenas: { $sum: 1 },
          calificacion_promedio: { $avg: '$calificacion' },
          calificacion_5: { $sum: { $cond: [{ $eq: ['$calificacion', 5] }, 1, 0] } },
          calificacion_4: { $sum: { $cond: [{ $eq: ['$calificacion', 4] }, 1, 0] } },
          calificacion_3: { $sum: { $cond: [{ $eq: ['$calificacion', 3] }, 1, 0] } },
          calificacion_2: { $sum: { $cond: [{ $eq: ['$calificacion', 2] }, 1, 0] } },
          calificacion_1: { $sum: { $cond: [{ $eq: ['$calificacion', 1] }, 1, 0] } }
        }
      }
    ]).toArray();

    return estadisticas[0] || {
      total_resenas: 0,
      calificacion_promedio: 0,
      calificacion_5: 0,
      calificacion_4: 0,
      calificacion_3: 0,
      calificacion_2: 0,
      calificacion_1: 0
    };
  }
}

module.exports = ServicioResenas;