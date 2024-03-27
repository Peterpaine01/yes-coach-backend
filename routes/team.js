const express = require("express");
const fileUpload = require("express-fileupload");
const router = express.Router();

const axios = require("axios");

// Import du models Team, Club, User
const Team = require("../models/Team");
const Club = require("../models/Club");

// Import du middleware isAuthenticated
const isAuthenticated = require("../middlewares/isAuthenticated");

const cloudinary = require("cloudinary").v2;
const convertToBase64 = require("../utils/convertToBase64");

// ----------- ROUTE CREATE TEAM ------------

router.post(
  "/club/:id/new-team",
  fileUpload(),
  isAuthenticated,
  async (req, res) => {
    try {
      console.log(req.params.id);
      const user = req.user;
      const club = await Club.findById(req.params.id);
      const isAdmin = club.admins.find((admin) => admin.equals(user._id));

      const { name, sport, color, genre, ageCategory, level } = req.body;

      const picture = req.files?.picture;

      if (isAdmin) {
        // Checking if name has been passed to body
        if (!name) {
          return res.json({
            message: "Team name is required",
          });
        }

        const newTeam = new Team({
          name: name,
          sport: sport,
          color: color,
          genre: genre,
          ageCategory: ageCategory,
          level: level,
          teamClub: [club._id],
        });

        if (picture) {
          // transforming image in string readable by cloudinary
          const transformedPicture = convertToBase64(picture);

          // sending request to cloudianry for uploading my image
          const result = await cloudinary.uploader.upload(transformedPicture, {
            folder: `yes-coach/clubs/${club._id}/teams/${newTeam._id}`,
          });
          newTeam.picture = result;
        }

        await newTeam.save();
        res.status(201).json(newTeam);
      } else {
        return res
          .status(401)
          .json({ message: "You need to be admin to create a team." });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ----------- ROUTE READ ALL TEAMS ------------
router.get("/club/:id/teams", isAuthenticated, async (req, res) => {
  try {
    const user = req.user;
    const club = rep.params.id;

    const teams = await Team.find({ teamClub: club })
      .populate("coachs")
      .populate("members");
    res.json(teams);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------- ROUTE READ TEAM BY ID ------------
router.get("/team/:id", async (req, res) => {
  try {
    const team = await Team.findById(req.params.id)
      .populate("coachs")
      .populate("members")
      .populate("teamClub");

    const numberOfMembers = team.members.length;
    res.json({ members: numberOfMembers, team });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// ----------- ROUTE UPDATE TEAM BY ID ------------
router.put(
  "/update-team/:id",
  fileUpload(),
  isAuthenticated,
  async (req, res) => {
    try {
      const user = req.user;
      const teamToUpdate = await Team.findById(req.params.id).populate(
        "teamClub"
      );
      const isAdmin = teamToUpdate.teamClub.admins.find((admin) =>
        admin.equals(user._id)
      );
      const isCoach = teamToUpdate.coachs.find((coach) =>
        coach.equals(user._id)
      );
      console.log(isCoach);
      // console.log(user._id);

      const picture = req.files?.picture;

      const {
        name,
        sport,
        genre,
        color,
        ageCategory,
        level,
        newCoachs,
        deleteCoachs,
        newMembers,
        deleteMembers,
      } = req.body;

      if (isAdmin || isCoach) {
        // console.log("is admin");
        // Checking if name has been passed to body
        if (!name) {
          return res.json({ message: "Club name is required" });
        } else {
          teamToUpdate.name = name;
          teamToUpdate.sport = sport;
          teamToUpdate.genre = genre;
          teamToUpdate.ageCategory = ageCategory;
          teamToUpdate.level = level;
          teamToUpdate.color = color;

          // if new coachs
          const newTeamCoachs = [...teamToUpdate.coachs];
          if (newCoachs) {
            newTeamCoachs.push(newCoachs);
            teamToUpdate.coachs = newTeamCoachs;
          }

          // if request to delete coachs
          if (deleteCoachs) {
            const deleteTeamCoachs = teamToUpdate.coachs.findIndex((admin) =>
              admin.equals(deleteCoachs)
            );
            teamToUpdate.coachs.splice(deleteTeamCoachs, 1);
          }

          // if new members
          const newTeamMembers = [...teamToUpdate.members];
          if (newMembers) {
            newTeamMembers.push(newMembers);
            teamToUpdate.members = newTeamMembers;
          }

          // if request to delete members
          if (deleteMembers) {
            const deleteTeamMembers = teamToUpdate.members.findIndex((member) =>
              member.equals(deleteMembers)
            );
            teamToUpdate.members.splice(deleteTeamMembers, 1);
          }
        }

        if (picture === undefined) {
          teamToUpdate.picture = teamToUpdate.picture;
        } else {
          // transforming image in string readable by cloudinary
          const transformedPicture = convertToBase64(picture);
          // sending request to cloudianry for uploading my image
          const result = await cloudinary.uploader.upload(transformedPicture, {
            folder: `yes-coach/clubs/${teamToUpdate.teamClub._id}/teams/${teamToUpdate._id}`,
          });

          teamToUpdate.picture = result;
        }
        await teamToUpdate.save();
        res.json(teamToUpdate);
      } else {
        return res
          .status(401)
          .json({ message: "You need to be admin to update this team." });
      }
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
);

// ----------- ROUTE DELETE TEAM BY ID ------------
router.delete("/delete-team/:id", isAuthenticated, async (req, res) => {
  try {
    // if id exist in params
    if (req.params.id) {
      const teamToDelete = await Team.findById(req.params.id).populate(
        "teamClub"
      );
      const user = req.user;
      const isAdmin = teamToDelete.teamClub.admins.find((admin) =>
        admin.equals(user._id)
      );
      if (isAdmin) {
        // find club by id and delete
        await Team.findByIdAndDelete(req.params.id);
        res.json({ message: "Team removed" });
      } else {
        return res
          .status(401)
          .json({ message: "You need to be admin to delete this team." });
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
