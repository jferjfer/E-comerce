const axios = require('axios');

const testCheckout = async () => {
    console.log('🧪 PRUEBA DE CHECKOUT REAL\n');

    try {
        // 1. Verificar salud del servicio
        console.log('🔍 Verificando servicio...');
        try {
            await axios.get('http://localhost:3003/api/pagos', { timeout: 2000 });
            // Nota: /api/pagos devuelve 401 si no hay token, o 200 si es público (en este caso es placeholder)
            // Pero si responde, el servicio está vivo.
        } catch (e) {
            if (e.code === 'ECONNREFUSED') {
                throw new Error('El servicio de transacciones (puerto 3003) no está corriendo.');
            }
        }
        console.log('✅ Servicio de transacciones accesible');

        // 2. Simular Checkout Directo
        console.log('\n💳 Enviando solicitud de checkout...');

        const payload = {
            usuario: { id: '1', email: 'test@demo.com' },
            items: [{ id: '1', nombre: 'Producto Test', precio: 100, cantidad: 1 }],
            total: 100,
            metodoPago: 'contado'
        };

        const response = await axios.post('http://localhost:3003/api/checkout', payload);

        console.log('✅ Respuesta recibida:', response.status);
        console.log('📦 Datos:', JSON.stringify(response.data, null, 2));

        if (response.data.orden && response.data.orden.id) {
            console.log('\n🎉 ¡PRUEBA EXITOSA! Se generó una orden real.');
        } else {
            console.error('\n⚠️ La respuesta no contiene ID de orden.');
        }

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        if (error.response) {
            console.error('Datos error:', error.response.data);
        }
    }
};

testCheckout();
