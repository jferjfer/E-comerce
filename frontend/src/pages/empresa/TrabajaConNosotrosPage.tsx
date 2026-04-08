export default function TrabajaConNosotrosPage() {
  const email = 'servicioalcliente@egoscolombia.com'
  const asunto = 'Quiero trabajar en EGOS'

  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="bg-gray-900 text-white py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs tracking-[6px] uppercase text-amber-400 mb-4">Únete al equipo</p>
          <h1 className="text-4xl font-bold mb-4">Trabaja con Nosotros</h1>
          <p className="text-gray-400 text-base leading-relaxed">
            Buscamos personas apasionadas por la moda, la tecnología y el servicio al cliente que quieran construir algo grande desde Colombia.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16 space-y-12 text-sm text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">¿Por qué EGOS?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: '🚀', titulo: 'Startup en crecimiento', texto: 'Somos una empresa joven con visión grande. Aquí tu trabajo tiene impacto real desde el primer día.' },
              { icon: '🇨🇴', titulo: 'Hecho en Colombia', texto: 'Trabajamos con orgullo desde Bogotá, construyendo tecnología y moda para el mundo.' },
              { icon: '💡', titulo: 'Innovación constante', texto: 'Usamos IA, microservicios y tecnología de punta. Siempre hay algo nuevo que aprender.' },
              { icon: '🤝', titulo: 'Equipo humano', texto: 'Valoramos a las personas. Creemos en el trabajo en equipo, la honestidad y el respeto.' },
            ].map((v, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4">
                <p className="text-2xl mb-2">{v.icon}</p>
                <p className="font-semibold text-gray-900 mb-1">{v.titulo}</p>
                <p className="text-gray-500">{v.texto}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">¿Cómo aplicar?</h2>
          <p>
            Actualmente no tenemos vacantes publicadas, pero siempre estamos abiertos a conocer personas talentosas.
            Si te apasiona la moda, el comercio electrónico, el servicio al cliente o la tecnología, escríbenos.
          </p>
          <p className="mt-3">
            Envíanos tu hoja de vida y cuéntanos en pocas líneas por qué quieres ser parte de EGOS.
          </p>
          <a
            href={`mailto:${email}?subject=${encodeURIComponent(asunto)}`}
            className="inline-flex items-center gap-2 mt-6 bg-gray-900 text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-700 transition-colors"
          >
            <i className="fas fa-envelope"></i>
            Enviar mi hoja de vida
          </a>
          <p className="mt-3 text-gray-400 text-xs">
            📧 {email}
          </p>
        </section>

      </div>
    </div>
  )
}
