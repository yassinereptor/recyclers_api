const mongoose = require('mongoose');

const {
    Schema
} = mongoose;

const ProductSchema = new Schema({
    user_id: String,
    user_name: String,
    title: String, 
    desc: String,
    unit: Number,
    cat: Number,
    price: Number,
    quantity: Number,
    quality: Number,
    fix: Boolean,
    bid: Boolean,
    images: Array,
    bid_list: Array,
    time: String,
    lat: String,
    lng: String,
    pos: String,
});

mongoose.model('Product', ProductSchema);