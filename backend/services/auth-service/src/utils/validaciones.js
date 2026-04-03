const Joi = require('joi');

const esquemaRegistro = Joi.object({
  nombre: Joi.string()
    .min(2).max(100)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/)
    .required()
    .messages({
      'string.min': 'El nombre debe tener al menos 2 caracteres',
      'string.pattern.base': 'El nombre solo puede contener letras',
      'any.required': 'El nombre es requerido'
    }),

  apellido: Joi.string()
    .min(2).max(100)
    .pattern(/^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/)
    .optional()
    .messages({
      'string.min': 'El apellido debe tener al menos 2 caracteres',
      'string.pattern.base': 'El apellido solo puede contener letras'
    }),

  email: Joi.string().email().required()
    .messages({
      'string.email': 'Debe ser un email válido',
      'any.required': 'El email es requerido'
    }),

  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/)
    .required()
    .messages({
      'string.min': 'La contraseña debe tener al menos 8 caracteres',
      'string.pattern.base': 'La contraseña debe tener al menos una mayúscula, un número y un carácter especial',
      'any.required': 'La contraseña es requerida'
    }),

  confirmar_password: Joi.string().optional(),
  contrasena: Joi.string().min(8).optional(),

  documento_tipo: Joi.string()
    .valid('CC', 'CE', 'TI', 'PP', 'NIT')
    .optional(),

  documento_numero: Joi.string()
    .pattern(/^[0-9]{5,12}$/)
    .optional()
    .messages({
      'string.pattern.base': 'El documento debe tener entre 5 y 12 dígitos numéricos'
    }),

  telefono: Joi.string()
    .pattern(/^[0-9+\s\-]{7,15}$/)
    .optional()
    .messages({
      'string.pattern.base': 'El teléfono debe tener entre 7 y 15 dígitos'
    }),

  fecha_nacimiento: Joi.string()
    .optional()
    .custom((value, helpers) => {
      if (!value) return value;
      const fecha = new Date(value);
      const hoy = new Date();
      const edad = hoy.getFullYear() - fecha.getFullYear();
      const cumpleEsteAno = new Date(hoy.getFullYear(), fecha.getMonth(), fecha.getDate());
      const edadReal = hoy >= cumpleEsteAno ? edad : edad - 1;
      if (edadReal < 18) {
        return helpers.error('any.invalid');
      }
      if (fecha > hoy) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .messages({
      'any.invalid': 'Debes ser mayor de 18 años y la fecha no puede ser futura'
    }),

  genero: Joi.string().allow('').optional(),
  direccion: Joi.string().allow('').optional(),
  barrio: Joi.string().allow('').optional(),
  ciudad: Joi.string().allow('').optional(),
  departamento: Joi.string().allow('').optional(),

  acepta_terminos: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'Debes aceptar los términos y condiciones',
      'any.required': 'Debes aceptar los términos y condiciones'
    }),

  acepta_datos: Joi.boolean()
    .valid(true)
    .required()
    .messages({
      'any.only': 'Debes autorizar el tratamiento de datos personales',
      'any.required': 'Debes autorizar el tratamiento de datos personales'
    }),

  acepta_marketing: Joi.boolean().optional(),
  rol: Joi.string().valid('cliente', 'invitado').default('cliente')
}).options({ allowUnknown: true, abortEarly: false, stripUnknown: true });

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