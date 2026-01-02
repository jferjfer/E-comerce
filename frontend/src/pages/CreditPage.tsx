import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import { useNavigate } from 'react-router-dom';

interface OpcionCredito {
  proveedor: string;
  tipo: string;
  disponible: boolean;
  tasa_mensual: number;
  cuota_mensual: number;
  interes_total: number;
  total_pagar: number;
  requisitos: string;
  estado_integracion?: string;
}

export default function CreditPage() {
  const { usuario, token } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [evaluacion, setEvaluacion] = useState<any>(null);
  const [monto, setMonto] = useState(1000000);
  const [plazo, setPlazo] = useState(6);
  const [opciones, setOpciones] = useState<OpcionCredito[]>([]);
  const [creditoAprobado, setCreditoAprobado] = useState<any>(null);

  useEffect(() => {
    if (!usuario) {
      navigate('/login');
      return;
    }
    evaluarCliente();
  }, [usuario]);

  const evaluarCliente = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/credito/evaluar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          usuario_id: usuario?.id,
          fecha_registro: usuario?.fecha_creacion || '2024-04-26T00:00:00',
          total_compras_historico: usuario?.total_compras_historico || 3500000,
          numero_compras: 7
        })
      });
      const data = await res.json();
      setEvaluacion(data);
    } catch (error) {
      console.error('Error evaluando cliente:', error);
    } finally {
      setLoading(false);
    }
  };

  const compararOpciones = async () => {
    setLoading(true);
    try {
      const url = evaluacion?.califica 
        ? `http://localhost:3000/api/credito/comparar/${monto}/${plazo}?usuario_id=${usuario?.id}`
        : `http://localhost:3000/api/credito/comparar/${monto}/${plazo}`;
      const res = await fetch(url);
      const data = await res.json();
      setOpciones(data.opciones);
    } catch (error) {
      console.error('Error comparando opciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const solicitarCredito = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/credito/interno/solicitar', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          usuario_id: usuario?.id,
          monto_solicitado: monto,
          plazo_meses: plazo
        })
      });
      const data = await res.json();
      setCreditoAprobado(data);
    } catch (error) {
      console.error('Error solicitando crédito:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (evaluacion) {
      compararOpciones();
    }
  }, [monto, plazo, evaluacion]);

  if (loading && !evaluacion) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Evaluando tu perfil...</p>
        </div>
      </div>
    );
  }

  if (evaluacion && !evaluacion.califica) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-6 mb-8">
            <div className="flex items-center">
              <div className="text-yellow-500 text-4xl mr-4">⚠️</div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">No calificas para Crédito Propio</h2>
                <p className="text-gray-700 mt-1">{evaluacion.razon}</p>
                <p className="text-sm text-gray-600 mt-2">Pero puedes solicitar con nuestros aliados ADDI o Sistecredito</p>
              </div>
            </div>
          </div>

          {/* Simulador */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Simula tu Crédito</h2>
            
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monto a Solicitar
                </label>
                <input
                  type="range"
                  min="500000"
                  max="5000000"
                  step="100000"
                  value={monto}
                  onChange={(e) => setMonto(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>$500K</span>
                  <span className="text-2xl font-bold text-blue-600">${(monto/1000000).toFixed(1)}M</span>
                  <span>$5M</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Plazo (meses)
                </label>
                <input
                  type="range"
                  min="3"
                  max="12"
                  step="3"
                  value={plazo}
                  onChange={(e) => setPlazo(Number(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-sm text-gray-600 mt-1">
                  <span>3</span>
                  <span className="text-2xl font-bold text-blue-600">{plazo} meses</span>
                  <span>12</span>
                </div>
              </div>
            </div>
          </div>

          {/* Opciones Externas */}
          <h3 className="text-xl font-bold text-gray-900 mb-4">Opciones Disponibles con Aliados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {opciones.map((opcion, index) => (
              <div key={index} className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-2">{opcion.proveedor}</h3>
                <p className="text-sm text-gray-600 mb-4">{opcion.tipo}</p>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cuota Mensual:</span>
                    <span className="font-bold text-lg">${opcion.cuota_mensual.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tasa:</span>
                    <span className="font-semibold">{opcion.tasa_mensual}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total a Pagar:</span>
                    <span className="font-semibold">${opcion.total_pagar.toLocaleString()}</span>
                  </div>
                </div>

                <button
                  disabled
                  className="w-full bg-gray-300 text-gray-500 py-2 rounded-lg font-semibold cursor-not-allowed"
                >
                  Próximamente
                </button>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-900 mb-2">¿Cómo calificar para Crédito Propio?</h3>
            <ul className="text-gray-700 space-y-2">
              <li>✓ Mínimo 6 meses con nosotros</li>
              <li>✓ Total de compras mayor a $1,000,000</li>
              <li>✓ Sin mora en pagos</li>
            </ul>
            <button
              onClick={() => navigate('/catalog')}
              className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
            >
              Ir al Catálogo
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (creditoAprobado?.aprobado) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="text-green-500 text-6xl mb-4">✅</div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">¡Crédito Aprobado!</h2>
              <p className="text-gray-600">{creditoAprobado.mensaje}</p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Monto Aprobado</p>
                <p className="text-2xl font-bold text-blue-600">${creditoAprobado.monto_aprobado.toLocaleString()}</p>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Cuota Mensual</p>
                <p className="text-2xl font-bold text-green-600">${creditoAprobado.cuota_mensual.toLocaleString()}</p>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Plazo</p>
                <p className="text-2xl font-bold text-purple-600">{creditoAprobado.plazo_meses} meses</p>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">Tasa Mensual</p>
                <p className="text-2xl font-bold text-orange-600">{creditoAprobado.tasa_mensual}%</p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-600">Interés Total:</span>
                <span className="font-semibold">${creditoAprobado.interes_total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-lg font-bold">
                <span>Total a Pagar:</span>
                <span className="text-blue-600">${creditoAprobado.total_pagar.toLocaleString()}</span>
              </div>
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => navigate('/checkout')}
                className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 font-semibold"
              >
                Usar Crédito Ahora
              </button>
              <button
                onClick={() => setCreditoAprobado(null)}
                className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 font-semibold"
              >
                Solicitar Otro
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">Solicitar Crédito</h1>

        {/* Perfil del Cliente */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Tu Perfil Crediticio</h2>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Límite Aprobado</p>
              <p className="text-2xl font-bold text-green-600">${evaluacion?.limite_aprobado.toLocaleString()}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Antigüedad</p>
              <p className="text-2xl font-bold text-blue-600">{evaluacion?.meses_antiguedad} meses</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Compras Totales</p>
              <p className="text-2xl font-bold text-purple-600">${evaluacion?.total_compras.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Simulador */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Simula tu Crédito</h2>
          
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Monto a Solicitar
              </label>
              <input
                type="range"
                min="500000"
                max={evaluacion?.limite_aprobado || 5000000}
                step="100000"
                value={monto}
                onChange={(e) => setMonto(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>$500K</span>
                <span className="text-2xl font-bold text-blue-600">${(monto/1000000).toFixed(1)}M</span>
                <span>${(evaluacion?.limite_aprobado/1000000).toFixed(1)}M</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Plazo (meses)
              </label>
              <input
                type="range"
                min="3"
                max="12"
                step="3"
                value={plazo}
                onChange={(e) => setPlazo(Number(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-gray-600 mt-1">
                <span>3</span>
                <span className="text-2xl font-bold text-blue-600">{plazo} meses</span>
                <span>12</span>
              </div>
            </div>
          </div>
        </div>

        {/* Opciones de Crédito */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {opciones.map((opcion, index) => (
            <div
              key={index}
              className={`bg-white rounded-lg shadow-lg p-6 ${
                index === 0 ? 'ring-2 ring-blue-500' : ''
              } ${!opcion.disponible ? 'opacity-60' : ''}`}
            >
              {index === 0 && (
                <div className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full inline-block mb-3">
                  MEJOR OPCIÓN
                </div>
              )}
              <h3 className="text-xl font-bold text-gray-900 mb-2">{opcion.proveedor}</h3>
              <p className="text-sm text-gray-600 mb-4">{opcion.tipo}</p>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-600">Cuota Mensual:</span>
                  <span className="font-bold text-lg">${opcion.cuota_mensual.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tasa:</span>
                  <span className="font-semibold">{opcion.tasa_mensual}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total a Pagar:</span>
                  <span className="font-semibold">${opcion.total_pagar.toLocaleString()}</span>
                </div>
              </div>

              <div className="bg-gray-50 p-3 rounded-lg mb-4">
                <p className="text-xs text-gray-600">{opcion.requisitos}</p>
              </div>

              {opcion.disponible ? (
                <button
                  onClick={opcion.proveedor === 'ESTILO_MODA' ? solicitarCredito : undefined}
                  disabled={loading || opcion.proveedor !== 'ESTILO_MODA'}
                  className={`w-full py-2 rounded-lg font-semibold ${
                    opcion.proveedor === 'ESTILO_MODA'
                      ? 'bg-blue-600 text-white hover:bg-blue-700'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  {opcion.proveedor === 'ESTILO_MODA' ? 'Solicitar' : 'Próximamente'}
                </button>
              ) : (
                <div className="text-center text-sm text-gray-500">
                  {opcion.estado_integracion}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
