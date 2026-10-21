const asyncHandler = require('../utils/asyncHandler')
const profileService = require('../services/profile.service')

exports.list = asyncHandler(async (req, res) => {
  res.json(await profileService.listProfiles(req.user))
})

exports.create = asyncHandler(async (req, res) => {
  res.status(201).json(await profileService.createProfile(req.user, req.body))
})

exports.update = asyncHandler(async (req, res) => {
  res.json(await profileService.updateProfile(req.user, req.params.id, req.body))
})

exports.remove = asyncHandler(async (req, res) => {
  await profileService.deleteProfile(req.user, req.params.id)
  res.json({ ok: true })
})
