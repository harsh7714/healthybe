import jsPDF from 'jspdf'

/**
 * generateClinicalPdf — Generates a multi-page, formatted medical summary PDF
 * for patient consultations, hospital visits, and personal health archival.
 */
export async function generateClinicalPdf({
  profile = {},
  vitals = {},
  metrics = [],
  medications = [],
  checkups = [],
  diet = [],
  options = {
    includeVitals: true,
    includeMedications: true,
    includeCheckups: true,
    includeMetrics: true,
    includeDiet: true,
    includeEmergency: true,
  }
}) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const pageW = 210
  const pageH = 297
  const margin = 14
  const contentW = pageW - margin * 2

  let currentY = margin

  // Helper to ensure page bounds
  const checkPageBreak = (neededHeight) => {
    if (currentY + neededHeight > pageH - 20) {
      doc.addPage('a4', 'portrait')
      currentY = margin
      renderPageHeader(true)
    }
  }

  // Helper to draw a modern section header
  const renderSectionHeader = (title, icon = '') => {
    checkPageBreak(14)
    doc.setFillColor(15, 23, 42) // Slate 900
    doc.roundedRect(margin, currentY, contentW, 7.5, 1.5, 1.5, 'F')

    doc.setTextColor(20, 184, 166) // Teal 500
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(9)
    doc.text(`${icon ? icon + '  ' : ''}${title.toUpperCase()}`, margin + 3.5, currentY + 5.2)

    currentY += 10.5
  }

  // Top Page Header
  const renderPageHeader = (isContinuation = false) => {
    // Header background banner
    doc.setFillColor(13, 148, 136) // Teal 600
    doc.rect(margin, currentY, contentW, 16, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(13)
    doc.text('HEALTHYBE', margin + 5, currentY + 7.5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.text('Family Health Management & Clinical Vault', margin + 5, currentY + 12)

    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    const titleText = isContinuation ? 'CLINICAL SUMMARY (CONT.)' : 'CLINICAL HEALTH SUMMARY CARD'
    doc.text(titleText, pageW - margin - 5, currentY + 7.5, { align: 'right' })

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    doc.text(`Generated: ${dateStr}`, pageW - margin - 5, currentY + 12, { align: 'right' })

    currentY += 21
  }

  // 1. Render First Page Header
  renderPageHeader(false)

  // 2. Patient Demographics Card
  checkPageBreak(24)
  doc.setFillColor(248, 250, 252) // Slate 50
  doc.setDrawColor(203, 213, 225) // Slate 300
  doc.roundedRect(margin, currentY, contentW, 22, 2, 2, 'FD')

  doc.setTextColor(15, 23, 42)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.text(profile.name || 'Primary Patient', margin + 4, currentY + 6)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8)
  doc.setTextColor(71, 85, 105)
  doc.text(`Relation: ${profile.relation || 'Self (Primary)'}`, margin + 4, currentY + 11)
  doc.text(`Age: ${profile.age || 'Not specified'}`, margin + 4, currentY + 16)

  doc.text(`Account ID: ${profile.email || profile.userId || 'HealthyBe User'}`, margin + 70, currentY + 11)
  doc.text(`Document Reference: HB-${Date.now().toString().slice(-8)}`, margin + 70, currentY + 16)

  currentY += 27

  // 3. Clinical Vitals Snapshot
  if (options.includeVitals && vitals && Object.keys(vitals).length > 0) {
    renderSectionHeader('Clinical Vitals & Physiological Telemetry', '●')

    let entries = []
    const firstVal = Object.values(vitals)[0]
    if (firstVal && firstVal.stats) {
      Object.entries(vitals).forEach(([, memData]) => {
        if (memData.stats) {
          Object.entries(memData.stats).forEach(([vName, sObj]) => {
            entries.push([`${memData.memberName ? memData.memberName + ': ' : ''}${vName}`, sObj])
          })
        }
      })
    } else {
      entries = Object.entries(vitals)
    }

    if (entries.length > 0) {
      const colW = contentW / Math.min(entries.length, 4)
      const rowH = 15

      let rowX = margin
      entries.forEach(([name, stat], idx) => {
        checkPageBreak(rowH + 2)
        doc.setFillColor(241, 245, 249)
        doc.setDrawColor(226, 232, 240)
        doc.roundedRect(rowX, currentY, colW - 2, rowH, 1.5, 1.5, 'FD')

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(7)
        doc.setTextColor(100, 116, 139)
        doc.text(name.toUpperCase(), rowX + 2.5, currentY + 4)

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(10)
        doc.setTextColor(15, 23, 42)
        doc.text(`${stat?.value || '--'}`, rowX + 2.5, currentY + 9)

        doc.setFontSize(6.5)
        doc.setFont('helvetica', 'normal')
        doc.setTextColor(100, 116, 139)
        doc.text(stat?.unit || '', rowX + 25, currentY + 9)

        // Status indicator
        const st = stat?.status || 'Normal'
        doc.setFontSize(6.5)
        doc.setFont('helvetica', 'bold')
        if (st.toLowerCase().includes('high') || st.toLowerCase().includes('critical')) {
          doc.setTextColor(225, 29, 72)
        } else if (st.toLowerCase().includes('borderline')) {
          doc.setTextColor(217, 119, 6)
        } else {
          doc.setTextColor(13, 148, 136)
        }
        doc.text(`[${st}]`, rowX + 2.5, currentY + 13)

        if ((idx + 1) % 4 === 0) {
          rowX = margin
          currentY += rowH + 3
        } else {
          rowX += colW
        }
      })

      if (entries.length % 4 !== 0) {
        currentY += rowH + 4
      } else {
        currentY += 2
      }
    }
  }

  // 4. Active Medical Prescriptions
  if (options.includeMedications && medications && medications.length > 0) {
    renderSectionHeader('Active Prescriptions & Medications', '●')

    medications.forEach((med, idx) => {
      checkPageBreak(12)
      doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252)
      doc.setDrawColor(226, 232, 240)
      doc.rect(margin, currentY, contentW, 10.5, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(15, 23, 42)
      doc.text(med.name || 'Prescribed Medicine', margin + 3, currentY + 4.5)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(71, 85, 105)
      doc.text(`Dosage: ${med.dosage || 'As directed'}`, margin + 65, currentY + 4.5)
      doc.text(`Schedule: ${med.frequency || 'Daily'}`, margin + 115, currentY + 4.5)

      doc.setFontSize(6.5)
      doc.setTextColor(100, 116, 139)
      doc.text(`Source: ${med.source || 'Medical Record'} (${med.date || 'Active'})`, margin + 3, currentY + 8.5)

      currentY += 11.5
    })

    currentY += 3
  }

  // 5. Diagnostic Checkups History
  if (options.includeCheckups && checkups && checkups.length > 0) {
    renderSectionHeader('Diagnostic Checkups & Clinical Observations', '●')

    checkups.forEach((c) => {
      checkPageBreak(16)
      doc.setFillColor(248, 250, 252)
      doc.setDrawColor(226, 232, 240)
      doc.roundedRect(margin, currentY, contentW, 13.5, 1, 1, 'FD')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(8.5)
      doc.setTextColor(15, 23, 42)
      doc.text(c.type || 'Diagnostic Panel', margin + 3, currentY + 4.5)

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(100, 116, 139)
      doc.text(c.date || 'Recent', pageW - margin - 3, currentY + 4.5, { align: 'right' })

      doc.setTextColor(51, 65, 85)
      doc.setFontSize(7.5)
      const findingsText = doc.splitTextToSize(c.findings || 'No specific clinical abnormalities noted.', contentW - 6)
      doc.text(findingsText, margin + 3, currentY + 9)

      currentY += 15.5
    })

    currentY += 2
  }

  // 6. Extracted Lab Test Biomarkers
  if (options.includeMetrics && metrics && metrics.length > 0) {
    renderSectionHeader('Laboratory Test Biomarkers & Pathology Indicators', '●')

    // Table header
    checkPageBreak(8)
    doc.setFillColor(226, 232, 240)
    doc.rect(margin, currentY, contentW, 6, 'F')
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(7)
    doc.setTextColor(71, 85, 105)
    doc.text('BIOMARKER NAME', margin + 3, currentY + 4)
    doc.text('MEASURED VALUE', margin + 70, currentY + 4)
    doc.text('CLINICAL STATUS / REFERENCE', margin + 115, currentY + 4)
    currentY += 7

    metrics.slice(0, 15).forEach((m, mIdx) => {
      checkPageBreak(8)
      doc.setFillColor(mIdx % 2 === 0 ? 255 : 248, mIdx % 2 === 0 ? 255 : 250, mIdx % 2 === 0 ? 255 : 252)
      doc.rect(margin, currentY, contentW, 6.5, 'F')

      doc.setFont('helvetica', 'bold')
      doc.setFontSize(7.5)
      doc.setTextColor(15, 23, 42)
      doc.text(m.name || 'Lab Test', margin + 3, currentY + 4.5)

      doc.setFont('helvetica', 'normal')
      doc.text(`${m.value} ${m.unit || ''}`, margin + 70, currentY + 4.5)

      const statusStr = m.status || 'Normal'
      if (statusStr.toLowerCase().includes('high') || statusStr.toLowerCase().includes('critical') || statusStr.toLowerCase().includes('elevated')) {
        doc.setTextColor(225, 29, 72)
        doc.setFont('helvetica', 'bold')
      } else if (statusStr.toLowerCase().includes('borderline')) {
        doc.setTextColor(217, 119, 6)
      } else {
        doc.setTextColor(13, 148, 136)
      }
      doc.text(statusStr, margin + 115, currentY + 4.5)

      currentY += 7
    })

    currentY += 3
  }

  // 7. Dietary & Lifestyle Directives
  if (options.includeDiet && diet && diet.length > 0) {
    renderSectionHeader('Personalized Nutrition & Lifestyle Guidelines', '●')

    diet.forEach((d) => {
      checkPageBreak(8)
      const directive = typeof d === 'string' ? d : d.text || ''
      if (!directive) return

      doc.setFont('helvetica', 'normal')
      doc.setFontSize(7.5)
      doc.setTextColor(51, 65, 85)
      doc.text('•', margin + 3, currentY + 3.5)
      const lines = doc.splitTextToSize(directive, contentW - 10)
      doc.text(lines, margin + 7, currentY + 3.5)
      currentY += lines.length * 4.2 + 1.5
    })

    currentY += 3
  }

  // 8. Emergency Helplines & Directives
  if (options.includeEmergency) {
    checkPageBreak(22)
    renderSectionHeader('Emergency Medical Contacts & Helplines', '●')

    doc.setFillColor(254, 242, 242) // Rose 50
    doc.setDrawColor(254, 205, 211) // Rose 200
    doc.roundedRect(margin, currentY, contentW, 14, 1.5, 1.5, 'FD')

    doc.setTextColor(159, 18, 57) // Rose 900
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8)
    doc.text('🚨 NATIONAL EMERGENCY HELPLINES:', margin + 3.5, currentY + 5)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(7.5)
    doc.setTextColor(190, 18, 60)
    doc.text('Ambulance / Emergency: 108 / 112  |  Poison Control: 1800-116-117  |  National Health Helpline: 1800-180-1104', margin + 3.5, currentY + 10)

    currentY += 18
  }

  // 9. Footer & Disclaimer on each page
  const totalPages = doc.internal.getNumberOfPages()
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p)
    doc.setDrawColor(226, 232, 240)
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(6.5)
    doc.setTextColor(148, 163, 184) // Slate 400
    doc.text('CONFIDENTIAL MEDICAL SUMMARY — Intended for clinical consultation and patient recordkeeping only.', margin, pageH - 8)
    doc.text(`Page ${p} of ${totalPages}`, pageW - margin, pageH - 8, { align: 'right' })
  }

  // Download the generated PDF
  const cleanName = (profile.name || 'Patient').replace(/[^a-zA-Z0-9]/g, '_')
  const fileName = `HealthyBe_Summary_${cleanName}_${new Date().toISOString().slice(0, 10)}.pdf`
  doc.save(fileName)

  return fileName
}
