const Category = require("../models/category");
const fileIsValidImg = require("../helperFunctions/fileIsValidImg");
const fs = require("fs");
const fsPromises = require("fs.promises");
const getNewImagePath = require("../helperFunctions/getNewImagePath");
const Item = require("../models/item");
const path = require("path");

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
    // Create category object and save it in database
    const saveNewCategory = new Promise((resolve, reject) => {
      let newCategory = new Category({
        title: title,
        description: description,
        imgUrl: imgUrl,
      });

      newCategory
        .save()
        .then(() => resolve())
        .catch((err) => reject(err));
    });

    // Add image to database
    saveNewCategory
      .then(
        () =>
          new Promise((resolve, reject) => {
            let targetPath = path.join("public" + imgUrl);
            // Move image from 'temp' path to permanent public/images path
            fsPromises
              .rename(image.path, targetPath)
              .then(() => resolve())
              .catch((err) => reject(err));
          })
      )
      .then(() => res.redirect("/inventory"))
      .catch((err) => next(err));
  } else {
    // Delete uploaded file and warn user of invalid file
    if (fs.existsSync(image.path)) {
      fsPromises
        .unlink(image.path)
        .then(() => {
          res.render("category_create", {
            title: "Create new category",
            warnings: { img: "Only '.jpg', '.jpeg' and '.png' are allowed." },
            populate: {
              title: title,
              description: description,
            },
          });
        })
        .catch((err) => next(err));
    }
  }
};

// Displays list of all Categories.
exports.category_list_get = function (req, res, next) {
  Category.find()
    .sort([["title", "ascending"]])
    .exec()
    .then((list_categories) => {
      res.render("category_list", {
        title: "Inventory List",
        category_list: list_categories,
      });
    })
    .catch((err) => next(err));
};
// Displays a category and all it's items
exports.category_get = function (req, res, next) {
  const id = req.params.category;
  const getCategory = Category.findById(id).exec();
  const getCategoryItems = Item.find({ category: id }).exec();

  Promise.all([getCategory, getCategoryItems])
    .then(([found_category, items]) => {
      res.render("category_read", {
        title: `${found_category.title} items`,
        category: found_category,
        items: items,
      });
    })
    .catch((err) => next(err));
};

