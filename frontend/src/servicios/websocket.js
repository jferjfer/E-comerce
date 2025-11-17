import { io } from 'socket.io-client';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.conectado = false;
  }

  conectar() {
    if (!this.socket) {
      this.socket = io('http://localhost:3000', {
        path: '/ws',
        transports: ['websocket', 'polling']
      });

      this.socket.on('connect', () => {
        console.log('🔌 WebSocket conectado');
        this.conectado = true;
      });

      this.socket.on('disconnect', () => {
        console.log('🔌 WebSocket desconectado');
        this.conectado = false;
      });

      this.socket.on('connect_error', (error) => {
        console.log('❌ Error WebSocket:', error.message);
      });
    }
  }

  desconectar() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.conectado = false;
    }
  }

  // Eventos del carrito
  emitirCarritoActualizado(carrito) {
    if (this.socket && this.conectado) {
      this.socket.emit('carrito_actualizado', carrito);
    }
  }

  escucharCarritoActualizado(callback) {
    if (this.socket) {
      this.socket.on('carrito_actualizado', callback);
    }
  }

  // Eventos de pedidos
  emitirNuevoPedido(pedido) {
    if (this.socket && this.conectado) {
      this.socket.emit('nuevo_pedido', pedido);
    }
  }

  escucharNuevoPedido(callback) {
    if (this.socket) {
      this.socket.on('nuevo_pedido', callback);
    }
  }
}

export default new WebSocketService();