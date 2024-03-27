// J'importe mongoose pour pouvoir faire mongoose.model
const mongoose = require("mongoose");

// MODEL TEAM

const Team = mongoose.model("Team", {
  name: String,
  sport: String,
  genre: String,
  ageCategory: String,
  level: String,
  picture: Object,
  color: String,
  teamClub: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Club",
  },
  coachs: [
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
module.exports = Team;
