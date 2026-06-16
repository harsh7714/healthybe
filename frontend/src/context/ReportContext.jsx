import React, { createContext, useContext, useState, useEffect } from 'react'
import { useAuth } from './AuthContext'
import { useProfiles } from './ProfileContext'

const ReportContext = createContext()

const REPORT_DATABASE = {
  "lipid_profile_father.pdf": {
    vitals: {
      "Blood Pressure": { value: "135/88", unit: "mmHg", status: "Borderline", color: "text-amber-500" },
      "Heart Rate": { value: "78", unit: "bpm", status: "Normal", color: "text-teal-500" },
      "Blood Glucose": { value: "104", unit: "mg/dL", status: "Pre-diabetic", color: "text-amber-500" },
      "Oxygen Saturation": { value: "97%", unit: "SpO2", status: "Optimal", color: "text-emerald-500" }
    },
    metrics: [
      { name: "LDL Cholesterol", value: "142", unit: "mg/dL", status: "Borderline High (Target < 100)" },
      { name: "HDL Cholesterol", value: "41", unit: "mg/dL", status: "Optimal (Target > 40)" },
      { name: "Total Cholesterol", value: "215", unit: "mg/dL", status: "Borderline High (Target < 200)" },
      { name: "Triglycerides", value: "155", unit: "mg/dL", status: "Borderline High (Target < 150)" }
    ],
    checkup: {
      type: "Lipid Profile Panel",
      findings: "Borderline high LDL cholesterol (142 mg/dL) and total cholesterol (215 mg/dL)."
    },
    medications: [
      { name: "Atorvastatin", dose: "10mg", freq: "Once daily at bedtime", status: "Recommended" }
    ],
    diet: [
      "Restrict saturated fats and trans-fatty acids (fried foods, butter, fatty meats).",
      "Increase daily intake of soluble fiber (oats, kidney beans, brussels sprouts).",
      "Include heart-healthy fats such as walnuts, almonds, and extra virgin olive oil."
    ]
  },
  "thyroid_panel_mother.pdf": {
    vitals: {
      "Blood Pressure": { value: "118/76", unit: "mmHg", status: "Optimal", color: "text-emerald-500" },
      "Heart Rate": { value: "68", unit: "bpm", status: "Normal", color: "text-teal-500" },
      "Blood Glucose": { value: "88", unit: "mg/dL", status: "Optimal", color: "text-emerald-500" },
      "Oxygen Saturation": { value: "98%", unit: "SpO2", status: "Optimal", color: "text-emerald-500" }
    },
    metrics: [
      { name: "TSH (Thyroid Stimulating)", value: "5.4", unit: "uIU/mL", status: "Elevated (Ref: 0.4 - 4.0)" },
      { name: "Free T4", value: "1.1", unit: "ng/dL", status: "Normal (Ref: 0.8 - 1.8)" }
    ],
    checkup: {
      type: "Thyroid Panel Follow-up",
      findings: "Subclinical Hypothyroidism indicated by borderline elevated TSH (5.4 uIU/mL)."
    },
    medications: [
      { name: "Levothyroxine", dose: "50mcg", freq: "Once daily in the morning on empty stomach", status: "Active" }
    ],
    diet: [
      "Ensure adequate iodine and selenium intake (Brazil nuts, fish, eggs).",
      "Limit soy products and raw cruciferous vegetables within 4 hours of thyroid medication.",
      "Incorporate gluten-free grains to reduce potential autoimmune inflammatory triggers."
    ]
  },
  "annual_checkup_self.pdf": {
    vitals: {
      "Blood Pressure": { value: "120/82", unit: "mmHg", status: "Optimal", color: "text-emerald-500" },
      "Heart Rate": { value: "74", unit: "bpm", status: "Normal", color: "text-teal-500" },
      "Blood Glucose": { value: "94", unit: "mg/dL", status: "Optimal", color: "text-emerald-500" },
      "Oxygen Saturation": { value: "99%", unit: "SpO2", status: "Optimal", color: "text-emerald-500" }
    },
    metrics: [
      { name: "25-Hydroxy Vitamin D", value: "28", unit: "ng/mL", status: "Insufficiency (Ref: 30 - 100)" },
      { name: "Hemoglobin", value: "14.5", unit: "g/dL", status: "Optimal (Ref: 13.8 - 17.2)" },
      { name: "White Blood Cell (WBC)", value: "6.8", unit: "K/uL", status: "Optimal (Ref: 4.5 - 11.0)" }
    ],
    checkup: {
      type: "Comprehensive Annual Physical",
      findings: "Healthy overall baseline. Noted mild Vitamin D deficiency (28 ng/mL)."
    },
    medications: [
      { name: "Cholecalciferol (Vitamin D3)", dose: "1000 IU", freq: "Once daily with meals", status: "Active" }
    ],
    diet: [
      "Incorporate foods rich in Vitamin D, such as fatty fish (salmon) and egg yolks.",
      "Consume calcium-rich foods to support Vitamin D synthesis.",
      "Maintain balanced daily calories (50% complex carbs, 25% lean protein, 25% healthy fats)."
    ]
  },
  "blood_test_cbc.pdf": {
    vitals: {
      "Blood Pressure": { value: "118/80", unit: "mmHg", status: "Optimal", color: "text-emerald-500" },
      "Heart Rate": { value: "72", unit: "bpm", status: "Normal", color: "text-teal-500" },
      "Blood Glucose": { value: "92", unit: "mg/dL", status: "Optimal", color: "text-emerald-500" },
      "Oxygen Saturation": { value: "99%", unit: "SpO2", status: "Optimal", color: "text-emerald-500" }
    },
    metrics: [
      { name: "White Blood Cell (WBC)", value: "5.9", unit: "K/uL", status: "Optimal (Ref: 4.5 - 11.0)" },
      { name: "Red Blood Cell (RBC)", value: "4.8", unit: "M/uL", status: "Optimal (Ref: 4.3 - 5.9)" },
      { name: "Hemoglobin", value: "14.2", unit: "g/dL", status: "Optimal (Ref: 13.8 - 17.2)" },
      { name: "Platelet Count", value: "235", unit: "K/uL", status: "Optimal (Ref: 150 - 450)" }
    ],
    checkup: {
      type: "Complete Blood Count (CBC)",
      findings: "Optimal blood counts. No indications of infection or anemia."
    },
    medications: [],
    diet: [
      "Maintain stable iron intake with spinach, legumes, and lean proteins.",
      "Combine plant-based iron with Vitamin C (citrus, bell peppers) to boost absorption."
    ]
  },
  "liver_function_panel.pdf": {
    vitals: {
      "Blood Pressure": { value: "128/84", unit: "mmHg", status: "Normal", color: "text-teal-500" },
      "Heart Rate": { value: "75", unit: "bpm", status: "Normal", color: "text-teal-500" }
    },
    metrics: [
      { name: "Alanine Aminotransferase (ALT)", value: "54", unit: "U/L", status: "Mildly Elevated (Ref: 10 - 40)" },
      { name: "Aspartate Aminotransferase (AST)", value: "48", unit: "U/L", status: "Mildly Elevated (Ref: 10 - 40)" },
      { name: "Alkaline Phosphatase (ALP)", value: "85", unit: "U/L", status: "Normal (Ref: 44 - 147)" },
      { name: "Total Bilirubin", value: "0.9", unit: "mg/dL", status: "Normal (Ref: 0.2 - 1.2)" }
    ],
    checkup: {
      type: "Liver Function Test (LFT)",
      findings: "Mildly elevated transaminases (ALT/AST). Suggestive of sluggish metabolic activity."
    },
    medications: [
      { name: "Milk Thistle Extract", dose: "150mg", freq: "Once daily with lunch", status: "Recommended supplement" }
    ],
    diet: [
      "Avoid refined sugars, high-fructose syrups, and saturated fats.",
      "Increase intake of cruciferous vegetables (broccoli, brussels sprouts) to assist liver detox.",
      "Drink black coffee or green tea daily (rich in liver-protective antioxidants)."
    ]
  },
  "eye_prescription_doctor.pdf": {
    vitals: {},
    metrics: [
      { name: "Refractive Error (OD)", value: "-1.50", unit: "Diopter", status: "Stable Myopia" },
      { name: "Refractive Error (OS)", value: "-1.75", unit: "Diopter", status: "Stable Myopia" }
    ],
    checkup: {
      type: "Ophthalmic Examination",
      findings: "Myopic refractive error stabilized. Intraocular pressures are within normal range."
    },
    medications: [
      { name: "Lutein & Zeaxanthin", dose: "10mg", freq: "Once daily with breakfast", status: "Active Supplement" }
    ],
    diet: [
      "Increase lutein-rich foods (spinach, kale, orange bell peppers) to support macular health.",
      "Consume omega-3 fatty acids (salmon, chia seeds) to support tear film health."
    ]
  },
  "renal_function_kidney.pdf": {
    vitals: {
      "Blood Pressure": { value: "122/78", unit: "mmHg", status: "Normal", color: "text-teal-500" }
    },
    metrics: [
      { name: "Serum Creatinine", value: "1.15", unit: "mg/dL", status: "Borderline High (Ref: 0.5 - 1.1)" },
      { name: "Blood Urea Nitrogen (BUN)", value: "22", unit: "mg/dL", status: "Borderline High (Ref: 7 - 20)" },
      { name: "eGFR (Estimated GFR)", value: "58", unit: "mL/min/1.73m²", status: "Mildly Decreased (Target > 60)" }
    ],
    checkup: {
      type: "Renal Function Panel",
      findings: "Borderline high creatinine and BUN. Mildly reduced eGFR (58) suggests early-stage renal strain."
    },
    medications: [
      { name: "Coenzyme Q10", dose: "100mg", freq: "Once daily with meals", status: "Recommended" }
    ],
    diet: [
      "Limit daily sodium intake to less than 2,000 mg.",
      "Moderate protein intake; focus on high-quality, plant-based proteins.",
      "Increase water intake to at least 2.5 - 3.0 Liters daily to assist renal clearance."
    ]
  }
}

