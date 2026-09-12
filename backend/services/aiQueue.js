const Report = require('../models/Report')
const { analyzeWithGemini } = require('./geminiService')
const { mergeAnalysisIntoProfileHealthData } = require('./profileService')

class AiQueue {
  constructor(maxConcurrency = 3, maxRetries = 3) {
    this.queue = []
    this.running = 0
    this.maxConcurrency = maxConcurrency
    this.maxRetries = maxRetries
  }

  /**
   * Enqueue a new report analysis job
   * @param {Object} job
   * @param {string} job.reportId
   * @param {Buffer} job.buffer
   * @param {string} job.mimeType
   * @param {string} job.userId
   * @param {string} job.profileId
   * @param {string} job.fileName
   * @param {string} job.date
   */
  enqueue(job) {
    this.queue.push({
      ...job,
      attempts: 0,
      enqueuedAt: Date.now(),
    })
    console.log(`📥 [AiQueue] Enqueued report ${job.reportId}. Queue length: ${this.queue.length}, Running: ${this.running}`)
    this.processNext()
  }

  async processNext() {
    if (this.running >= this.maxConcurrency || this.queue.length === 0) {
      return
    }

    const job = this.queue.shift()
    this.running++

    this.executeJob(job)
      .finally(() => {
        this.running--
        // Process next available item
        this.processNext()
      })
  }

  async executeJob(job) {
    const { reportId, buffer, mimeType, userId, profileId, fileName, date } = job
    job.attempts++

    console.log(`🤖 [AiQueue] Processing report ${reportId} (Attempt ${job.attempts}/${this.maxRetries})...`)

    try {
      const analysis = await analyzeWithGemini(buffer, mimeType)
      console.log(`✅ [AiQueue] Analysis successful for report ${reportId}`)

      // 1. Update Report in MongoDB
      await Report.findByIdAndUpdate(reportId, {
        status: 'COMPLETED',
        analysis,
        errorMessage: null,
      })

      // 2. Aggregate and update Profile dashboard info
      await mergeAnalysisIntoProfileHealthData(userId, profileId, analysis, fileName, date)
      console.log(`📊 [AiQueue] Dashboard metrics merged for profile ${profileId}`)
    } catch (err) {
      console.warn(`⚠️ [AiQueue] Error processing report ${reportId}: ${err.message}`)

      // Check if retries remain
      if (job.attempts < this.maxRetries) {
        const delay = Math.pow(2, job.attempts) * 1000 // 2s, 4s, 8s
        console.log(`🔁 [AiQueue] Scheduling retry in ${delay}ms for report ${reportId}...`)
        setTimeout(() => {
          this.queue.unshift(job) // High priority retry at front of queue
          this.processNext()
        }, delay)
      } else {
        console.error(`❌ [AiQueue] Max retries reached for report ${reportId}. Marking as FAILED.`)
        const fallbackAnalysis = {
          vitals: {},
          metrics: [],
          checkup: { type: 'Uploaded Document', findings: 'AI analysis could not be completed automatically.' },
          medications: [],
          diet: [],
        }

        await Report.findByIdAndUpdate(reportId, {
          status: 'FAILED',
          errorMessage: err.message || 'AI analysis failed',
          analysis: fallbackAnalysis,
        })
      }
    }
  }

  getStatus() {
    return {
      pending: this.queue.length,
      running: this.running,
      maxConcurrency: this.maxConcurrency,
    }
  }
}

// Singleton instance
const aiQueue = new AiQueue(3, 3)

module.exports = aiQueue
