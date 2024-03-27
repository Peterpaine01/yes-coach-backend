const express = require("express");
// Je ne peux pas utiliser app et je ne peux pas le recréer car ça créerait un serveur dans mon serveur, j'utilise donc express.Router pour déclarer mes routes.
const router = express.Router();
const fileUpload = require("express-fileupload");
const { body, validationResult, check } = require("express-validator");

// Import du modèle User & Club
const User = require("../models/User");
const Club = require("../models/Club");
const Team = require("../models/Team");

const uid2 = require("uid2"); // Package qui sert à créer des string aléatoires
const SHA256 = require("crypto-js/sha256"); // Sert à encripter une string
const encBase64 = require("crypto-js/enc-base64"); // Sert à transformer l'encryptage en string

// Import du middleware isAuthenticated
const isAuthenticated = require("../middlewares/isAuthenticated");

const cloudinary = require("cloudinary").v2;
const convertToBase64 = require("../utils/convertToBase64");

// ----------- ROUTE CREATE / SIGNUP -----------
router.post("/signup", body("email").isEmail(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, firstname, lastname, password } = req.body;

    // Aller regarder dans la collection si je trouve un utilisateur avec cet email
    const existingUser = await User.findOne({ email: email });
    // Si on en trouve un utilisateur => erreur
    if (existingUser !== null) {
      // error 409 = conflit
      return res.status(409).json({
        message: "User already exists",
      });
    }
    // On vérifie que le nom d'utilisateur a bien était passé en body
    if (!email || !password || !firstname || !lastname) {
      return res.status(400).json({ message: "all fields are required" });
    }
    // On génère un salt
    const salt = uid2(16);
    // console.log("salt =>>>>   ", salt);
    // On génère un hash
    const hash = SHA256(password + salt).toString(encBase64);
    // console.log("hash    ", hash);
    // On génère un token
    const token = uid2(64);
    // console.log("token    ", token);

    const newUser = new User({
      email: email,
      firstname: firstname,
      lastname: lastname,
      hash: hash,
      salt: salt,
      token: token,
    });

    // J'enregistre toutes les infos qu'on a créées et reçues en BDD SAUF LE MOT DE PASSE
    await newUser.save();

    const displayUser = {
      _id: newUser["_id"],
      email: newUser["email"],
      firstname: newUser["firstname"],
      lastname: newUser["lastname"],
      token: newUser["token"],
    };
    // Je répond à l'utilisateur tout sauf le SALT et le HASH car ce sont des données sensibles

    res.status(201).json(displayUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------- ROUTE CREATE / SIGNUP WITH JOIN CODE -----------
router.post("/signup/:code", body("email").isEmail(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, firstname, lastname, password } = req.body;

    //   const clubFound = await Club.findOne({ joinCode: joinCode });

    // Aller regarder dans la collection si je trouve un utilisateur avec cet email
    const userFound = await User.findOne({ email: email });
    // Si on en trouve un utilisateur => erreur
    if (userFound !== null) {
      // error 409 = conflit
      return res.status(409).json({
        message: "User already exists",
      });
    }
    // On vérifie que le nom d'utilisateur a bien était passé en body
    if (!firstname && !lastname) {
      return res
        .status(400)
        .json({ message: "firstname and lastname are required" });
    }
    // On génère un salt
    const salt = uid2(16);
    // console.log("salt =>>>>   ", salt);
    // On génère un hash
    const hash = SHA256(password + salt).toString(encBase64);
    // console.log("hash    ", hash);
    // On génère un token
    const token = uid2(64);
    // console.log("token    ", token);

    const newUser = new User({
      email: email,
      firstname: firstname,
      lastname: lastname,
      hash: hash,
      salt: salt,
      token: token,
    });

    // J'enregistre toutes les infos qu'on a créées et reçues en BDD SAUF LE MOT DE PASSE
    await newUser.save();

    // si
    const joinCode = req.params.code;
    const club = await Club.findOne({ joinCode: joinCode });
    if (club) {
      club.members.push(newUser._id);
      await club.save();
    }

    const displayUser = {
      _id: newUser["_id"],
      email: newUser["email"],
      firstname: newUser["firstname"],
      lastname: newUser["lastname"],
      token: newUser["token"],
      club: club["name"],
    };
    // Je répond à l'utilisateur tout sauf le SALT et le HASH car ce sont des données sensibles
    // console.log(`newUser > ${newUser}`);
    res.status(201).json(displayUser);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------- ROUTE LOGIN -----------
router.post("/login", body("email").isEmail(), async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: "Enter valid email please." });
    }
    const { email, password } = req.body;
    console.log(req.body.email);
    // Aller regarder dans la collection si je trouve un utilisateur avec cet email
    const userFound = await User.findOne({ email: email });
    //console.log(userFound);
    // userFound = array
    // On extrait l'objet user du tableau userFound
    // On verifie que userFound existe dans la BDD
    if (!userFound) {
      // si ce n'est pas le cas on retourne un message d'erreur
      return res.status(400).json({
        message: "User doesn't exist. Please sign up.",
      });
    }
    // si c'est le cas on continue

    // on construit le hash avec le mot de passe reçu et le salt de l'utilisateur trouvé
    const hashReceived = SHA256(password + userFound.salt).toString(encBase64);

    // on compare le hash de l'utilisateur trouvé avec le hash obtenu
    if (hashReceived !== userFound.hash) {
      // Je répond une erreur
      return res.status(400).json({
        message: "Email or Password doesn't match",
      });
    } else {
      const displayUser = {
        _id: userFound["_id"],
        firstname: userFound["firstname"],
        lastname: userFound["lastname"],
        token: userFound["token"],
      };
      // Je répond OK au client
      res.status(201).json(displayUser);
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------- ROUTE READ USERS ------------
router.get("/users", async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------- ROUTE READ USER BY ID ------------
router.get("/user/:id", async (req, res) => {
  try {
    const id = req.params.id;
    if (id) {
      const user = await User.findById(id);
      const userClubs = await Club.find({ members: id });
      const userTeams = await Team.find({ members: id });
      res
        .status(200)
        .json({ user: user, userClubs: userClubs, userTeams: userTeams });
    } else {
      res.status(200).json({ message: "missing parameter" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------- ROUTE UPDATE USER BY ID ------------
router.put(
  "/update-user/:id",
  fileUpload(),
  isAuthenticated,
  body("email").isEmail(),
  async (req, res) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const id = req.params.id;
      const user = req.user;
      const userToUpdate = await User.findById(id);

      const avatar = req.files?.avatar;

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
        password,
      } = req.body;

      if (id === user._id) {
        userToUpdate.email = email;
        userToUpdate.lastname = lastname;
        userToUpdate.firstname = firstname;
        userToUpdate.nickname = nickname;
        userToUpdate.pronouns = pronouns;
        userToUpdate.phone = phone;
        userToUpdate.birthdate = birthdate;
        userToUpdate.arrival = arrival;
        userToUpdate.playerNumber = playerNumber;
        userToUpdate.licenceNumber = licenceNumber;
        userToUpdate.height = height;
        userToUpdate.weight = weight;
        userToUpdate.size = size;
        userToUpdate.shoesSize = shoesSize;

        // if (password) {
        //   // On génère à nouveau un token
        //   const salt = uid2(16);
        //   const hash = SHA256(password + salt).toString(encBase64);
        //   const token = uid2(64);
        //   userToUpdate.hash = hash;
        //   userToUpdate.salt = salt;
        //   userToUpdate.token = token;
        // }

        if (avatar === undefined) {
          userToUpdate.avatar = userToUpdate.avatar;
        } else {
          // transforming image in string readable by cloudinary
          const transformedPicture = convertToBase64(avatar);
          // sending request to cloudianry for uploading my image
          const result = await cloudinary.uploader.upload(transformedPicture, {
            folder: `yes-coach/users/${userToUpdate._id}`,
          });

          userToUpdate.avatar = result;
        }

        await userToUpdate.save();
        res.json(userToUpdate);
      } else {
        return res
          .status(401)
          .json({ message: "You can only update your own profil." });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ----------- ROUTE UPDATE USER PASSWORD ------------
router.put(
  "/update-user-password/:id",
  fileUpload(),
  isAuthenticated,
  async (req, res) => {
    try {
      const id = req.params.id;
      const user = req.user;
      const userToUpdate = await User.findById(id);

      console.log(id);
      console.log(userToUpdate._id);
      console.log(user._id);

      const { password } = req.body;

      if ((userToUpdate._id = user._id)) {
        if (password) {
          // On génère à nouveau un token
          const salt = uid2(16);
          const hash = SHA256(password + salt).toString(encBase64);
          const token = uid2(64);
          userToUpdate.hash = hash;
          userToUpdate.salt = salt;
          userToUpdate.token = token;
        }

        await userToUpdate.save();
        res.json(userToUpdate);
      } else {
        return res
          .status(401)
          .json({ message: "You can only update your own profil." });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ----------- ROUTE DELETE USER BY ID ------------
router.delete("/delete-user/:id", isAuthenticated, async (req, res) => {
  try {
    // if id exist in params
    if (req.params.id) {
      const userToDelete = await User.findById(req.params.id);
      const user = req.user;
      // check if user profil to delete belongs to current user
      if (userToDelete._id === user._id) {
        // find user by id and delete
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: "User removed" });
      } else {
        return res
          .status(401)
          .json({ message: "You can only delete your own profil." });
      }
    } else {
      // else no id has been transmitted
      res.json({ messsage: "Missing id" });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------- SET UP ------------
// Export du router qui contient mes routes
module.exports = router;
