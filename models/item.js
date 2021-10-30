var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ItemSchema = new Schema(
  {
    title: {type: String, required: true, maxLength: 100},
    description: {type: String, required: false, maxLength: 800},
    price: {type: Number, required: true},
    stock: {type: Number, required: true},
    category: {type: String, required: true, maxLength: 45},
    promotion: {type: Boolean, required: true},
    discount: {type: Number, required: false, max: 100},
    imgUrl: {type: String, required: true}
  }
);

// Virtual for item's URL
ItemSchema
.virtual('url')
.get(() => {
  return '/' + this.category + '/' + this._id;
});

//Export model
module.exports = mongoose.model('Item', ItemSchema);