var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var CategorySchema = new Schema(
  {
    title: {type: String, required: true, maxLength: 40},
    description: {type: String, required: true, maxLength: 120},
    imgUrl: {type: String, required: true},
  }
);

// Virtual for category's URL
CategorySchema.virtual('url')
.get(function() {
  return 'shop/category/' + this.title.toLowerCase().split(" ").join("") + '/' + this._id;
});

//Export model
module.exports = mongoose.model('Category', CategorySchema);