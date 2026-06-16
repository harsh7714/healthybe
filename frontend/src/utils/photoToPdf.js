import jsPDF from 'jspdf'

/**
 * Converts a camera photo (image File) into a PDF File.
 * The image is centred on an A4 page with 10 mm padding.
 * Returns a new File with the same name but .pdf extension.
 */
export async function photoToPdf(imageFile) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(new Error('Failed to read image file'))

    reader.onload = (e) => {
      const img = new Image()
      img.onerror = () => reject(new Error('Failed to load image'))

      img.onload = () => {
        try {
          // Choose portrait or landscape based on the photo orientation
          const orientation = img.width > img.height ? 'landscape' : 'portrait'

          // A4 page dimensions in mm
          const pageW = orientation === 'landscape' ? 297 : 210
          const pageH = orientation === 'landscape' ? 210 : 297
          const PADDING = 10

          // Scale image to fit within padded area while keeping aspect ratio
          const maxW = pageW - PADDING * 2
          const maxH = pageH - PADDING * 2
          const ratio = Math.min(maxW / img.width, maxH / img.height)
          const imgW = img.width * ratio
          const imgH = img.height * ratio
          const x = (pageW - imgW) / 2
          const y = (pageH - imgH) / 2

          const pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
          pdf.addImage(e.target.result, 'JPEG', x, y, imgW, imgH)

          const blob = pdf.output('blob')
          const pdfName = imageFile.name.replace(/\.(jpe?g|png|webp|gif)$/i, '.pdf')
          const pdfFile = new File([blob], pdfName, { type: 'application/pdf' })

          resolve(pdfFile)
        } catch (err) {
          reject(err)
        }
      }

      img.src = e.target.result
    }

    reader.readAsDataURL(imageFile)
  })
}
