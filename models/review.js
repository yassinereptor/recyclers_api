const mongoose = require('mongoose');

const {
    Schema
} = mongoose;

const ReviewSchema = new Schema({
    post_user_id: String,
    user_id: String,
    post_id: String,
    text: String,
    rate: Number
});

mongoose.model('Review', ReviewSchema);