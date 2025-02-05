const { body, validationResult } = require('express-validator');

// Validation middleware for profile creation/update
const validateProfile = [
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .matches(/^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/)
    .withMessage('El nombre solo puede contener letras'),
  
  body('apellido')
    .trim()
    .notEmpty()
    .withMessage('El apellido es requerido')
    .matches(/^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/)
    .withMessage('El apellido solo puede contener letras'),
  
  body('sexo')
    .trim()
    .notEmpty()
    .withMessage('El sexo es requerido')
    .isIn(['M', 'F', 'O'])
    .withMessage('El sexo debe ser M, F o O'),
  
  body('documento')
    .trim()
    .notEmpty()
    .withMessage('El documento es requerido')
    .matches(/^[0-9XYZ][0-9]{7}[A-Z]$|^[A-Z][0-9]{8}$/)
    .withMessage('Formato de documento inválido'),
  
  body('fechaNacimiento')
    .trim()
    .notEmpty()
    .withMessage('La fecha de nacimiento es requerida')
    .isISO8601()
    .withMessage('Formato de fecha inválido'),
  
  body('telefono')
    .trim()
    .notEmpty()
    .withMessage('El teléfono es requerido')
    .matches(/^[0-9]{9}$/)
    .withMessage('El teléfono debe tener 9 dígitos'),
  
  body('email')
    .trim()
    .notEmpty()
    .withMessage('El email es requerido')
    .isEmail()
    .withMessage('Email inválido'),
  
  // Validation result middleware
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

module.exports = {
  validateProfile
};