// Updates a category
exports.category_update_get = function (req, res, next) {
  const category_id = req.params.category;

  Category.findById(category_id)
    .exec()
    .then((category) => {
      res.render("category_update", {
        title: `Editing ${category.title} category`,
        category: category,
      });
    })
    .catch((err) => next(err));
};
exports.category_update_post = function (req, res, next) {
  // Get original category id's
  const category_id = req.params.category;
  const title = req.body.title;
  const description = req.body.description;
  const image = req.file;

  // Prepare new category that will replace original_category
  let newCategory_machine_title = title.toLowerCase().split(" ").join("");
  let newCategory_imgUrl = `/images/${newCategory_machine_title}_category.jpg`;
  let updated_category = {
    title: title,
    description: description,
    imgUrl: newCategory_imgUrl,
  };

  const getOriginalCategory = Category.findById(category_id).exec();
  const getOriginalCategoryItems = Item.find({ category: category_id }).exec();

  Promise.all([getOriginalCategory, getOriginalCategoryItems])
    .then(
      ([original_category, items]) =>
        new Promise((resolve, reject) => {
          let originalImagePath = original_category.image_path;
          let original_category_machine_title = original_category.machine_title;

          // If an image was uploaded
          if (image) {
            // If user uploads a valid image
            if (fileIsValidImg(image.mimetype)) {
              // Update Category in database
              Category.findByIdAndUpdate(category_id, updated_category)
                .exec()

                // Delete old image if it exists
                .then(
                  () =>
                    new Promise((resolve, reject) => {
                      if (fs.existsSync(originalImagePath)) {
                        fsPromises
                          .unlink(originalImagePath)
                          .then(() => resolve())
                          .catch((err) => reject(err));
                      } else resolve();
                    })
                )

                // Move uploaded image from 'temp' path to permanent public/images path
                .then(
                  () =>
                    new Promise((resolve, reject) => {
                      fsPromises
                        .rename(image.path, "public" + newCategory_imgUrl)
                        .then(() => resolve())
                        .catch((err) => reject(err));
                    })
                )

                // Update items in DB
                .then(
                  () =>
                    new Promise((resolve, reject) => {
                      // Update all items imgUrls in Db
                      let promiseUpdateDb = [];
                      items.forEach((item) => {
                        let p = new Promise((resolve, reject) => {
                          let previousUrl = item.imgUrl;
                          let newImgUrl = getNewImagePath(
                            original_category_machine_title,
                            newCategory_machine_title,
                            previousUrl
                          );
                          let updateImgPath = {
                            imgUrl: newImgUrl,
                          };
                          Item.findByIdAndUpdate(item._id, updateImgPath)
                            .exec()
                            .then(() => resolve([previousUrl, newImgUrl]))
                            .catch((err) => reject(err));
                        });
                        promiseUpdateDb.push(p);
                      });

                      // Rename item images to match new category
                      let promiseRenameImages = [];
                      Promise.all(promiseUpdateDb)
                        .then((imgUrls) => {
                          imgUrls.forEach((urlPair) => {
                            let p = new Promise((resolve, reject) => {
                              let previousImgPath = "public" + urlPair[0];
                              let newImgPath = "public" + urlPair[1];
                              fsPromises
                                .rename(previousImgPath, newImgPath)
                                .then(() => resolve())
                                .catch((err) => reject(err));
                            });
                            promiseRenameImages.push(p);
                          });
                        })
                        .catch((err) => reject(err));

                      // If images were updated in db and locally
                      Promise.all(promiseRenameImages)
                        .then(() => resolve())
                        .catch((err) => reject(err));
                    })
                )
                .catch((err) => reject(err))

                .then(() => resolve());
            }
            // If invalid image was uploaded
            else {
              // Delete uploaded file and warn user of invalid file
              if (fs.existsSync(image.path)) {
                fsPromises
                  .unlink(image.path)
                  .then(() => {
                    res.render("category_update", {
                      title: `Editing ${original_category.title} category`,
                      category: original_category,
                      warnings: {
                        img: "Only '.jpg', '.jpeg' and '.png' are allowed.",
                      },
                    });
                  })
                  .catch((err) => reject(err));
              }
            }
          }

          // If no image was uploaded
          else {
            // Update category in database
            Category.findByIdAndUpdate(category_id, updated_category)
              .exec()
              // If an old image exists - rename it and keep it as default
              .then(
                () =>
                  new Promise((resolve, reject) => {
                    if (fs.existsSync(originalImagePath)) {
                      fsPromises
                        .rename(
                          originalImagePath,
                          "public" + newCategory_imgUrl
                        )
                        .then(() => resolve())
                        .catch(() => reject());
                    } else resolve();
                  })
              )

              // Update items in DB
              .then(
                () =>
                  new Promise((resolve, reject) => {
                    // Update all items imgUrls in Db
                    let promiseUpdateDb = [];
                    items.forEach((item) => {
                      let p = new Promise((resolve, reject) => {
                        let previousUrl = item.imgUrl;
                        let newImgUrl = getNewImagePath(
                          original_category_machine_title,
                          newCategory_machine_title,
                          previousUrl
                        );
                        let updateImgPath = {
                          imgUrl: newImgUrl,
                        };
                        Item.findByIdAndUpdate(item._id, updateImgPath)
                          .exec()
                          .then(() => resolve([previousUrl, newImgUrl]))
                          .catch((err) => reject(err));
                      });
                      promiseUpdateDb.push(p);
                    });

                    // Rename item images to match new category
                    let promiseRenameImages = [];
                    Promise.all(promiseUpdateDb)
                      .then((imgUrls) => {
                        imgUrls.forEach((urlPair) => {
                          let p = new Promise((resolve, reject) => {
                            let previousImgPath = "public" + urlPair[0];
                            let newImgPath = "public" + urlPair[1];
                            fsPromises
                              .rename(previousImgPath, newImgPath)
                              .then(() => resolve())
                              .catch((err) => reject(err));
                          });
                          promiseRenameImages.push(p);
                        });
                      })
                      .catch((err) => reject(err));

                    // If images were updated in db and locally
                    Promise.all(promiseRenameImages)
                      .then(() => resolve())
                      .catch((err) => reject(err));
                  })
              )
              .catch((err) => reject(err))

              .then(() => resolve());
          }
        })
    )
    .then(() => res.redirect("/inventory"))
    .catch((err) => next(err));
};

// Deletes a category
exports.category_delete_get = function (req, res, next) {
  let id = req.params.category;

  Category.findById(id)
    .exec()
    .then((category) => {
      // Successful, so render.
      res.render("category_delete", {
        title: `Delete ${category.title} category`,
        category: category,
      });
    })
    .catch((err) => next(err));
};
exports.category_delete_post = function (req, res, next) {
  let id = req.params.category;

  const getCategory = Category.findById(id).exec();
  const getItems = Item.find({ category: id }).exec();

  Promise.all([getCategory, getItems])
    .then(
      ([category, items]) =>
        new Promise((resolve, reject) => {
          // If no items are found under a given category,delete it
          if (!items.length) {
            let imgPath = category.image_path;
            Category.findByIdAndDelete(category._id)
              .exec()
              .then(() => {
                // Delete category image
                if (fs.existsSync(imgPath)) {
                  fsPromises
                    .unlink(imgPath)
                    .then(() => resolve())
                    .catch((err) => reject(err));
                }
              })
              .catch((err) => reject(err));
          }
          // If items found, warn user
          else {
            res.render("category_delete", {
              title: `Delete ${category.title} category`,
              category: category,
              conflicting_items: items,
            });
          }
        })
    )
    .then(() => res.redirect("/inventory"))
    .catch((err) => next(err));
};
