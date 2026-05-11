const { v4: uuidv4 } = require('uuid');
const Pedido = require('../modelos/Pedido');

const ControladorCheckout = {
    procesarCheckout: async (req, res) => {
        try {
            const { usuario, items, total, metodoPago, descuento_bono = 0, codigo_bono = null } = req.body;

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
            console.log(`💰 Total: ${total}, Método: ${metodoPago}${descuento_bono > 0 ? `, Bono: -$${descuento_bono}` : ''}`);

            let totalFinal = total;

            // Validar y aplicar bono si existe
            if (codigo_bono && descuento_bono > 0) {
                console.log(`🎁 Validando bono ${codigo_bono} para usuario ${usuario.id}`);
                
                try {
                    const CREDIT_SERVICE_URL = process.env.CREDIT_SERVICE_URL || 'http://credit-service:3008';
                    const axios = require('axios');
                    
                    // Validar bono con credit-service
                    const validacion = await axios.post(`${CREDIT_SERVICE_URL}/api/bonos/validar`, {
                        codigo: codigo_bono,
                        usuario_id: usuario.id
                    }, { timeout: 5000 });

                    if (!validacion.data.valido) {
                        return res.status(400).json({ 
                            error: 'Bono no válido', 
                            razon: validacion.data.razon 
                        });
                    }

                    // Verificar que el monto del bono coincide
                    if (validacion.data.monto !== descuento_bono) {
                        return res.status(400).json({ 
                            error: 'Monto de bono no coincide',
                            mensaje: `El bono tiene un valor de $${validacion.data.monto}, no $${descuento_bono}`
                        });
                    }

                    // Aplicar descuento verificado
                    totalFinal = Math.max(0, total - validacion.data.monto);
                    console.log(`✅ Bono validado: -$${validacion.data.monto} | Total final: $${totalFinal}`);

                } catch (error) {
                    console.error('❌ Error validando bono:', error.message);
                    return res.status(400).json({ 
                        error: 'No se pudo validar el bono',
                        mensaje: 'Intenta nuevamente o continúa sin el bono'
                    });
                }
            }

            // Crear el pedido en la base de datos con el total descontado
            const nuevoPedido = await Pedido.crear(usuario.id, 'Confirmado', totalFinal, descuento_bono, codigo_bono);

            if (!nuevoPedido) {
                throw new Error('No se pudo crear el pedido en la base de datos');
            }

            console.log(`✅ Pedido creado en BD con ID: ${nuevoPedido.id} | Total: $${totalFinal}`);

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

            // Marcar bono como usado si existe
            if (codigo_bono && descuento_bono > 0) {
                try {
                    const CREDIT_SERVICE_URL = process.env.CREDIT_SERVICE_URL || 'http://credit-service:3008';
                    const axios = require('axios');
                    
                    await axios.post(`${CREDIT_SERVICE_URL}/api/bonos/aplicar`, {
                        codigo: codigo_bono,
                        usuario_id: usuario.id,
                        pedido_id: nuevoPedido.id
                    }, { timeout: 5000 });

                    console.log(`🎁 Bono ${codigo_bono} marcado como usado en pedido ${nuevoPedido.id}`);
                } catch (error) {
                    console.error('⚠️ Error marcando bono como usado:', error.message);
                    // No bloqueamos el flujo si falla esto
                }
            }

            const respuesta = {
                mensaje: 'Pedido procesado exitosamente',
                orden: {
                    id: nuevoPedido.id,
                    fecha: nuevoPedido.fecha_creacion,
                    total: nuevoPedido.total,
                    total_original: total,
                    descuento_bono: descuento_bono,
                    codigo_bono: codigo_bono,
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
