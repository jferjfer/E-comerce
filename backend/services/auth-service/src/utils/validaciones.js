const Joi = require('joi');

const esquemaRegistro = Joi.object({
  nombre: Joi.string().min(2).max(255).required(),
  apellido: Joi.string().optional(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  contrasena: Joi.string().min(6).optional(),
  documento_tipo: Joi.string().optional(),
  documento_numero: Joi.string().optional(),
  telefono: Joi.string().optional(),
  fecha_nacimiento: Joi.string().optional(),
  genero: Joi.string().allow('').optional(),
  direccion: Joi.string().optional(),
  ciudad: Joi.string().optional(),
  departamento: Joi.string().optional(),
  acepta_terminos: Joi.boolean().optional(),
  acepta_datos: Joi.boolean().optional(),
  acepta_marketing: Joi.boolean().optional(),
  rol: Joi.string().valid('cliente', 'invitado').default('cliente')
}).options({ allowUnknown: true, abortEarly: true, stripUnknown: true });

const esquemaInicioSesion = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Debe ser un email válido',
      'any.required': 'El email es requerido'
    }),
  
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'La contraseña es requerida'
    }),
  
  contrasena: Joi.string()
    .optional()
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