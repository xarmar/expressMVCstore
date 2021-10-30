var express = require("express");
var router = express.Router();

// Require controller modules.
var category_controller = require("../controllers/categoryController");

/// Category ROUTES ///

// GET shop categories.
router.get("/", category_controller.category_list);

// GET category routes.
router.get("/category/*", category_controller.display_category);


module.exports = router;