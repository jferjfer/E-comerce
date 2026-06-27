import { API_URL } from '@/config/api';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import EgosLogo from '@/components/EgosLogo';

const RecoverPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [mensaje, setMensaje] = useState('');
  const [cargando, setCargando] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const manejarEnvio = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setMensaje('');
    try {
      const respuesta = await fetch(`${API_URL}/api/auth/solicitar-recuperacion`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const datos = await respuesta.json();
      if (respuesta.ok) {
        setEnviado(true);
      } else {
        setMensaje(datos.error || 'Error al procesar la solicitud');
      }
    } catch {
      setMensaje('Error de conexión. Intenta de nuevo.');
    } finally {
      setCargando(false);
    }
  };

  if (enviado) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="flex justify-center mb-10">
            <EgosLogo size="md" showSlogan />
          </div>
          <div className="bg-white rounded-2xl p-8 text-center space-y-4 shadow-xl">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
              <i className="fas fa-envelope-open text-emerald-600 text-2xl"></i>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Revisa tu correo</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Si el correo existe en nuestra base de datos, recibirás un enlace para restablecer tu contraseña. Revisa también la carpeta de spam.
            </p>
            <Link
              to="/login"
              className="block w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors text-sm mt-2"
              style={{ color: '#c5a47e' }}
            >
              Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="flex justify-center mb-10">
          <EgosLogo size="md" showSlogan />
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-xl space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Recuperar contraseña</h2>
            <p className="text-gray-500 text-sm mt-1">
              Ingresa tu email y te enviaremos un enlace
            </p>
          </div>

          <form onSubmit={manejarEnvio} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Correo electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
              />
            </div>

            {mensaje && (
              <p className="text-red-600 text-sm text-center">{mensaje}</p>
            )}

            <button
              type="submit"
              disabled={cargando}
              className="w-full bg-gray-900 text-white py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 text-sm"
              style={{ color: '#c5a47e' }}
            >
              {cargando ? 'Enviando...' : 'Enviar enlace de recuperación'}
            </button>
          </form>

          <div className="text-center">
            <Link to="/login" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              ← Volver al inicio de sesión
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecoverPasswordPage;
