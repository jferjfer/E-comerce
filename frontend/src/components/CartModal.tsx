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
    if (newQuantity <= 0) eliminarItem(productId)
    else actualizarCantidad(productId, newQuantity)
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Carrito" size="md">
      <div className="max-h-96 overflow-y-auto">
        {items.length === 0 ? (
          <div className="text-center py-12">
            <i className="fas fa-shopping-bag text-3xl text-gray-700 mb-3"></i>
            <p className="text-gray-500 text-xs tracking-[3px] uppercase">Tu carrito está vacío</p>
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="flex items-center gap-3 p-3 border-b border-white/5">
              <img src={item.imagen} className="w-14 h-14 object-cover flex-shrink-0" alt={item.nombre} />
              <div className="flex-1 min-w-0">
                <h4 className="text-xs text-gray-300 uppercase tracking-wide truncate">{item.nombre}</h4>
                <p className="font-bodoni text-gold text-sm mt-0.5">{formatPrice(item.precio)}</p>
                <div className="flex items-center gap-2 mt-1.5">
                  <button
                    onClick={() => handleQuantityChange(item.id, item.cantidad - 1)}
                    className="w-6 h-6 border border-white/10 text-gray-400 hover:border-gold/50 hover:text-gold flex items-center justify-center transition-colors"
                  >
                    <i className="fas fa-minus text-[10px]"></i>
                  </button>
                  <span className="text-xs text-gray-300 w-4 text-center">{item.cantidad}</span>
                  <button
                    onClick={() => handleQuantityChange(item.id, item.cantidad + 1)}
                    className="w-6 h-6 border border-white/10 text-gray-400 hover:border-gold/50 hover:text-gold flex items-center justify-center transition-colors"
                  >
                    <i className="fas fa-plus text-[10px]"></i>
                  </button>
                </div>
              </div>
              <button
                onClick={() => eliminarItem(item.id)}
                className="text-gray-700 hover:text-red-400 transition-colors p-1 flex-shrink-0"
              >
                <i className="fas fa-times text-xs"></i>
              </button>
            </div>
          ))
        )}
      </div>

      {items.length > 0 && (
        <div className="border-t border-white/5 pt-4 mt-2">
          <div className="flex justify-between items-center mb-4">
            <span className="font-bodoni text-xl text-gold">{formatPrice(obtenerPrecioTotal())}</span>
            <button
              onClick={vaciarCarrito}
              className="text-xs text-gray-600 hover:text-gray-400 tracking-[3px] uppercase transition-colors"
            >
              Vaciar
            </button>
          </div>
          <button
            onClick={onCheckout}
            className="w-full bg-gold text-black py-3 text-xs font-semibold tracking-[4px] uppercase hover:bg-gold-light transition-colors"
          >
            Finalizar compra
          </button>
        </div>
      )}
    </Modal>
  )
}
