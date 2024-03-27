// J'importe mongoose pour pouvoir faire mongoose.model
const mongoose = require("mongoose");

// MODEL USER

const User = mongoose.model("User", {
  email: String,
  lastname: String,
  firstname: String,
  nickname: String,
  pronouns: String,
  avatar: Object,
  phone: String,
  birthdate: Date,
  arrival: Date,
  playerNumber: String,
  licenceNumber: String,
  height: Number,
  weight: Number,
  size: String,
  shoesSize: String,
  role: Array,
  unavailability: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Unavailability",
  },
  userPresences: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Presence",
    },
  ],
  userClubs: [
    // {
    //   club: {
    //     type: mongoose.Schema.Types.ObjectId,
    //     ref: "Club",
    //   },
    //   isAdmin: Boolean,
    //   clubRole: [
    //     {
    //       type: mongoose.Schema.Types.ObjectId,
    //       ref: "Role",
    //     },
    //   ],
    // },
    { type: mongoose.Schema.Types.ObjectId, ref: "Club" },
  ],
  userTeams: [
    {
      team: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Team",
      },
      isCoach: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Team",
        },
      ],
    },
  ],

  token: String,
  hash: String,
  salt: String,
});

// Export du modèle
module.exports = User;
