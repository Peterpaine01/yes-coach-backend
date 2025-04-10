const express = require("express")
const router = express.Router()

const uid2 = require("uid2")
const SHA256 = require("crypto-js/sha256")
const encBase64 = require("crypto-js/enc-base64")

// Import utils
const generateAuth = require("../utils/auth")
const { success, error } = require("../utils/response")

// Import middlewares
const isAuthenticated = require("../middlewares/isAuthenticated")

// Import modèle User & Club
const User = require("../models/User")
const Club = require("../models/Club")
const Team = require("../models/Team")

const cloudinary = require("cloudinary").v2
const convertToBase64 = require("../utils/convertToBase64")

// ----------- SIGNUP -----------
const signup = async (req, res) => {
  try {
    const { email, firstname, lastname, password } = req.body

    // Aller regarder dans la collection si je trouve un utilisateur avec cet email
    const existingUser = await User.findOne({ email: email })
    // Si on en trouve un utilisateur => erreur
    if (existingUser !== null) {
      // error 409 = conflit
      return res.status(409).json({
        message: "User already exists",
      })
    }
    // On vérifie que le nom d'utilisateur a bien était passé en body
    if (!email || !password || !firstname || !lastname) {
      return res.status(400).json({ message: "all fields are required" })
    }

    const { salt, hash, token } = generateAuth(password)

    const newUser = new User({
      email: email,
      firstname: firstname,
      lastname: lastname,
      hash: hash,
      salt: salt,
      token: token,
    })

    // J'enregistre toutes les infos qu'on a créées et reçues en BDD SAUF LE MOT DE PASSE
    await newUser.save()

    const displayUser = {
      _id: newUser["_id"],
      email: newUser["email"],
      firstname: newUser["firstname"],
      lastname: newUser["lastname"],
      token: newUser["token"],
    }
    // Je répond à l'utilisateur tout sauf le SALT et le HASH car ce sont des données sensibles

    res.status(201).json(displayUser)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ----------- SIGNUP WITH JOIN CODE -----------
const signupWithCode = async (req, res) => {
  try {
    const { email, firstname, lastname, password } = req.body

    //   const clubFound = await Club.findOne({ joinCode: joinCode });

    // Aller regarder dans la collection si je trouve un utilisateur avec cet email
    const userFound = await User.findOne({ email: email })
    // Si on en trouve un utilisateur => erreur
    if (userFound !== null) {
      // error 409 = conflit
      return res.status(409).json({
        message: "User already exists",
      })
    }
    // On vérifie que le nom d'utilisateur a bien était passé en body
    if (!firstname && !lastname) {
      return res
        .status(400)
        .json({ message: "firstname and lastname are required" })
    }

    const { salt, hash, token } = generateAuth(password)

    const newUser = new User({
      email: email,
      firstname: firstname,
      lastname: lastname,
      hash: hash,
      salt: salt,
      token: token,
    })

    // J'enregistre toutes les infos qu'on a créées et reçues en BDD SAUF LE MOT DE PASSE
    await newUser.save()

    // si
    const joinCode = req.params.code
    const club = await Club.findOne({ joinCode: joinCode })
    let clubName = null
    if (club) {
      club.members.push(newUser._id)
      await club.save()
      clubName = club.name
    }

    const displayUser = {
      _id: newUser["_id"],
      email: newUser["email"],
      firstname: newUser["firstname"],
      lastname: newUser["lastname"],
      token: newUser["token"],
      club: clubName,
    }

    res.status(201).json(displayUser)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ----------- LOGIN -----------
const login = async (req, res) => {
  try {
    const { email, password } = req.body
    console.log(req.body.email)
    // Aller regarder dans la collection si je trouve un utilisateur avec cet email
    const userFound = await User.findOne({ email: email })
    // userFound = array
    // On extrait l'objet user du tableau userFound
    // On verifie que userFound existe dans la BDD
    if (!userFound) {
      // si ce n'est pas le cas on retourne un message d'erreur
      return res.status(400).json({
        message: "User doesn't exist. Please sign up.",
      })
    }
    // si c'est le cas on continue

    // on construit le hash avec le mot de passe reçu et le salt de l'utilisateur trouvé
    const hashReceived = SHA256(password + userFound.salt).toString(encBase64)

    // on compare le hash de l'utilisateur trouvé avec le hash obtenu
    if (hashReceived !== userFound.hash) {
      // Je répond une erreur
      return res.status(400).json({
        message: "Email or Password doesn't match",
      })
    } else {
      const displayUser = {
        _id: userFound["_id"],
        firstname: userFound["firstname"],
        lastname: userFound["lastname"],
        token: userFound["token"],
      }
      // Je répond OK au client
      res.status(201).json(displayUser)
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ----------- READ USERS ------------
const getUsers = async (req, res) => {
  try {
    const users = await User.find()
    res.json(users)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ----------- READ USER BY ID ------------
const getUserById = async (req, res) => {
  try {
    const id = req.params.id
    if (id) {
      const user = await User.findById(id)
      const userClubs = await Club.find({ members: id })
      const userTeams = await Team.find({ members: id })
      res
        .status(200)
        .json({ user: user, userClubs: userClubs, userTeams: userTeams })
    } else {
      res.status(200).json({ message: "missing parameter" })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ----------- UPDATE USER BY ID ------------
const updateUser = async (req, res) => {
  try {
    const id = req.params.id

    const user = req.user
    const userToUpdate = await User.findById(id)

    if (!userToUpdate) {
      return res.status(404).json({ message: "User not found" })
    }

    if (id !== user._id.toString()) {
      return res
        .status(401)
        .json({ message: "You can only update your own profil." })
    }

    // Body destructuring
    const {
      email,
      lastname,
      firstname,
      nickname,
      pronouns,
      phone,
      birthdate,
      arrival,
      playerNumber,
      licenceNumber,
      height,
      weight,
      size,
      shoesSize,
      password, // optional
    } = req.body

    const avatar = req.files?.avatar

    // Champs textuels
    userToUpdate.email = email ?? userToUpdate.email
    userToUpdate.lastname = lastname ?? userToUpdate.lastname
    userToUpdate.firstname = firstname ?? userToUpdate.firstname
    userToUpdate.nickname = nickname ?? userToUpdate.nickname
    userToUpdate.pronouns = pronouns ?? userToUpdate.pronouns
    userToUpdate.phone = phone ?? userToUpdate.phone
    userToUpdate.birthdate = birthdate ?? userToUpdate.birthdate
    userToUpdate.arrival = arrival ?? userToUpdate.arrival
    userToUpdate.playerNumber = playerNumber ?? userToUpdate.playerNumber
    userToUpdate.licenceNumber = licenceNumber ?? userToUpdate.licenceNumber
    userToUpdate.height = height ?? userToUpdate.height
    userToUpdate.weight = weight ?? userToUpdate.weight
    userToUpdate.size = size ?? userToUpdate.size
    userToUpdate.shoesSize = shoesSize ?? userToUpdate.shoesSize

    // Update avatar if provided
    if (avatar) {
      const transformedPicture = convertToBase64(avatar)
      const result = await cloudinary.uploader.upload(transformedPicture, {
        folder: `yes-coach/users/${userToUpdate._id}`,
      })
      userToUpdate.avatar = result
    }

    // Update password if provided
    if (password) {
      const { salt, hash, token } = generateAuth(password)
      userToUpdate.hash = hash
      userToUpdate.salt = salt
      userToUpdate.token = token
    }

    await userToUpdate.save()
    res.json(userToUpdate)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ----------- DELETE USER BY ID ------------
const deleteUser = async (req, res) => {
  try {
    // if id exist in params
    if (req.params.id) {
      const userToDelete = await User.findById(req.params.id)
      const user = req.user
      // check if user profil to delete belongs to current user
      if (userToDelete._id.toString() === user._id.toString()) {
        // find user by id and delete
        await User.findByIdAndDelete(req.params.id)
        res.json({ message: "User removed" })
      } else {
        return res
          .status(401)
          .json({ message: "You can only delete your own profil." })
      }
    } else {
      // else no id has been transmitted
      res.json({ messsage: "Missing id" })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

// ----------- SET UP ------------

module.exports = {
  signup,
  signupWithCode,
  login,
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
}
