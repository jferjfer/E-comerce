const nodemailer = require('nodemailer');

// Configuración Hostinger SSL puerto 465
const crearTransporter = (user, pass) => nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.hostinger.com',
  port: parseInt(process.env.SMTP_PORT) || 465,
  secure: true, // Puerto 465 = SSL directo
  auth: { user, pass }
});

class ServicioCorreo {
  // ventas@ — correos comerciales: bienvenida, bonos, confirmaciones de compra
  get transporterVentas() {
    return crearTransporter(
      process.env.SMTP_USER_VENTAS || 'ventas@egoscolombia.com.co',
      process.env.SMTP_PASS_VENTAS || ''
    );
  }

  // servicioalcliente@ — correos operativos: facturas, recuperación contraseña, credenciales
  get transporterServicio() {
    return crearTransporter(
      process.env.SMTP_USER || 'servicioalcliente@egoscolombia.com.co',
      process.env.SMTP_PASS || ''
    );
  }

  async enviarCorreo(opciones, tipoRemitente = 'servicio') {
    const transporter = tipoRemitente === 'ventas'
      ? this.transporterVentas
      : this.transporterServicio;
    const remitente = tipoRemitente === 'ventas'
      ? (process.env.SMTP_USER_VENTAS || 'ventas@egoscolombia.com.co')
      : (process.env.SMTP_USER || 'servicioalcliente@egoscolombia.com.co');
    return await transporter.sendMail({
      from: `"EGOS Colombia" <${remitente}>`,
      ...opciones
    });
  }

  async enviarBienvenida(email, nombreUsuario) {
    const urlTienda = process.env.FRONTEND_URL || 'https://egoscolombia.com.co';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 0;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">¡Bienvenido a EGOS!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Tu tienda de moda favorita</p>
        </div>
        <div style="background: white; padding: 40px 30px;">
          <p style="font-size: 16px; color: #333;">Hola <strong>${nombreUsuario}</strong>,</p>
          <p style="color: #555; line-height: 1.6;">
            Tu cuenta ha sido creada exitosamente. Ahora puedes explorar nuestro catálogo, 
            guardar tus favoritos y realizar compras con total seguridad.
          </p>
          <div style="background: #f0f4ff; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0; color: #444; font-weight: bold;">¿Qué puedes hacer ahora?</p>
            <ul style="color: #555; margin: 10px 0 0; padding-left: 20px; line-height: 1.8;">
              <li>Explorar más de 100 productos de moda</li>
              <li>Guardar tus prendas favoritas</li>
              <li>Usar nuestro asistente de IA para recomendaciones</li>
              <li>Probar ropa con nuestro avatar 3D</li>
            </ul>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${urlTienda}" 
               style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
              Ir a la Tienda
            </a>
          </div>
        </div>
        <div style="background: #f0f0f0; padding: 20px 30px; text-align: center;">
          <p style="color: #888; font-size: 12px; margin: 0;">
            Este es un correo automático, no respondas a este mensaje.<br>
            EGOS — Wear Your Truth
          </p>
        </div>
      </div>
    `;

    return await this.enviarCorreo({
      to: email,
      subject: '¡Bienvenido a EGOS! 🎉',
      html
    }, 'servicio'); // servicioalcliente@ envía bienvenidas
  }

  async enviarConfirmacionCompra(email, nombreUsuario, pedido) {
    const urlTienda = process.env.FRONTEND_URL || 'https://egoscolombia.com.co';
    const urlPedidos = `${urlTienda}/orders`;

    const formatearPrecio = (valor) =>
      new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(valor);

    const productosHtml = (pedido.productos || []).map(p => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee; color: #555;">
          Producto #${p.id}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center; color: #555;">
          ${p.cantidad}
        </td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right; color: #333; font-weight: bold;">
          ${formatearPrecio(p.precio * p.cantidad)}
        </td>
      </tr>
    `).join('');

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 0;">
        <div style="background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); padding: 40px 30px; text-align: center;">
          <div style="font-size: 48px; margin-bottom: 10px;">✅</div>
          <h1 style="color: white; margin: 0; font-size: 26px;">¡Pedido Confirmado!</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0; font-size: 14px;">Pedido #${pedido.id}</p>
        </div>
        <div style="background: white; padding: 40px 30px;">
          <p style="font-size: 16px; color: #333;">Hola <strong>${nombreUsuario}</strong>,</p>
          <p style="color: #555; line-height: 1.6;">
            Tu pedido ha sido recibido y está siendo procesado. 
            Te notificaremos cuando sea enviado.
          </p>

