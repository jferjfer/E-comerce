const { v4: uuidv4 } = require('uuid');
const Pedido = require('../modelos/Pedido');

const ControladorCheckout = {
    procesarCheckout: async (req, res) => {
        try {
            const { usuario, items, total, metodoPago } = req.body;

            // Validación básica
            if (!usuario || !items || items.length === 0) {
                return res.status(400).json({ error: 'Datos de pedido inválidos' });
            }

            // Validar que solo clientes puedan realizar compras
            if (usuario.rol !== 'cliente') {
                return res.status(403).json({
                    error: 'Acceso denegado',
                    mensaje: 'Solo los clientes pueden realizar compras'
                });
            }

            console.log(`🛒 Procesando checkout para usuario ${usuario.email || 'Anónimo'}`);
            console.log(`💰 Total: ${total}, Método: ${metodoPago}`);

            // Crear el pedido en la base de datos
            // El estado inicial será 'Confirmado' ya que asumimos pago exitoso por ahora
            const nuevoPedido = await Pedido.crear(usuario.id, 'Confirmado', total);

            if (!nuevoPedido) {
                throw new Error('No se pudo crear el pedido en la base de datos');
            }

            console.log(`✅ Pedido creado en BD con ID: ${nuevoPedido.id}`);

            // Agregar los productos al pedido
            const promesasProductos = items.map(item => {
                return Pedido.agregarProducto(
                    nuevoPedido.id,
                    item.id,
                    item.cantidad,
                    item.precio
                );
            });

            await Promise.all(promesasProductos);
            console.log(`📦 ${items.length} productos agregados al pedido`);

            // Si se proporcionó un método de pago, podríamos guardarlo en una tabla de pagos futura
            // Por ahora, el flujo asume que el pago fue procesado (simulado o real en frontend)

            const respuesta = {
                mensaje: 'Pedido procesado exitosamente',
                orden: {
                    id: nuevoPedido.id,
                    fecha: nuevoPedido.fecha_creacion,
                    total: nuevoPedido.total,
                    estado: nuevoPedido.estado,
                    items_count: items.length,
                    metodo_pago: metodoPago
                }
            };

            res.status(200).json(respuesta);

        } catch (error) {
            console.error('❌ Error en checkout:', error);
            res.status(500).json({ error: 'Error interno al procesar el pedido' });
        }
    }
};

module.exports = ControladorCheckout;
