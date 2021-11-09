const {check, validationResult} = require('express-validator');

exports.itemFormValidator = [
  check('title')
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage('Title can not be empty!')
    .bail()
    .isLength({min: 1})
    .withMessage('Minimum 1 character required!')
    .bail()
    .isLength({max: 20})
    .withMessage('Maximum 20 characters!')
    .bail(),
  check('description')
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage('Description can not be empty!')
    .bail()
    .isLength({min: 1})
    .withMessage('Minimum 1 character required!')
    .bail()
    .isLength({max: 30})
    .withMessage('Maximum 30 characters!')
    .bail(),
  check('price')
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage('Price can not be empty!')
    .bail()
    .isLength({min: 1})
    .withMessage('Minimum 1 number required!')
    .toFloat()
    .bail(),
  check('stock')
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage('Stock can not be empty!')
    .bail()
    .isLength({min: 1})
    .withMessage('Minimum 1 number required!')
    .toInt()
    .bail(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(422).json({errors: errors.array()});
    next();
  },
];