const Category = require("../models/category");
const fileIsValidImg = require("../helperFunctions/fileIsValidImg");
const fs = require("fs");
const fsPromises = require("fs.promises");
const Item = require("../models/item");
const mongoose = require("mongoose");
const path = require("path");

// Creates a new item
exports.item_create_get = (req, res, next) => {
  const category_id = req.params.category;

  Category.findById(category_id)
    .exec()
    .then((category) => {
      res.render("item_create", {
        title: "Create new item",
        category: category,
      });
    })
    .catch((err) => next(err));
};
exports.item_create_post = (req, res, next) => {
  const title = req.body.title;
  const description = req.body.description;
  const price = req.body.price;
  const stock = req.body.stock;
  const categoryId = req.body.categoryId;
  const image = req.file;

  // If image has valid mimetype => accept and render new item in list
  if (fileIsValidImg(image.mimetype)) {
    Category.findById(categoryId)
      .exec()
      .then(
        (category) =>
          new Promise((resolve, reject) => {
            let imgUrl = `/images/${title.toLowerCase().split(" ").join("")}_${
              category.machine_title
            }.jpg`;

            // Prepare new Item object
            let newItem = new Item({
              title: title,
              description: description,
              price: price,
              stock: stock,
              category: categoryId,
              imgUrl: imgUrl,
            });

            // Save new Item Object in Database
            newItem
              .save()
              .then((item) => resolve([category, item]))
              .catch((err) => reject(err));
          })
      )
      .then(
        ([category, item]) =>
          new Promise((resolve, reject) => {
            // Move image from 'temp' path to permanent public/images path
            let targetPath = path.join("public" + item.imgUrl);
            fsPromises
              .rename(image.path, targetPath)
              .then(() => resolve(category))
              .catch((err) => reject(err));
          })
      )
      .then((category) => res.redirect(category.url))
      .catch((err) => next(err));
  } else {
    // Delete uploaded file and warn user of invalid file
    if (fs.existsSync(image.path)) {
      fsPromises
        .unlink(image.path)
        .then(() => {
          Category.findById(categoryId)
            .exec()
            .then((category) => {
              res.render("item_create", {
                title: "Create new item",
                category: category,
                warnings: {
                  img: "Only '.jpg', '.jpeg' and '.png' are allowed.",
                },
                populate: {
                  title: title,
                  description: description,
                  price: price,
                  stock: stock,
                },
              });
            })
            .catch((err) => next(err));
        })
        .catch((err) => next(err));
    }
  }
};

// Updates an item
exports.item_update_get = (req, res, next) => {
  const category_id = req.params.category;
  const item_id = req.params.item;

  const getCategory = Category.findById(category_id).exec();
  const getItem = Item.findById(item_id).exec();
  const getCategoryList = Category.find()
    .sort([["title", "ascending"]])
    .exec();

  Promise.all([getCategory, getItem, getCategoryList])
    .then(([category, item, category_list]) => {
      res.render("item_update", {
        title: `Edit ${item.title}`,
        category: category,
        category_list: category_list,
        item: item,
      });
    })
    .catch((err) => next(err));
};

