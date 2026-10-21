const asyncHandler = require('../utils/asyncHandler')
const chatService = require('../services/chat.service')

exports.send = asyncHandler(async (req, res) => {
  res.json(await chatService.sendMessage(req.user, req.body, req.file))
})
