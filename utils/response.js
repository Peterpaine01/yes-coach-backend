const success = (res, data, status = 200) => res.status(status).json(data)
const error = (res, message, status = 500) =>
  res.status(status).json({ message })

module.exports = { success, error }
