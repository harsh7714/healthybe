import React, { useState, useEffect, useRef } from 'react'
import jsPDF from 'jspdf'
import { Button } from './ui/Button'
import { Spinner } from './ui/Spinner'

export function DocumentScannerModal({ isOpen, onClose, onComplete }) {
  if (!isOpen) return null

  const [step, setStep] = useState('camera') // 'camera' | 'editor' | 'compile'
  const [pages, setPages] = useState([])
  const [activePageIndex, setActivePageIndex] = useState(0)

  // Camera WebRTC states
  const [devices, setDevices] = useState([])
  const [selectedDeviceId, setSelectedDeviceId] = useState('')
  const [cameraError, setCameraError] = useState(null)
  const [isCameraStarting, setIsCameraStarting] = useState(false)
  const [flashActive, setFlashActive] = useState(false)

  // Save/compile states
  const [pdfName, setPdfName] = useState(`Scan_${new Date().toISOString().slice(0, 10)}`)
  const [isCompiling, setIsCompiling] = useState(false)

  const videoRef = useRef(null)
  const streamRef = useRef(null)
  const editorContainerRef = useRef(null)

  // Drag states for crop handles
  const [draggedHandle, setDraggedHandle] = useState(null) // 'top' | 'bottom' | 'left' | 'right'

  // Initialize camera and get device list
  useEffect(() => {
    if (step === 'camera') {
      initCamera()
    } else {
      stopCamera()
    }
    return () => stopCamera()
  }, [step, selectedDeviceId])

  // Get list of video devices
  useEffect(() => {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
      navigator.mediaDevices.enumerateDevices()
        .then(devs => {
          const videoDevs = devs.filter(d => d.kind === 'videoinput')
          setDevices(videoDevs)
          if (videoDevs.length && !selectedDeviceId) {
            // Default to environment (back) camera if found
            const backCam = videoDevs.find(d => d.label.toLowerCase().includes('back') || d.label.toLowerCase().includes('environment'))
            setSelectedDeviceId(backCam ? backCam.deviceId : videoDevs[0].deviceId)
          }
        })
        .catch(err => console.warn('Could not enumerate cameras:', err))
    }
  }, [])

  const initCamera = async () => {
    stopCamera()
    setIsCameraStarting(true)
    setCameraError(null)

    const constraints = selectedDeviceId
      ? { video: { deviceId: { exact: selectedDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } } }
      : { video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } } }

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera streaming not supported on this browser context')
      }
      const stream = await navigator.mediaDevices.getUserMedia(constraints)
      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play().catch(e => console.warn('Video play failed:', e))
      }
    } catch (err) {
      console.error('Camera access failed:', err)
      setCameraError('Could not access camera. Please check permissions or select another device.')
    } finally {
      setIsCameraStarting(false)
    }
  }

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop())
      streamRef.current = null
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }

  // Snap photo
  const handleCapture = () => {
    if (!videoRef.current) return

    // Trigger visual flash
    setFlashActive(true)
    setTimeout(() => setFlashActive(false), 150)

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1920
    canvas.height = video.videoHeight || 1080

    const ctx = canvas.getContext('2d')
    if (ctx) {
      // Draw current video frame
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95)

      const newPage = {
        id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalUrl: dataUrl,
        processedUrl: dataUrl,
        rotation: 0,
        filter: 'original', // 'original' | 'document' | 'grayscale' | 'bw'
        crop: { top: 0, bottom: 0, left: 0, right: 0 } // percents
      }

      setPages(prev => [...prev, newPage])
    }
  }

  // Handle image processing in canvas (crop, rotate, apply filter)
  const processImage = (page) => {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const { rotation, filter, crop } = page

        // Get cropped dimensions
        const cropL = (crop.left / 100) * img.width
        const cropR = (crop.right / 100) * img.width
        const cropT = (crop.top / 100) * img.height
        const cropB = (crop.bottom / 100) * img.height

        const srcW = img.width - cropL - cropR
        const srcH = img.height - cropT - cropB

        // Determine canvas dimensions based on rotation
        const isRotated90 = rotation === 90 || rotation === 270
        canvas.width = isRotated90 ? srcH : srcW
        canvas.height = isRotated90 ? srcW : srcH

        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(page.originalUrl)
          return
        }

        // Apply filters (using canvas filters where supported)
        if (filter === 'document') {
          // Document scanning mode - boost contrast and brightness slightly to whiten paper background
          ctx.filter = 'contrast(1.4) brightness(1.1) saturate(0.8)'
        } else if (filter === 'grayscale') {
          ctx.filter = 'grayscale(1) contrast(1.15)'
        } else {
          ctx.filter = 'none'
        }

        // Apply translation and rotation
        ctx.translate(canvas.width / 2, canvas.height / 2)
        ctx.rotate((rotation * Math.PI) / 180)

        // Draw cropped portion
        ctx.drawImage(
          img,
          cropL,
          cropT,
          srcW,
          srcH,
          -srcW / 2,
          -srcH / 2,
          srcW,
          srcH
        )

        // Black and White high-contrast threshold filter (manual pixel processing for photocopy look)
        if (filter === 'bw') {
          const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
          const data = imgData.data
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i]
            const g = data[i + 1]
            const b = data[i + 2]
            // Standard relative luminance formula
            const gray = 0.299 * r + 0.587 * g + 0.114 * b
            const val = gray > 128 ? 255 : 0
            data[i] = data[i + 1] = data[i + 2] = val
          }
          ctx.putImageData(imgData, 0, 0)
        }

        resolve(canvas.toDataURL('image/jpeg', 0.95))
      }
      img.src = page.originalUrl
    })
  }

  // Update a page configuration and re-process image
  const updatePageConfig = async (index, newProps) => {
    // 1. Get snapshot of current target page, merged with updates
    const targetPage = { ...pages[index], ...newProps }
    
    // 2. Generate new processed url from updated config
    const url = await processImage(targetPage)
    
    // 3. Update state
    setPages(prev => {
      const copy = [...prev]
      if (copy[index]) {
        copy[index] = { ...targetPage, processedUrl: url }
      }
      return copy
    })
  }

  // Crop drag event handlers (percentage-based sliders logic)
  const handleCropMouseDown = (handle, e) => {
    e.preventDefault()
    setDraggedHandle(handle)
  }

  const handleCropMouseMove = (e) => {
    if (!draggedHandle || !editorContainerRef.current) return

    const rect = editorContainerRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const pctX = Math.max(0, Math.min(100, (x / rect.width) * 100))
    const pctY = Math.max(0, Math.min(100, (y / rect.height) * 100))

    const activePage = pages[activePageIndex]
    if (!activePage) return

    const { crop } = activePage
    let newCrop = { ...crop }

    if (draggedHandle === 'top') {
      newCrop.top = Math.max(0, Math.min(100 - crop.bottom - 5, pctY))
    } else if (draggedHandle === 'bottom') {
      newCrop.bottom = Math.max(0, Math.min(100 - crop.top - 5, 100 - pctY))
    } else if (draggedHandle === 'left') {
      newCrop.left = Math.max(0, Math.min(100 - crop.right - 5, pctX))
    } else if (draggedHandle === 'right') {
      newCrop.right = Math.max(0, Math.min(100 - crop.left - 5, 100 - pctX))
    }

    updatePageConfig(activePageIndex, { crop: newCrop })
  }

  const handleCropMouseUp = () => {
    setDraggedHandle(null)
  }

  // Support mobile touch drag
  const handleCropTouchStart = (handle, e) => {
    setDraggedHandle(handle)
  }

  const handleCropTouchMove = (e) => {
    if (!draggedHandle || !editorContainerRef.current || !e.touches.length) return

    const rect = editorContainerRef.current.getBoundingClientRect()
    const touch = e.touches[0]
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    const pctX = Math.max(0, Math.min(100, (x / rect.width) * 100))
    const pctY = Math.max(0, Math.min(100, (y / rect.height) * 100))

    const activePage = pages[activePageIndex]
    if (!activePage) return

    const { crop } = activePage
    let newCrop = { ...crop }

    if (draggedHandle === 'top') {
      newCrop.top = Math.max(0, Math.min(100 - crop.bottom - 5, pctY))
    } else if (draggedHandle === 'bottom') {
      newCrop.bottom = Math.max(0, Math.min(100 - crop.top - 5, 100 - pctY))
    } else if (draggedHandle === 'left') {
      newCrop.left = Math.max(0, Math.min(100 - crop.right - 5, pctX))
    } else if (draggedHandle === 'right') {
      newCrop.right = Math.max(0, Math.min(100 - crop.left - 5, 100 - pctX))
    }

    updatePageConfig(activePageIndex, { crop: newCrop })
  }

  // Delete page
  const handleDeletePage = (index) => {
    const nextPages = pages.filter((_, i) => i !== index)
    setPages(nextPages)
    if (nextPages.length === 0) {
      setStep('camera')
      setActivePageIndex(0)
    } else if (activePageIndex >= nextPages.length) {
      setActivePageIndex(nextPages.length - 1)
    }
  }

  // Reorder pages
  const movePage = (index, direction) => {
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === pages.length - 1) return

    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const copy = [...pages]
    const temp = copy[index]
    copy[index] = copy[targetIndex]
    copy[targetIndex] = temp

    setPages(copy)
    setActivePageIndex(targetIndex)
  }

  // Compile PDF and upload
  const handleCompile = async () => {
    if (pages.length === 0) return
    setIsCompiling(true)

    try {
      let pdf = null

      for (let i = 0; i < pages.length; i++) {
        const page = pages[i]
        // Ensure image processedUrl is calculated
        const imgUrl = page.processedUrl || await processImage(page)

        const loadImg = (url) => new Promise((resolve) => {
          const img = new Image()
          img.onload = () => resolve({ width: img.width, height: img.height })
          img.src = url
        })

        const dims = await loadImg(imgUrl)
        const orientation = dims.width > dims.height ? 'landscape' : 'portrait'
        const pageW = orientation === 'landscape' ? 297 : 210
        const pageH = orientation === 'landscape' ? 210 : 297
        const PADDING = 10

        const maxW = pageW - PADDING * 2
        const maxH = pageH - PADDING * 2
        const ratio = Math.min(maxW / dims.width, maxH / dims.height)
        const imgW = dims.width * ratio
        const imgH = dims.height * ratio
        const x = (pageW - imgW) / 2
        const y = (pageH - imgH) / 2

        if (i === 0) {
          pdf = new jsPDF({ orientation, unit: 'mm', format: 'a4' })
        } else {
          pdf.addPage('a4', orientation)
        }

        pdf.addImage(imgUrl, 'JPEG', x, y, imgW, imgH)
      }

      const blob = pdf.output('blob')
      const finalFilename = pdfName.toLowerCase().endsWith('.pdf') ? pdfName : `${pdfName}.pdf`
      const compiledFile = new File([blob], finalFilename, { type: 'application/pdf' })

      onComplete(compiledFile)
      onClose()
    } catch (err) {
      console.error('PDF Compilation failed:', err)
    } finally {
      setIsCompiling(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in overflow-hidden">
      <div className="bg-slate-950 border border-slate-900 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Flash screen overlay */}
        {flashActive && (
          <div className="absolute inset-0 bg-white/80 z-[100] animate-pulse" />
        )}

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-900/60 flex items-center justify-between bg-slate-900/40">
          <div>
            <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
              <span className="text-teal-400">📷</span> Adobe-Style PDF Document Maker
            </h3>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {step === 'camera' && 'Snap pages sequentially. Align document within guides.'}
              {step === 'editor' && 'Adjust borders, apply filters, or rotate to correct layout.'}
              {step === 'compile' && 'Review document pages, reorder if needed, and compile.'}
            </p>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
          
          {/* Main Area */}
          <div className="flex-1 bg-black/40 flex flex-col relative overflow-hidden p-4 justify-center items-center">
            
            {/* Step 1: Camera View Finder */}
            {step === 'camera' && (
              <div className="relative w-full max-w-lg aspect-[3/4] bg-slate-900 border border-slate-850 rounded-2xl overflow-hidden flex flex-col items-center justify-center">
                {isCameraStarting ? (
                  <div className="flex flex-col items-center gap-3">
                    <Spinner size="lg" />
                    <p className="text-xs text-slate-400">Accessing Camera...</p>
                  </div>
                ) : cameraError ? (
                  <div className="p-6 text-center space-y-4">
                    <span className="text-4xl text-rose-500">⚠️</span>
                    <p className="text-sm font-semibold text-rose-400">{cameraError}</p>
                    <Button variant="secondary" size="sm" onClick={initCamera}>Try Again</Button>
                  </div>
                ) : (
                  <>
                    <video 
                      ref={videoRef} 
                      className="w-full h-full object-cover" 
                      autoPlay 
                      playsInline 
                      muted 
                    />
                    
                    {/* Document Alignment Frame */}
                    <div className="absolute inset-0 border-[3px] border-dashed border-teal-500/40 m-8 rounded-xl pointer-events-none flex items-center justify-center">
                      <div className="text-[9px] bg-slate-950/80 text-teal-400 font-bold tracking-wide uppercase px-3 py-1.5 rounded-lg border border-teal-500/20 backdrop-blur-sm">
                        Place Document Here
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Step 2: Page Editor (Crop & Filters) */}
            {step === 'editor' && pages[activePageIndex] && (
              <div className="flex flex-col items-center w-full h-full justify-between gap-4">
                
                {/* Editor Container with Crop Outlines */}
                <div 
                  ref={editorContainerRef}
                  onMouseMove={handleCropMouseMove}
                  onMouseUp={handleCropMouseUp}
                  onTouchMove={handleCropTouchMove}
                  onTouchEnd={handleCropMouseUp}
                  className="relative max-h-[50vh] aspect-[3/4] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 select-none flex items-center justify-center"
                  style={{ maxHeight: 'calc(80vh - 200px)' }}
                >
                  <img 
                    src={pages[activePageIndex].originalUrl} 
                    alt="Original scan" 
                    className="max-w-full max-h-full object-contain pointer-events-none"
                    style={{
                      transform: `rotate(${pages[activePageIndex].rotation}deg)`,
                      transition: 'transform 0.2s ease'
                    }}
                  />

                  {/* Crop Borders overlay */}
                  <div 
                    className="absolute border-2 border-teal-400 bg-teal-400/5 shadow-2xl"
                    style={{
                      top: `${pages[activePageIndex].crop.top}%`,
                      bottom: `${pages[activePageIndex].crop.bottom}%`,
                      left: `${pages[activePageIndex].crop.left}%`,
                      right: `${pages[activePageIndex].crop.right}%`,
                    }}
                  >
                    {/* Top drag handle */}
                    <div 
                      onMouseDown={(e) => handleCropMouseDown('top', e)}
                      onTouchStart={(e) => handleCropTouchStart('top', e)}
                      className="absolute top-0 left-0 right-0 h-4 -mt-2 cursor-ns-resize flex items-center justify-center"
                    >
                      <div className="w-12 h-1.5 bg-teal-400 rounded-full border border-slate-950" />
                    </div>

                    {/* Bottom drag handle */}
                    <div 
                      onMouseDown={(e) => handleCropMouseDown('bottom', e)}
                      onTouchStart={(e) => handleCropTouchStart('bottom', e)}
                      className="absolute bottom-0 left-0 right-0 h-4 -mb-2 cursor-ns-resize flex items-center justify-center"
                    >
                      <div className="w-12 h-1.5 bg-teal-400 rounded-full border border-slate-950" />
                    </div>

                    {/* Left drag handle */}
                    <div 
                      onMouseDown={(e) => handleCropMouseDown('left', e)}
                      onTouchStart={(e) => handleCropTouchStart('left', e)}
                      className="absolute top-0 bottom-0 left-0 w-4 -ml-2 cursor-ew-resize flex items-center justify-center"
                    >
                      <div className="h-12 w-1.5 bg-teal-400 rounded-full border border-slate-950" />
                    </div>

                    {/* Right drag handle */}
                    <div 
                      onMouseDown={(e) => handleCropMouseDown('right', e)}
                      onTouchStart={(e) => handleCropTouchStart('right', e)}
                      className="absolute top-0 bottom-0 right-0 w-4 -mr-2 cursor-ew-resize flex items-center justify-center"
                    >
                      <div className="h-12 w-1.5 bg-teal-400 rounded-full border border-slate-950" />
                    </div>
                  </div>
                </div>

                {/* Editor Settings bar */}
                <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
                  {/* Rotation and deletion controls */}
                  <div className="flex justify-between items-center border-b border-slate-800/80 pb-3">
                    <span className="text-xs text-slate-400 font-medium">Page {activePageIndex + 1} of {pages.length}</span>
                    <div className="flex gap-2">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        onClick={() => {
                          const r = (pages[activePageIndex].rotation + 90) % 360
                          updatePageConfig(activePageIndex, { rotation: r })
                        }}
                        className="py-1 px-3 rounded-xl text-xs"
                      >
                        🔄 Rotate 90°
                      </Button>
                      <Button 
                        variant="danger" 
                        size="sm" 
                        onClick={() => handleDeletePage(activePageIndex)}
                        className="py-1 px-3 rounded-xl text-xs"
                      >
                        🗑️ Delete
                      </Button>
                    </div>
                  </div>

                  {/* Filter selector */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Enhancement Filter</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'original', label: 'Original' },
                        { id: 'document', label: 'Document' },
                        { id: 'grayscale', label: 'Gray' },
                        { id: 'bw', label: 'B & W' }
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => updatePageConfig(activePageIndex, { filter: f.id })}
                          className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                            pages[activePageIndex].filter === f.id
                              ? 'bg-teal-500/10 border-teal-500 text-teal-400'
                              : 'bg-slate-950/40 border-slate-800/60 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            )}

            {/* Step 3: Compilation and Reorder view */}
            {step === 'compile' && (
              <div className="w-full max-w-xl h-full flex flex-col justify-between py-2">
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-0">
                  <div className="bg-slate-900/30 border border-slate-900 rounded-2xl p-4 space-y-3">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Compile Details</span>
                    <div className="space-y-2">
                      <label className="text-xs text-slate-400 font-semibold block">Document PDF Name</label>
                      <input 
                        type="text" 
                        value={pdfName} 
                        onChange={e => setPdfName(e.target.value)}
                        placeholder="Enter document name"
                        className="w-full bg-slate-950 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-teal-400 font-bold focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider block">Arrange Pages ({pages.length})</span>
                    {pages.map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-4 p-3 bg-slate-900/40 border border-slate-900 rounded-xl justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-bold text-teal-400 font-mono w-4">{idx + 1}</span>
                          <img src={p.processedUrl} alt={`page-${idx}`} className="w-10 h-12 object-contain bg-black border border-slate-850 rounded" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-slate-200 truncate">Page_{idx + 1}.jpeg</p>
                            <p className="text-[9px] text-slate-500 uppercase mt-0.5">{p.filter} · {p.rotation}° rot</p>
                          </div>
                        </div>

                        {/* Page reordering buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            disabled={idx === 0}
                            onClick={() => movePage(idx, 'up')}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-400 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button 
                            disabled={idx === pages.length - 1}
                            onClick={() => movePage(idx, 'down')}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-teal-400 hover:bg-slate-800 disabled:opacity-30 disabled:pointer-events-none transition-colors"
                            title="Move Down"
                          >
                            ▼
                          </button>
                          <button 
                            onClick={() => handleDeletePage(idx)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-slate-800 transition-colors ml-1"
                            title="Delete Page"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {isCompiling && (
                  <div className="py-4 flex flex-col items-center justify-center gap-3">
                    <Spinner size="md" />
                    <p className="text-xs font-semibold text-teal-400">Compiling high quality PDF...</p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Sidebar / Capture Control Panel */}
          <div className="w-full md:w-64 bg-slate-900/20 border-t md:border-t-0 md:border-l border-slate-900/60 p-5 flex flex-col justify-between shrink-0">
            
            {/* Top Info section */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-500 uppercase font-black tracking-wider">Queue</span>
                <h4 className="font-extrabold text-sm text-slate-200 mt-0.5">{pages.length} Pages Scanned</h4>
              </div>

              {/* Thumbnail Strip */}
              {pages.length > 0 && (
                <div className="flex md:grid md:grid-cols-2 gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 max-h-36 md:max-h-60 overflow-y-auto no-scrollbar">
                  {pages.map((p, idx) => (
                    <div 
                      key={p.id}
                      onClick={() => {
                        setActivePageIndex(idx)
                        setStep('editor')
                      }}
                      className={`relative aspect-[3/4] w-12 md:w-auto shrink-0 bg-slate-950 border rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition-all ${
                        activePageIndex === idx && step === 'editor'
                          ? 'border-teal-500 shadow-lg shadow-teal-500/10'
                          : 'border-slate-850 hover:border-slate-700'
                      }`}
                    >
                      <img src={p.processedUrl} alt={`snap-${idx}`} className="w-full h-full object-cover pointer-events-none" />
                      <span className="absolute bottom-1 right-1 bg-slate-950/80 text-[8px] font-black text-slate-300 font-mono px-1 rounded">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions section */}
            <div className="space-y-3 mt-4">
              
              {/* Device Selector (if in camera step) */}
              {step === 'camera' && devices.length > 1 && (
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-500 uppercase font-black tracking-wider">Select Lens</label>
                  <select 
                    value={selectedDeviceId}
                    onChange={e => setSelectedDeviceId(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-teal-500"
                  >
                    {devices.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${devices.indexOf(d) + 1}`}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Context Actions */}
              {step === 'camera' && (
                <>
                  <Button 
                    type="button" 
                    onClick={handleCapture}
                    disabled={isCameraStarting || !!cameraError}
                    className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 shadow-xl py-3 rounded-2xl flex items-center justify-center gap-2 group shrink-0"
                  >
                    <span className="text-base group-hover:scale-110 transition-transform">📸</span> Snap Photo
                  </Button>
                  {pages.length > 0 && (
                    <Button 
                      type="button" 
                      variant="secondary"
                      onClick={() => {
                        setActivePageIndex(pages.length - 1)
                        setStep('editor')
                      }}
                      className="w-full py-2.5 rounded-2xl text-xs"
                    >
                      Review & Edit
                    </Button>
                  )}
                </>
              )}

              {step === 'editor' && (
                <>
                  <Button 
                    type="button" 
                    onClick={() => setStep('camera')}
                    className="w-full py-2.5 rounded-2xl text-xs"
                  >
                    ＋ Capture More
                  </Button>
                  <Button 
                    type="button" 
                    variant="secondary"
                    onClick={() => setStep('compile')}
                    className="w-full py-2.5 rounded-2xl text-xs border border-teal-500/20 text-teal-400 hover:bg-slate-850"
                  >
                    ✓ Proceed to Compile
                  </Button>
                </>
              )}

              {step === 'compile' && (
                <>
                  <Button 
                    type="button" 
                    onClick={() => setStep('camera')}
                    variant="secondary"
                    disabled={isCompiling}
                    className="w-full py-2.5 rounded-2xl text-xs"
                  >
                    📸 Back to Capture
                  </Button>
                  <Button 
                    type="button" 
                    onClick={handleCompile}
                    disabled={isCompiling || pages.length === 0}
                    className="w-full py-3 rounded-2xl text-xs font-black shadow-xl"
                  >
                    💾 Save to Vault
                  </Button>
                </>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}
