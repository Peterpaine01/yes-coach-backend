// routes/clubRoutes.js
const express = require("express")
const fileUpload = require("express-fileupload")
const router = express.Router()

// Import du modèle Club et Team
const Club = require("../models/Club")
const Team = require("../models/Team")

// Import du middleware isAuthenticated
const isAuthenticated = require("../middlewares/isAuthenticated")

const cloudinary = require("cloudinary").v2
const convertToBase64 = require("../utils/convertToBase64")

// ----------- ROUTE CREATE CLUB ------------
router.post("/new-club", fileUpload(), isAuthenticated, async (req, res) => {
  try {
    const { v4: uuidv4 } = require("uuid")
    const generateCode = uuidv4()

    const { name, email, phone, color } = req.body

    const newClub = new Club({
      name,
      email,
      phone,
      color,
      joinCode: generateCode,
      admins: [req.user],
      members: [req.user],
    })

    await newClub.save()

    // Ajouter le club dans le tableau userClubs de l'utilisateur
    const user = await User.findById(req.user._id)

    // Ajouter l'utilisateur comme membre et admin du club
    user.userClubs.push({
      club: newClub._id, // L'ID du club créé
      isAdmin: true, // L'utilisateur est admin du club
      clubRole: [], // Ajouter des rôles spécifiques si nécessaire
    })

    // Sauvegarder les modifications sur l'utilisateur
    await user.save()

    res.status(201).json(newClub)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// ----------- ROUTE READ ALL CLUBS ------------
router.get("/clubs", async (req, res) => {
  try {
    const clubs = await Club.find().populate("admins members")
    res.json(clubs)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// ----------- ROUTE READ USERS' CLUBS ------------
router.get("/user-clubs", isAuthenticated, async (req, res) => {
  try {
    const user = req.user
    const clubs = await Club.find({ members: user._id })
      .populate("admins")
      .populate("members")
    res.json(clubs)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// ----------- ROUTE READ CLUB BY ID ------------
router.get("/club/:id", async (req, res) => {
  try {
    const club = await Club.findById(req.params.id).populate("admins members")
    const clubTeams = await Team.find({ teamClub: req.params.id })

    const numberOfMembers = club.members.length
    res.json({ club, members: numberOfMembers, teams: clubTeams })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// ----------- ROUTE UPDATE CLUB BY ID ------------
router.put(
  "/update-club/:id",
  fileUpload(),
  isAuthenticated,
  async (req, res) => {
    try {
      const user = req.user
      const clubToUpdate = await Club.findById(req.params.id)

      const isAdmin = clubToUpdate.admins.find((admin) =>
        admin.equals(user._id)
      )

      const picture = req.files?.picture
      const {
        name,
        email,
        phone,
        color,
        newAdmins,
        deleteAdmins,
        newMembers,
        deleteMembers,
      } = req.body

      if (isAdmin) {
        if (!name || !email) {
          return res.json({ message: "Club name and email are required" })
        }

        clubToUpdate.name = name
        clubToUpdate.email = email
        clubToUpdate.phone = phone
        clubToUpdate.color = color

        // Add new admins if provided
        if (newAdmins) {
          clubToUpdate.admins.push(newAdmins)
        }

        // Remove admins if requested
        if (deleteAdmins) {
          clubToUpdate.admins = clubToUpdate.admins.filter(
            (admin) => !admin.equals(deleteAdmins)
          )
        }

        // Add new members if provided
        if (newMembers) {
          clubToUpdate.members.push(newMembers)
        }

        // Remove members if requested
        if (deleteMembers) {
          clubToUpdate.members = clubToUpdate.members.filter(
            (member) => !member.equals(deleteMembers)
          )
        }

        // Handle picture upload
        if (picture) {
          const transformedPicture = convertToBase64(picture)
          const result = await cloudinary.uploader.upload(transformedPicture, {
            folder: `yes-coach/clubs/${clubToUpdate._id}`,
          })
          clubToUpdate.picture = result
        }

        await clubToUpdate.save()
        res.json(clubToUpdate)
      } else {
        return res
          .status(401)
          .json({ message: "You need to be an admin to update this club." })
      }
    } catch (error) {
      res.status(500).json({ message: error.message })
    }
  }
)

// ----------- ROUTE DELETE CLUB BY ID ------------
router.delete("/delete-club/:id", isAuthenticated, async (req, res) => {
  try {
    const clubToDelete = await Club.findById(req.params.id)
    const user = req.user
    const isAdmin = clubToDelete.admins.find((admin) => admin.equals(user._id))

    if (isAdmin) {
      await Club.findByIdAndDelete(req.params.id)
      res.json({ message: "Club removed" })
    } else {
      return res
        .status(401)
        .json({ message: "You need to be an admin to delete this club." })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
