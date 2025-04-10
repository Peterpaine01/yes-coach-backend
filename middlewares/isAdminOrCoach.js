const User = require("../models/User")
const Club = require("../models/Club")
const Team = require("../models/Team")

const isAdminOrCoach = async (req, res, next) => {
  try {
    // Récupérer l'ID du club sur lequel l'utilisateur effectue l'action
    const { clubId } = req.body
    // Vérifier si le clubId existe
    if (!clubId) {
      return res.status(400).json({ message: "Club ID is required" })
    }

    // Récupérer l'utilisateur connecté
    const user = req.user // Assumes that the user is set by a previous authentication middleware
    const userToCheck = await User.findById(user._id)
      .populate("userClubs.club")
      .populate("userTeams.team")

    if (!userToCheck) {
      return res.status(404).json({ message: "User not found" })
    }
    console.log(userToCheck)

    // Vérifier si l'utilisateur est admin du club
    const isAdmin = userToCheck.userClubs.some(
      (userClub) =>
        userClub.club._id.toString() === clubId && userClub.isAdmin === true
    )
    console.log(isAdmin)

    // Vérifier si l'utilisateur est coach d'une équipe du club
    const isCoach = userToCheck.userTeams.some(
      (userTeam) =>
        userTeam.team.club.toString() === clubId && userTeam.isCoach === true
    )
    console.log(isCoach)

    if (!isAdmin && !isCoach) {
      return res
        .status(403)
        .json({ message: "You do not have permission to perform this action" })
    }

    // Si l'utilisateur est soit admin soit coach, on passe à l'action suivante
    next()
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
}

module.exports = isAdminOrCoach