const generateDynamicReportMetrics = (reportName) => {
  const clean = reportName.toLowerCase()
  if (clean.includes("lipid") || clean.includes("cholesterol")) {
    return {
      vitals: {
        "Blood Pressure": { value: "132/85", unit: "mmHg", status: "Borderline", color: "text-amber-500" },
        "Heart Rate": { value: "76", unit: "bpm", status: "Normal", color: "text-teal-500" }
      },
      metrics: [
        { name: "LDL Cholesterol", value: "138", unit: "mg/dL", status: "Borderline High (Target < 100)" },
        { name: "HDL Cholesterol", value: "42", unit: "mg/dL", status: "Optimal (Target > 40)" },
        { name: "Total Cholesterol", value: "208", unit: "mg/dL", status: "Borderline High (Target < 200)" }
      ],
      checkup: {
        type: "Lipid Profile Panel",
        findings: "Borderline high LDL cholesterol (138 mg/dL) from custom uploaded report."
      },
      medications: [],
      diet: [
        "Incorporate daily oats and soluble fiber to manage LDL levels.",
        "Limit intake of fried foods and trans-fats."
      ]
    }
  }
  if (clean.includes("thyroid") || clean.includes("tsh")) {
    return {
      vitals: {
        "Blood Pressure": { value: "115/75", unit: "mmHg", status: "Optimal", color: "text-emerald-500" }
      },
      metrics: [
        { name: "TSH (Thyroid Stimulating)", value: "5.1", unit: "uIU/mL", status: "Elevated (Ref: 0.4 - 4.0)" }
      ],
      checkup: {
        type: "Thyroid Panel Follow-up",
        findings: "Mildly elevated TSH (5.1 uIU/mL) indicating subclinical thyroid response."
      },
      medications: [],
      diet: [
        "Include selenium-rich foods like Brazil nuts and fish.",
        "Ensure moderate, clean iodine intake."
      ]
    }
  }
  if (clean.includes("cbc") || clean.includes("blood")) {
    return {
      vitals: {
        "Blood Pressure": { value: "120/80", unit: "mmHg", status: "Normal", color: "text-teal-500" },
        "Heart Rate": { value: "72", unit: "bpm", status: "Normal", color: "text-teal-500" }
      },
      metrics: [
        { name: "Hemoglobin", value: "14.1", unit: "g/dL", status: "Optimal (Ref: 13.8 - 17.2)" },
        { name: "White Blood Cell (WBC)", value: "6.2", unit: "K/uL", status: "Optimal (Ref: 4.5 - 11.0)" }
      ],
      checkup: {
        type: "Complete Blood Count (CBC)",
        findings: "Optimal general blood count parameters."
      },
      medications: [],
      diet: [
        "Ensure adequate iron intake with leafy green vegetables and citrus fruits."
      ]
    }
  }
  if (clean.includes("liver") || clean.includes("alt") || clean.includes("ast")) {
    return {
      vitals: {
        "Blood Pressure": { value: "125/82", unit: "mmHg", status: "Normal", color: "text-teal-500" }
      },
      metrics: [
        { name: "Alanine Aminotransferase (ALT)", value: "52", unit: "U/L", status: "Mildly Elevated (Ref: 10 - 40)" },
        { name: "Aspartate Aminotransferase (AST)", value: "46", unit: "U/L", status: "Mildly Elevated (Ref: 10 - 40)" }
      ],
      checkup: {
        type: "Liver Function Test",
        findings: "Mild elevation in transaminase markers ALT/AST."
      },
      medications: [],
      diet: [
        "Reduce consumption of processed sugars and fats.",
        "Add liver-supportive foods like broccoli, garlic, and green tea."
      ]
    }
  }
  if (clean.includes("renal") || clean.includes("kidney") || clean.includes("creatinine")) {
    return {
      vitals: {
        "Blood Pressure": { value: "128/84", unit: "mmHg", status: "Normal", color: "text-teal-500" }
      },
      metrics: [
        { name: "Serum Creatinine", value: "1.18", unit: "mg/dL", status: "Borderline High (Ref: 0.5 - 1.1)" },
        { name: "BUN (Blood Urea)", value: "21", unit: "mg/dL", status: "Borderline High (Ref: 7 - 20)" }
      ],
      checkup: {
        type: "Renal Function Panel",
        findings: "Borderline creatinine levels indicating slight kidney load."
      },
      medications: [],
      diet: [
        "Moderate protein intake and limit daily sodium.",
        "Drink at least 2.5 - 3.0 Liters of water daily."
      ]
    }
  }
  if (clean.includes("eye") || clean.includes("vision") || clean.includes("prescription")) {
    return {
      vitals: {},
      metrics: [
        { name: "Refractive Error (OD)", value: "-1.50", unit: "Diopter", status: "Stable Myopia" },
        { name: "Refractive Error (OS)", value: "-1.75", unit: "Diopter", status: "Stable Myopia" }
      ],
      checkup: {
        type: "Ophthalmic Examination",
        findings: "Myopic refractive values remain stable."
      },
      medications: [],
      diet: [
        "Increase intake of dark leafy greens and carrots rich in beta-carotene."
      ]
    }
  }
  return {
    vitals: {
      "Blood Pressure": { value: "120/80", unit: "mmHg", status: "Normal", color: "text-teal-500" },
      "Heart Rate": { value: "70", unit: "bpm", status: "Normal", color: "text-teal-500" }
    },
    metrics: [
      { name: "General Vital Index", value: "98", unit: "%", status: "Healthy Baseline Range" }
    ],
    checkup: {
      type: "Custom Upload Analysis",
      findings: "Document parsed. Telemetry values match a healthy standard baseline."
    },
    medications: [],
    diet: [
      "Maintain active exercise routines and hydration levels."
    ]
  }
}

