/**
 * This builds on the webServer of previous projects in that it exports the
 * current directory via webserver listing on a hard code (see portno below)
 * port. It also establishes a connection to the MongoDB named 'project6'.
 *
 * To start the webserver run the command:
 *    node webServer.js
 *
 * Note that anyone able to connect to localhost:portNo will be able to fetch
 * any file accessible to the current user in the current directory or any of
 * its children.
 *
 * This webServer exports the following URLs:
 * /            - Returns a text status message. Good for testing web server
 *                running.
 * /test        - Returns the SchemaInfo object of the database in JSON format.
 *                This is good for testing connectivity with MongoDB.
 * /test/info   - Same as /test.
 * /test/counts - Returns the population counts of the project6 collections in the
 *                database. Format is a JSON object with properties being the
 *                collection name and the values being the counts.
 *
 * The following URLs need to be changed to fetch there reply values from the
 * database:
 * /user/list         - Returns an array containing all the User objects from
 *                      the database (JSON format).
 * /user/:id          - Returns the User object with the _id of id (JSON
 *                      format).
 * /photosOfUser/:id  - Returns an array with all the photos of the User (id).
 *                      Each photo should have all the Comments on the Photo
 *                      (JSON format).
 */

const mongoose = require("mongoose");
mongoose.Promise = require("bluebird");

const session = require("express-session");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path"); // To work with file paths


// const async = require("async");

const express = require("express");
const app = express();

// Configure multer to store files in memory
const upload = multer({ storage: multer.memoryStorage() });

const fs = require("fs");

// Load the Mongoose schema for User, Photo, and SchemaInfo
const User = require("./schema/user.js");
const Photo = require("./schema/photo.js");
const SchemaInfo = require("./schema/schemaInfo.js");
const Activity = require("./schema/activity.js");

