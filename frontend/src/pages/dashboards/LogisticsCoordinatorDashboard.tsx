import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

interface Devolucion {
  id: number
  id_pedido: string
  usuario_id: number
  razon: string
  estado: string
  fecha_creacion: string
  fecha_actualizacion: string
  monto_pedido: number
  nombre_cliente: string
  email_cliente: string
}

export default function LogisticsCoordinatorDashboard() {
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState<number | null>(null)
  const { token } = useAuthStore()

  const cargarDevoluciones = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/devoluciones?estado=Aprobada', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      setDevoluciones(data.devoluciones || [])
    } catch (error) {
      console.error('Error cargando devoluciones:', error)
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargarDevoluciones()
  }, [])

  const completar = async (id: number) => {
    if (!confirm('¿Marcar esta devolución como completada?')) return
    
    setProcesando(id)
    try {
      const response = await fetch(`http://localhost:3000/api/devoluciones/${id}/completar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ comentario: 'Producto recibido y procesado' })
      })

      if (response.ok) {
        alert('Devolución completada')
        cargarDevoluciones()
      } else {
        alert('Error al completar')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al completar')
    } finally {
      setProcesando(null)
    }
  }

  if (cargando) return <div className="p-8">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard Logística</h1>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Aprobadas Pendientes</h3>
            <p className="text-3xl font-bold">{devoluciones.length}</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Razón</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aprobada</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {devoluciones.map((dev) => (
                <tr key={dev.id}>
                  <td className="px-6 py-4 text-sm">{dev.id}</td>
                  <td className="px-6 py-4 text-sm">
                    <div>{dev.nombre_cliente || 'N/A'}</div>
                    <div className="text-gray-500 text-xs">{dev.email_cliente}</div>
                  </td>
                  <td className="px-6 py-4 text-sm">{dev.razon}</td>
                  <td className="px-6 py-4 text-sm">${dev.monto_pedido?.toLocaleString()}</td>
                  <td className="px-6 py-4 text-sm">{new Date(dev.fecha_actualizacion).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => completar(dev.id)}
                      disabled={procesando === dev.id}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      Marcar Completada
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {devoluciones.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hay devoluciones aprobadas pendientes
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
