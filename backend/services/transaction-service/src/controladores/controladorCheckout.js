const { v4: uuidv4 } = require('uuid');

const ControladorCheckout = {
    procesarCheckout: async (req, res) => {
        try {
            const { usuario, items, total, metodoPago } = req.body;

            // Validación básica
            if (!usuario || !items || items.length === 0) {
                return res.status(400).json({ error: 'Datos de pedido inválidos' });
            }

            console.log(`🛒 Procesando checkout para usuario ${usuario.email || 'Anónimo'}`);
            console.log(`💰 Total: ${total}, Método: ${metodoPago}`);

            // Simulación de procesamiento de pago (2 segundos)
            await new Promise(resolve => setTimeout(resolve, 2000));

            // Generar ID de orden único
            const orderId = `ORD-${uuidv4().substring(0, 8).toUpperCase()}`;
            const fecha = new Date().toISOString();

            // Aquí se guardaría en base de datos real
            // await PedidoModel.create({ ... })

            const respuesta = {
                mensaje: 'Pedido procesado exitosamente',
                orden: {
                    id: orderId,
                    fecha: fecha,
                    total: total,
                    estado: 'confirmado',
                    items_count: items.length,
                    metodo_pago: metodoPago
                }
            };

            console.log(`✅ Pedido ${orderId} creado exitosamente`);
            res.status(200).json(respuesta);

        } catch (error) {
            console.error('❌ Error en checkout:', error);
            res.status(500).json({ error: 'Error interno al procesar el pedido' });
        }
    }
};

module.exports = ControladorCheckout;