          <div style="background: #f8f8f8; border-radius: 8px; padding: 20px; margin: 24px 0;">
            <p style="margin: 0 0 12px; font-weight: bold; color: #333;">Resumen del pedido</p>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background: #eee;">
                  <th style="padding: 10px; text-align: left; font-size: 12px; color: #666; text-transform: uppercase;">Producto</th>
                  <th style="padding: 10px; text-align: center; font-size: 12px; color: #666; text-transform: uppercase;">Cant.</th>
                  <th style="padding: 10px; text-align: right; font-size: 12px; color: #666; text-transform: uppercase;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${productosHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 14px 10px; font-weight: bold; color: #333; font-size: 16px;">Total</td>
                  <td style="padding: 14px 10px; text-align: right; font-weight: bold; color: #11998e; font-size: 18px;">
                    ${formatearPrecio(pedido.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div style="background: #fff8e1; border-left: 4px solid #ffc107; padding: 16px; border-radius: 4px; margin: 20px 0;">
            <p style="margin: 0; color: #555; font-size: 14px;">
              <strong>Método de pago:</strong> ${pedido.metodo_pago || 'Tarjeta'}<br>
              <strong>Estado:</strong> Creado — en preparación<br>
              <strong>Fecha:</strong> ${new Date().toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${urlPedidos}" 
               style="background: linear-gradient(135deg, #11998e, #38ef7d); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
              Ver Mis Pedidos
            </a>
          </div>
        </div>
        <div style="background: #f0f0f0; padding: 20px 30px; text-align: center;">
          <p style="color: #888; font-size: 12px; margin: 0;">
            Este es un correo automático, no respondas a este mensaje.<br>
            EGOS — Wear Your Truth
          </p>
        </div>
      </div>
    `;

    return await this.enviarCorreo({
      to: email,
      subject: `✅ Pedido #${pedido.id} confirmado — EGOS`,
      html
    }, 'ventas'); // ventas@ envía confirmaciones de compra
  }

