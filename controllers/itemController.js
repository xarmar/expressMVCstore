var Category = require("../models/category");
var Item = require("../models/item");
var async = require("async");
var path = require("path");
var fs = require("fs");
var formidable = require('formidable');

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



// Render view for creating new item
exports.item_create_get = function (req, res, next) {
  var category_id = req.params.category;

  Category.findById(category_id).exec(function(err, category) {
    if(err) {
      return next(err)
    }
    else {
      // Successful, so render.
      res.render("create_item", {
        title: "Create new item",
        category: category,
      });
    }
  });
}
// Creates a new item
exports.item_create_post = function (req, res, next) {
  var title;
  var description;
  var price;
  var stock;
  var categoryId;
  var image;

  var formData = new formidable.IncomingForm();
  formData.parse(req, function(err, fields, files) {
    if (err) {
      return next(err);
    }
    else {
      // Get form fields
      title = fields.title;
      description = fields.description;
      price = fields.price;
      stock = fields.stock;
      categoryId = fields.categoryId;
      image = files.image;

      async.waterfall(
        [
          // 1 - Find category
          function (callback) {
            Category.findById(categoryId, function getCategory(err, categoryObj) {
              if (err) {
                return next(err);
              } else {
                callback(null, categoryObj);
              }
            });
          },
          // 2 - Create item object
          function (categoryObj, callback) {
            
            var imgUrl = `/images/${title.toLowerCase().split(" ").join("")}_${categoryObj.machine_title}.jpg`

            // Prepare Item object
            var newItem = new Item({
                title: title,
                description: description,
                price: price,
                stock: stock,
                category: categoryId,
                imgUrl: imgUrl
              }
            )
            // Save Item Object in Database
            newItem.save(function (err, itemObj) {
              if (err) {
                return next(err);            
              }
              else {
                callback(null, categoryObj, itemObj)
              }
            });
          },
          // 3 - Save image in Server
          function (categoryObj, itemObj, callback) {
            var targetPath = `public/images/${itemObj.machine_title}_${categoryObj.machine_title}.jpg`;
            
            // Move image from 'temp' path to permanent public/images path
            fs.rename(image.filepath, targetPath, function (err) {
              if (err) {
                err
              }
              else {
                callback(null, categoryObj)
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
      )
    }
  });
}

// Render view for editing an item
exports.item_edit_get = function (req, res, next) {
  var category_id = req.params.category;
  var item_id = req.params.item;

  async.parallel(
    {
      // Get category object
      category: function (callback) {
        Category.findById(category_id).exec(callback);
      },
      // Get category object
      item: function (callback) {
        Item.findById(item_id).exec(callback);
      },
      // Get category list
      category_list: function (callback) {
        Category.find().sort([["title", "ascending"]]).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      else {
        // Successful, so render.
        res.render("edit_item", {
          title: "Edit your item",
          category: results.category,
          category_list: results.category_list,
          item: results.item
        });
      }
    }
  );
}

// TODO- item_edit_post

// Render view for deleting an item
exports.item_delete_get = function (req, res, next) {
  var category_id = req.params.category;
  var item_id = req.params.item;

  async.parallel(
    {
      // Get category object
      category: function (callback) {
        Category.findById(category_id).exec(callback);
      },
      // Get category object
      item: function (callback) {
        Item.findById(item_id).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      else {
        // Successful, so render.
        res.render("delete_item", {
          title: "Delete your item",
          category: results.category,
          item: results.item
        });
      }
    }
  );
}
// Delete an item
exports.item_delete_post = function (req, res, next) {
  var item_id = req.params.item;
  var category_id = req.params.category;

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
        Category.findById(category_id, function getCategory(err, categoryObj) {
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