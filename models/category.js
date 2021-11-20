const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const CategorySchema = new Schema(
  {
    title: {type: String, required: true, maxLength: 20},
    description: {type: String, required: true, maxLength: 90},
    imgUrl: {type: String, required: true},
  }
);

// Virtual for machine title
CategorySchema.virtual('machine_title')
.get(function() {
  return this.title.toLowerCase().split(" ").join("")
});

// Virtual for category's URL
CategorySchema.virtual('url')
.get(function() {
  return `/inventory/category/${this.machine_title}/${this._id}`
});

// Virtual for machine title
CategorySchema.virtual('image_path')
.get(function() {
  return `public/images/${this.title.toLowerCase().split(" ").join("")}_category.jpg`
});

//Export model
module.exports = mongoose.model('Category', CategorySchema);