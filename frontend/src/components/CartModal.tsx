import { useCartStore } from '@/store/useCartStore'
import { formatPrice } from '@/utils/sanitize'
import Modal from './Modal'

interface CartModalProps {
  isOpen: boolean
  onClose: () => void
  onCheckout: () => void
}

export default function CartModal({ isOpen, onClose, onCheckout }: CartModalProps) {
  const { items, eliminarItem, actualizarCantidad, obtenerPrecioTotal, vaciarCarrito } = useCartStore()
  
  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      eliminarItem(productId)
    } else {
      actualizarCantidad(productId, newQuantity)
    }
  }
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Carrito de Compras" size="md">
      <div className="max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-10">
            <i className="fas fa-shopping-bag text-4xl text-gray-200 mb-3"></i>
            <p className="text-gray-400 text-sm">Tu carrito está vacío</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 sm:p-4 border-b last:border-b-0">
              <img
                src={item.imagen}
                className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded-lg flex-shrink-0"
                alt={item.nombre}
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-gray-800 truncate">{item.nombre}</h4>
                <p className="text-primary font-bold text-sm">{formatPrice(item.precio)}</p>
                <div className="flex items-center gap-1.5 mt-1.5">
                  <button
                    onClick={() => handleQuantityChange(item.id, item.cantidad - 1)}
                    className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 flex-shrink-0"
                  >
                    <i className="fas fa-minus text-[10px]"></i>
                  </button>
                  <span className="w-6 text-center text-sm font-medium">{item.cantidad}</span>
                  <button
                    onClick={() => handleQuantityChange(item.id, item.cantidad + 1)}
                    className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center hover:bg-gray-200 flex-shrink-0"
                  >
                    <i className="fas fa-plus text-[10px]"></i>
                  </button>
                </div>
              </div>
              <button
                onClick={() => eliminarItem(item.id)}
                className="flex-shrink-0 w-7 h-7 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <i className="fas fa-trash text-xs"></i>
              </button>
            </div>
          ))
        )}
      </div>
      
      {items.length > 0 && (
        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between items-center mb-4">
            <span className="text-lg font-bold">Total: {formatPrice(obtenerPrecioTotal())}</span>
            <button
              onClick={vaciarCarrito}
              className="text-sm text-gray-500 hover:text-gray-700"
            >
              Limpiar carrito
            </button>
          </div>
          <button 
            onClick={onCheckout}
            className="w-full bg-primary text-white py-3 rounded-lg hover:bg-secondary transition-colors"
          >
            Proceder al Pago
          </button>
        </div>
      )}
    </Modal>
  )
}