  async enviarCredencialesEmpleado(email, nombre, rol, password) {
    const urlTienda = process.env.FRONTEND_URL || 'https://egoscolombia.com.co';

    const rolesNombres = {
      rrhh: 'Recursos Humanos', contador: 'Contador', ceo: 'CEO',
      customer_success: 'Customer Success', logistics_coordinator: 'Coordinador Logístico',
      marketing_manager: 'Gerente de Marketing', product_manager: 'Gestor de Productos',
      support_agent: 'Agente de Soporte', seller_premium: 'Vendedor Premium'
    };
    const rolNombre = rolesNombres[rol] || rol;

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9">
        <div style="background:#111827;padding:40px 30px;text-align:center">
          <h1 style="color:#c5a47e;margin:0;font-size:28px;letter-spacing:8px">EGOS</h1>
          <p style="color:rgba(255,255,255,0.7);margin:8px 0 0;font-size:12px">Wear Your Truth</p>
        </div>
        <div style="background:white;padding:40px 30px">
          <p style="font-size:16px;color:#333">Hola <strong>${nombre}</strong>,</p>
          <p style="color:#555;line-height:1.6">
            Has sido registrado en el sistema EGOS como <strong>${rolNombre}</strong>.
            A continuación encontrarás tus credenciales de acceso:
          </p>
          <div style="background:#f8f8f8;border-radius:8px;padding:24px;margin:24px 0;border-left:4px solid #c5a47e">
            <p style="margin:0 0 8px;color:#666;font-size:13px">Email de acceso:</p>
            <p style="margin:0 0 16px;font-size:16px;font-weight:bold;color:#111">${email}</p>
            <p style="margin:0 0 8px;color:#666;font-size:13px">Contraseña temporal:</p>
            <p style="margin:0;font-size:20px;font-weight:bold;color:#c5a47e;font-family:monospace;letter-spacing:3px">${password}</p>
          </div>
          <p style="color:#e74c3c;font-size:13px">
            ⚠️ Por seguridad, cambia tu contraseña en tu primer inicio de sesión.
          </p>
          <div style="text-align:center;margin:30px 0">
            <a href="${urlTienda}/login" style="background:#111827;color:#c5a47e;padding:14px 32px;text-decoration:none;border-radius:4px;font-size:14px;font-weight:bold;letter-spacing:2px;display:inline-block">
              INICIAR SESIÓN
            </a>
          </div>
        </div>
        <div style="background:#f0f0f0;padding:20px 30px;text-align:center">
          <p style="color:#888;font-size:12px;margin:0">
            Este es un correo automático, no respondas a este mensaje.<br>
            EGOS — Wear Your Truth
          </p>
        </div>
      </div>
    `;

    return await this.enviarCorreo({
      to: email,
      subject: `👤 Bienvenido al equipo EGOS — Tus credenciales de acceso`,
      html
    }, 'servicio'); // servicioalcliente@ envía credenciales internas
  }

  async enviarBonoBienvenida(email, nombreUsuario, codigo, porcentaje, fechaVencimiento) {
    const urlTienda = process.env.FRONTEND_URL || 'https://egoscolombia.com.co';
    const fechaStr = fechaVencimiento.toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' });
    const nombreCorto = (nombreUsuario || 'Cliente').split(' ')[0];

    const html = `
      <div style="font-family:'Helvetica Neue',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff">
        <div style="background:#111827;padding:36px 40px;text-align:center">
          <div style="font-size:36px;font-weight:900;color:#c5a47e;letter-spacing:-2px">E</div>
          <div style="font-size:20px;font-weight:700;color:#ffffff;letter-spacing:10px;text-transform:uppercase">EGOS</div>
          <div style="font-size:10px;color:#c5a47e;letter-spacing:4px;margin-top:2px;text-transform:uppercase">Wear Your Truth</div>
        </div>
        <div style="background:linear-gradient(135deg,#c5a47e,#a67c52);padding:40px;text-align:center">
          <div style="font-size:52px;margin-bottom:12px">🎁</div>
          <h1 style="color:#111827;margin:0;font-size:26px;font-weight:900">
            ¡Bienvenido ${nombreCorto}!
          </h1>
          <p style="color:#111827;margin:10px 0 0;font-size:14px;opacity:0.8">
            Tienes un regalo esperándote
          </p>
        </div>
        <div style="padding:40px">
          <p style="font-size:17px;color:#111827;margin:0 0 16px">
            Hola <strong>${nombreCorto}</strong> 👋
          </p>
          <p style="font-size:14px;color:#6b7280;line-height:1.7;margin:0 0 28px">
            Gracias por unirte a la familia EGOS. Para celebrar tu llegada, 
            te regalamos un <strong>${porcentaje}% de descuento</strong> en tu primera compra.
          </p>
          <div style="background:#111827;border-radius:16px;padding:32px;text-align:center;margin-bottom:28px">
            <p style="margin:0 0 8px;font-size:12px;color:#c5a47e;letter-spacing:3px;text-transform:uppercase">Tu bono de bienvenida</p>
            <p style="margin:0 0 4px;font-size:42px;font-weight:900;color:#c5a47e">${porcentaje}%</p>
            <p style="margin:0 0 24px;font-size:12px;color:#9ca3af">descuento en tu primera compra</p>
            <div style="background:#1f2937;border-radius:10px;padding:16px;display:inline-block;min-width:260px">
              <p style="margin:0 0 6px;font-size:11px;color:#9ca3af;letter-spacing:2px">CÓDIGO DE BONO</p>
              <p style="margin:0;font-size:22px;font-weight:900;color:#ffffff;font-family:monospace;letter-spacing:4px">${codigo}</p>
            </div>
            <p style="margin:16px 0 0;font-size:12px;color:#6b7280">
              ⏰ Válido hasta el <strong style="color:#c5a47e">${fechaStr}</strong>
            </p>
          </div>
          <div style="background:#faf8f5;border-radius:12px;padding:24px;margin-bottom:28px;border:1px solid #f0ebe4">
            <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#111827">¿Cómo usar tu bono?</p>
            <p style="margin:0 0 8px;font-size:13px;color:#6b7280">1. Elige los productos que quieras</p>
            <p style="margin:0 0 8px;font-size:13px;color:#6b7280">2. Ve al carrito y selecciona tu método de pago</p>
            <p style="margin:0;font-size:13px;color:#6b7280">3. Ingresa el código <strong style="color:#111827;font-family:monospace">${codigo}</strong> y se descuenta el ${porcentaje}% automáticamente</p>
          </div>
          <div style="text-align:center">
            <a href="${urlTienda}" style="display:inline-block;background:#c5a47e;color:#111827;padding:16px 40px;text-decoration:none;border-radius:8px;font-size:15px;font-weight:700;letter-spacing:1px">
              Ir a la Tienda
            </a>
          </div>
        </div>
        <div style="background:#111827;padding:28px 40px;text-align:center">
          <p style="margin:0 0 8px;font-size:11px;color:#c5a47e;letter-spacing:3px;text-transform:uppercase">EGOS — Wear Your Truth</p>
          <p style="margin:0;font-size:11px;color:#6b7280">Este bono es personal e intransferible · egoscolombia.com.co</p>
        </div>
      </div>
    `;

    return await this.enviarCorreo({
      to: email,
      subject: `🎁 ¡${nombreCorto}, tienes un ${porcentaje}% de descuento en tu primera compra! — EGOS`,
      html
    }, 'servicio'); // servicioalcliente@ envía bonos
  }

  async enviarRecuperacionContrasena(email, token, nombreUsuario) {
    const enlaceRecuperacion = `${process.env.FRONTEND_URL || 'https://egoscolombia.com.co'}/restablecer-contrasena?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Recuperación de Contraseña</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">EGOS</p>
        </div>
        <div style="background: white; padding: 40px 30px;">
          <p style="font-size: 16px; color: #333;">Hola <strong>${nombreUsuario}</strong>,</p>
          <p style="color: #555; line-height: 1.6;">
            Recibimos una solicitud para restablecer tu contraseña. 
            Si no fuiste tú, puedes ignorar este correo.
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${enlaceRecuperacion}" 
               style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 14px 32px; text-decoration: none; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
              Restablecer Contraseña
            </a>
          </div>
          <p style="color: #888; font-size: 13px;">Este enlace expirará en <strong>1 hora</strong>.</p>
          <p style="color: #888; font-size: 12px; word-break: break-all;">
            Si el botón no funciona, copia este enlace: ${enlaceRecuperacion}
          </p>
        </div>
        <div style="background: #f0f0f0; padding: 20px 30px; text-align: center;">
          <p style="color: #888; font-size: 12px; margin: 0;">
            Este es un correo automático, no respondas a este mensaje.<br>
            EGOS — Wear Your Truth
          </p>
        </div>
      </div>
    `;

    return await this.enviarCorreo({
      to: email,
      subject: 'Recuperación de Contraseña — EGOS',
      html
    }, 'servicio'); // servicioalcliente@ envía recuperación
  }
}

module.exports = new ServicioCorreo();
