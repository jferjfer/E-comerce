import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotificationStore } from '@/store/useNotificationStore'
import { ROLE_DEFINITIONS } from '@/config/roles'

export default function ProfilePage() {
  const { usuario } = useAuthStore()
  const navigate = useNavigate()
  const addNotification = useNotificationStore(state => state.addNotification)
  
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState({
    nombre: usuario?.nombre || '',
    email: usuario?.email || '',
    telefono: '',
    direccion: '',
    ciudad: ''
  })
  
  const [preferences, setPreferences] = useState({
    style: 'casual',
    size: 'M',
    colors: ['Negro', 'Blanco'],
    notifications: true
  })
  
  const isCliente = usuario?.rol === 'cliente'
  const roleInfo = usuario?.rol ? ROLE_DEFINITIONS[usuario.rol] : null
  
  const handleSave = () => {
    setIsEditing(false)
    addNotification('Información actualizada exitosamente', 'success')
  }
  
  const handleSavePreferences = () => {
    addNotification('Preferencias guardadas exitosamente', 'success')
  }
  
  const handleBack = () => {
    if (isCliente) {
      navigate('/')
    } else if (usuario?.rol === 'product_manager' || usuario?.rol === 'category_manager' || usuario?.rol === 'seller_premium') {
      navigate('/products')
    } else if (usuario?.rol === 'marketing_manager') {
      navigate('/marketing')
    } else {
      navigate('/admin')
    }
  }
  
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={handleBack} className="text-primary hover:text-secondary">
            <i className="fas fa-arrow-left mr-2"></i>
            Volver
          </button>
          <h1 className="text-3xl font-bold text-primary">
            <i className="fas fa-user mr-3"></i>
            Mi Perfil
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Información Personal */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">Información Personal</h2>
                {isCliente && (
                  <button
                    onClick={() => setIsEditing(!isEditing)}
                    className="text-primary hover:text-secondary text-sm font-medium"
                  >
                    <i className={`fas fa-${isEditing ? 'times' : 'edit'} mr-1`}></i>
                    {isEditing ? 'Cancelar' : 'Editar'}
                  </button>
                )}
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                  <input 
                    type="text" 
                    value={isEditing ? formData.nombre : usuario?.nombre || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, nombre: e.target.value }))}
                    readOnly={!isEditing}
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 ${!isEditing ? 'bg-gray-50' : ''}`}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input 
                    type="email" 
                    value={isEditing ? formData.email : usuario?.email || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    readOnly={!isEditing}
                    className={`w-full border border-gray-300 rounded-lg px-3 py-2 ${!isEditing ? 'bg-gray-50' : ''}`}
                  />
                </div>
                {isCliente && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                      <input 
                        type="tel" 
                        value={formData.telefono}
                        onChange={(e) => setFormData(prev => ({ ...prev, telefono: e.target.value }))}
                        readOnly={!isEditing}
                        placeholder="Ej: +57 300 123 4567"
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 ${!isEditing ? 'bg-gray-50' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                      <input 
                        type="text" 
                        value={formData.direccion}
                        onChange={(e) => setFormData(prev => ({ ...prev, direccion: e.target.value }))}
                        readOnly={!isEditing}
                        placeholder="Ej: Calle 123 #45-67"
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 ${!isEditing ? 'bg-gray-50' : ''}`}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Ciudad</label>
                      <input 
                        type="text" 
                        value={formData.ciudad}
                        onChange={(e) => setFormData(prev => ({ ...prev, ciudad: e.target.value }))}
                        readOnly={!isEditing}
                        placeholder="Ej: Bogotá"
                        className={`w-full border border-gray-300 rounded-lg px-3 py-2 ${!isEditing ? 'bg-gray-50' : ''}`}
                      />
                    </div>
                  </>
                )}
                {!isCliente && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rol</label>
                    <div className="flex items-center gap-2">
                      <span className={`${roleInfo?.color || 'bg-gray-500'} text-white px-3 py-1 rounded-full text-sm`}>
                        <i className={`${roleInfo?.icon || 'fas fa-user'} mr-2`}></i>
                        {roleInfo?.name || usuario?.rol}
                      </span>
                    </div>
                  </div>
                )}
                {!isCliente && roleInfo && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Descripción del Rol</label>
                    <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                      {roleInfo.description}
                    </p>
                  </div>
                )}
                {isEditing && isCliente && (
                  <button
                    onClick={handleSave}
                    className="w-full bg-primary text-white py-3 rounded-lg hover:bg-secondary transition-colors"
                  >
                    <i className="fas fa-save mr-2"></i>
                    Guardar Cambios
                  </button>
                )}
              </div>
            </div>

            {/* Preferencias solo para clientes */}
            {isCliente && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">Preferencias de Compra</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estilo Preferido</label>
                    <select 
                      value={preferences.style}
                      onChange={(e) => setPreferences(prev => ({ ...prev, style: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="casual">Casual</option>
                      <option value="elegante">Elegante</option>
                      <option value="deportivo">Deportivo</option>
                      <option value="bohemio">Bohemio</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Talla Preferida</label>
                    <select 
                      value={preferences.size}
                      onChange={(e) => setPreferences(prev => ({ ...prev, size: e.target.value }))}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    >
                      <option value="XS">XS</option>
                      <option value="S">S</option>
                      <option value="M">M</option>
                      <option value="L">L</option>
                      <option value="XL">XL</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Colores Favoritos</label>
                    <div className="grid grid-cols-3 gap-2">
                      {['Negro', 'Blanco', 'Azul', 'Rojo', 'Verde', 'Rosa'].map(color => (
                        <label key={color} className="flex items-center">
                          <input 
                            type="checkbox" 
                            checked={preferences.colors.includes(color)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setPreferences(prev => ({ ...prev, colors: [...prev.colors, color] }))
                              } else {
                                setPreferences(prev => ({ ...prev, colors: prev.colors.filter(c => c !== color) }))
                              }
                            }}
                            className="mr-2"
                          />
                          <span className="text-sm">{color}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      checked={preferences.notifications}
                      onChange={(e) => setPreferences(prev => ({ ...prev, notifications: e.target.checked }))}
                      className="mr-2"
                    />
                    <label className="text-sm text-gray-700">Recibir notificaciones de ofertas</label>
                  </div>

                  <button 
                    onClick={handleSavePreferences}
                    className="w-full bg-primary text-white py-3 rounded-lg hover:bg-secondary transition-colors"
                  >
                    Guardar Preferencias
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {isCliente && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="font-semibold text-gray-800 mb-4">Acciones Rápidas</h3>
                <div className="space-y-3">
                  <Link 
                    to="/orders" 
                    className="block w-full text-left px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <i className="fas fa-shopping-bag mr-2 text-primary"></i>
                    Ver Mis Pedidos
                  </Link>
                  <Link 
                    to="/favorites" 
                    className="block w-full text-left px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <i className="fas fa-heart mr-2 text-red-500"></i>
                    Mis Favoritos
                  </Link>
                  <Link 
                    to="/payments" 
                    className="block w-full text-left px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <i className="fas fa-credit-card mr-2 text-green-500"></i>
                    Métodos de Pago
                  </Link>
                </div>
              </div>
            )}

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <i className="fas fa-info-circle text-blue-600 mt-1 mr-2"></i>
                <div>
                  <h4 className="font-semibold text-blue-900 text-sm">Información</h4>
                  <p className="text-blue-800 text-xs mt-1">
                    {isCliente 
                      ? 'Mantén tus preferencias actualizadas para recibir mejores recomendaciones.'
                      : 'Aquí puedes actualizar tu información personal y configuración de cuenta.'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}