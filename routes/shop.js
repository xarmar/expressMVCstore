var express = require("express");
var router = express.Router();

// Require controller modules.
var category_controller = require("../controllers/categoryController");
var item_controller = require("../controllers/itemController");


/// Category ROUTES ///

// GET - Redirect user from "/" to "/shop"
router.get("/", category_controller.category_list_get);

// GET - Redirect user to category page
router.get("/category/*", category_controller.category_get);

// GET - Redirect user to edit item page
// router.get("/item/:id/edit", item_controller.item_edit_get);

// POST - Delete item
router.post("/item/:id/delete", item_controller.item_delete_post);


module.exports = router;