export function ReportProvider({ children }) {
  const { userEmail, isLoggedIn } = useAuth()
  const { family, activeProfileId, setFamily } = useProfiles()

  const [reports, setReports] = useState([])
  const [reportsLoading, setReportsLoading] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)
  const [globalStagedFile, setGlobalStagedFile] = useState(null)

  // Fetch all reports from MongoDB when userEmail / login state changes
  useEffect(() => {
    if (!isLoggedIn || !userEmail) {
      setReports([])
      setReportsLoading(false)
      return
    }

    setReportsLoading(true)
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    fetch(`${apiBase}/api/reports`, {
      headers: { 'x-user-email': userEmail }
    })
      .then(r => r.ok ? r.json() : Promise.reject('Server error'))
      .then(data => {
        setReports(data.map(r => ({
          id:        r.id || r._id,
          name:      r.name,
          dbKey:     r.s3Key,
          profileId: r.profileId,
          date:      r.date,
          size:      r.size,
          type:      r.type,
          pages:     r.s3Url ? [r.s3Url] : [],
          s3Url:     r.s3Url,
          s3Key:     r.s3Key,
          analysis:  r.analysis,
        })))
      })
      .catch(err => console.warn('Could not load reports from backend:', err))
      .finally(() => setReportsLoading(false))
  }, [userEmail, isLoggedIn])

  const renameReport = (id, newName) => {
    setReports(prev => prev.map(r => r.id === id ? { ...r, name: newName } : r))
  }

  const uploadReportSync = (reportName, profileId, dbKey = null, pages = [], sizeStr = null) => {
    const isImage = reportName.endsWith('.png') || reportName.endsWith('.jpg') || reportName.endsWith('.jpeg') || (pages && pages.length > 0);
    const newDoc = {
      id: `r_${Math.floor(Math.random() * 9000 + 1000)}`,
      name: reportName,
      dbKey: dbKey || reportName,
      profileId,
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }),
      size: sizeStr || `${(Math.random() * 2 + 1).toFixed(1)} MB`,
      type: isImage ? 'IMAGE' : 'PDF',
      pages: pages || [],
      link: `https://healthybe.app/s/share_${Math.floor(Math.random() * 900 + 100)}`
    }
    setReports(prev => [newDoc, ...prev])
  }

  const deleteReport = async (reportId) => {
    if (!userEmail) return
    const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
    try {
      await fetch(`${apiBase}/api/reports/${reportId}`, { 
        method: 'DELETE',
        headers: { 'x-user-email': userEmail }
      })
    } catch (err) {
      console.warn('Delete API call failed:', err.message)
    }

    setReports(prev => prev.filter(r => r.id !== reportId))
    
    // Refresh family profiles to fetch updated healthData
    try {
      const res = await fetch(`${apiBase}/api/profiles`, {
        headers: { 'x-user-email': userEmail }
      })
      if (res.ok) {
        const data = await res.json()
        setFamily(data)
      }
    } catch (err) {
      console.warn('Could not reload profiles after delete:', err)
    }
  }

  const uploadReportToS3 = async (file, profileId, customFilename = null) => {
    if (!userEmail) return { success: false, error: 'Not logged in' }
    setIsUploading(true)
    setUploadError(null)

    const finalFilename = customFilename || file.name

    const formData = new FormData()
    formData.append('file', file, finalFilename)
    formData.append('profileId', profileId)

    try {
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3001'
      const res = await fetch(`${apiBase}/api/upload`, {
        method: 'POST',
        headers: { 'x-user-email': userEmail },
        body: formData,
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Upload failed' }))
        throw new Error(err.error || `Server error ${res.status}`)
      }

      const data = await res.json()
      const isImage = file.type.includes('image')

      const newDoc = {
        id: data.id || `r_${Math.floor(Math.random() * 9000 + 1000)}`,
        name: finalFilename,
        dbKey: data.s3Key || data.fileKey,
        profileId,
        date: data.date || new Date().toLocaleDateString('en-US', { month: 'long', day: '2-digit', year: 'numeric' }),
        size: data.size,
        type: isImage ? 'IMAGE' : 'PDF',
        pages: data.s3Url ? [data.s3Url] : [],
        s3Url: data.s3Url,
        s3Key: data.s3Key || data.fileKey,
        analysis: data.analysis,
      }

      setReports(prev => [newDoc, ...prev])

      // Refresh family profiles to fetch updated healthData
      try {
        const profilesRes = await fetch(`${apiBase}/api/profiles`, {
          headers: { 'x-user-email': userEmail }
        })
        if (profilesRes.ok) {
          const profilesData = await profilesRes.json()
          setFamily(profilesData)
        }
      } catch (err) {
        console.warn('Could not reload profiles after upload:', err)
      }

      return { success: true, report: newDoc }
    } catch (err) {
      setUploadError(err.message)
      return { success: false, error: err.message }
    } finally {
      setIsUploading(false)
    }
  }

  const getDataForReport = (report) => {
    if (report?.analysis) return report.analysis
    const key = report?.dbKey || report?.name
    return REPORT_DATABASE[key] || generateDynamicReportMetrics(key)
  }

  const getDerivedHealthData = (profileId = 'all') => {
    const activeReports = profileId === 'all'
      ? reports
      : reports.filter(r => r.profileId === profileId)

    const sortedReports = [...activeReports]

    // Compile Vitals
    let vitals = {}
    if (profileId === 'all') {
      family.forEach(member => {
        const memberReport = sortedReports.find(r => r.profileId === member.id)
        if (memberReport) {
          const dbData = getDataForReport(memberReport)
          if (dbData && Object.keys(dbData.vitals || {}).length > 0) {
            vitals[member.id] = {
              memberName: member.name,
              initials: member.initials,
              profileImageUrl: member.profileImageUrl,
              stats: dbData.vitals
            }
          }
        }
      })
    } else {
      const reportWithVitals = sortedReports.find(r => {
        const dbData = getDataForReport(r)
        return dbData && Object.keys(dbData.vitals || {}).length > 0
      })
      if (reportWithVitals) {
        vitals = getDataForReport(reportWithVitals).vitals
      }
    }

    // Compile Lab Metrics
    const latestMetrics = {}
    sortedReports.forEach(r => {
      const data = getDataForReport(r)
      if (data && data.metrics) {
        data.metrics.forEach(m => {
          if (!latestMetrics[m.name]) {
            latestMetrics[m.name] = {
              ...m,
              date: r.date,
              fileName: r.name,
              memberId: r.profileId,
              memberName: family.find(f => f.id === r.profileId)?.name || 'Unknown'
            }
          }
        })
      }
    })
    const metricsList = Object.values(latestMetrics)

    // Compile Medications List
    const medications = []
    const seenMedications = new Set()
    sortedReports.forEach(r => {
      const data = getDataForReport(r)
      if (data && data.medications) {
        data.medications.forEach(m => {
          const keyMed = `${r.profileId}_${m.name}`
          if (!seenMedications.has(keyMed)) {
            seenMedications.add(keyMed)
            medications.push({
              ...m,
              memberName: family.find(f => f.id === r.profileId)?.name || 'Unknown',
              initials: family.find(f => f.id === r.profileId)?.initials || '??',
              profileImageUrl: family.find(f => f.id === r.profileId)?.profileImageUrl || null,
              source: r.name,
              date: r.date
            })
          }
        })
      }
    })

    // Compile Checkups List
    const checkups = []
    sortedReports.forEach(r => {
      const data = getDataForReport(r)
      if (data && data.checkup) {
        checkups.push({
          date: r.date,
          type: data.checkup.type,
          findings: data.checkup.findings,
          memberName: family.find(f => f.id === r.profileId)?.name || 'Unknown',
          initials: family.find(f => f.id === r.profileId)?.initials || '??',
          fileName: r.name
        })
      }
    })

    // Compile Diet Guidelines
    const dietGuidelines = []
    sortedReports.forEach(r => {
      const data = getDataForReport(r)
      if (data && data.diet) {
        data.diet.forEach(d => {
          const memberName = family.find(f => f.id === r.profileId)?.name || 'Unknown'
          dietGuidelines.push({ text: d, memberName, profileId: r.profileId })
        })
      }
    })

    const uniqueDiets = []
    const seenDiets = new Set()
    dietGuidelines.forEach(item => {
      const key = `${item.profileId}_${item.text}`
      if (!seenDiets.has(key)) {
        seenDiets.add(key)
        uniqueDiets.push(item)
      }
    })

    return { vitals, metrics: metricsList, medications, checkups, diet: uniqueDiets }
  }

  const getReportAnalysis = (reportName) => {
    const r = reports.find(item => item.name === reportName)
    if (r?.analysis) return r.analysis
    const key = r ? (r.dbKey || r.name) : reportName
    return REPORT_DATABASE[key] || generateDynamicReportMetrics(key)
  }

  return (
    <ReportContext.Provider value={{
      reports,
      reportsLoading,
      isUploading,
      uploadError,
      globalStagedFile,
      setGlobalStagedFile,
      renameReport,
      uploadReportSync,
      deleteReport,
      uploadReportToS3,
      getDerivedHealthData,
      getReportAnalysis
    }}>
      {children}
    </ReportContext.Provider>
  )
}

export function useReports() {
  return useContext(ReportContext)
}
