var Category = require("../models/category");
var Item = require("../models/item");
var async = require("async");
var path = require("path");
var fs = require("fs");

// Edit a item
exports.item_edit_post = function (req, res, next) {
  res.send("edit request");
  // var split = req.url.split("/");
  // var id = split[split.length - 2];
  // var item;
  // async.series(
  //   [
  //     function (callback) {
  //       item = Item.findById(id).exec(callback);
  //       callback(null, item);
  //     },
  //     function (callback) {
  //       var imageTitle = item.title.toLowerCase().split(" ").join("");
  //       var imagePath = path.join(
  //         "/public/images/" + imageTitle + "_" + item.category + ".jpg"
  //       );
  //       // Delete image
  //       fs.unlink(imagePath, function (err) {
  //         if (err) {
  //           next(err);
  //         }
  //       });
  //       callback(null);
  //     },
  //     function (callback) {
  //       Item.findByIdAndRemove(item._id, function (err) {
  //         if (err) {
  //           return next(err);
  //         }
  //       }),
  //         callback(null);
  //     },
  //     function (callback) {
  //       Category.findById(item._id, function (err) {
  //         if (err) {
  //           return next(err);
  //         }
  //       }),
  //         callback(null, category);
  //     },
  //   ],
  //   function (err, results) {
  //     if (err) {
  //       return next(err);
  //     }
  //     // Success delete => redirect user to category.
  //     if (result.category) {
  //       res.redirect(
  //         "/category/" +
  //           category.title.toLowerCase().split(" ").join("") +
  //           item.category
  //       );
  //     }
  //   }
  // );
};

// Delete a item
exports.item_delete_post = function (req, res, next) {
  var item_id = req.body.id

  async.waterfall(
    [
      // Get item object
      function (callback) {
        Item.findById(item_id, function getItem(err, itemObj) {
          if (err) {
            return next(err);
          } else {
            callback(null, itemObj);
          }
        });
      },
      // Get category object
      function (itemObj, callback) {
        var categoryId = itemObj.category;

        Category.findById(categoryId, function getCategory(err, categoryObj) {
          if (err) {
            return next(err);
          } else {
            callback(null, itemObj, categoryObj);
          }
        });
      },
      // Delete image
      function (itemObj, categoryObj, callback) {
        var itemTitle = itemObj.title.toLowerCase().split(" ").join("");
        var categoryTitle = categoryObj.title.toLowerCase().split(" ").join("");
        var imgPath = path.join(
          "public/images/" + itemTitle + "_" + categoryTitle + ".jpg"
        );

        fs.unlink(imgPath, function (err) {
          if (err) {
            return next(err);
          } else {
            callback(null, itemObj, categoryObj);
          }
        });
      },
      // Delete item object
      function (itemObj, categoryObj, callback) {
        Item.findByIdAndRemove(itemObj._id, function deleteItem(err) {
          if (err) {
            return next(err);
          } else {
            callback(null, categoryObj);
          }
        });
      },
    ],
    function (err, categoryObj) {
      if (err) {
        return next(err);
      } else {
        res.redirect(categoryObj.url);
      }
    }
  );
};

// Create a new item
exports.item_create_get = function (req, res, next) {
  var category_id = req.params.id;
  // Get category object
  Category.findById(category_id, function getCategory(err, category_obj) {
    if (err) {
        return next(err);
    } else {
      res.render("create_item", {
        title: "Create new item",
        category: category_obj,
      });
    }
  });
};
