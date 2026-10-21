const AppError = require('../utils/AppError')

function validateQuestion(text, file, reportId) {
  if (!text && !file && !reportId) {
    throw messageError('Write a question or attach a report.', 400)
  }
}

function parseHistory(historyValue) {
  let history
  try {
    history = JSON.parse(String(historyValue || '[]'))
  } catch {
    throw messageError('Conversation history is invalid.', 400)
  }
  if (!Array.isArray(history) || history.length > 40) {
    throw messageError('Conversation history is invalid.', 400)
  }
  return history
}

function messageError(message, statusCode) {
  return new AppError(message, statusCode, null, { message })
}

module.exports = { parseHistory, validateQuestion }
