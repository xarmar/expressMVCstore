const express = require("express");
const multer  = require('multer');
const router = express.Router();
const upload = multer({ dest: 'public/images' });
const validators = require("../validators/expressValidators");

// Require controller modules.
const category_controller = require("../controllers/categoryController");
const item_controller = require("../controllers/itemController");


// GET - Redirect user from "/" to "/shop"
router.get("/", category_controller.category_list_get);

// --- ITEMS ---
// UPDATE Item request
router.get("/category/*/:category/:item/edit", item_controller.item_update_get)
router.post("/category/*/:category/:item/edit", upload.single('image'), validators.itemFormValidator, item_controller.item_update_post)

// DELETE Item request
router.get("/category/*/:category/:item/delete", item_controller.item_delete_get)
router.post("/category/*/:category/:item/delete", upload.none(), item_controller.item_delete_post)

// CREATE Item request
router.get("/category/*/:category/new", item_controller.item_create_get);
router.post("/category/*/:category/new", upload.single('image'), validators.itemFormValidator, item_controller.item_create_post)


// --- CATEGORIES ---
//  CREATE Category request
router.get("/category/new", category_controller.category_create_get);
router.post("/category/new", upload.single('image'), validators.categoryFormValidator, category_controller.category_create_post);

// DELETE Category request
router.get("/category/*/:category/delete", category_controller.category_delete_get);
router.post("/category/*/:category/delete", upload.none(), category_controller.category_delete_post);

// Update Category request
router.get("/category/*/:category/edit", category_controller.category_update_get);
router.post("/category/*/:category/edit", upload.single('image'), validators.categoryFormValidator, category_controller.category_update_post);

// READ Category request
router.get("/category/*/:category", category_controller.category_get);



module.exports = router;