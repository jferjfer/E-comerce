// Tipos reutilizados del frontend web
export interface Producto {
  id: string;
  nombre: string;
  precio: number;
  imagen: string;
  imagenes_adicionales?: string[];
  descripcion: string;
  categoria: string;
  tallas?: string[];
  colores?: string[];
  calificacion: number;
  en_stock: boolean;
  sku?: string;
}

export interface ItemCarrito extends Producto {
  cantidad: number;
  talla?: string;
  color?: string;
}

export interface Usuario {
  id: string;
  nombre: string;
  apellido?: string;
  email: string;
  rol: string;
  telefono?: string;
  documento_tipo?: string;
  documento_numero?: string;
  ciudad?: string;
  direccion?: string;
  total_compras_historico?: number;
}

export interface Pedido {
  id: string;
  estado: string;
  total: number;
  fecha_creacion: string;
  productos?: any[];
}

export interface Factura {
  id: string;
  numero: string;
  total: number;
  estado: string;
  fecha: string;
  cufe: string;
}
