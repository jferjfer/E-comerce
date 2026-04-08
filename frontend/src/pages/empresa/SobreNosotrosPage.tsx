export default function SobreNosotrosPage() {
  return (
    <div className="min-h-screen bg-white">

      {/* Hero */}
      <div className="bg-gray-900 text-white py-20 px-4 text-center">
        <div className="max-w-2xl mx-auto">
          <p className="text-xs tracking-[6px] uppercase text-amber-400 mb-4">Nuestra Historia</p>
          <h1 className="text-4xl font-bold mb-4">Wear Your Truth</h1>
          <p className="text-gray-400 text-base leading-relaxed">
            EGOS nació en Bogotá con una convicción: la moda es una forma de decir quién eres sin abrir la boca.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-16 space-y-14 text-sm text-gray-700 leading-relaxed">

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">¿Quiénes somos?</h2>
          <p>
            Somos <strong>VERTEL & CATILLO S.A.S</strong>, una empresa colombiana de moda fundada en 2026 en Bogotá D.C.
            Operamos bajo la marca <strong>EGOS</strong>, una plataforma de comercio electrónico especializada en ropa,
            calzado y accesorios que celebran la identidad y la autenticidad de quienes los usan.
          </p>
          <p className="mt-3">
            Creemos que cada prenda cuenta una historia. Por eso trabajamos con diseñadores y proveedores colombianos
            que comparten nuestra visión: moda con propósito, calidad real y precios justos.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Nuestra Misión</h2>
          <p>
            Democratizar el acceso a moda de calidad en Colombia, conectando a personas con prendas que reflejen
            su verdadera identidad, a través de una experiencia de compra digital segura, ágil y personalizada.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Nuestra Visión</h2>
          <p>
            Ser la plataforma de moda colombiana de referencia en Latinoamérica para 2030, reconocida por la
            autenticidad de su propuesta, la confianza de sus clientes y el impacto positivo en la industria
            textil nacional.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Nuestros Valores</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { icon: '✨', titulo: 'Autenticidad', texto: 'Promovemos la expresión genuina a través de la moda.' },
              { icon: '🤝', titulo: 'Confianza', texto: 'Construimos relaciones transparentes con nuestros clientes.' },
              { icon: '🇨🇴', titulo: 'Orgullo colombiano', texto: 'Apoyamos el talento y la industria textil de Colombia.' },
              { icon: '♻️', titulo: 'Responsabilidad', texto: 'Avanzamos hacia prácticas más sostenibles y conscientes.' },
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
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Información Legal</h2>
          <div className="bg-gray-50 rounded-xl p-5 space-y-1">
            <p><strong>Razón social:</strong> VERTEL & CATILLO S.A.S</p>
            <p><strong>NIT:</strong> 902.051.708-6</p>
            <p><strong>Domicilio:</strong> Carrera 107 A Bis 69 B 58, Bogotá D.C., Colombia</p>
            <p><strong>Actividad principal:</strong> Comercio al por menor de prendas de vestir (CIIU 4771)</p>
            <p><strong>Régimen tributario:</strong> Régimen Simple de Tributación (SIMPLE)</p>
            <p><strong>Correo:</strong> servicioalcliente@egoscolombia.com</p>
          </div>
        </section>

      </div>
    </div>
  )
}
