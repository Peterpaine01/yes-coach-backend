// J'importe mongoose pour pouvoir faire mongoose.model
const mongoose = require("mongoose");

// MODEL ROLE

const Role = mongoose.model("Role", {
  name: String,
  description: String,
  rights: String,
});

// Export du modèle
module.exports = Role;
