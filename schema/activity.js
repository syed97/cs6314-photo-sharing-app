"use strict";

const mongoose = require("mongoose");

/**
 * Define the Mongoose Schema for Activity.
 */
const activitySchema = new mongoose.Schema({
    username: {
        type: String,
        required: true,
    },
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    activity_type: {
        type: String,
        required: true,
        enum: ['new_photo', 'new_comment', 'login', 'logout', 'register'], // Enforce valid activity types
    },
    activity_date: {
        type: Date,
        default: Date.now, // Automatically set the date and time of the activity
    },
    activity_info: {
        type: mongoose.Schema.Types.Mixed, // Allows flexible structure for activity-specific info
        default: null, // For cases like login where there's no specific info
    },
});

/**
 * Create a Mongoose Model for an Activity using the activitySchema.
 */
const Activity = mongoose.model("Activity", activitySchema);

/**
 * Make this available to our application.
 */
module.exports = Activity;
