export default function DevolucionesPage() {
  return (
    <div className="min-h-screen bg-white py-16 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Política de Devoluciones y Cambios</h1>
        <p className="text-sm text-gray-400 mb-10">Última actualización: marzo 2026 — Ley 1480 de 2011</p>

        <div className="space-y-8 text-sm text-gray-700 leading-relaxed">

          <section className="bg-gray-50 border border-gray-200 rounded-xl p-5">
            <p className="font-semibold text-gray-800 mb-1">📋 Resumen rápido</p>
            <ul className="space-y-1">
              <li>✅ <strong>5 días hábiles</strong> para retracto en compras online (obligatorio por ley)</li>
              <li>✅ <strong>30 días</strong> para devoluciones por producto defectuoso o error en el pedido</li>
              <li>✅ <strong>15 días</strong> para cambios de talla o color (cortesía EGOS)</li>
              <li>✅ <strong>1 año</strong> de garantía legal por defectos de fabricación</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">1. Derecho de Retracto (Ley 1480 de 2011 — Art. 47)</h2>
            <p>Por ser una compra realizada a través de internet (comercio electrónico), usted tiene derecho a retractarse de la compra dentro de los <strong>5 días hábiles</strong> siguientes a la entrega del producto, sin necesidad de dar ninguna explicación.</p>
            <p className="mt-2">Para ejercer este derecho, el producto debe ser devuelto en las mismas condiciones en que fue recibido: sin usar, sin lavar, con todas las etiquetas originales y en su empaque original.</p>
            <p className="mt-2">Una vez recibido el producto y verificado su estado, realizaremos el reembolso total dentro de los <strong>30 días calendario</strong> siguientes, por el mismo medio de pago utilizado.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">2. Casos en que NO aplica el Retracto</h2>
            <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2">
              <p className="font-semibold text-red-800">El derecho de retracto NO aplica en los siguientes casos:</p>
              <ul className="list-disc pl-5 space-y-1 text-red-700">
                <li>Productos que hayan sido <strong>usados, lavados o alterados</strong> después de la entrega</li>
                <li><strong>Ropa interior, vestidos de baño y productos de higiene personal</strong> por razones sanitarias</li>
                <li>Productos <strong>personalizados o hechos a medida</strong> según especificaciones del cliente</li>
                <li>Productos con <strong>etiquetas removidas</strong> o sin su empaque original</li>
                <li>Compras realizadas en <strong>tienda física</strong> (aplica solo para comercio electrónico)</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">3. Devoluciones por Producto Defectuoso o Error en el Pedido</h2>
            <p>Si recibió un producto con defecto de fabricación, dañado durante el transporte, o diferente al que ordenó, tiene <strong>30 días calendario</strong> desde la entrega para solicitar la devolución o cambio.</p>
            <p className="mt-2">En estos casos, EGOS asume el costo del envío de devolución y le enviará el producto correcto o realizará el reembolso total, según su preferencia.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">4. Cambios de Talla o Color (Cortesía EGOS)</h2>
            <p>Entendemos que elegir la talla correcta en línea puede ser difícil. Por eso, como cortesía, aceptamos cambios de talla o color dentro de los <strong>15 días calendario</strong> siguientes a la entrega, siempre que:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>El producto esté sin usar, sin lavar y con todas sus etiquetas</li>
              <li>Haya disponibilidad de la talla o color solicitado</li>
              <li>El producto no sea ropa interior, vestido de baño ni artículo personalizado</li>
            </ul>
            <p className="mt-2">El costo del envío de devolución en cambios por talla o color es asumido por el cliente.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">5. Garantía Legal (Ley 1480 de 2011 — Art. 58)</h2>
            <p>Todos nuestros productos cuentan con <strong>1 año de garantía legal</strong> contra defectos de fabricación (costuras defectuosas, materiales de mala calidad, suela despegada, etc.).</p>
            <p className="mt-2">La garantía no cubre el desgaste normal por uso, daños causados por mal uso o accidentes.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">6. ¿Cómo solicitar una Devolución?</h2>
            <ol className="list-decimal pl-5 space-y-2">
              <li>Ingrese a su cuenta en egoscolombia.com.co</li>
              <li>Vaya a <strong>Mis Pedidos</strong> y seleccione el pedido</li>
              <li>Haga clic en <strong>"Solicitar devolución"</strong> e indique el motivo</li>
              <li>Nuestro equipo de Customer Success revisará su solicitud en máximo <strong>2 días hábiles</strong></li>
              <li>Si es aprobada, recibirá instrucciones para el envío del producto</li>
              <li>Una vez recibido y verificado, procesaremos el reembolso o cambio</li>
            </ol>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">7. Contacto</h2>
            <p>Para dudas sobre devoluciones:<br />📧 servicioalcliente@egoscolombia.com<br />📞 301 787 9852 — 314 811 3593<br />Lunes a viernes, 8:00 AM – 6:00 PM</p>
          </section>

        </div>
      </div>
    </div>
  )
}
