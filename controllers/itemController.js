const async = require("async");
const { body, validationResult } = require("express-validator");
const Category = require("../models/category");
const fileIsValidImg = require("../helperFunctions/fileIsValidImg");
const formidable = require("formidable");
const Item = require("../models/item");
var mongoose = require("mongoose");
const path = require("path");
const fs = require("fs");

// Render view for creating new item
exports.item_create_get = function (req, res, next) {
  let category_id = req.params.category;

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
  let title = req.body.title;
  let description = req.body.description;
  let price = req.body.price;
  let stock = req.body.stock;
  let categoryId = req.body.categoryId;
  let image = req.file;

  // If image has valid mimetype (jpg) => accept and render new item in list
  if (fileIsValidImg(image.mimetype)) {
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
          let imgUrl = `/images/${title.toLowerCase().split(" ").join("")}_${
            categoryObj.machine_title
          }.jpg`;

          // Prepare Item object
          let newItem = new Item({
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
          let targetPath = path.join("public" + itemObj.imgUrl);
          // Move image from 'temp' path to permanent public/images path
          fs.rename(image.path, targetPath, function (err) {
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
};

// Render view for editing an item
exports.item_update_get = function (req, res, next) {
  let category_id = req.params.category;
  let item_id = req.params.item;

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
// Edit a item
exports.item_update_post = function (req, res, next) {
  // Get original item and category id's
  let item_id = req.params.item;
  let category_id = req.params.category;

  let title;
  let description;
  let price;
  let stock;
  let categoryId;
  let image;

  let formData = new formidable.IncomingForm();
  formData.parse(req, function (err, fields, files) {
    if (err) {
      return next(err);
    } else {
      // Get new data from form fields
      title = fields.title;
      description = fields.description;
      price = fields.price;
      stock = fields.stock;
      categoryId = fields.categoryId,
      image = files.image;

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
          // 3 - Get category list of original category
          category_list: function (callback) {
            Category.find()
              .sort([["title", "ascending"]])
              .exec(callback);
          },
          // 4 - Get new chosen category item object
          new_chosen_category: function (callback) {
            Category.findById(categoryId).exec(callback);
          },
        },
        function (err, results) {
          if (err) {
            return next(err);
          } else {
            // If user uploads a valid image OR no image 
            if (
              fileIsValidImg(image.mimetype) ||
              image.mimetype === "application/octet-stream"
            ) {
              let originalImagePath =
                "public/images/" +
                results.original_item.machine_title +
                "_" +
                results.original_category.machine_title +
                '.jpg';

              // Prepare new item Imgurl
              let newItem_machineTitle = title
                .toLowerCase()
                .split(" ")
                .join("");
              let newCategory_machineTitle =
                results.new_chosen_category.machine_title;

              let newItem_imgUrl =
              "/images/" +
              newItem_machineTitle +
              "_" +
              newCategory_machineTitle + 
              ".jpg"

              // Prepare new item that will replace original_item
              let updated_item = {
                title: title,
                description: description,
                price: price,
                stock: stock,
                category: mongoose.Types.ObjectId(categoryId),
                imgUrl: newItem_imgUrl
              };

              // Update item in database
              Item.findByIdAndUpdate(item_id, updated_item, function(err, updatedItem) {
                if(err) {
                  return next(err);
                }
                else{
                  
                  // If an image was uploaded - delete old one, create new one
                  if (fileIsValidImg(image.mimetype)) {
                    // Delete old image
                    if (fs.existsSync(originalImagePath)) {
                      fs.unlink(originalImagePath, function (err) {
                        if (err) {
                          return next(err);
                        }
                      });
                    }

                    // Move uploaded image from 'temp' path to permanent public/images path
                    fs.rename(image.filepath, 'public' + newItem_imgUrl, function (err) {
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
                  // If no image was uploaded
                  if (image.size === 0) {
                    // If a old image exists - rename it and keep it as default
                    if (fs.existsSync(originalImagePath)) {
                      fs.rename(
                        originalImagePath,
                        'public' + newItem_imgUrl,
                        function (err) {
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
                        }
                      );
                    }
                  }
                }
              });
            }
            // Warn user when an invalid file is uploaded
            else {
              res.render("item_update", {
                title: "Edit your item",
                category: results.original_category,
                category_list: results.category_list,
                item: results.original_item,
                warnings: {
                  img: "Only '.jpg', '.jpeg' and '.png' are allowed.",
                },
              });
            }
          }
        }
      );
    }
  });
};

// Render view for deleting an item
exports.item_delete_get = function (req, res, next) {
  let category_id = req.params.category;
  let item_id = req.params.item;

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
  let item_id = req.params.item;
  let category_id = req.params.category;

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
        let imgPath = path.join("public" + itemObj.imgUrl);
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
