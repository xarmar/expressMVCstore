#! /usr/bin/env node

console.log(
  "This script populates some test books, authors, genres and bookinstances to your database. Specified database as argument - e.g.: populatedb mongodb+srv://cooluser:coolpassword@cluster0.a9azn.mongodb.net/local_library?retryWrites=true"
);

// Get arguments passed on command line
var userArgs = process.argv.slice(2);
/*
if (!userArgs[0].startsWith('mongodb')) {
    console.log('ERROR: You need to specify a valid mongodb URL as the first argument');
    return
}
*/
var async = require("async");
var Category = require("./models/category");
var Item = require("./models/item");

var mongoose = require("mongoose");
var mongoDB = userArgs[0];
mongoose.connect(mongoDB, { useNewUrlParser: true, useUnifiedTopology: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));

var Categories = [];
var Items = [];

// Add a category to Categories Array
function CategoryCreate(title, description, imgUrl, cb) {
  var category = new Category({
    title: title,
    description: description,
    imgUrl: imgUrl,
  });

  category.save(function (err) {
    if (err) {
      cb(err, null);
      return;
    }
    console.log("New Category: " + category);
    Categories.push(category);
    cb(null, category);
  });
}

// Adds a item to the Items Array
function itemCreate(
  title,
  description,
  price,
  stock,
  category,
  promotion,
  discount,
  imgUrl,
  cb
) {
  var itemDetails = {
    title: title,
    description: description,
    price: price,
    stock: stock,
    category: category,
    promotion: promotion,
    discount: discount,
    imgUrl: imgUrl
  };
  var item = new Item(itemDetails);

  item.save(function (err) {
    if (err) {
      cb(err, null);
      return;
    }
    console.log("New Item: " + item);
    Items.push(item);
    cb(null, item);
  });
}

// Adds multiple categories in sequence to the Categories Array
function createCategories(cb) {
  async.series(
    [
      // Create Categories
      function (callback) {
        CategoryCreate(
          "Fruits",
          "All types of fruit from all over the world. Which ones to choose, that is the hard question!",
          "/images/fruits_category.jpg",
          callback
        );
      },
      function (callback) {
        CategoryCreate(
          "Meat",
          "Bought directly from local farmers, our products help support small farms around our state.",
          "/images/meat_category.jpg",
          callback
        );
      },
      function (callback) {
        CategoryCreate(
          "Fish",
          "Bought directly from local fishermen, buying our fish supports the local families in our community.",
          "/images/fish_category.jpg",
          callback
        );
      },
      function (callback) {
        CategoryCreate(
          "Vegetables",
          "Get all the vitamins and minerals you need with our top quality BIO veggies.",
          "/images/vegetables_category.jpg",
          callback
        );
      },
      function (callback) {
        CategoryCreate(
          "Bakery",
          "Delicious cakes and really tasty bread. Our bakers make everything with love just for you.",
          "/images/bakery_category.jpg",
          callback
        );
      },
      function (callback) {
        CategoryCreate(
          "Drinks",
          "Feeling thirsty? We have a big variety of drinks available - you will surely find your favorite.",
          "/images/drinks_category.jpg",
          callback
        );
      },
      function (callback) {
        CategoryCreate(
          "Dairy",
          "Milk, cheese and yogurt. Is there anything better? We don't think so.",
          "/images/dairy_category.jpg",
          callback
        );
      },
      function (callback) {
        CategoryCreate(
          "Health and Beauty",
          "Try our amazing products and experience a real improvement in well-being.",
          "/images/healthAndBeauty_category.jpg",
          callback
        );
      },
    ],
    // optional callback
    cb
  );
}

