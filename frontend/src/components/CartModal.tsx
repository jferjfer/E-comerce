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
          <p className="text-gray-500 text-center py-8">Tu carrito está vacío</p>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center space-x-4 p-4 border-b">
              <img 
                src={item.imagen} 
                className="w-16 h-16 object-cover rounded" 
                alt={item.nombre}
              />
              <div className="flex-1">
                <h4 className="font-medium">{item.nombre}</h4>
                <p className="text-primary font-bold">{formatPrice(item.precio)}</p>
                <div className="flex items-center space-x-2 mt-2">
                  <button
                    onClick={() => handleQuantityChange(item.id, item.cantidad - 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                  >
                    <i className="fas fa-minus text-xs"></i>
                  </button>
                  <span className="w-8 text-center">{item.cantidad}</span>
                  <button
                    onClick={() => handleQuantityChange(item.id, item.cantidad + 1)}
                    className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center hover:bg-gray-300"
                  >
                    <i className="fas fa-plus text-xs"></i>
                  </button>
                </div>
              </div>
              <button 
                onClick={() => eliminarItem(item.id)}
                className="text-red-500 hover:text-red-700 p-2"
              >
                <i className="fas fa-trash"></i>
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