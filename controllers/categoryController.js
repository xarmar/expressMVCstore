const async = require("async");
const Category = require("../models/category");
const fileIsValidImg = require("../helperFunctions/fileIsValidImg");
const Item = require("../models/item");
const path = require("path");
const fs = require("fs");

// Display list of all Categories.
exports.category_list_get = function (req, res, next) {
  Category.find()
    .sort([["title", "ascending"]])
    .exec(function (err, list_categories) {
      if (err) {
        return next(err);
      }
      else {
        //Successful, so render
        res.render("category_list", {
          title: "Inventory List",
          category_list: list_categories,
        });
      }
    });
};
// Display a category and all it's items 
exports.category_get = function (req, res, next) {
  var id = req.params.category;
  async.parallel(
    {
      found_category: function (callback) {
        Category.findById(id).exec(callback);
      },
      items: function (callback) {
        Item.find({ category: id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      res.render("category_read", {
        title: `${results.found_category.title} items`,
        category: results.found_category,
        items: results.items,
      });
    }
  );
};

// Creates a new category
exports.category_create_get = function (req, res, next) {
  res.render("category_create", {
    title: "Create new category",
  });
};
exports.category_create_post = function (req, res, next) {
  let title = req.body.title;
  let description = req.body.description;
  let image = req.file;
  let imgUrl = `/images/${title
    .toLowerCase()
    .split(" ")
    .join("")}_category.jpg`;

  // If image has valid mimetype (jpg) => accept and render new item in list
  if (fileIsValidImg(image.mimetype)) {
    async.waterfall(
      [
        // 1 - Create category object and save it in database
        function (callback) {
          let newCategory = new Category({
            title: title,
            description: description,
            imgUrl: imgUrl,
          });
          newCategory.save(function (err) {
            if (err) {
              return next(err);
            } else {
              callback(null);
            }
          });
        },
        // 2 - Save image in Server
        function (callback) {
          let targetPath = path.join("public" + imgUrl);
          // Move image from 'temp' path to permanent public/images path
          fs.rename(image.path, targetPath, function (err) {
            if (err) {
              return next(err);
            } else {
              callback(null);
            }
          });
        },
      ],
      function (err) {
        if (err) {
          return next(err);
        } else {
          res.redirect("/inventory");
        }
      }
    );
  } else {
    // Reject invalid extension and warn user
    res.render("category_create", {
      title: "Create new category",
      warnings: { img: "Only '.jpg', '.jpeg' and '.png' are allowed." },
      populate: {
        title: title,
        description: description,
      },
    });
  }
};

// Deletes a category (WIP)
exports.category_delete_get = function (req, res, next) {
  let id = req.params.category;

  Category.findById(id).exec(function (err, category) {
    if (err) {
      return next(err);
    } else {
      // Successful, so render.
      res.render("category_delete", {
        title: `Delete ${category.title} category`,
        category: category,
      });
    }
  });
};
exports.category_delete_post = function (req, res, next) {
  let id = req.params.category;

  async.parallel(
    {
      category: function (callback) {
        Category.findById(id).exec(callback);
      },
      items: function (callback) {
        Item.find({ category: id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      }
      else {
        if(results.items === undefined) {
          let imgPath = path.join("public" + `${results.category.title}_category`);
          Category.findByIdAndDelete(results.category._id).exec(function(err) {
            if(err) {
              return next(err);
            }
            else {
              // Delete category image
              if (fs.existsSync(imgPath)) {
                fs.unlink(imgPath, function (err) {
                  if (err) {
                    return next(err);
                  } else {
                    Category.find()
                    .sort([["title", "ascending"]])
                    .exec(function (err, list_categories) {
                      if (err) {
                        return next(err);
                      }
                      else {
                        //Successful, so render
                        res.render("category_list", {
                          title: "Inventory List",
                          category_list: list_categories
                        });
                      }
                    }
                    )
                  }
                });
              }
            }
          });
        }
        // If items found, warn user
        else {
          res.render("category_delete", {
            title: `Delete ${results.category.title} category`,
            category: results.category,
            conflicting_items: results.items,
          });
        }
      }
    }
  );
};