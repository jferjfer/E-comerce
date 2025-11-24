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

  async enviarRecuperacionContrasena(email, token, nombreUsuario) {
    const enlaceRecuperacion = `${process.env.FRONTEND_URL || 'http://localhost:3005'}/restablecer-contrasena?token=${token}`;
    
    const htmlCorreo = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Recuperación de Contraseña - Estilo y Moda</h2>
        <p>Hola ${nombreUsuario},</p>
        <p>Recibimos una solicitud para restablecer tu contraseña. Si no fuiste tú, puedes ignorar este correo.</p>
        <p>Para restablecer tu contraseña, haz clic en el siguiente enlace:</p>
        <a href="${enlaceRecuperacion}" 
           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Restablecer Contraseña
        </a>
        <p style="margin-top: 20px;">Este enlace expirará en 1 hora por seguridad.</p>
        <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
        <p style="word-break: break-all; color: #666;">${enlaceRecuperacion}</p>
        <hr style="margin: 30px 0;">
        <p style="color: #666; font-size: 12px;">
          Este es un correo automático, no respondas a este mensaje.<br>
          Estilo y Moda - Tu tienda de confianza
        </p>
      </div>
    `;

    const opciones = {
      from: `"Estilo y Moda" <${process.env.SMTP_USER}>`,
      to: email,
      subject: 'Recuperación de Contraseña - Estilo y Moda',
      html: htmlCorreo
    };

    return await this.transporter.sendMail(opciones);
  }
}

module.exports = new ServicioCorreo();