const async = require("async");
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
      let category_id = req.params.category;
      let originalUrl = req.originalUrl;
      let split = originalUrl.split("/");
      let crud_operation = split[split.length - 1];

      // Create fields that will re-populate form
      let populate = {
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
        let item_id = req.params.item;

        async.parallel(
          {
            // Get category object
            category: function (callback) {
              Category.findById(category_id).exec(callback);
            },
            // Get item object
            item: function (callback) {
              Item.findById(item_id).exec(callback);
            },
            // Get category list
            category_list: function (callback) {
              Category.find()
                .sort([["title", "ascending"]])
                .exec(callback);
            },
          },
          function (err, results) {
            if (err) {
              return next(err);
            } else {
              // Redirect to original Url
              res.render("item_update", {
                title: `Edit ${results.item.title}`,
                category: results.category,
                category_list: results.category_list,
                item: results.item,
                populate: populate,
                express_warnings: express_warnings,
              });
            }
          }
        );
      } else {
        Category.findById(category_id).exec(function (err, category) {
          if (err) {
            return next(err);
          } else {
            res.render("item_create", {
              title: "Create new item",
              category: category,
              populate: populate,
              express_warnings: express_warnings,
            });
          }
        });
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
      let originalUrl = req.originalUrl;
      let split = originalUrl.split("/");
      let crud_operation = split[split.length - 1];

      // Create fields that will re-populate form
      let populate = {
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
        let category_id = req.params.category;
        Category.findById(category_id).exec(function (err, category) {
          if (err) {
            return next(err);
          } else {
            res.render("category_update", {
              title: `Editing ${category.title} category`,
              category: category,
              populate: populate,
              express_warnings: express_warnings,
            });
          }
        });
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
