var Category = require("../models/category");
var Item = require("../models/item");
var async = require("async");


// Display list of all Categories.
exports.category_list_get = function (req, res, next) {
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

// Display a category and all it's items
exports.category_get = function (req, res, next) {
  var split = req.url.split('/');
  var id = split[split.length - 1];
  async.parallel({
    found_category: function(callback) {
      Category.findById(id)
      .exec(callback);
    },
    items: function(callback) {
      Item.find({category: id}).exec(callback);
    },
  },
  function(err, results) {
    if(err) {
      return next(err)
    }
    res.render("display_category", {
      category: results.found_category,
      items: results.items,
    });
  });
};