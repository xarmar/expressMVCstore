var Category = require("../models/category");
// var async = require("async");
// const { body,validationResult } = require('express-validator');


// Display list of all Categories.
exports.category_list = function (req, res, next) {
  Category.find()
    .sort([["title", "ascending"]])
    .exec(function (err, list_categories) {
      if (err) {
        return next(err);
      }
      //Successful, so render
      res.render("category_list", {
        title: "All Categories",
        category_list: list_categories,
      });
    });
};

// Display only one category.
exports.display_category = function (req, res, next) {
  Category.find( {  } )
    .sort([["title", "ascending"]])
    .exec(function (err, list_categories) {
      if (err) {
        return next(err);
      }
      //Successful, so render
      res.render("category_list", {
        title: "All Categories",
        category_list: list_categories,
      });
    });
};


exports.display_category = function (req, res, next) {
  var split = req.url.split('/');
  var id = split[split.length - 1];
  Category.findById(id, function (err, found_category) {
    if (err) {
      return next(err);
    }
    res.render("display_category", {
      category: found_category
    });
});
}