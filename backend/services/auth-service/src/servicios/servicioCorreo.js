const nodemailer = require('nodemailer');

class ServicioCorreo {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER || 'tu-email@gmail.com',
        pass: process.env.SMTP_PASS || 'tu-app-password'
      }
    });
  }

  async enviarCorreo(opciones) {
    return await this.transporter.sendMail({
      from: `"Estilo y Moda" <${process.env.SMTP_USER}>`,
      ...opciones
    });
  }

  async enviarBienvenida(email, nombreUsuario) {
    const urlTienda = process.env.FRONTEND_URL || 'http://localhost:3005';

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 0;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">¡Bienvenido a Estilo y Moda!</h1>
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
            Estilo y Moda — Tu tienda de confianza
          </p>
        </div>
      </div>
    `;

    return await this.enviarCorreo({
      to: email,
      subject: '¡Bienvenido a Estilo y Moda! 🎉',
      html
    });
  }

  async enviarConfirmacionCompra(email, nombreUsuario, pedido) {
    const urlTienda = process.env.FRONTEND_URL || 'http://localhost:3005';
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
            Estilo y Moda — Tu tienda de confianza
          </p>
        </div>
      </div>
    `;

    return await this.enviarCorreo({
      to: email,
      subject: `✅ Pedido #${pedido.id} confirmado — Estilo y Moda`,
      html
    });
  }

  async enviarRecuperacionContrasena(email, token, nombreUsuario) {
    const enlaceRecuperacion = `${process.env.FRONTEND_URL || 'http://localhost:3005'}/restablecer-contrasena?token=${token}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Recuperación de Contraseña</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Estilo y Moda</p>
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
            Estilo y Moda — Tu tienda de confianza
          </p>
        </div>
      </div>
    `;

    return await this.enviarCorreo({
      to: email,
      subject: 'Recuperación de Contraseña — Estilo y Moda',
      html
    });
  }
}

module.exports = new ServicioCorreo();
