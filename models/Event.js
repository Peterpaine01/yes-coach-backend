// J'importe mongoose pour pouvoir faire mongoose.model
const mongoose = require("mongoose");

// MODEL EVENT

const Event = mongoose.model("Event", {
  name: String,
  type: String,
  description: Object,
  opponents: [String],
  start: Date,
  end: Date,
  meetPoint: String,
  meetHour: Number,
  location: String,
  isRecurrent: Boolean,
  Recurrency: {
    frequence: Number,
    start: Date,
    end: Date,
  },
  visibilityEvent: Boolean,
  visibilityPresences: Boolean,
  summons: Boolean,
  teamsSummoned: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
    },
  ],
  coachs: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  isPresent: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  isAbsent: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  isLate: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  isHurt: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  notSummons: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

// Export du modèle
module.exports = Event;
