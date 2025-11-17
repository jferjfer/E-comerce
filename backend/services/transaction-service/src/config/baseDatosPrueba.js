// Simulador de base de datos en memoria para pruebas
class BaseDatosPrueba {
  constructor() {
    this.carritos = [];
    this.pedidos = [];
    this.pagos = [];
    this.carritoProductos = [];
    this.pedidoProductos = [];
    this.contadorId = 1;
  }

  async query(consulta, parametros = []) {
    console.log('🔍 Consulta simulada:', consulta);
    console.log('📝 Parámetros:', parametros);

    // Simular INSERT carrito
    if (consulta.includes('INSERT INTO carrito')) {
      const [idUsuario] = parametros;
      const nuevoCarrito = {
        id: this.contadorId++,
        id_usuario: idUsuario,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      };
      this.carritos.push(nuevoCarrito);
      return { rows: [nuevoCarrito] };
    }

    // Simular SELECT carrito por usuario
    if (consulta.includes('SELECT * FROM carrito WHERE id_usuario')) {
      const [idUsuario] = parametros;
      const carrito = this.carritos.find(c => c.id_usuario === idUsuario);
      return { rows: carrito ? [carrito] : [] };
    }

    // Simular INSERT carrito_producto
    if (consulta.includes('INSERT INTO carrito_producto')) {
      const [idCarrito, idProducto, cantidad, precioUnitario] = parametros;
      const nuevoItem = {
        id: this.contadorId++,
        id_carrito: idCarrito,
        id_producto: idProducto,
        cantidad,
        precio_unitario: precioUnitario,
        fecha_creacion: new Date()
      };
      this.carritoProductos.push(nuevoItem);
      return { rows: [nuevoItem] };
    }

    // Simular SELECT productos del carrito
    if (consulta.includes('SELECT cp.* FROM carrito_producto cp')) {
      const [idCarrito] = parametros;
      const productos = this.carritoProductos.filter(cp => cp.id_carrito == idCarrito);
      return { rows: productos };
    }

    // Simular INSERT pedido
    if (consulta.includes('INSERT INTO pedido')) {
      const [idUsuario, estado, total] = parametros;
      const nuevoPedido = {
        id: this.contadorId++,
        id_usuario: idUsuario,
        estado,
        total,
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date()
      };
      this.pedidos.push(nuevoPedido);
      return { rows: [nuevoPedido] };
    }

    // Simular SELECT pedidos por usuario
    if (consulta.includes('SELECT * FROM pedido WHERE id_usuario')) {
      const [idUsuario] = parametros;
      const pedidos = this.pedidos.filter(p => p.id_usuario === idUsuario);
      return { rows: pedidos };
    }

    return { rows: [], rowCount: 0 };
  }

  on(evento, callback) {
    if (evento === 'connect') {
      setTimeout(() => callback(), 100);
    }
  }
}

module.exports = new BaseDatosPrueba();