import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store/useAuthStore'

interface Devolucion {
  id: number
  id_pedido: string
  usuario_id: number
  razon: string
  estado: string
  fecha_creacion: string
  monto_pedido: number
  nombre_cliente: string
  email_cliente: string
}

export default function CustomerSuccessDashboard() {
  const [devoluciones, setDevoluciones] = useState<Devolucion[]>([])
  const [cargando, setCargando] = useState(true)
  const [procesando, setProcesando] = useState<number | null>(null)
  const { token } = useAuthStore()

  const cargarDevoluciones = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/devoluciones?estado=Solicitada', {
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

  const aprobar = async (id: number) => {
    if (!confirm('¿Aprobar esta devolución?')) return
    
    setProcesando(id)
    try {
      const response = await fetch(`http://localhost:3000/api/devoluciones/${id}/aprobar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ comentario: 'Aprobada por Customer Success' })
      })

      if (response.ok) {
        alert('Devolución aprobada')
        cargarDevoluciones()
      } else {
        alert('Error al aprobar')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al aprobar')
    } finally {
      setProcesando(null)
    }
  }

  const rechazar = async (id: number) => {
    const motivo = prompt('Motivo del rechazo:')
    if (!motivo) return

    setProcesando(id)
    try {
      const response = await fetch(`http://localhost:3000/api/devoluciones/${id}/rechazar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ motivo })
      })

      if (response.ok) {
        alert('Devolución rechazada')
        cargarDevoluciones()
      } else {
        alert('Error al rechazar')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error al rechazar')
    } finally {
      setProcesando(null)
    }
  }

  if (cargando) return <div className="p-8">Cargando...</div>

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Dashboard Customer Success</h1>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-gray-500 text-sm">Solicitadas</h3>
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
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
                  <td className="px-6 py-4 text-sm">{new Date(dev.fecha_creacion).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-sm space-x-2">
                    <button
                      onClick={() => aprobar(dev.id)}
                      disabled={procesando === dev.id}
                      className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700 disabled:opacity-50"
                    >
                      Aprobar
                    </button>
                    <button
                      onClick={() => rechazar(dev.id)}
                      disabled={procesando === dev.id}
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {devoluciones.length === 0 && (
            <div className="text-center py-12 text-gray-500">
              No hay devoluciones solicitadas
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
