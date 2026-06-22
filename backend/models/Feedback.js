const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema({

    rating: {
        type: Number,
        required: true
    },

    complaintId: {
        type: String,
        required: true
    },

    feedback: {
        type: String,
        required: true
    },

    createdAt: {
        type: Date,
        default: Date.now
    }

});

module.exports =
    mongoose.model(
        "Feedback",
        feedbackSchema
    );