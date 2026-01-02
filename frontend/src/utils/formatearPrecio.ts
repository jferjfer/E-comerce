/**
 * Formatea un número como precio en pesos colombianos
 * @param precio - Número a formatear
 * @returns String formateado como $XX.XXX COP
 */
export const formatearPrecio = (precio: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(precio);
};

/**
 * Formatea un número con separadores de miles
 * @param numero - Número a formatear
 * @returns String formateado como XX.XXX
 */
export const formatearNumero = (numero: number): string => {
  return new Intl.NumberFormat('es-CO').format(numero);
};
