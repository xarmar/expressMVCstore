var Category = require("../models/category");
var Item = require("../models/item");
var async = require("async");
var path = require("path");
var fs = require("fs");
var formidable = require("formidable");

// Render view for creating new item
exports.item_create_get = function (req, res, next) {
  var category_id = req.params.category;

  Category.findById(category_id).exec(function (err, category) {
    if (err) {
      return next(err);
    } else {
      // Successful, so render.
      res.render("item_create", {
        title: "Create new item",
        category: category,
      });
    }
  });
};
// Creates a new item
exports.item_create_post = function (req, res, next) {
  var title;
  var description;
  var price;
  var stock;
  var categoryId;
  var image;

  var formData = new formidable.IncomingForm();
  formData.parse(req, function (err, fields, files) {
    if (err) {
      return next(err);
    } else {
      // Get form fields
      title = fields.title;
      description = fields.description;
      price = fields.price;
      stock = fields.stock;
      categoryId = fields.categoryId;
      image = files.image;

      // Declare valid extensions of image
      let fileType = files.image.mimetype;
      let validExts = ["jpg", "jpeg", "png"];

      // If NO image was uploaded OR uploaded image has valid extension => accept and render new item in list
      if (
        image.size === 0 ||
        validExts.some((ext) => fileType.replace("image/", "") === ext)
      ) {
        async.waterfall(
          [
            // 1 - Find category
            function (callback) {
              Category.findById(
                categoryId,
                function getCategory(err, categoryObj) {
                  if (err) {
                    return next(err);
                  } else {
                    callback(null, categoryObj);
                  }
                }
              );
            },
            // 2 - Create item object
            function (categoryObj, callback) {
              var imgUrl = `/images/${title
                .toLowerCase()
                .split(" ")
                .join("")}_${categoryObj.machine_title}.jpg`;

              // Prepare Item object
              var newItem = new Item({
                title: title,
                description: description,
                price: price,
                stock: stock,
                category: categoryId,
                imgUrl: imgUrl,
              });
              // Save Item Object in Database
              newItem.save(function (err, itemObj) {
                if (err) {
                  return next(err);
                } else {
                  callback(null, categoryObj, itemObj);
                }
              });
            },
            // 3 - Save image in Server
            function (categoryObj, itemObj, callback) {
              // If a image was uploaded, save it
              if (image.size > 0) {
                var targetPath = `public/images/${itemObj.machine_title}_${categoryObj.machine_title}.jpg`;
                // Move image from 'temp' path to permanent public/images path
                fs.rename(image.filepath, targetPath, function (err) {
                  if (err) {
                    return next(err);
                  } else {
                    callback(null, categoryObj);
                  }
                });
              } else {
                callback(null, categoryObj);
              }
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
      } else {
        // Reject invalid extension and warn user
        Category.findById(categoryId).exec(function (err, category) {
          if (err) {
            return next(err);
          } else {
            res.render("item_create", {
              title: "Create new item",
              category: category,
              warnings: { img: "Only '.jpg', '.jpeg' and '.png' are allowed." },
              populate: {
                title: title,
                description: description,
                price: price,
                stock: stock,
              },
            });
          }
        });
      }
    }
  });
};

// Render view for editing an item
exports.item_update_get = function (req, res, next) {
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
        Category.find()
          .sort([["title", "ascending"]])
          .exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      } else {
        // Successful, so render.
        res.render("item_update", {
          title: "Edit your item",
          category: results.category,
          category_list: results.category_list,
          item: results.item,
        });
      }
    }
  );
};
// Edit a item (WIP) - TODO TODO TODO
exports.item_update_post = function (req, res, next) {
  // Get original item and category id's
  var item_id = req.params.item;
  var category_id = req.params.category;

  var title;
  var description;
  var price;
  var stock;
  var categoryId;
  var image;

  var formData = new formidable.IncomingForm();
  formData.parse(req, function (err, fields, files) {
    if (err) {
      return next(err);
    } else {
      // Get new data from form fields
      title = fields.title;
      description = fields.description;
      price = fields.price;
      stock = fields.stock;
      categoryId = fields.categoryId;
      if (files.image) {
        image = files.image;
      }

      async.parallel(
        {
          // 1 - Get original item object
          original_item: function (callback) {
            Item.findById(item_id).exec(callback);
          },
          // 2 - Get original category object
          original_category: function (callback) {
            Category.findById(category_id).exec(callback);
          },
          // 3 - Get new chosen category item object
          new_chosen_category: function (callback) {
            Category.findById(categoryId).exec(callback);
          },
        },
        function (err, results) {
          if (err) {
            return next(err);
          } else {
            let item_machine_name = title.toLowerCase().split(" ").join("");
            let category_machine_name =
              results.new_chosen_category.machine_title;
            let imgUrl = `/images/${item_machine_name}_${category_machine_name}.jpg`;

            // Prepare new item that will replace original_item
            let updated_item = {
              title: title,
              description: description,
              price: price,
              stock: stock,
              categoryId: categoryId,
              imgUrl: imgUrl,
            };

            // Update original item with new info
            Item.findByIdAndUpdate(item_id, updated_item, function (err) {
              if (err) {
                return next(err);
              } else {
                // If a new image was NOT uploaded, just rename the old image
                let originalImagePath = `public/images/${results.original_item.machine_title}_${results.original_category.machine_title}.jpg`;
                if (image.size === 0) {
                  // If item has a image, rename it
                  if (fs.existsSync(originalImagePath)) {
                    fs.rename(
                      originalImagePath,
                      `public${updated_item.imgUrl}`,
                      function (err) {
                        if (err) {
                          return next(err);
                        }
                      }
                    );
                  }
                  // Redirect user to original category
                  Item.find(
                    { category: category_id },
                    function (err, item_list) {
                      if (err) {
                        return next(err);
                      } else {
                        res.render("category_read", {
                          title: `${results.original_category.title} items`,
                          category: results.original_category,
                          items: item_list,
                        });
                      }
                    }
                  );
                }
                // Else, delete old image and upload new one to public/image
                else {
                  // Delete old image
                  if (fs.existsSync(originalImagePath)) {
                    fs.unlink(originalImagePath, function (err) {
                      if (err) {
                        return next(err);
                      }
                    });
                  }

                  // Prepare path of new image
                  let updated_machine_title = updated_item.title
                    .toLowerCase()
                    .split(" ")
                    .join("");
                  let newPath = `public/images/${updated_machine_title}_${results.new_chosen_category.machine_title}.jpg`;

                  // Move uploaded image from 'temp' path to permanent public/images path
                  fs.rename(image.filepath, newPath, function (err) {
                    if (err) {
                      return next(err);
                    } else {
                      // Redirect user to original category
                      Item.find(
                        { category: category_id },
                        function (err, item_list) {
                          if (err) {
                            return next(err);
                          } else {
                            res.render("category_read", {
                              title: `${results.original_category.title} items`,
                              category: results.original_category,
                              items: item_list,
                            });
                          }
                        }
                      );
                    }
                  });
                }
              }
            });
          }
        }
      );
    }
  });
};

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
      } else {
        // Successful, so render.
        res.render("item_delete", {
          title: "Delete your item",
          category: results.category,
          item: results.item,
        });
      }
    }
  );
};
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
      // If a image exists, delete image
      function (itemObj, categoryObj, callback) {
        var itemTitle = itemObj.title.toLowerCase().split(" ").join("");
        var categoryTitle = categoryObj.title.toLowerCase().split(" ").join("");
        var imgPath = path.join(
          "public/images/" + itemTitle + "_" + categoryTitle + ".jpg"
        );
        if (fs.existsSync(imgPath)) {
          fs.unlink(imgPath, function (err) {
            if (err) {
              return next(err);
            } else {
              callback(null, itemObj, categoryObj);
            }
          });
        } else {
          callback(null, itemObj, categoryObj);
        }
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
