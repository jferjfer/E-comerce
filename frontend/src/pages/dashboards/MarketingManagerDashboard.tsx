import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'
import { useNotificationStore } from '@/store/useNotificationStore'

export default function MarketingManagerDashboard() {
  const { usuario } = useAuthStore()
  const { addNotification } = useNotificationStore()
  const [cupones, setCupones] = useState<any[]>([])
  const [campanas, setCampanas] = useState<any[]>([])
  const [cargando, setCargando] = useState(true)
  const [mostrarModalCupon, setMostrarModalCupon] = useState(false)
  const [mostrarModalCampana, setMostrarModalCampana] = useState(false)
  const [mostrarListaCampanas, setMostrarListaCampanas] = useState(false)
  const [mostrarListaCupones, setMostrarListaCupones] = useState(false)
  const [mostrarReportes, setMostrarReportes] = useState(false)
  const [nuevoCupon, setNuevoCupon] = useState({
    codigo: '',
    tipo: 'porcentaje',
    valor: 0,
    descripcion: ''
  })
  const [nuevaCampana, setNuevaCampana] = useState({
    nombre: '',
    descripcion: '',
    tipo: 'descuento',
    presupuesto: 0
  })

  useEffect(() => {
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const resCupones = await fetch('http://localhost:3006/api/cupones')
      const dataCupones = await resCupones.json()
      setCupones(dataCupones.cupones || [])
      
      const resCampanas = await fetch('http://localhost:3006/api/campanas')
      const dataCampanas = await resCampanas.json()
      setCampanas(dataCampanas.campanas || [])
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setCargando(false)
    }
  }

  const crearCupon = () => {
    if (!nuevoCupon.codigo || !nuevoCupon.valor) {
      addNotification('Completa todos los campos', 'error')
      return
    }
    const cupon = {
      id: Date.now(),
      ...nuevoCupon,
      activo: true,
      usos_actuales: 0,
      usos_maximos: 100
    }
    setCupones([...cupones, cupon])
    setMostrarModalCupon(false)
    setNuevoCupon({ codigo: '', tipo: 'porcentaje', valor: 0, descripcion: '' })
    addNotification('Cupón creado exitosamente', 'success')
  }

  const crearCampana = () => {
    if (!nuevaCampana.nombre || !nuevaCampana.presupuesto) {
      addNotification('Completa todos los campos', 'error')
      return
    }
    
    fetch('http://localhost:3006/api/campanas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(nuevaCampana)
    })
    .then(res => res.json())
    .then(data => {
      setCampanas([...campanas, data.campana])
      setMostrarModalCampana(false)
      setNuevaCampana({ nombre: '', descripcion: '', tipo: 'descuento', presupuesto: 0 })
      addNotification('Campaña creada exitosamente', 'success')
    })
    .catch(() => addNotification('Error creando campaña', 'error'))
  }

  const toggleCupon = (id: number) => {
    setCupones(cupones.map(c => c.id === id ? { ...c, activo: !c.activo } : c))
    addNotification('Estado del cupón actualizado', 'success')
  }

  const toggleCampana = (id: number) => {
    const campana = campanas.find(c => c.id === id)
    if (!campana) return
    
    const nuevoEstado = campana.estado === 'Activa' ? 'Pausada' : 'Activa'
    
    fetch(`http://localhost:3006/api/campanas/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ estado: nuevoEstado })
    })
    .then(() => {
      setCampanas(campanas.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c))
      addNotification('Estado de la campaña actualizado', 'success')
    })
    .catch(() => addNotification('Error actualizando campaña', 'error'))
  }

  const eliminarCampana = (id: number) => {
    if (!confirm('¿Eliminar esta campaña?')) return
    
    fetch(`http://localhost:3006/api/campanas/${id}`, { method: 'DELETE' })
    .then(() => {
      setCampanas(campanas.filter(c => c.id !== id))
      addNotification('Campaña eliminada', 'success')
    })
    .catch(() => addNotification('Error eliminando campaña', 'error'))
  }

  const exportarDatos = () => {
    const datos = { cupones, campanas }
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'marketing-data.json'
    a.click()
    addNotification('Datos exportados exitosamente', 'success')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-fuchsia-600 rounded-lg flex items-center justify-center">
              <i className="fas fa-megaphone text-white text-xl"></i>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard de Marketing</h1>
              <p className="text-gray-600">Gestión de Campañas y Promociones</p>
            </div>
          </div>
        </div>

        {/* Métricas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Campañas Activas</p>
                <p className="text-2xl font-bold text-fuchsia-600">{campanas.filter(c => c.estado === 'Activa').length}</p>
              </div>
              <i className="fas fa-bullhorn text-fuchsia-500 text-2xl"></i>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Cupones Activos</p>
                <p className="text-2xl font-bold text-pink-600">{cupones.filter(c => c.activo).length}</p>
              </div>
              <i className="fas fa-ticket-alt text-pink-500 text-2xl"></i>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Campañas</p>
                <p className="text-2xl font-bold text-green-600">{campanas.length}</p>
              </div>
              <i className="fas fa-chart-line text-green-500 text-2xl"></i>
            </div>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Cupones</p>
                <p className="text-2xl font-bold text-blue-600">{cupones.length}</p>
              </div>
              <i className="fas fa-tags text-blue-500 text-2xl"></i>
            </div>
          </div>
        </div>

        {/* Acciones Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <i className="fas fa-percentage text-pink-600 mr-2"></i>
              Promociones
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => setMostrarModalCampana(true)}
                className="w-full bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700 transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>
                Nueva Promoción
              </button>
              <button 
                onClick={() => setMostrarListaCampanas(true)}
                className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <i className="fas fa-list mr-2"></i>
                Ver Todas
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <i className="fas fa-ticket-alt text-fuchsia-600 mr-2"></i>
              Cupones
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => setMostrarModalCupon(true)}
                className="w-full bg-fuchsia-600 text-white py-2 rounded-lg hover:bg-fuchsia-700 transition-colors"
              >
                <i className="fas fa-plus mr-2"></i>
                Crear Cupón
              </button>
              <button 
                onClick={() => setMostrarListaCupones(true)}
                className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <i className="fas fa-tags mr-2"></i>
                Gestionar Cupones
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <i className="fas fa-chart-bar text-blue-600 mr-2"></i>
              Analytics
            </h3>
            <div className="space-y-3">
              <button 
                onClick={() => setMostrarReportes(true)}
                className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                <i className="fas fa-chart-line mr-2"></i>
                Reportes
              </button>
              <button 
                onClick={exportarDatos}
                className="w-full border border-gray-300 py-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <i className="fas fa-download mr-2"></i>
                Exportar Datos
              </button>
            </div>
          </div>
        </div>

        {/* Campañas */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Campañas</h3>
          {cargando ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-fuchsia-600 mx-auto"></div>
            </div>
          ) : campanas.length > 0 ? (
            <div className="space-y-4">
              {campanas.map((campana) => (
                <div key={campana.id} className="border border-gray-200 rounded-lg p-4 hover:border-fuchsia-300 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">{campana.nombre}</h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleCampana(campana.id)}
                        className={`px-3 py-1 rounded-full text-sm cursor-pointer hover:opacity-80 ${
                          campana.estado === 'Activa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {campana.estado === 'Activa' ? 'Activa' : 'Pausada'}
                      </button>
                      <button
                        onClick={() => eliminarCampana(campana.id)}
                        className="px-3 py-1 rounded-full text-sm bg-red-100 text-red-800 hover:bg-red-200"
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{campana.descripcion}</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-500">Tipo:</span>
                      <p className="font-medium">{campana.tipo}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Presupuesto:</span>
                      <p className="font-medium text-blue-600">${campana.presupuesto?.toLocaleString()}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Conversiones:</span>
                      <p className="font-medium text-green-600">{campana.metricas?.conversiones || 0}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">CTR:</span>
                      <p className="font-medium text-purple-600">{campana.metricas?.ctr || 0}%</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-bullhorn text-4xl mb-3"></i>
              <p>No hay campañas disponibles</p>
              <button
                onClick={() => setMostrarModalCampana(true)}
                className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
              >
                Crear Primera Campaña
              </button>
            </div>
          )}
        </div>

        {/* Cupones */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Cupones</h3>
          {cargando ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-600 mx-auto"></div>
            </div>
          ) : cupones.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {cupones.map((cupon) => (
                <div key={cupon.id} className="border-2 border-dashed border-pink-300 rounded-lg p-4 bg-pink-50">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono font-bold text-pink-600">{cupon.codigo}</span>
                    <span className="bg-pink-600 text-white px-2 py-1 rounded text-xs">
                      {cupon.tipo === 'porcentaje' ? `${cupon.valor}%` : `$${cupon.valor}`}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{cupon.descripcion}</p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Usos: <strong>{cupon.usos_actuales}/{cupon.usos_maximos}</strong></span>
                    <button
                      onClick={() => toggleCupon(cupon.id)}
                      className={`px-2 py-1 rounded cursor-pointer hover:opacity-80 ${
                        cupon.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {cupon.activo ? 'Activo' : 'Inactivo'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <i className="fas fa-ticket-alt text-4xl mb-3"></i>
              <p>No hay cupones disponibles</p>
              <button
                onClick={() => setMostrarModalCupon(true)}
                className="mt-4 px-4 py-2 bg-pink-600 text-white rounded-lg hover:bg-pink-700"
              >
                Crear Primer Cupón
              </button>
            </div>
          )}
        </div>

        {/* Modal Crear Cupón */}
        {mostrarModalCupon && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Crear Nuevo Cupón</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Código</label>
                  <input
                    type="text"
                    value={nuevoCupon.codigo}
                    onChange={(e) => setNuevoCupon({...nuevoCupon, codigo: e.target.value.toUpperCase()})}
                    placeholder="VERANO2024"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <select
                    value={nuevoCupon.tipo}
                    onChange={(e) => setNuevoCupon({...nuevoCupon, tipo: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="porcentaje">Porcentaje</option>
                    <option value="fijo">Monto Fijo</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Valor</label>
                  <input
                    type="number"
                    value={nuevoCupon.valor}
                    onChange={(e) => setNuevoCupon({...nuevoCupon, valor: Number(e.target.value)})}
                    placeholder="20"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descripción</label>
                  <input
                    type="text"
                    value={nuevoCupon.descripcion}
                    onChange={(e) => setNuevoCupon({...nuevoCupon, descripcion: e.target.value})}
                    placeholder="Descuento de verano"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setMostrarModalCupon(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={crearCupon}
                  className="flex-1 bg-fuchsia-600 text-white py-2 rounded-lg hover:bg-fuchsia-700"
                >
                  Crear Cupón
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Ver Todas las Campañas */}
        {mostrarListaCampanas && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Todas las Campañas ({campanas.length})</h3>
                <button onClick={() => setMostrarListaCampanas(false)} className="text-gray-500 hover:text-gray-700">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              {campanas.length > 0 ? (
                <div className="space-y-3">
                  {campanas.map((c) => (
                    <div key={c.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <h4 className="font-semibold text-lg">{c.nombre}</h4>
                          <p className="text-sm text-gray-600 mt-1">{c.descripcion}</p>
                          <div className="flex gap-4 mt-2 text-sm">
                            <span className="text-gray-500">Tipo: <strong>{c.tipo}</strong></span>
                            <span className="text-gray-500">Presupuesto: <strong className="text-blue-600">${Number(c.presupuesto).toLocaleString()}</strong></span>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm ${
                          c.estado === 'Activa' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {c.estado}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No hay campañas disponibles</p>
              )}
            </div>
          </div>
        )}

        {/* Modal Gestionar Cupones */}
        {mostrarListaCupones && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">Gestionar Cupones ({cupones.length})</h3>
                <button onClick={() => setMostrarListaCupones(false)} className="text-gray-500 hover:text-gray-700">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              {cupones.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {cupones.map((c) => (
                    <div key={c.id} className="border-2 border-dashed border-pink-300 rounded-lg p-4 bg-pink-50">
                      <div className="flex justify-between items-start mb-2">
                        <span className="font-mono font-bold text-pink-600 text-lg">{c.codigo}</span>
                        <span className="bg-pink-600 text-white px-3 py-1 rounded">
                          {c.tipo === 'porcentaje' ? `${c.valor}%` : `$${c.valor}`}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-3">{c.descripcion}</p>
                      <div className="flex justify-between items-center text-sm">
                        <span className="text-gray-500">Usos: <strong>{c.usos_actuales || 0}/{c.usos_maximos || 100}</strong></span>
                        <button
                          onClick={() => toggleCupon(c.id)}
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            c.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {c.activo ? 'Activo' : 'Inactivo'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No hay cupones disponibles</p>
              )}
            </div>
          </div>
        )}

        {/* Modal Reportes */}
        {mostrarReportes && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-3xl w-full mx-4">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold">Reportes de Marketing</h3>
                <button onClick={() => setMostrarReportes(false)} className="text-gray-500 hover:text-gray-700">
                  <i className="fas fa-times text-xl"></i>
                </button>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-fuchsia-50 to-pink-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-700">Campañas</h4>
                    <i className="fas fa-bullhorn text-fuchsia-600 text-2xl"></i>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <strong className="text-gray-900">{campanas.length}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Activas:</span>
                      <strong className="text-green-600">{campanas.filter(c => c.estado === 'Activa').length}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Pausadas:</span>
                      <strong className="text-gray-600">{campanas.filter(c => c.estado !== 'Activa').length}</strong>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">Presupuesto Total:</span>
                      <strong className="text-blue-600">${campanas.reduce((sum, c) => sum + Number(c.presupuesto || 0), 0).toLocaleString()}</strong>
                    </div>
                  </div>
                </div>
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-semibold text-gray-700">Cupones</h4>
                    <i className="fas fa-ticket-alt text-pink-600 text-2xl"></i>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total:</span>
                      <strong className="text-gray-900">{cupones.length}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Activos:</span>
                      <strong className="text-green-600">{cupones.filter(c => c.activo).length}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Inactivos:</span>
                      <strong className="text-gray-600">{cupones.filter(c => !c.activo).length}</strong>
                    </div>
                    <div className="flex justify-between pt-2 border-t">
                      <span className="text-gray-600">Usos Totales:</span>
                      <strong className="text-purple-600">{cupones.reduce((sum, c) => sum + (c.usos_actuales || 0), 0)}</strong>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex gap-3">
                <button
                  onClick={exportarDatos}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  <i className="fas fa-download mr-2"></i>
                  Exportar Datos
                </button>
                <button
                  onClick={() => setMostrarReportes(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Crear Campaña */}
        {mostrarModalCampana && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4">Crear Nueva Campaña</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Nombre</label>
                  <input
                    type="text"
                    value={nuevaCampana.nombre}
                    onChange={(e) => setNuevaCampana({...nuevaCampana, nombre: e.target.value})}
                    placeholder="Black Friday 2024"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Descripción</label>
                  <textarea
                    value={nuevaCampana.descripcion}
                    onChange={(e) => setNuevaCampana({...nuevaCampana, descripcion: e.target.value})}
                    placeholder="Descuentos hasta 50%"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Tipo</label>
                  <select
                    value={nuevaCampana.tipo}
                    onChange={(e) => setNuevaCampana({...nuevaCampana, tipo: e.target.value})}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  >
                    <option value="descuento">Descuento</option>
                    <option value="email">Email Marketing</option>
                    <option value="social">Redes Sociales</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Presupuesto</label>
                  <input
                    type="number"
                    value={nuevaCampana.presupuesto}
                    onChange={(e) => setNuevaCampana({...nuevaCampana, presupuesto: Number(e.target.value)})}
                    placeholder="50000"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setMostrarModalCampana(false)}
                  className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={crearCampana}
                  className="flex-1 bg-pink-600 text-white py-2 rounded-lg hover:bg-pink-700"
                >
                  Crear Campaña
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
