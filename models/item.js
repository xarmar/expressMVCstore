var mongoose = require('mongoose');

var Schema = mongoose.Schema;

var ItemSchema = new Schema(
  {
    title: {type: String, required: true, maxLength: 40},
    description: {type: String, required: false, maxLength: 120},
    price: {type: Number, required: true, max: 9999},
    stock: {type: Number, required: true, max: 999},
    category: [{ type: Schema.Types.ObjectId, ref: "Category" }],
    promotion: {type: Boolean, required: true},
    discount: {type: Number, required: false, max: 100},
    imgUrl: {type: String, required: true}
  }
);

// Virtual for item's URL
ItemSchema
.virtual('url')
.get(function() {
  return '/item/' + this._id;
});

//Export model
module.exports = mongoose.model('Item', ItemSchema);