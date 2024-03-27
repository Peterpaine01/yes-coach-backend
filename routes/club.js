const express = require("express");
const fileUpload = require("express-fileupload");
const router = express.Router();

const axios = require("axios");

// Import du modèle Club
const Club = require("../models/Club");
const Team = require("../models/Team");

// Import du middleware isAuthenticated
const isAuthenticated = require("../middlewares/isAuthenticated");

const cloudinary = require("cloudinary").v2;
const convertToBase64 = require("../utils/convertToBase64");

// ----------- ROUTE CREATE CLUB ------------

router.post("/new-club", fileUpload(), isAuthenticated, async (req, res) => {
  try {
    // console.log(req.user);
    // console.log(generateCode);

    // const extremeCharacter =
    //   "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

    // let generateCode = "";
    // const codeLength = 10;
    // for (let i = 0; i < codeLength; i++) {
    //     generateCode += extremeCharacter.charAt(Math.floor(Math.random() * codeLength));
    // }
    // console.log(result);
    // const codeUniq = await Club.findOne({ joinCode: generateCode });

    // const uniqueNumber = new Date().getTime();

    const { v4: uuidv4 } = require("uuid");

    const generateCode = uuidv4();

    // const uniqueCode = await Club.findOne({ joinCode: generateCode });
    // if (uniqueCode) {
    //   const generateCode = uuidv4();
    // }

    const { name, email, phone, color } = req.body;

    const newClub = new Club({
      name: name,
      email: email,
      phone: phone,
      color: color,
      joinCode: generateCode,
      admins: [req.user],
      members: [req.user],
    });

    // console.log(newClub);

    await newClub.save();

    res.status(201).json(newClub);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------- ROUTE READ ALL CLUBS ------------
router.get("/clubs", async (req, res) => {
  try {
    const clubs = await Club.find().populate("admins", "members");
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------- ROUTE READ USER'S CLUBS ------------
router.get("/user-clubs", isAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    console.log(user);

    const clubs = await Club.find({ members: user._id })
      .populate("admins")
      .populate("members");
    res.json(clubs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------- ROUTE READ CLUB BY ID ------------
router.get("/club/:id", async (req, res) => {
  try {
    const club = await Club.findById(req.params.id)
      .populate("admins")
      .populate("members");
    const clubTeams = await Team.find({ teamClub: req.params.id });

    const numberOfMembers = club.members.length;
    res.json({ club: club, members: numberOfMembers, teams: clubTeams });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------- ROUTE READ USER CLUB BY ID ------------
// router.get("/user-club/:id", isAuthenticated, async (req, res) => {
//   try {
//     const club = await Club.findById(req.params.id)
//       .populate("admins")
//       .populate("members");

//     console.log(club);

//     const numberOfMembers = club.members.length;
//     res.json({ members: numberOfMembers, club });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// ----------- ROUTE UPDATE CLUB BY ID ------------
router.put(
  "/update-club/:id",
  fileUpload(),
  isAuthenticated,
  async (req, res) => {
    try {
      const user = req.user;
      const clubToUpdate = await Club.findById(req.params.id);
      const isAdmin = clubToUpdate.admins.find((admin) =>
        admin.equals(user._id)
      );
      // console.log(clubToUpdate.admins);
      // console.log(user._id);

      const picture = req.files?.picture;

      const {
        name,
        email,
        phone,
        color,
        newAdmins,
        deleteAdmins,
        newMembers,
        deleteMembers,
      } = req.body;

      if (isAdmin) {
        // console.log("is admin");
        // Checking if name and email have been passed to body
        if (!name || !email) {
          return res.json({ message: "Club name and email are required" });
        } else {
          clubToUpdate.name = name;
          clubToUpdate.email = email;
          clubToUpdate.phone = phone;
          clubToUpdate.color = color;

          // if new admins
          const newClubAdmins = [...clubToUpdate.admins];
          if (newAdmins) {
            newClubAdmins.push(newAdmins);
            clubToUpdate.admins = newClubAdmins;
          }

          // if request to delete admins
          if (deleteAdmins) {
            const deleteClubAdmins = clubToUpdate.admins.findIndex((admin) =>
              admin.equals(deleteAdmins)
            );
            clubToUpdate.admins.splice(deleteClubAdmins, 1);
          }

          // if new members
          const newClubMembers = [...clubToUpdate.members];
          if (newMembers) {
            newClubMembers.push(newMembers);
            clubToUpdate.members = newClubMembers;
          }

          // if request to delete members
          if (deleteMembers) {
            const deleteClubMembers = clubToUpdate.members.findIndex((member) =>
              member.equals(deleteMembers)
            );
            clubToUpdate.members.splice(deleteClubMembers, 1);
          }
        }

        if (picture === undefined) {
          clubToUpdate.picture = clubToUpdate.picture;
        } else {
          // transforming image in string readable by cloudinary
          const transformedPicture = convertToBase64(picture);
          // sending request to cloudianry for uploading my image
          const result = await cloudinary.uploader.upload(transformedPicture, {
            folder: `yes-coach/clubs/${clubToUpdate._id}`,
          });

          clubToUpdate.picture = result;
        }
        await clubToUpdate.save();
        res.json(clubToUpdate);
      } else {
        return res
          .status(401)
          .json({ message: "You need to be admin to update this club." });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ----------- ROUTE DELETE CLUB BY ID ------------
router.delete("/delete-club/:id", isAuthenticated, async (req, res) => {
  try {
    // if id exist in params
    if (req.params.id) {
      const clubToDelete = await Club.findById(req.params.id);
      const user = req.user;
      const isAdmin = clubToDelete.admins.find((admin) =>
        admin.equals(user._id)
      );
      if (isAdmin) {
        // find club by id and delete
        await Club.findByIdAndDelete(req.params.id);
        res.json({ message: "Club removed" });
      } else {
        return res
          .status(401)
          .json({ message: "You need to be admin to delete this club." });
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
