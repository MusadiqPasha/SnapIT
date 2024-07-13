const express = require("express");
const session = require("express-session");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const multer = require("multer");
const fs = require("fs");
const path = require("path"); // Import path module for file paths
const app = express();

const crypto = require("crypto");
const generateSecretKey = () => {
  return crypto.randomBytes(32).toString("hex");
};

app.use(
  session({
    secret: generateSecretKey(),
    resave: true,
    saveUninitialized: true,
  })
);

app.set("view engine", "ejs");
app.use(express.static("public/data"));
app.use(express.static("public"));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ extended: false }));

// Create a schema for the images
const imageSchema = new mongoose.Schema({
  data: String,
});

const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Serve mainpage.html when the root path is accessed
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "mainpage.html"));
});

// Serve mainpage.html when /mainpage.html path is accessed
app.get("/mainpage.html", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "mainpage.html"));
});

app.get("/login.html", (req, res) => {
  const errorMessage = req.query.error; // Get the error message from the query parameters
  res.sendFile("/login.html", { errorMessage });
});

// MongoDB connection and User model

mongoose.connect("mongodb://localhost:27017/SnapIT", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on("error", () => console.log("Error in Connecting to Database"));
db.once("open", () => console.log("Connected to Database"));

const User = mongoose.model("User", {
  username: String,
  phone: String,
  email: String,
  password: String,
  dob: String,
  gender: String,
  location: String,
  image: {
    data: String,
  },
  friends: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
});

app.get("/finalInterface", (req, res) => {
  const userID = req.session.user ? req.session.user._id : null;
  res.render("finalInterface", { userID });
});

app.get("/chat", (req, res) => {
  const userID = req.session.user ? req.session.user._id : null;
  res.render("chat", { userID });
});

app.post("/saveSnapshot", async (req, res) => {
  try {
    const { image } = req.body;
    const userID = req.session.user ? req.session.user._id : null;
    // Fetch the username from the user session
    const username = req.session.user ? req.session.user.username : null;
    // Decode base64 image data
    const imageData = Buffer.from(
      image.replace(/^data:image\/\w+;base64,/, ""),
      "base64"
    );

    // Get the data folder path
    const dataFolderPath = path.join(__dirname, "public/data");
    console.log(dataFolderPath);
    // Create the data folder if it doesn't exist
    if (!fs.existsSync(dataFolderPath)) {
      fs.mkdirSync(dataFolderPath);
    }

    // Save the image with the user-specified name
    const filePath = path.join(dataFolderPath, `${username}.png`);
    fs.writeFileSync(filePath, imageData);

    console.log(`Snapshot saved for user ${username} at ${filePath}`);
    res.status(200).send("Snapshot saved successfully.");
  } catch (error) {
    console.error("Error saving snapshot:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get(
  "D:/YEAR 2/SEM 3/Web Technologies/SnapIT/finalcodeez/data/username",
  (req, res) => {
    // Add this route to serve images
    const { username } = req.params;
    // Get the data folder path
    const dataFolderPath = path.join(__dirname, "data");
    const filePath = path.join(dataFolderPath, `${username}.png`);

    // Check if the file exists
    if (fs.existsSync(filePath)) {
      // Read the file and send it as a response
      const image = fs.readFileSync(filePath);
      res.writeHead(200, { "Content-Type": "image/png" });
      res.end(image, "binary");
    } else {
      // Return a placeholder image or a 404 response
      res.status(404).send("Image not found");
    }
  }
);

app.post("/login.html", (req, res) => {
  const { username, password } = req.body;

  // Find a user with the provided username and password
  User.findOne({ username, password })
    .then((user) => {
      if (user) {
        console.log("User logged in:", user);

        // Set the user property in the session
        req.session.user = user;

        return res.redirect("/finalInterface.html"); // Redirect to mainpage.html
      } else {
        console.error("Invalid username or password");
    
        // Redirect with error message as a query parameter
        return res.redirect("/login.html?error=Invalid username or password");
      }
    })
    .catch((err) => {
      console.error(err);

      return res.status(500).send("Error occurred while validating user data.");
    });
});

app.get("/getFriends", async (req, res) => {
  const userID = req.session.user ? req.session.user._id : null;

  try {
    // Fetch the user data from the database, including the populated friends field
    const user = await User.findById(userID).populate("friends");

    // Extract the friend data from the user object
    const friends = user.friends.map((friend) => ({
      username: friend.username,
      _id: friend._id,
    }));

    // Return the list of friends
    console.log("Friends fetched hehe:", friends);
    res.json({ friends });
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Handle the /addFriends endpoint
app.post("/addFriends", (req, res) => {
  const { friendList } = req.body;
  const userID = req.session.user ? req.session.user._id : null;
  // Update the friends array for the current user (replace 'currentUserId' with the actual user ID)
  User.updateOne(
    { _id: userID },
    { $addToSet: { friends: { $each: friendList } } }
  )
    .then(() => {
      console.log("Friends added successfully", friendList);
      res.status(200).send("Friends added successfully");
    })
    .catch((error) => {
      console.error("Error adding friends:", error);
      res.status(500).send("Internal Server Error");
    });
});

app.post("/signup.html", async (req, res) => {
  const { username, phone, email, password, dob, gender, location } = req.body;

  try {
    // Check if the username already exists
    const existingUser = await User.findOne({ username });

    if (existingUser) {
      console.log("username already taken");

      return res.redirect("/signup.html");
      // Username is already taken, send a response to the client
    }

    // Create a new user
    const user = new User({
      username,
      phone,
      email,
      password,
      dob,
      gender,
      location,
    });

    // Save the user data
    const savedUser = await user.save();

    console.log("User data saved:", savedUser);
    return res.redirect("/login.html"); // Redirect to login page
  } catch (error) {
    console.log("username already taken");
    console.error("Error occurred while saving user data:", error);
    return res.redirect("/signup.html");
  }
});

app.get("/viewprofile", async (req, res) => {
  const userID = req.session.user ? req.session.user._id : null;

  if (!userID) {
    // Redirect to login if the user is not authenticated
    return res.redirect("/login.html");
  }

  try {
    // Fetch the user data from the database
    const user = await User.findById(userID);

    if (!user) {
      // Redirect to login if the user is not found
      return res.redirect("/login.html");
    }

    // Render the viewprofile page with the user data
    res.render("viewprofile", { user });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/searchresults", async (req, res) => {
  try {
    const { name } = req.query;

    // Perform a case-insensitive search for users with the provided name
    const users = await User.find({
      username: { $regex: new RegExp(name, "i") },
    });

    // Render the search results page with the list of users
    res.render("searchresults", { users, searchQuery: name });
  } catch (error) {
    console.error("Error searching for users:", error);
    res.status(500).send("Internal Server Error");
  }
});

app.get("/getFriends", async (req, res) => {
  const userID = req.session.user ? req.session.user._id : null;

  try {
    // Fetch the user data from the database, including the populated friends field
    const user = await User.findById(userID).populate("friends");

    // Extract the friend data from the user object
    const friends = user.friends.map((friend) => ({
      username: friend.username,
    }));

    // Return the list of friends
    res.json({ friends });
  } catch (error) {
    console.error("Error fetching friends:", error);
    res.status(500).send("Internal Server Error");
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Listening on PORT ${port}`);
});