// Adds multiple items in sequence to the Items Array
function createItems(cb) {
  async.series(
    [
      // Create Fruit Items
      function (callback) {
        itemCreate(
          "Banana",
          "From Portugal",
          "0.39",
          "318",
          Categories[0],
          false,
          0,
          "/images/banana_fruits.jpg",
          callback
        );
      },
      function (callback) {
        itemCreate(
          "Apple",
          "From Spain",
          "0.34",
          "519",
          Categories[0],
          false,
          0,
          "/images/apple_fruits.jpg",
          callback
        );
      },
      function (callback) {
        itemCreate(
          "Mango",
          "From Mexico",
          "0.86",
          "219",
          Categories[0],
          false,
          0,
          "/images/mango_fruits.jpg",
          callback
        );
      },

      // Create Meat Items
      function (callback) {
        itemCreate(
          "Pork",
          "500g",
          "4.49",
          "120",
          Categories[1],
          false,
          0,
          "/images/pork_meat.jpg",
          callback
        );
      },
      function (callback) {
        itemCreate(
          "Beef",
          "400g",
          "5.10",
          "97",
          Categories[1],
          false,
          0,
          "/images/beef_meat.jpg",
          callback
        );
      },
      function (callback) {
        itemCreate(
          "Chicken Wings",
          "600g",
          "3.99",
          "118",
          Categories[1],
          false,
          0,
          "/images/chickenwings_meat.jpg",
          callback
        );
      },

      // Create Fish Items
      function (callback) {
        itemCreate(
          "Salmon",
          "750g",
          "7.79",
          "14",
          Categories[2],
          false,
          0,
          "/images/salmon_fish.jpg",
          callback
        );
      },
      function (callback) {
        itemCreate(
          "Tuna",
          "450g",
          "4.15",
          "42",
          Categories[2],
          false,
          0,
          "/images/tuna_fish.jpg",
          callback
        );
      },
      // Create Vegetable Items
      function (callback) {
        itemCreate(
          "Tomato",
          "Packed with vitamins",
          "0.19",
          "440",
          Categories[3],
          false,
          0,
          "/images/tomato_vegetables.jpg",
          callback
        );
      },
      function (callback) {
        itemCreate(
          "Broccoli",
          "Good source of calcium",
          "0.34",
          "299",
          Categories[3],
          false,
          0,
          "/images/broccoli_vegetables.jpg",
          callback
        );
      },
      function (callback) {
        itemCreate(
          "Carrot",
          "Shopping for your pet rabbit",
          "0.12",
          "299",
          Categories[3],
          false,
          0,
          "/images/carrot_vegetables.jpg",
          callback
        );
      },
      // Create Bakery Items
      function (callback) {
        itemCreate(
          "Chocolate Cake",
          "Life is better after chocolate cake",
          "2.19",
          "44",
          Categories[4],
          false,
          0,
          "/images/chocolatecake_bakery.jpg",
          callback
        );
      },
      function (callback) {
        itemCreate(
          "Bread",
          "Hot and crunchy. Yummi!",
          "0.89",
          "140",
          Categories[4],
          false,
          0,
          "/images/bread_bakery.jpg",
          callback
        );
      },

      // Create Drinks Items
      function (callback) {
        itemCreate(
          "Water",
          "Classic botted water",
          "3.19",
          "120",
          Categories[5],
          false,
          0,
          "/images/water_drinks.jpg",
          callback
        );
      },

      // Create Dairy Items
      function (callback) {
        itemCreate(
          "Milk",
          "Lactose and gluten free",
          "1.34",
          "120",
          Categories[6],
          false,
          0,
          "/images/milk_dairy.jpg",
          callback
        );
      },

      // Create Health & Beauty Items
      function (callback) {
        itemCreate(
          "Lipstick",
          "Get ready to go out today",
          "6.90",
          "30",
          Categories[7],
          false,
          0,
          "/images/lipstick_healthandbeauty.jpg",
          callback
        );
      },
      function (callback) {
        itemCreate(
          "Body Wash",
          "Smell good, feel good...",
          "2.90",
          "45",
          Categories[7],
          false,
          0,
          "/images/bodywash_healthandbeauty.jpg",
          callback
        );
      },
    ],
    // optional callback
    cb
  );
}

// Populates DB with Categories and Items
async.series(
  [createCategories, createItems],
  // Optional callback
  function (err, results) {
    if (err) {
      console.log("FINAL ERR: " + err);
    } else {
      console.log("Items: " + Items);
    }
    // All done, disconnect from database
    mongoose.connection.close();
  }
);
