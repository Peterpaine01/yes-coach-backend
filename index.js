require("dotenv").config();
const express = require("express");
// const bp = require("body-parser");

const mongoose = require("mongoose");
const cors = require("cors");
const cloudinary = require("cloudinary").v2;

// Pour créer un serveur :
const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI);

// Je me connecte à mon compte cloudinary avec les identifiants présents sur mon compte
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

app.use(require("./routes/user"));
app.use(require("./routes/club"));
app.use(require("./routes/team"));
app.use(require("./routes/event"));

// -------- SET UP ----------

app.all("*", (req, res) => {
  res.status(404).json({ message: "This route does not exist" });
});

app.listen(process.env.PORT, () => {
  console.log("Server started");
});
