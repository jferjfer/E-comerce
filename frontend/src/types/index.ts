export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  descripcion: string;
  categoria: string;
  tallas?: string[];
  colores?: string[];
  calificacion: number;
  en_stock: boolean;
  es_eco?: boolean;
  compatibilidad?: number;
}

export interface ItemCarrito extends Producto {
  cantidad: number;
  talla?: string;
  color?: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: string;
  preferencias?: {
    estilo: string;
    colores: string[];
    talla: string;
  };
}

export interface MetodoPago {
  id: string;
  nombre: string;
  tipo: 'contado' | 'credito' | 'externo';
  descripcion: string;
  icono: string;
  monto_maximo?: number;
  tasa_interes?: number;
}

export interface Pedido {
  id: string;
  items: ItemCarrito[];
  total: number;
  metodo_pago: MetodoPago;
  estado: 'pendiente' | 'procesando' | 'completado' | 'cancelado';
  fecha_creacion: Date;
}

// Tipos legacy para compatibilidad
export type Product = Producto;
export type CartItem = ItemCarrito;
export type User = Usuario;
export type PaymentMethod = MetodoPago;
export type Order = Pedido;