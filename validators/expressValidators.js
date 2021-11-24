const { check, validationResult } = require("express-validator");
const Category = require("../models/category");
const Item = require("../models/item");

exports.itemFormValidator = [
  check("title")
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage("Title must not be empty!")
    .bail()
    .isLength({ min: 1 })
    .withMessage("Minimum 1 character required!")
    .bail()
    .isLength({ max: 20 })
    .withMessage("Maximum 20 characters allowed!")
    .bail(),
  check("description")
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage("Description must not be empty!")
    .bail()
    .isLength({ min: 1 })
    .withMessage("Minimum 1 character required!")
    .bail()
    .isLength({ max: 90 })
    .withMessage("Maximum 90 characters allowed!")
    .bail(),
  check("price")
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage("Price must not be empty!")
    .bail()
    .isFloat()
    .withMessage("Price must be a float number.")
    .bail()
    .isLength({ min: 1 })
    .withMessage("Minimum 1 number required!")
    .toFloat()
    .bail(),
  check("stock")
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage("Stock can not be empty!")
    .bail()
    .isInt()
    .withMessage("Stock must be an integrer.")
    .bail()
    .isLength({ min: 1 })
    .withMessage("Minimum 1 number required!")
    .toInt()
    .bail(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const category_id = req.params.category;
      const originalUrl = req.originalUrl;
      const split = originalUrl.split("/");
      const crud_operation = split[split.length - 1];

      // Create fields that will re-populate form
      const populate = {
        title: req.body.title,
        description: req.body.description,
        price: req.body.price,
        stock: req.body.stock,
      };

      let express_warnings = {};
      errors.errors.forEach((e) => {
        let field = e.param;
        let msg = e.msg;
        express_warnings[field] = msg;
      });

      if (crud_operation === "edit") {
        const item_id = req.params.item;

        const getCategory = Category.findById(category_id).exec();
        const getItem = Item.findById(item_id).exec();
        const getCategoryList = Category.find()
          .sort([["title", "ascending"]])
          .exec();

        Promise.all([getCategory, getItem, getCategoryList])
          .then(([category, item, category_list]) => {
            res.render("item_update", {
              title: `Edit ${item.title}`,
              category: category,
              category_list: category_list,
              item: item,
              populate: populate,
              express_warnings: express_warnings,
            });
          })
          .catch((err) => next(err));
      } else {
        Category.findById(category_id)
          .exec()
          .then((category) => {
            res.render("item_create", {
              title: "Create new item",
              category: category,
              populate: populate,
              express_warnings: express_warnings,
            });
          })
          .catch((err) => next(err));
      }
    } else {
      next();
    }
  },
];

exports.categoryFormValidator = [
  check("title")
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage("Title must not be empty!")
    .bail()
    .isLength({ min: 1 })
    .withMessage("Minimum 1 character required!")
    .bail()
    .isLength({ max: 20 })
    .withMessage("Maximum 20 characters allowed!")
    .bail(),
  check("description")
    .trim()
    .escape()
    .not()
    .isEmpty()
    .withMessage("Description must not be empty!")
    .bail()
    .isLength({ min: 1 })
    .withMessage("Minimum 1 character required!")
    .bail()
    .isLength({ max: 90 })
    .withMessage("Maximum 90 characters allowed!")
    .bail(),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const originalUrl = req.originalUrl;
      const split = originalUrl.split("/");
      const crud_operation = split[split.length - 1];

      // Create fields that will re-populate form
      const populate = {
        title: req.body.title,
        description: req.body.description,
      };

      let express_warnings = {};
      errors.errors.forEach((e) => {
        let field = e.param;
        let msg = e.msg;
        express_warnings[field] = msg;
      });

      if (crud_operation === "edit") {
        const category_id = req.params.category;
        Category.findById(category_id)
          .exec()
          .then((category) => {
            res.render("category_update", {
              title: `Editing ${category.title} category`,
              category: category,
              populate: populate,
              express_warnings: express_warnings,
            });
          })
          .catch((err) => next(err));
      } else {
        res.render("category_create", {
          title: "Create new category",
          populate: populate,
          express_warnings: express_warnings,
        });
      }
    } else {
      next();
    }
  },
];
