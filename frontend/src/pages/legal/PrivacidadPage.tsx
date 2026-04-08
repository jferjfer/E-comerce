export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Privacidad y Tratamiento de Datos</h1>
        <p className="text-sm text-gray-400 mb-10">Última actualización: marzo 2026 — Ley 1581 de 2012</p>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Responsable del Tratamiento</h2>
            <p><strong>VERTEL & CATILLO S.A.S</strong> — NIT 902.051.708-6<br />Carrera 107 A Bis 69 B 58, Bogotá D.C., Colombia<br />📧 servicioalcliente@egoscolombia.com</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Datos que Recopilamos</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Nombre completo y documento de identidad</li>
              <li>Correo electrónico y número de teléfono</li>
              <li>Dirección de envío y ciudad</li>
              <li>Historial de compras y preferencias de navegación</li>
              <li>Información de pago (procesada de forma segura por la pasarela de pagos, no almacenamos datos de tarjetas)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Finalidad del Tratamiento</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>Procesar y gestionar sus pedidos y pagos</li>
              <li>Enviar notificaciones sobre el estado de su pedido</li>
              <li>Cumplir obligaciones legales y fiscales (facturación electrónica DIAN)</li>
              <li>Mejorar la experiencia de usuario en la plataforma</li>
              <li>Enviar comunicaciones comerciales, solo si el usuario otorgó su consentimiento expreso</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Base Legal del Tratamiento</h2>
            <p>El tratamiento de sus datos se realiza con base en:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Su consentimiento expreso al momento del registro</li>
              <li>La ejecución del contrato de compraventa</li>
              <li>El cumplimiento de obligaciones legales (Ley 1480 de 2011, Estatuto Tributario)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Derechos del Titular</h2>
            <p>De conformidad con la Ley 1581 de 2012, usted tiene derecho a:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Conocer</strong> los datos que tenemos sobre usted</li>
              <li><strong>Actualizar</strong> sus datos cuando sean inexactos o incompletos</li>
              <li><strong>Rectificar</strong> información errónea</li>
              <li><strong>Suprimir</strong> sus datos cuando no sean necesarios para la finalidad que motivó su recolección (derecho al olvido)</li>
              <li><strong>Revocar</strong> el consentimiento para el tratamiento</li>
              <li><strong>Presentar quejas</strong> ante la Superintendencia de Industria y Comercio (SIC)</li>
            </ul>
            <p className="mt-2">Para ejercer estos derechos, escríbanos a servicioalcliente@egoscolombia.com con el asunto <em>"Derechos HABEAS DATA"</em>. Responderemos en un plazo máximo de 15 días hábiles.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. Transferencia de Datos a Terceros</h2>
            <p>Sus datos podrán ser compartidos únicamente con:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Empresas de transporte y logística para la entrega de pedidos</li>
              <li>Pasarelas de pago para procesar transacciones</li>
              <li>La DIAN para efectos de facturación electrónica</li>
              <li>Proveedores de servicios tecnológicos bajo estrictos acuerdos de confidencialidad</li>
            </ul>
            <p className="mt-2">No vendemos ni cedemos sus datos personales a terceros con fines comerciales.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Seguridad de los Datos</h2>
            <p>Implementamos medidas técnicas y organizativas para proteger sus datos contra acceso no autorizado, pérdida o alteración, incluyendo cifrado SSL/TLS, autenticación con JWT y almacenamiento seguro en servidores certificados.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">8. Vigencia</h2>
            <p>Sus datos serán conservados durante el tiempo necesario para cumplir las finalidades descritas y las obligaciones legales aplicables. Una vez cumplidas, procederemos a su eliminación segura.</p>
          </section>

        </div>
      </div>
    </div>
  )
}
