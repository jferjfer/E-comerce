export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Cookies</h1>
        <p className="text-sm text-gray-400 mb-10">Última actualización: marzo 2026</p>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">¿Qué son las cookies?</h2>
            <p>Las cookies son pequeños archivos de texto que se almacenan en su dispositivo cuando visita un sitio web. Nos permiten recordar sus preferencias, mantener su sesión activa y mejorar su experiencia de navegación.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Cookies que utilizamos</h2>
            <div className="space-y-4">
              <div className="border border-gray-100 rounded-lg p-4">
                <p className="font-semibold text-gray-800 mb-1">🔒 Cookies Esenciales</p>
                <p>Necesarias para el funcionamiento del sitio. Incluyen su sesión de usuario (token JWT), el contenido de su carrito de compras y preferencias de seguridad. No pueden desactivarse.</p>
              </div>
              <div className="border border-gray-100 rounded-lg p-4">
                <p className="font-semibold text-gray-800 mb-1">📊 Cookies de Rendimiento</p>
                <p>Nos ayudan a entender cómo los usuarios interactúan con el sitio (páginas visitadas, tiempo de navegación). La información es anónima y se usa para mejorar la plataforma.</p>
              </div>
              <div className="border border-gray-100 rounded-lg p-4">
                <p className="font-semibold text-gray-800 mb-1">🎯 Cookies de Funcionalidad</p>
                <p>Recuerdan sus preferencias como idioma, talla habitual y productos vistos recientemente para personalizar su experiencia.</p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">¿Cómo gestionar las cookies?</h2>
            <p>Puede configurar su navegador para rechazar o eliminar cookies. Sin embargo, desactivar las cookies esenciales puede afectar el funcionamiento del sitio, incluyendo el inicio de sesión y el carrito de compras.</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Chrome:</strong> Configuración → Privacidad y seguridad → Cookies</li>
              <li><strong>Firefox:</strong> Opciones → Privacidad y seguridad</li>
              <li><strong>Safari:</strong> Preferencias → Privacidad</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Contacto</h2>
            <p>Para consultas sobre nuestra política de cookies: servicioalcliente@egoscolombia.com</p>
          </section>

        </div>
      </div>
    </div>
  )
}
