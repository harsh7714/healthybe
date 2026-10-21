const crypto = require('crypto')

const Profile = require('../models/profile.model')
const Report = require('../models/report.model')
const User = require('../models/user.model')
const ChatSession = require('../models/chatSession.model')
const AppError = require('../utils/AppError')
const storage = require('./storage')

const ownerId = user => String(user._id)

function toProfileResponse(doc) {
  return {
    id: doc.id,
    name: doc.name,
    relation: doc.relation,
    age: doc.age || '',
    email: doc.email || '',
    initials: doc.initials || doc.name.slice(0, 1).toUpperCase(),
    profileImageUrl: doc.profileImageUrl,
  }
}

async function listProfiles(user) {
  const userId = ownerId(user)
  let profiles = await Profile.find({ userId }).sort({ createdAt: 1 })
  if (!profiles.some(profile => profile.id === 'self')) {
    profiles.unshift(
      await Profile.create({
        userId,
        id: 'self',
        name: user.name,
        relation: 'Self',
        initials: user.name.slice(0, 2).toUpperCase(),
      }),
    )
  }
  return profiles.map(toProfileResponse)
}

async function createProfile(user, data) {
  const name = String(data.name || '').trim()
  const relation = String(data.relation || '').trim()
  const id = crypto.randomUUID()
  const profile = await Profile.create({
    userId: ownerId(user),
    id,
    name,
    relation,
    age: data.age ? String(data.age) : '',
    initials: name
      .split(/\s+/)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase(),
  })
  return toProfileResponse(profile)
}

async function updateProfile(user, id, data) {
  const updates = {}
  for (const key of ['name', 'relation', 'age']) {
    if (data[key] !== undefined) updates[key] = String(data[key]).trim()
  }
  if (updates.name)
    updates.initials = updates.name
      .split(/\s+/)
      .map(part => part[0])
      .join('')
      .slice(0, 2)
      .toUpperCase()
  if (id === 'self' && updates.name) await User.updateOne({ _id: user._id }, { name: updates.name })
  const profile = await Profile.findOneAndUpdate({ userId: ownerId(user), id }, updates, {
    new: true,
    runValidators: true,
  })
  if (!profile) throw messageError('Profile not found.', 404)
  return toProfileResponse(profile)
}

async function deleteProfile(user, id) {
  if (id === 'self') throw messageError('The account owner profile cannot be removed.', 400)
  const userId = ownerId(user)
  const profile = await Profile.findOne({ userId, id })
  if (!profile) throw messageError('Profile not found.', 404)
  const reports = await Report.find({ userId, profileId: id })
  await Promise.all(reports.map(storage.remove))
  await profile.deleteOne()
  await Promise.all([
    Report.deleteMany({ userId, profileId: id }),
    ChatSession.deleteMany({ userId, profileId: id }),
  ])
}

function messageError(message, statusCode) {
  return new AppError(message, statusCode, null, { message })
}

module.exports = { createProfile, deleteProfile, listProfiles, updateProfile }
