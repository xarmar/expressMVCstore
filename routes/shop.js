var express = require("express");
var router = express.Router();

// Require controller modules.
var category_controller = require("../controllers/categoryController");
var item_controller = require("../controllers/itemController");


/// Category ROUTES ///

// GET - Redirect user from "/" to "/shop"
router.get("/", category_controller.category_list_get);

// GET - Create Item request
router.get("/category/*/:id/new", item_controller.item_create_get);

// POST - Create Item request
router.post("/category/*/:id/new", item_controller.item_create_post)

// GET - Read Category request
router.get("/category/*/:id", category_controller.category_get);

// POST - Delete Item request
router.post("/category/*/:id/delete", item_controller.item_delete_post);

// GET - Redirect user to edit item page
// router.get("/item/:id/edit", item_controller.item_edit_get);

module.exports = router;