exports.item_update_post = (req, res, next) => {
  // Get original item and category id's
  const item_id = req.params.item;
  const category_id = req.params.category;

  const title = req.body.title;
  const description = req.body.description;
  const price = req.body.price;
  const stock = req.body.stock;
  const categoryId = req.body.categoryId;
  const image = req.file;

  const originalItem = Item.findById(item_id).exec();
  const originalCategory = Category.findById(category_id).exec();
  const categoryList = Category.find()
    .sort([["title", "ascending"]])
    .exec();
  const newChosenCategory = Category.findById(categoryId).exec();

  Promise.all([originalItem, originalCategory, categoryList, newChosenCategory])
    .then(
      ([
        original_item,
        original_category,
        category_list,
        new_chosen_category,
      ]) =>
        new Promise((resolve, reject) => {
          let originalImagePath =
            "public/images/" +
            original_item.machine_title +
            "_" +
            original_category.machine_title +
            ".jpg";

          let newItem_machineTitle = title.toLowerCase().split(" ").join("");
          let newCategory_machineTitle = new_chosen_category.machine_title;
          let newItem_imgUrl =
            "/images/" +
            newItem_machineTitle +
            "_" +
            newCategory_machineTitle +
            ".jpg";

          // Prepare new item that will replace original_item
          let updated_item = {
            title: title,
            description: description,
            price: price,
            stock: stock,
            category: mongoose.Types.ObjectId(categoryId),
            imgUrl: newItem_imgUrl,
          };

          if (image) {
            // If user uploads a valid image
            if (fileIsValidImg(image.mimetype)) {
              // Update item in database
              Item.findByIdAndUpdate(item_id, updated_item)
                .exec()
                .then(
                  () =>
                    new Promise((resolve, reject) => {
                      // Delete old image
                      if (fs.existsSync(originalImagePath)) {
                        fsPromises
                          .unlink(originalImagePath)
                          .then(() => resolve())
                          .catch(() => reject());
                      } else {
                        resolve();
                      }
                    })
                )
                .then(() => {
                  // Move uploaded image from 'temp' path to permanent public/images path
                  fsPromises
                    .rename(image.path, "public" + newItem_imgUrl)
                    .then(() => resolve(original_category.url))
                    .catch((err) => next(err));
                })
                .catch((err) => reject(err));
            }

            // If invalid file was uploaded
            else {
              // Delete uploaded file and warn user of invalid file
              if (fs.existsSync(image.path)) {
                fsPromises
                  .unlink(image.path)
                  .then(() => {
                    res.render("item_update", {
                      title: "Edit your item",
                      category: original_category,
                      category_list: category_list,
                      item: original_item,
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
            // Update item in database
            Item.findByIdAndUpdate(item_id, updated_item)
              .exec()
              .then(() =>
                new Promise((resolve, reject) => {
                  // If an old image exists - rename it and keep it as default
                  if (fs.existsSync(originalImagePath)) {
                    fsPromises
                      .rename(originalImagePath, "public" + newItem_imgUrl)
                      .then(() => resolve())
                      .catch((err) => reject(err));
                  } else {
                    resolve();
                  }
                })
                  .then(() => resolve(original_category.url))
                  .catch((err) => reject(err))
              );
          }
        })
    )
    .then((originalCategoryUrl) => res.redirect(originalCategoryUrl))
    .catch((err) => next(err));
};

// Deletes an item
exports.item_delete_get = (req, res, next) => {
  const category_id = req.params.category;
  const item_id = req.params.item;

  const getCategory = Category.findById(category_id).exec();
  const getItem = Item.findById(item_id).exec();

  Promise.all([getCategory, getItem])
    .then(([category, item]) => {
      // Successful, so render.
      res.render("item_delete", {
        title: `Delete ${item.title}`,
        category: category,
        item: item,
      });
    })
    .catch((err) => next(err));
};
exports.item_delete_post = (req, res, next) => {
  const item_id = req.params.item;
  const category_id = req.params.category;

  const getItem = Item.findById(item_id).exec();
  const getCategory = Category.findById(category_id).exec();

  Promise.all([getItem, getCategory])
    .then(
      ([item, category]) =>
        new Promise((resolve, reject) => {
          // If a image exists, delete image
          let imgPath = path.join("public" + item.imgUrl);
          if (fs.existsSync(imgPath)) {
            fsPromises
              .unlink(imgPath)
              .then(() => resolve([item, category]))
              .catch((err) => reject(err));
          } else {
            resolve([item, category]);
          }
        })
    )
    .then(
      ([item, category]) =>
        new Promise((resolve, reject) => {
          Item.findByIdAndRemove(item._id)
            .exec()
            .then(() => resolve([item, category]))
            .catch((err) => reject(err));
        })
    )
    .then(([item, category]) => res.redirect(category.url))
    .catch((err) => next(err));
};
