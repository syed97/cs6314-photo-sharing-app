"use strict";

const mongoose = require("mongoose");


/**
 * Define the Mongoose Schema for a Mention.
 */
const mentionSchema = new mongoose.Schema({
  // user id of the user mentioned
  user_id: mongoose.Schema.Types.ObjectId,
  display_name: String,
});

/**
 * Define the Mongoose Schema for a Comment.
 */
const commentSchema = new mongoose.Schema({
  // The text of the comment.
  comment: String,
  // The date and time when the comment was created.
  date_time: { type: Date, default: Date.now },
  // The ID of the user who created the comment.
  user_id: mongoose.Schema.Types.ObjectId,
  // deletion status of the comment
  is_delete: {type: Boolean, default: false},
  // Array of users mentioned in the photo
  mentions: [mentionSchema]
});

/**
 * Define the Mongoose Schema for a Photo.
 */
const photoSchema = new mongoose.Schema({
  // Name of the file containing the photo (in the project6/images directory).
  file_name: String,
  // The date and time when the photo was added to the database.
  date_time: { type: Date, default: Date.now },
  // The ID of the user who created the photo.
  user_id: mongoose.Schema.Types.ObjectId,
  // Array of comment objects representing the comments made on this photo.
  comments: [commentSchema],
  // deletion status of the photo
  is_delete: {type: Boolean, default: false}
});

/**
 * Create a Mongoose Model for a Photo using the photoSchema.
 */
const Photo = mongoose.model("Photo", photoSchema);

/**
 * Make this available to our application.
 */
module.exports = Photo;
