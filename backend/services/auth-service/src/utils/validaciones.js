const Joi = require('joi');

const esquemaRegistro = Joi.object({
  nombre: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.max': 'El nombre no puede exceder 255 caracteres',
      'any.required': 'El nombre es requerido'
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Debe ser un email válido',
      'any.required': 'El email es requerido'
    }),
  
  contrasena: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#\$%\^&\*])'))
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 8 caracteres',
      'string.pattern.base': 'La contraseña debe contener al menos: 1 minúscula, 1 mayúscula, 1 número y 1 carácter especial',
      'any.required': 'La contraseña es requerida'
    }),
  
  rol: Joi.string()
    .valid('cliente', 'invitado')
    .default('cliente')
});

const esquemaInicioSesion = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Debe ser un email válido',
      'any.required': 'El email es requerido'
    }),
  
  contrasena: Joi.string()
    .required()
    .messages({
      'any.required': 'La contraseña es requerida'
    })
});

const validarRegistro = (datos) => {
  return esquemaRegistro.validate(datos, { abortEarly: false });
};

const validarInicioSesion = (datos) => {
  return esquemaInicioSesion.validate(datos, { abortEarly: false });
};

const sanitizarEntrada = (datos) => {
  if (typeof datos === 'string') {
    return datos.trim().replace(/<script[^>]*>.*?<\/script>/gi, '');
  }
  if (typeof datos === 'object' && datos !== null) {
    const sanitizado = {};
    for (const [clave, valor] of Object.entries(datos)) {
      sanitizado[clave] = sanitizarEntrada(valor);
    }
    return sanitizado;
  }
  return datos;
};

module.exports = {
  validarRegistro,
  validarInicioSesion,
  sanitizarEntrada
};