const Joi = require('joi');

const esquemaResena = Joi.object({
  id_producto: Joi.string().required().messages({
    'any.required': 'El ID del producto es requerido'
  }),
  calificacion: Joi.number().integer().min(1).max(5).required().messages({
    'number.min': 'La calificación debe ser entre 1 y 5',
    'number.max': 'La calificación debe ser entre 1 y 5',
    'any.required': 'La calificación es requerida'
  }),
  comentario: Joi.string().max(1000).optional().messages({
    'string.max': 'El comentario no puede exceder 1000 caracteres'
  }),
  imagenes: Joi.array().items(Joi.string()).max(5).optional().messages({
    'array.max': 'Máximo 5 imágenes permitidas'
  })
});

const esquemaPregunta = Joi.object({
  id_producto: Joi.string().required().messages({
    'any.required': 'El ID del producto es requerido'
  }),
  texto_pregunta: Joi.string().min(10).max(500).required().messages({
    'string.min': 'La pregunta debe tener al menos 10 caracteres',
    'string.max': 'La pregunta no puede exceder 500 caracteres',
    'any.required': 'El texto de la pregunta es requerido'
  })
});

const esquemaRespuesta = Joi.object({
  texto_respuesta: Joi.string().min(5).max(1000).required().messages({
    'string.min': 'La respuesta debe tener al menos 5 caracteres',
    'string.max': 'La respuesta no puede exceder 1000 caracteres',
    'any.required': 'El texto de la respuesta es requerido'
  })
});

const validarResena = (datos) => {
  return esquemaResena.validate(datos, { abortEarly: false });
};

const validarPregunta = (datos) => {
  return esquemaPregunta.validate(datos, { abortEarly: false });
};

const validarRespuesta = (datos) => {
  return esquemaRespuesta.validate(datos, { abortEarly: false });
};

module.exports = {
  validarResena,
  validarPregunta,
  validarRespuesta
};