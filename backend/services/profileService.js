const Profile = require('../models/Profile')

const mergeAnalysisIntoProfileHealthData = async (userId, profileId, newAnalysis, reportName, reportDate) => {
  try {
    if (!newAnalysis) {
      console.warn('⚠️ No analysis results to merge for report:', reportName)
      return
    }

    // 1. Fetch current profile
    const profile = await Profile.findOne({ userId, id: profileId })
    if (!profile) {
      console.warn(`⚠️ Profile not found for merge: userId=${userId}, profileId=${profileId}`)
      return
    }
    console.log(`🔍 Merging analysis results into profile: ${profile.name} (${profileId})`)

    let healthData = profile.healthData || { vitals: {}, metrics: [], medications: [], checkups: [], diet: [] }
    if (!healthData) healthData = {}
    if (!healthData.vitals) healthData.vitals = {}
    if (!healthData.metrics) healthData.metrics = []
    if (!healthData.medications) healthData.medications = []
    if (!healthData.checkups) healthData.checkups = []
    if (!healthData.diet) healthData.diet = []

    // 2. Merge Vitals
    if (newAnalysis.vitals && Object.keys(newAnalysis.vitals).length > 0) {
      healthData.vitals = {
        ...healthData.vitals,
        ...newAnalysis.vitals
      }
    }

    // 3. Merge Lab Metrics
    if (newAnalysis.metrics) {
      newAnalysis.metrics.forEach(m => {
        if (m && m.name) {
          const idx = healthData.metrics.findIndex(item => item.name.toLowerCase() === m.name.toLowerCase())
          const metricData = {
            ...m,
            date: reportDate,
            fileName: reportName,
            memberId: profileId
          }
          if (idx !== -1) {
            healthData.metrics[idx] = metricData
          } else {
            healthData.metrics.push(metricData)
          }
        }
      })
    }

    // 4. Merge Medications
    if (newAnalysis.medications) {
      newAnalysis.medications.forEach(m => {
        if (m && m.name) {
          const keyMed = m.name.toLowerCase()
          const exists = healthData.medications.some(item => item.name.toLowerCase() === keyMed)
          if (!exists) {
            healthData.medications.push({
              ...m,
              source: reportName,
              date: reportDate
            })
          } else {
            const idx = healthData.medications.findIndex(item => item.name.toLowerCase() === keyMed)
            if (idx !== -1) {
              healthData.medications[idx] = {
                ...healthData.medications[idx],
                ...m,
                source: reportName,
                date: reportDate
              }
            }
          }
        }
      })
    }

    // 5. Merge Checkups
    if (newAnalysis.checkup && newAnalysis.checkup.type) {
      healthData.checkups.push({
        date: reportDate,
        type: newAnalysis.checkup.type,
        findings: newAnalysis.checkup.findings || '',
        fileName: reportName
      })
    }

    // 6. Merge Diet Guidelines
    if (newAnalysis.diet) {
      newAnalysis.diet.forEach(d => {
        if (d) {
          const exists = healthData.diet.some(item => item.text.toLowerCase() === d.toLowerCase())
          if (!exists) {
            healthData.diet.push({ text: d, profileId })
          }
        }
      })
    }

    // 7. Save updated profile healthData
    profile.healthData = healthData
    profile.markModified('healthData')
    await profile.save()
    console.log(`✅ Profile healthData merged for ${userId}/${profileId}`)
  } catch (err) {
    console.error(`Error merging profile health data:`, err.message)
  }
}

module.exports = {
  mergeAnalysisIntoProfileHealthData
}
