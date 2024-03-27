// J'importe mongoose pour pouvoir faire mongoose.model
const mongoose = require("mongoose");

// MODEL CLUB

const Club = mongoose.model("Club", {
  name: String,
  email: String,
  picture: Object,
  phone: String,
  color: String,
  joinCode: String,
  admins: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  members: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

// Export du modèle
module.exports = Club;