// XXX - Your submission should work without this line. Comment out or delete
// this line for tests and before submission!
// const models = require("./modelData/photoApp.js").models;
mongoose.set("strictQuery", false);
mongoose.connect("mongodb://127.0.0.1/project6", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// We have the express static module
// (http://expressjs.com/en/starter/static-files.html) do all the work for us.
app.use(express.static(__dirname));
// for sessions
app.use(session({secret: "secretKey", resave: false, saveUninitialized: false}));
app.use(bodyParser.json());

app.get("/", function (request, response) {
  response.send("Simple web server of files from " + __dirname);
});

/**
 * Use express to handle argument passing in the URL. This .get will cause
 * express to accept URLs with /test/<something> and return the something in
 * request.params.p1.
 * 
 * If implement the get as follows:
 * /test        - Returns the SchemaInfo object of the database in JSON format.
 *                This is good for testing connectivity with MongoDB.
 * /test/info   - Same as /test.
 * /test/counts - Returns an object with the counts of the different collections
 *                in JSON format.
 */


// helper methods
async function addActivity(activityObj) {
  try {
    const userDetails = await User.findOne({login_name: activityObj.username}, {_id: 1, first_name: 1, last_name: 1});
    const username = `${userDetails.first_name} ${userDetails.last_name}` || "null";
    const newActivity = new Activity({
      username: username,
      user_id: userDetails._id,
      activity_type: activityObj.activity_type,
      activity_date: activityObj.activity_date || Date.now(),
      activity_info: activityObj.activity_info
    });
    await newActivity.save();
  } catch (err) {
    console.error("Error adding activity:", err);
  }
}

// handle /test route
app.get("/test", async function (request, response) {
  try{
    const info = await SchemaInfo.find({});
    if (info.length === 0) {
          // No SchemaInfo found - return 500 error
          return response.status(500).send("Missing SchemaInfo");
    }
    console.log("SchemaInfo", info[0]);
    return response.json(info[0]); // Use `json()` to send JSON responses
  } catch(err){
    // Handle any errors that occurred during the query
    console.error("Error in /test", err);
    return response.status(500).json(err); // Send the error as JSON
  }
});

// handle /test/<param> route
app.get("/test/:p1", async function (request, response) {
  // Express parses the ":p1" from the URL and returns it in the request.params
  // objects.
  console.log("/test called with param1 = ", request.params.p1);

  const param = request.params.p1 || "info";
  console.log("param ", param);

  if (param === "info") {
    // Fetch the SchemaInfo. There should only one of them. The query of {} will
    // match it.
    try{

      const info = await SchemaInfo.find({});
      if (info.length === 0) {
            // No SchemaInfo found - return 500 error
            return response.status(500).send("Missing SchemaInfo");
      }
      console.log("SchemaInfo", info[0]);
      return response.json(info[0]); // Use `json()` to send JSON responses
    } catch(err){
      // Handle any errors that occurred during the query
      console.error("Error in /test/info:", err);
      return response.status(500).json(err); // Send the error as JSON
    }

  } else if (param === "counts") {
   // If the request parameter is "counts", we need to return the counts of all collections.
// To achieve this, we perform asynchronous calls to each collection using `Promise.all`.
// We store the collections in an array and use `Promise.all` to execute each `.countDocuments()` query concurrently.
   
    
const collections = [
  { name: "user", collection: User },
  { name: "photo", collection: Photo },
  { name: "schemaInfo", collection: SchemaInfo },
];

try {
  await Promise.all(
    collections.map(async (col) => {
      col.count = await col.collection.countDocuments({});
      return col;
    })
  );

  const obj = {};
  for (let i = 0; i < collections.length; i++) {
    obj[collections[i].name] = collections[i].count;
  }
  return response.end(JSON.stringify(obj));
} catch (err) {
  return response.status(500).send(JSON.stringify(err));
}
  } else {
    // If we know understand the parameter we return a (Bad Parameter) (400)
    // status.
    return response.status(400).send("Bad param " + param);
  }
});


// middleware to test if authenticated
function isAuthenticated(req, res, next) {
  // Check if there is a user object in the session
  if (req.session.user) {
    return next(); // If authenticated, move to the next middleware or route handler
  }
  return res.status(401).send("Not authenticated"); // If not, send a 401 response
}


/**
 * URL /user/list - Returns all the User objects.
 */
app.get("/user/list", isAuthenticated, async function (request, response) {
  try {
    // const users = await User.find().select("_id first_name last_name");
    const users = await User.find({},{_id: 1, first_name: 1, last_name: 1});
    if (users.length === 0){
      return response.status(400).send("No users found");
    }
    return response.status(200).json(users);
  } catch(err) {
    return response.status(500).send(JSON.stringify(err));
  }
});

/**
 * URL /user/:id - Returns the information for User (id).
 */
app.get("/user/:id", isAuthenticated, async function (request, response) {
  const id = request.params.id;
  try {
    const user = await User.findById(id, 
      {first_name: 1, 
      last_name: 1, 
      occupation: 1, 
      location: 1,
      description: 1});
    delete user.__v; //remove extra field added by Mongoose
    return response.json(user);
  } catch(err) {
    return response.status(400).send('Invalid user ID');
  }
});

/**
 * URL /photosOfUser/:id - Returns the Photos for User (id).
 */
app.get("/photosOfUser/:id", isAuthenticated, async function (request, response) {
  const userId = request.params.id;
  const photosQuery = Photo.find({user_id: userId}, {_id: 1, user_id: 1, file_name: 1, date_time: 1, comments: 1, is_delete: 1});
  
  try {
    // retrieve photos for the given user id
    const photos = await photosQuery;

    // collect all unique user_ids from comments across photos
    const userIdsInComments = new Set();
    photos.forEach(photo => {
      photo.comments.forEach(comment => {
        userIdsInComments.add(comment.user_id.toString());
      });
    });

    // retrieve user information for all unique comment user_ids
    const commenters = await User.find({ _id: { $in: Array.from(userIdsInComments) } })
                            .select("_id first_name last_name").lean();
    
    // commenter info table for lookup
    const commentersMap = commenters.reduce((table, item) => {
      table[item._id.toString()] = item;
      return table;
    }, {});

    // make response object that is consistent with frontend
    const responseObject = photos.map(photo => {
      return {
        _id: photo._id,
        file_name: photo.file_name,
        date_time: photo.date_time,
        user_id: photo.user_id,
        is_delete: photo.is_delete,
        comments: photo.comments.map(comment => (
          {
            _id: comment._id,
            date_time: comment.date_time,
            comment: comment.comment,
            is_delete: comment.is_delete,
            user: commentersMap[comment.user_id]
          }
        ))
      };
    });
    // return response object
    return response.json(responseObject);
  } catch(err) {
    return response.status(400).send('Invalid user ID');
  }
});

/** 
 * URL /photo/:photo_id - get the image file corresponding to the id
 */
app.get("/photo/:photo_id", isAuthenticated, async function(request, response){
  const photoId = request.params.photo_id;
  const photo = await Photo.findById(photoId, {file_name: 1, _id: 0});
  if (!photo) {
    return response.status(404).send("Photo not found.");
  }
  // Check if the file exists and serve it
  const filePath = path.join(__dirname, 'images', photo.file_name);
  if (fs.existsSync(filePath)) {
    response.sendFile(filePath); // Send the file to the frontend
  } else {
    return response.status(404).send("Photo file not found on server.");
  }
  return undefined;
});


/** 
 * DELETE /photo/:photo_id - delete the photo corresponding to the photo id
 */
app.delete("/photo/:photo_id", isAuthenticated, async function(request, response){
  const photo_id = request.params.photo_id;
  try {
    // Ensure the photo exists and retrieve its data
    const photo = await Photo.findById(photo_id, {user_id: 1, file_name: 1});
    if (!photo) {
        return response.status(404).send('Photo not found');
    }
    // Optional: Check if the logged-in user is the owner of the photo
    if (photo.user_id.toString() !== request.session.user.id) {
        return response.status(403).send('Unauthorized to delete this photo');
    }

    // Soft delete the photo document
    photo.is_delete = true;
    await photo.save();

    response.status(200).send('Photo deleted successfully');
  } catch (err) {
      console.error('Error deleting photo:', err);
      response.status(500).send({ error: 'Internal Server Error' });
  }
  return undefined; // for linter
});

/**
 * DELETE /comment/:comment_id - delete comment corresponding to the comment id
 */
app.delete("/comment/:comment_id", isAuthenticated, async function(request, response){
  const comment_id = request.params.comment_id;

  try {
    // Find the photo containing the comment and update the comment's `is_delete` field
    const result = await Photo.updateOne(
      { "comments._id": comment_id }, // Locate the photo with the specific comment
      { $set: { "comments.$.is_delete": true } } // Update the `is_delete` field for the specific comment
    );

    if (result.modifiedCount === 0) {
      return response.status(404).send("Comment not found");
    }

    response.status(200).send("Comment deleted successfully");
  } catch (error) {
    console.error("Error deleting comment:", error);
    response.status(500).send("An error occurred while deleting the comment");
  }
  return undefined;
});


/**
 * DELETE /deleteUser/:user_id - delete user account
 */
app.delete("/deleteUser/:user_id", isAuthenticated, async function(request, response){
  const user_id = request.params.user_id;

  const mongoSession = await mongoose.startSession();
  mongoSession.startTransaction();

  try {
    // handle user data deletion //
    // delete user photos
    await Photo.deleteMany({user_id: user_id});

    // delete user comments
    await Photo.updateMany(
      { "comments.user_id": user_id }, // Find photos with comments by this user
      {
        $pull: { comments: { user_id: user_id } }, // Remove those comments
      }
    );

    // delete user activities
    await Activity.deleteMany({user_id: user_id});

    // delete user itself
    await User.deleteMany({_id: user_id});

    await mongoSession.commitTransaction();
    mongoSession.endSession();

    // Clear session data to log the user out
    request.session.destroy(function(err) {
      if (err) {
        console.error("Error during session destruction:", err);
        return response.status(500).send("Server error during logout");
      }
      return undefined;
    });

    // Respond with a signal to log out
    response.status(200).json({ message: "User and associated data deleted successfully.", logout: true });
  } catch (err) {
      await mongoSession.abortTransaction();
      mongoSession.endSession();
      response.status(500).send('Failed to delete user and associated data.');
  }
});

// POST /commentsOfPhoto/:photo_id - Add a comment to the photo
app.post("/commentsOfPhoto/:photo_id", isAuthenticated, async (req, res) => {
  const { photo_id } = req.params;
  let { comment, mentions } = req.body;
  const loggedInUser = req.session.user;  // Get the logged-in user from the session

  // Check if comment is empty or missing
  if (!comment || comment.trim().length === 0) {
    return res.status(400).send({ error: "Comment cannot be empty." });
  }

  // set mentions to null if not present in the comment
  if (!mentions || mentions.length === 0) {
    mentions = null;  // Setting mentions to null if no mentions
  }

  try {
    // Find the photo by its ID
    const photo = await Photo.findById(photo_id);

    if (!photo) {
      return res.status(404).send({ error: "Photo not found." });
    }

    // Create a new comment object
    const newComment = {
      _id: new mongoose.Types.ObjectId(),
      comment: comment,
      date_time: new Date().toISOString(),
      user_id: loggedInUser.id,
      mentions: mentions
    };

    // Add the comment to the photo's comments array
    photo.comments.push(newComment);
    // Save the photo document with the new comment
    await photo.save();

    // fetch first and last name for display
    const commenterDetails = await User.findById(loggedInUser.id, {first_name: 1, last_name: 1});

    // add comment added activity
    const activityObj = {
      username: req.session.user.login_name,
      activity_type: "new_comment",
      activity_info: {photo_id: photo_id, comment: comment}
    };
    await addActivity(activityObj);

    // Respond with the updated comment
    return res.status(200).json({
      _id: newComment._id,
      comment: newComment.comment,
      date_time: newComment.date_time,
      user: commenterDetails
    });

  } catch (err) {
    console.error("Error adding comment:", err);
    return res.status(500).send({ error: "Server error while adding comment." });
  }
});

// GET /mostRecentPhoto/:user_id - get most recenlty uploaded photo for the user
app.get("/mostRecentPhoto/:user_id", isAuthenticated, async function(request, response){
  const { user_id } = request.params;
  const photoQuery = await Photo.aggregate([
    // Stage 1: Match the documents where the user_id matches the given value
    {
      $match: { user_id: new mongoose.Types.ObjectId(user_id) }
    },
    // Stage 2: Sort the documents by "date_time" in descending order
    {
      $sort: { date_time: -1 }
    },
    // Stage 3: Limit the result to 1 document (most recent photo)
    {
      $limit: 1
    },
    //  Projected fields
    {
      $project: {
        _id: 1,
        file_name: 1,      
        date_time: 1,      
        user_id: 1
      }
    }
  ]);
  if (!photoQuery || photoQuery === null){
    return response.status(404).send("Photo not found");
  }
  const mostRecentPhoto = photoQuery[0];
  return response.status(200).json(mostRecentPhoto);
});


// GET /mostCommentsPhoto/:user_id - get the photo with the most comments on it
app.get("/mostCommentsPhoto/:user_id", isAuthenticated, async function(request, response){
  const { user_id } = request.params;

  const photoQuery = await Photo.aggregate([
    // Match photos for the specific user_id and not marked as deleted
    {
      $match: {
        user_id: new mongoose.Types.ObjectId(user_id),
        is_delete: false
      }
    },
    // Add a field for the count of non-deleted comments
    {
      $addFields: {
        commentCount: {
          $size: {
            $filter: {
              input: "$comments",
              as: "comment",
              cond: { $eq: ["$$comment.is_delete", false] }
            }
          }
        }
      }
    },
    // Sort photos by the commentCount field in descending order
    {
      $sort: {
        commentCount: -1
      }
    },
    // Limit the result to only the photo with the highest comment count
    {
      $limit: 1
    },
		{
      $project: {
        _id: 1,            
        file_name: 1,      
        date_time: 1,      
        user_id: 1,        
        commentCount: 1
      }
    }
  ]);
  if (!photoQuery || photoQuery === null){
    return response.status(404).send("Photo not found");
  }
  const photoWithMostComments = photoQuery[0];
  return response.status(200).json(photoWithMostComments);
});


//GET /mentionedPhotos/:user_id - get all photos where the user indicated by the user_id is mentioned
app.get("/mentionedPhotos/:user_id", isAuthenticated, async (request, response) => {
  const user_id = request.params.user_id;

  try {
    // search for photos with mentions
    const photosWithMentions = await Photo.find({
      comments: {
        $elemMatch: {
          is_delete: false,
          mentions: {
            $elemMatch: {
              user_id: new mongoose.Types.ObjectId(user_id)
            }
          }
        }
      }
    }, {_id: 1, file_name: 1, user_id: 1});
    if (!photosWithMentions || photosWithMentions.length === 0) {
      return response.status(200).send({message: "No Mentions Yet"});
    }
    // photo thumbnail, name, user_id
    // Prepare the response data
    const photosResponse = [];

    await Promise.all(
      photosWithMentions.map(async (photo) => {
        // Fetch user name
        const user = await User.findById(photo.user_id, { first_name: 1, last_name: 1, _id: 0 }).lean();
        photosResponse.push({
          photo_id: photo._id,
          file_name: photo.file_name,
          user_id: photo.user_id,
          user_name: `${user?.first_name || "Unknown"} ${user?.last_name || ""}`.trim(),
        });
      })
    );

    // Send the response data as JSON
    return response.status(200).json(photosResponse);
  } catch (error) {
    console.error(error);
  }
  return undefined;
});

// add new photo
app.post("/photos/new", isAuthenticated, upload.single("uploadedphoto"), async (req, res) => {
  if (!req.file) {
    return res.status(400).send("No file uploaded.");
  }
  try {
    // Generate a unique file name to avoid conflicts
    const timestamp = Date.now();
    const filename = `U${timestamp}${req.file.originalname}`;

    // Write the file to the "images" directory
    fs.writeFile("./images/" + filename, req.file.buffer, async (err) => {
      if (err) {
        return res.status(500).send({ error: "Error saving file." });
      }

      // Create a new photo document in the database
      const photo_id = new mongoose.Types.ObjectId();
      const newPhoto = new Photo({
        _id: photo_id,
        user_id: req.session.user.id,
        file_name: filename,
        date_time: new Date().toISOString(),
      });

      await newPhoto.save();

      // record new photo addition
      const activityObj = {
        username: req.session.user.login_name,
        activity_type: "new_photo",
        activity_info: {photo_id: photo_id}
      };
      await addActivity(activityObj);

      // respond with the photo data
      res.status(200).json({
        _id: newPhoto._id,
        file_name: newPhoto.file_name,
        date_time: newPhoto.date_time,
      });
      return undefined; // for linter
    });
  } catch (error) {
    console.error("Error uploading photo:", error);
    res.status(500).send("Server error while uploading photo.");
  }
  return undefined;
});

// fetch activities in sorted order
app.get("/activities", isAuthenticated, async(request, response) => {
  const activities = await Activity.find().sort({ activity_date: -1 }).limit(5);
  if (!activities) { // Assuming plaintext for example (not secure)
    return response.status(404).send("No activities found");
  }
  return response.status(200).json(activities);
});

// login and logout
app.post("/admin/login", async function(request, response) {
  const {login_name, password} = request.body;

  try {
    // Check if user exists with provided login_name
    const user = await User.findOne({login_name: login_name}, {_id: 1, login_name: 1, first_name: 1, password: 1 });

    if (!user) { // Assuming plaintext for example (not secure)
      return response.status(400).json({ message: "Invalid username or password" });
    }

    if (password !== user.password) {
      return response.status(400).json({ message: "Invalid username or password" });
    }

    // Save the user ID in the session
    request.session.user = { id: user._id, login_name: user.login_name };
    request.session.save();

    // add login activity
    const activityObj = {
      username: request.session.user.login_name,
      activity_type: "login",
      activity_info: null
    };
    await addActivity(activityObj); // Await to ensure proper execution

    // return response with some user data
    return response.status(200).json({ _id: user._id, login_name: user.login_name, first_name: user.first_name });
  } catch (err) {
    console.error("Login error:", err);
    return response.status(500).send("Server error during login");
  }
});


// logout
app.post("/admin/logout", async function(request, response) {
  // Check if a user is logged in (session exists)
  if (!request.session.user) {
    // Return 400 if user is not logged in
    return response.status(400).send("Bad request: No user is currently logged in");
  }

  // record logout activity
  const activityObj = {
    username: request.session.user.login_name,
    activity_type: "logout",
    activity_info: null
  };
  await addActivity(activityObj); 

  // Clear session data to log the user out
  request.session.destroy(function(err) {
    if (err) {
      console.error("Error during session destruction:", err);
      return response.status(500).send("Server error during logout");
    }
    
    // Send a success response
    return response.status(200).send("Logout successful");
  });
  return undefined;
});


// new user registration endpoint
/**
 * URL /user - Registers a new user.
 * Accepts a JSON body with the following properties:
 * login_name, password, first_name, last_name, location, description, occupation
 */
app.post("/user", async (req, res) => {
  const { login_name, password, first_name, last_name, location, description, occupation } = req.body;

  // Validate required fields
  if (!login_name || typeof login_name !== "string") {
    return res.status(400).json({errorMessage: "login_name must be a non-empty string."});
  }
  if (!password || typeof password !== "string") {
    return res.status(400).json({errorMessage: "Password must be a non-empty string."});
  }
  if (!first_name || typeof first_name !== "string") {
    return res.status(400).json({errorMessage: "First name must be a non-empty string."});
  }
  if (!last_name || typeof last_name !== "string") {
    return res.status(400).json({errorMessage: "Last name must be a non-empty string."});
  }

  try {
    // Check if login_name already exists
    const existingUser = await User.findOne({ login_name: login_name });
    if (existingUser) {
      return res.status(400).json({errorMessage: "The Username is already taken."});
    }

    // Create new user object
    const newUser = new User({
      login_name,
      password, // In real-world applications, hash the password using bcrypt or similar library
      first_name,
      last_name,
      location: location || "", // Default to empty string if not provided
      description: description || "",
      occupation: occupation || "",
    });

    // Save user to database
    await newUser.save();

    // record registration activity
    const activityObj = {
      username: login_name,
      activity_type: "register",
      activity_info: null
    };
    await addActivity(activityObj); 

    // Send success response
    return res.status(200).json({
      _id: newUser._id,
      login_name: newUser.login_name,
      first_name: newUser.first_name,
      last_name: newUser.last_name,
    });
  } catch (err) {
    console.error("Error registering user:", err);
    return res.status(500).send("Internal server error.");
  }
});


const server = app.listen(3000, function () {
  const port = server.address().port;
  console.log(
    "Listening at http://localhost:" +
      port +
      " exporting the directory " +
      __dirname
  );
});
