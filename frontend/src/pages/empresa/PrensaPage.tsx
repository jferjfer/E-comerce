export default function PrensaPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <p className="text-5xl mb-6">📰</p>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">Prensa</h1>
        <p className="text-gray-500 leading-relaxed">
          ¿Eres periodista o medio de comunicación y quieres hablar sobre EGOS? Nos encantaría contarte nuestra historia.
        </p>
        <a
          href="mailto:servicioalcliente@egoscolombia.com?subject=Solicitud%20de%20prensa%20-%20EGOS"
          className="inline-flex items-center gap-2 mt-6 bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
        >
          <i className="fas fa-envelope"></i>
          Contactar al equipo
        </a>
        <p className="mt-3 text-xs text-gray-400">servicioalcliente@egoscolombia.com</p>
      </div>
    </div>
  )
}
