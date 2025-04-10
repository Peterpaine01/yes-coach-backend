const express = require("express")
const fileUpload = require("express-fileupload")
const router = express.Router()

const axios = require("axios")

// Import du models Team, Club, Event
const Event = require("../models/Event")
const Team = require("../models/Team")
const Club = require("../models/Club")

// Import du middleware isAuthenticated
const isAuthenticated = require("../middlewares/isAuthenticated")

const ObjectId = require("mongodb").ObjectId

// const cloudinary = require("cloudinary").v2;
// const convertToBase64 = require("../utils/convertToBase64");

// ----------- ROUTE CREATE TEAM ------------

router.post("/club/:id/new-event", isAuthenticated, async (req, res) => {
  try {
    const user = req.user
    const club = await Club.findById(req.params.id)
    const clubTeams = await Team.find({ teamClub: club._id })
    // console.log(clubTeams);

    // Creating an array with all coaches from the club's teams
    const clubCoachs = []
    for (i = 0; i < clubTeams.length; i++) {
      // console.log(clubTeams[i].name);
      for (j = 0; j < clubTeams[i].coachs.length; j++) {
        clubCoachs.push(clubTeams[i].coachs[j])
        // console.log(clubTeams[i].coachs[j]);
      }
    }
    // console.log(clubCoachs);

    const isAdmin = club.admins.find((admin) => admin.equals(user._id))
    const isCoach = clubCoachs.find((coach) => coach.equals(user._id))

    const {
      name,
      type,
      description,
      opponents,
      start,
      end,
      meetPoint,
      meetHour,
      location,
      isRecurent,
      Recurrency,
      visibilityEvent,
      visibilityPresences,
      summons,
      teamsSummoned,
      coachs,
    } = req.body

    console.log(req.params.id)

    if (isAdmin || isCoach) {
      // Checking if name has been passed to body
      if (!name) {
        return res.json({
          message: "Event name is required",
        })
      }

      if (!start || !end) {
        return res.json({
          message: "Time slot is required",
        })
      }

      const newEvent = new Event({
        name: name,
        type: type,
        description: description,
        opponents: opponents,
        start: start,
        end: end,
        meetPoint: meetPoint,
        meetHour: meetHour,
        location: location,
        isRecurent: isRecurent,
        Recurrency: Recurrency,
        visibilityEvent: visibilityEvent,
        visibilityPresences: visibilityPresences,
        summons: summons,
        teamsSummoned: teamsSummoned,
        coachs: coachs,
      })

      await newEvent.save()
      res.status(201).json(newEvent)
    } else {
      return res
        .status(401)
        .json({ message: "You need to be admin or coach to create a event." })
    }
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// // ----------- ROUTE READ ALL EVENTS ------------
// router.get("/events-old", async (req, res) => {
//   try {
//     const { location, visibilityEvent } = req.query;
//     let teams = req.query.teams;

//     // const teamsOptions = await Team.find().select("_id");
//     const teamsOptions = [
//       "65e0a7034541461fdba17924",
//       "65e2642a173e12409926ccf0",
//       "65e27580adc0e4d290e38a85",
//     ];
//     // console.log(teamsOptions);

//     // teams === "All"
//     //   ? (teams = [...teamsOptions])
//     //   : (teams = req.query.teams.split(","));

//     const locationRegexp = new RegExp(location, "i"); // Permet de créer une RegExp
//     const filter = {};
//     const filterTeams = {};

//     // if (teams.length) {
//     //   // filter["$in"] = [{ "teamsSummoned._id": teams }];
//     //   const eventsTeams = await Event.find({ teamsSummons: { $in: teams } });
//     //   res.json({ events: eventsTeams });
//     // }

//     if (teams) {
//       filter.teamsSummoned = {
//         $in: ["65e27580adc0e4d290e38a85','65e2642a173e12409926ccf0"],
//       };
//     }
//     teams = req.query.teams.split(",");
//     // const teamsSelect = await Team.find({
//     //   name: { $in: teams },
//     // }).select("_id");

//     // console.log(teamsSelect);

//     // if (teamsSelect) {
//     //   filter.teamsSummoned = teamsSelect;
//     // }

//     if (location) {
//       filter.location = locationRegexp;
//     }

//     if (visibilityEvent === "true") {
//       filter.visibilityEvent = true;
//     } else if (visibilityEvent === "false") {
//       filter.visibilityEvent = false;
//     }

//     const events = await Event.find(filter)
//       .populate("teamsSummoned")
//       .populate("coachs")
//       .sort({ start: "asc" });

//     // const events = await Event.updateMany({
//     //   "teamsSummoned.name": { $in: [...teams] },
//     // });
//     // console.log(events);
//     // ?teams=65e27580adc0e4d290e38a85,65e2642a173e12409926ccf0,65e0a7034541461fdba17924

//     const numberOfEvents = await Event.countDocuments(filter);
//     res.json({ count: numberOfEvents, events: events });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// ----------- ROUTE READ ALL EVENTS ------------
router.get("/club/:id/events", isAuthenticated, async (req, res) => {
  try {
    const location = req.query.location || ""
    let teams = req.query.teams || ""

    const user = req.user
    // const club = await Club.findById(req.params.id)
    //   .populate("admins")
    //   .populate("members");
    const userTeams = await Team.find({ members: user._id })
    const clubTeams = await Team.find({ teamClub: req.params.id })
    // const teamsUser = clubTeams.members.find((member) =>
    //   member.equals(user._id)
    // );

    // Creating an array with all teams id where user belongs
    const userTeamsInClub = []
    for (i = 0; i < clubTeams.length; i++) {
      // console.log(clubTeams[i].name);
      for (j = 0; j < clubTeams[i].members.length; j++) {
        if (user._id === clubTeams[i].members[j]) {
          teamsUser.push(clubTeams[i]._id)
        }
        // console.log(clubTeams[i].coachs[j]);
      }
    }

    console.log(userTeamsInClub)
    // console.log(teams);

    const teamsOptions = [
      "65e27580adc0e4d290e38a85",
      "65e2642a173e12409926ccf0",
      "65e0a7034541461fdba17924",
    ]
    // ?teams=65e27580adc0e4d290e38a85,65e2642a173e12409926ccf0,65e0a7034541461fdba17924

    teams === ""
      ? (teams = [...teamsOptions])
      : (teams = req.query.teams.split(","))

    console.log(teams)

    const events = await Event.find({
      location: { $regex: location, $options: "i" },
      visibilityEvent: true,
    })
      .where("teamsSummoned")
      .in([...teams])
      .populate("teamsSummoned")
      .populate("coachs")
      .sort({ start: "asc" })

    const total = await Event.countDocuments({
      teamsSummoned: { $in: [...teams] },
      location: { $regex: location, $options: "i" },
      visibilityEvent: true,
    })

    const response = {
      total,
      events,
    }

    res.status(200).json(response)
  } catch (err) {
    console.log(err)
    res.status(500).json({ error: true, message: "Internal Server Error" })
  }
})

// ----------- ROUTE READ EVENT BY ID ------------
router.get("/event/:id", async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate("teamsSummoned")
      .populate("coaches")
      .populate("isPresent")
      .populate("isAbsent")
      .populate("isLate")
      .populate("isHurt")
      .populate("notSummons")

    const numberOfMembers = event.isPresent.length
    res.json({ Presences: numberOfMembers, event })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// // ----------- ROUTE UPDATE TEAM BY ID ------------
// router.put(
//   "/update-team/:id",
//   fileUpload(),
//   isAuthenticated,
//   async (req, res) => {
//     try {
//       const user = req.user;
//       const teamToUpdate = await Team.findById(req.params.id).populate(
//         "teamClub"
//       );
//       const isAdmin = teamToUpdate.teamClub.admins.find((admin) =>
//         admin.equals(user._id)
//       );
//       const isCoach = teamToUpdate.coachs.find((coach) =>
//         coach.equals(user._id)
//       );
//       console.log(isCoach);
//       // console.log(user._id);

//       const picture = req.files?.picture;

//       const {
//         name,
//         sport,
//         teams,
//         color,
//         ageCategory,
//         level,
//         newCoachs,
//         deleteCoachs,
//         newMembers,
//         deleteMembers,
//       } = req.body;

//       if (isAdmin || isCoach) {
//         // console.log("is admin");
//         // Checking if name has been passed to body
//         if (!name) {
//           return res.json({ message: "Club name is required" });
//         } else {
//           teamToUpdate.name = name;
//           teamToUpdate.sport = sport;
//           teamToUpdate.genre = genre;
//           teamToUpdate.ageCategory = ageCategory;
//           teamToUpdate.level = level;
//           teamToUpdate.color = color;

//           // if new coachs
//           const newTeamCoachs = [...teamToUpdate.coachs];
//           if (newCoachs) {
//             newTeamCoachs.push(newCoachs);
//             teamToUpdate.coachs = newTeamCoachs;
//           }

//           // if request to delete coachs
//           if (deleteCoachs) {
//             const deleteTeamCoachs = teamToUpdate.coachs.findIndex((admin) =>
//               admin.equals(deleteCoachs)
//             );
//             teamToUpdate.coachs.splice(deleteTeamCoachs, 1);
//           }

//           // if new members
//           const newTeamMembers = [...teamToUpdate.members];
//           if (newMembers) {
//             newTeamMembers.push(newMembers);
//             teamToUpdate.members = newTeamMembers;
//           }

//           // if request to delete members
//           if (deleteMembers) {
//             const deleteTeamMembers = teamToUpdate.members.findIndex((member) =>
//               member.equals(deleteMembers)
//             );
//             teamToUpdate.members.splice(deleteTeamMembers, 1);
//           }
//         }

//         if (picture === undefined) {
//           teamToUpdate.picture = teamToUpdate.picture;
//         } else {
//           // transforming image in string readable by cloudinary
//           const transformedPicture = convertToBase64(picture);
//           // sending request to cloudianry for uploading my image
//           const result = await cloudinary.uploader.upload(transformedPicture, {
//             folder: `yes-coach/clubs/${teamToUpdate.teamClub._id}/teams/${teamToUpdate._id}`,
//           });

//           teamToUpdate.picture = result;
//         }
//         await teamToUpdate.save();
//         res.json(teamToUpdate);
//       } else {
//         return res
//           .status(401)
//           .json({ message: "You need to be admin to update this team." });
//       }
//     } catch (error) {
//       res.status(500).json({ message: error.message });
//     }
//   }
// );

// // ----------- ROUTE DELETE TEAM BY ID ------------
// router.delete("/delete-team/:id", isAuthenticated, async (req, res) => {
//   try {
//     // if id exist in params
//     if (req.params.id) {
//       const teamToDelete = await Team.findById(req.params.id).populate(
//         "teamClub"
//       );
//       const user = req.user;
//       const isAdmin = teamToDelete.teamClub.admins.find((admin) =>
//         admin.equals(user._id)
//       );
//       if (isAdmin) {
//         // find club by id and delete
//         await Team.findByIdAndDelete(req.params.id);
//         res.json({ message: "Team removed" });
//       } else {
//         return res
//           .status(401)
//           .json({ message: "You need to be admin to delete this team." });
//       }
//     } else {
//       // else no id has been transmitted
//       res.json({ messsage: "Missing id" });
//     }
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// });

// ----------- SET UP ------------
// Export du router qui contient mes routes
module.exports = router
