// J'importe mongoose pour pouvoir faire mongoose.model
const mongoose = require("mongoose")

// Import du modèle User
const User = require("../models/User")

const isAuthenticated = async (req, res, next) => {
  //console.log(req.headers.authorization)
  // next();
  if (req.headers.authorization !== undefined) {
    // J'enlève 'Bearer ' de devant mon token
    const token = req.headers.authorization.replace("Bearer ", "")
    console.log("token >", token)

    // Je dois aller chercher dans la collection User, un document dont la clef token contient ma variable token
    const user = await User.findOne({ token: token }) // xK2puGAT3n7zlagBvsrapq3bLNtdVWdV6Umkj7YHv4anC2ANj-11Oz7BMyDDqij1
    console.log(user)

    // Si j'en trouve un j'appelle next
    if (user) {
      console.log("User is authenticated")
      // Ici je stocke les info du user dans req dans le but d'y avoir accès dans ma route
      req.user = user
      next()
    }

    // Si j'en trouve pas, je renvoie une erreur 401
    else {
      res.status(401).json({ message: "User doesn't exist. Sign up first." })
    }
  } else {
    return res.status(401).json({ message: "Authentication needed" })
  }
}

module.exports = isAuthenticated
