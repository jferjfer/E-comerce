const Joi = require('joi');

const esquemaAgregarProducto = Joi.object({
  id_producto: Joi.string()
    .required()
    .messages({
      'any.required': 'El ID del producto es requerido'
    }),
  
  cantidad: Joi.number()
    .integer()
    .min(1)
    .max(99)
    .default(1)
    .messages({
      'number.min': 'La cantidad debe ser al menos 1',
      'number.max': 'La cantidad no puede exceder 99'
    })
});

const esquemaActualizarCantidad = Joi.object({
  cantidad: Joi.number()
    .integer()
    .min(0)
    .max(99)
    .required()
    .messages({
      'number.min': 'La cantidad debe ser 0 o mayor',
      'number.max': 'La cantidad no puede exceder 99',
      'any.required': 'La cantidad es requerida'
    })
});

const esquemaCrearPedido = Joi.object({
  direccion_entrega: Joi.object({
    nombre: Joi.string().required(),
    direccion: Joi.string().required(),
    ciudad: Joi.string().required(),
    telefono: Joi.string().required()
  }).required(),
  
  metodo_pago: Joi.string()
    .valid('Tarjeta', 'PSE', 'Credito_Interno', 'Credito_Externo')
    .required()
    .messages({
      'any.only': 'Método de pago inválido'
    }),
  
  datos_pago: Joi.object().when('metodo_pago', {
    is: 'Tarjeta',
    then: Joi.object({
      numero_tarjeta: Joi.string().required(),
      nombre_titular: Joi.string().required(),
      fecha_expiracion: Joi.string().required(),
      cvv: Joi.string().required()
    }).required(),
    otherwise: Joi.object().optional()
  })
});

const validarAgregarProducto = (datos) => {
  return esquemaAgregarProducto.validate(datos, { abortEarly: false });
};

const validarActualizarCantidad = (datos) => {
  return esquemaActualizarCantidad.validate(datos, { abortEarly: false });
};

const validarCrearPedido = (datos) => {
  return esquemaCrearPedido.validate(datos, { abortEarly: false });
};

module.exports = {
  validarAgregarProducto,
  validarActualizarCantidad,
  validarCrearPedido
};