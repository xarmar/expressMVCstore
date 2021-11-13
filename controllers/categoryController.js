const async = require("async");
const Category = require("../models/category");
const fileIsValidImg = require("../helperFunctions/fileIsValidImg");
const getNewImagePath = require("../helperFunctions/getNewImagePath");
const Item = require("../models/item");
const path = require("path");
const fs = require("fs");

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

// Displays list of all Categories.
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
// Displays a category and all it's items 
exports.category_get = function (req, res, next) {
  let id = req.params.category;
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

// Updates a category
exports.category_update_get = function (req, res, next) {
  let category_id = req.params.category;

  Category.findById(category_id).exec(function (err, category) {
    if (err) {
      return next(err);
    } else {
      // Successful, so render.
      res.render("category_update", {
        title: `Editing ${category.title} category`,
        category: category,
      });
    }
  });
};
exports.category_update_post = function (req, res, next) {
  // Get original category id's
  let category_id = req.params.category;
  let title = req.body.title;
  let description = req.body.description;
  let image = req.file;

  async.parallel(
    {
      // 1 - Get original category object
      original_category: function (callback) {
        Category.findById(category_id).exec(callback);
      },
      // 2- Get items associated with category
      items: function (callback) {
        Item.find({ category: category_id }).exec(callback);
      },
    },
    function (err, results) {
      if (err) {
        return next(err);
      } else {
        let originalImagePath = results.original_category.image_path;
        let newCategory_machine_title = title.toLowerCase().split(" ").join("");
        let newCategory_imgUrl = `/images/${newCategory_machine_title}_category.jpg`;
        let original_category_machine_title = results.original_category.machine_title;
        
        // Prepare new category that will replace original_category
        let updated_category = {
          title: title,
          description: description,
          imgUrl: newCategory_imgUrl,
        };

        if (image) {
          // If user uploads a valid image
          if (fileIsValidImg(image.mimetype)) {
            // Update Category in database
            Category.findByIdAndUpdate(category_id, updated_category, function (err) {
              if (err) {
                return next(err);
              } else {
                // Delete old image
                if (fs.existsSync(originalImagePath)) {
                  fs.unlink(originalImagePath, function (err) {
                    if (err) {
                      return next(err);
                    }
                  });
                }
                // Move uploaded image from 'temp' path to permanent public/images path
                fs.rename(
                  image.path,
                  'public' + newCategory_imgUrl,
                  function (err) {
                    if (err) {
                      return next(err);
                    } 
                    else {
                      // Update all items imgUrls in Db
                      let promiseUpdateDb = [];
                      results.items.forEach(item => {
                        let p = new Promise((resolve, reject) => {
                          let previousUrl = item.imgUrl;
                          let newImgUrl = getNewImagePath(original_category_machine_title, newCategory_machine_title, previousUrl);
                          let updateImgPath = {
                            imgUrl: newImgUrl
                          }
                          Item.findByIdAndUpdate(item._id, updateImgPath, function(err) {
                            if(err) {
                              reject(err);
                            }
                            else {
                              resolve([previousUrl, newImgUrl]);
                            }
                          });
                        })
                        promiseUpdateDb.push(p);
                      });

                      // Rename item images to match new category
                      let promiseRenameImages = [];
                      Promise.all(promiseUpdateDb).then(imgUrls => {
                        imgUrls.forEach(urlPair => {
                          let p = new Promise((resolve, reject) => {
                            let previousImgPath = 'public' + urlPair[0];
                            let newImgPath = 'public' + urlPair[1];
                            fs.rename(previousImgPath, newImgPath, function(err) {
                              if(err) {
                                reject(err);
                              }
                              else {
                                resolve();
                              }
                            });
                          })
                          promiseRenameImages.push(p);
                        });
                      }).catch(err => next(err));

                      // If images were updated in db and locally
                      Promise.all(promiseRenameImages).then(() => {
                        // Redirect user to inventory
                        Category.find()
                        .sort([["title", "ascending"]])
                        .exec(function (err, list_categories) {
                          if (err) {
                            return next(err);
                          }
                          else {
                            // Redirect user to inventory
                            res.render("category_list", {
                              title: "Inventory List",
                              category_list: list_categories
                            });
                          }
                        });
                      }).catch(err => next(err));
                    }
                  });
              }
            })
          }
          // If invalid file was uploaded
          else {
            // Warn user an invalid file was  uploaded
            res.render("category_update", {
              title: `Editing ${results.original_category.title} category`,
              category: results.original_category,
              warnings: {
                img: "Only '.jpg', '.jpeg' and '.png' are allowed.",
              },
            });
          }
        }
        // If no image was uploaded
        else {
          // Update category in database
          Category.findByIdAndUpdate(category_id, updated_category, function (err) {
            if (err) {
              return next(err);
            } else {
              // If an old image exists - rename it and keep it as default
              if (fs.existsSync(originalImagePath)) {
                fs.rename(
                  originalImagePath,
                  "public" + newCategory_imgUrl,
                  function (err) {
                    if (err) {
                      return next(err);
                    } else {
                      // Update all items imgUrls in Db
                      let promiseUpdateDb = [];
                      results.items.forEach(item => {
                        let p = new Promise((resolve, reject) => {
                          let previousUrl = item.imgUrl;
                          let newImgUrl = getNewImagePath(original_category_machine_title, newCategory_machine_title, previousUrl);
                          let updateImgPath = {
                            imgUrl: newImgUrl
                          }
                          Item.findByIdAndUpdate(item._id, updateImgPath, function(err) {
                            if(err) {
                              reject(err);
                            }
                            else {
                              resolve([previousUrl, newImgUrl]);
                            }
                          });
                        })
                        promiseUpdateDb.push(p);
                      });

                      // Rename item images to match new category
                      let promiseRenameImages = [];
                      Promise.all(promiseUpdateDb).then(imgUrls => {
                        imgUrls.forEach(urlPair => {
                          let p = new Promise((resolve, reject) => {
                            let previousImgPath = 'public' + urlPair[0];
                            let newImgPath = 'public' + urlPair[1];
                            fs.rename(previousImgPath, newImgPath, function(err) {
                              if(err) {
                                reject(err);
                              }
                              else {
                                resolve();
                              }
                            });
                          })
                          promiseRenameImages.push(p);
                        });
                      }).catch(err => next(err));

                      // If images were updated in db and locally
                      Promise.all(promiseRenameImages).then(() => {
                        // Redirect user to inventory
                        Category.find()
                        .sort([["title", "ascending"]])
                        .exec(function (err, list_categories) {
                          if (err) {
                            return next(err);
                          }
                          else {
                            // Redirect user to inventory
                            res.render("category_list", {
                              title: "Inventory List",
                              category_list: list_categories
                            });
                          }
                        });
                      }).catch(err => next(err));
                    }
                  }
                );
              }
            }
          });
        }
      }
    }
  );
};

// Deletes a category
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
        // If no items are found under a given category,delete it
        if(!results.items.length) {
          let imgPath = results.category.image_path;
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

