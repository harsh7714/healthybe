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
  const isUnmountedRef = useRef(false)

  // Drag states for crop handles
  const [draggedHandle, setDraggedHandle] = useState(null)

  // Global unmount & unload tracking
  useEffect(() => {
    isUnmountedRef.current = false
    const handleUnload = () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop())
      }
    }
    window.addEventListener('beforeunload', handleUnload)
    window.addEventListener('pagehide', handleUnload)

    return () => {
      isUnmountedRef.current = true
      stopCamera()
      window.removeEventListener('beforeunload', handleUnload)
      window.removeEventListener('pagehide', handleUnload)
    }
  }, [])

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

      if (isUnmountedRef.current || !isOpen) {
        stream.getTracks().forEach(track => track.stop())
        return
      }

      streamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        const playPromise = videoRef.current.play()
        if (playPromise !== undefined) {
          playPromise.catch(e => {
            if (e.name !== 'AbortError') console.warn('Video play failed:', e)
          })
        }
      }
    } catch (err) {
      if (!isUnmountedRef.current && isOpen) {
        console.error('Camera access failed:', err)
        setCameraError('Could not access camera. Please verify camera permissions.')
      }
    } finally {
      if (!isUnmountedRef.current && isOpen) {
        setIsCameraStarting(false)
      }
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

    setFlashActive(true)
    setTimeout(() => setFlashActive(false), 150)

    const video = videoRef.current
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth || 1920
    canvas.height = video.videoHeight || 1080

    const ctx = canvas.getContext('2d')
    if (ctx) {
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95)

      const newPage = {
        id: `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        originalUrl: dataUrl,
        processedUrl: dataUrl,
        rotation: 0,
        filter: 'original',
        crop: { top: 4, bottom: 4, left: 4, right: 4 }
      }

      setPages(prev => [...prev, newPage])
    }
  }

  const handleDeletePage = (index) => {
    const updated = pages.filter((_, idx) => idx !== index)
    setPages(updated)
    if (updated.length === 0) {
      setStep('camera')
    } else {
      setActivePageIndex(Math.min(activePageIndex, updated.length - 1))
    }
  }

  const movePage = (fromIdx, direction) => {
    const toIdx = direction === 'up' ? fromIdx - 1 : fromIdx + 1
    if (toIdx < 0 || toIdx >= pages.length) return
    const updated = [...pages]
    const temp = updated[fromIdx]
    updated[fromIdx] = updated[toIdx]
    updated[toIdx] = temp
    setPages(updated)
    setActivePageIndex(toIdx)
  }

  const updatePageConfig = (pageIdx, changes) => {
    setPages(prev => {
      const updated = [...prev]
      const target = { ...updated[pageIdx], ...changes }
      target.processedUrl = applyFilterAndCrop(target)
      updated[pageIdx] = target
      return updated
    })
  }

  const applyFilterAndCrop = (pageObj) => {
    const img = new Image()
    img.src = pageObj.originalUrl

    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    if (!ctx) return pageObj.originalUrl

    const is90or270 = pageObj.rotation === 90 || pageObj.rotation === 270
    const rawW = img.naturalWidth || 1920
    const rawH = img.naturalHeight || 1080

    const cropLeft = (pageObj.crop.left / 100) * rawW
    const cropRight = (pageObj.crop.right / 100) * rawW
    const cropTop = (pageObj.crop.top / 100) * rawH
    const cropBottom = (pageObj.crop.bottom / 100) * rawH

    const cropW = Math.max(10, rawW - cropLeft - cropRight)
    const cropH = Math.max(10, rawH - cropTop - cropBottom)

    canvas.width = is90or270 ? cropH : cropW
    canvas.height = is90or270 ? cropW : cropH

    ctx.save()
    ctx.translate(canvas.width / 2, canvas.height / 2)
    ctx.rotate((pageObj.rotation * Math.PI) / 180)

    const drawW = is90or270 ? canvas.height : canvas.width
    const drawH = is90or270 ? canvas.width : canvas.height

    ctx.drawImage(
      img,
      cropLeft, cropTop, cropW, cropH,
      -drawW / 2, -drawH / 2, drawW, drawH
    )
    ctx.restore()

    if (pageObj.filter !== 'original') {
      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height)
      const data = imgData.data

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i]
        const g = data[i + 1]
        const b = data[i + 2]

        if (pageObj.filter === 'grayscale') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b
          data[i] = gray
          data[i + 1] = gray
          data[i + 2] = gray
        } else if (pageObj.filter === 'document') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b
          const enhanced = gray < 130 ? Math.max(0, gray - 40) : Math.min(255, gray + 40)
          data[i] = enhanced
          data[i + 1] = enhanced
          data[i + 2] = enhanced
        } else if (pageObj.filter === 'bw') {
          const gray = 0.299 * r + 0.587 * g + 0.114 * b
          const bw = gray > 128 ? 255 : 0
          data[i] = bw
          data[i + 1] = bw
          data[i + 2] = bw
        }
      }
      ctx.putImageData(imgData, 0, 0)
    }

    return canvas.toDataURL('image/jpeg', 0.92)
  }

  // Crop Drag Event Handlers
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

    updateCropPct(pctX, pctY)
  }

  const handleCropMouseUp = () => {
    setDraggedHandle(null)
  }

  const handleCropTouchStart = (handle, e) => {
    setDraggedHandle(handle)
  }

  const handleCropTouchMove = (e) => {
    if (!draggedHandle || !editorContainerRef.current || !e.touches[0]) return
    const touch = e.touches[0]
    const rect = editorContainerRef.current.getBoundingClientRect()
    const x = touch.clientX - rect.left
    const y = touch.clientY - rect.top

    const pctX = Math.max(0, Math.min(100, (x / rect.width) * 100))
    const pctY = Math.max(0, Math.min(100, (y / rect.height) * 100))

    updateCropPct(pctX, pctY)
  }

  const updateCropPct = (pctX, pctY) => {
    const currCrop = { ...pages[activePageIndex].crop }
    if (draggedHandle === 'top') currCrop.top = Math.min(pctY, 100 - currCrop.bottom - 10)
    if (draggedHandle === 'bottom') currCrop.bottom = Math.min(100 - pctY, 100 - currCrop.top - 10)
    if (draggedHandle === 'left') currCrop.left = Math.min(pctX, 100 - currCrop.right - 10)
    if (draggedHandle === 'right') currCrop.right = Math.min(100 - pctX, 100 - currCrop.left - 10)

    updatePageConfig(activePageIndex, { crop: currCrop })
  }

  // Compile PDF
  const handleCompile = async () => {
    if (pages.length === 0 || isCompiling) return
    setIsCompiling(true)

    try {
      const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
      const pdfW = doc.internal.pageSize.getWidth()
      const pdfH = doc.internal.pageSize.getHeight()

      for (let i = 0; i < pages.length; i++) {
        if (i > 0) doc.addPage()
        const pageObj = pages[i]
        const finalUrl = pageObj.processedUrl || pageObj.originalUrl

        doc.addImage(finalUrl, 'JPEG', 0, 0, pdfW, pdfH, undefined, 'FAST')
      }

      const blob = doc.output('blob')
      const safeName = (pdfName.trim() || 'Scanned_Report').replace(/[^a-z0-9_-]/gi, '_') + '.pdf'
      const compiledFile = new File([blob], safeName, { type: 'application/pdf' })

      onComplete(compiledFile)
      onClose()
    } catch (err) {
      console.error('PDF Compilation failed:', err)
    } finally {
      setIsCompiling(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-[#070b14] z-50 flex flex-col overflow-hidden animate-fade-in text-white select-none">
      <div className="w-full h-screen flex flex-col overflow-hidden relative">
        
        {/* Flash screen overlay */}
        {flashActive && (
          <div className="absolute inset-0 bg-white z-[100] animate-pulse" />
        )}

        {/* Modal Header & Stepper */}
        <div className="px-6 py-4 border-b border-slate-800 bg-[#0c1220] flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 text-teal-400 flex items-center justify-center font-bold text-sm">
              📷
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-slate-100 flex items-center gap-2">
                Mobile Document Scanner Pro
              </h3>
              <p className="text-[10px] text-slate-400 font-mono">
                {step === 'camera' && 'Align document inside frame & snap photo'}
                {step === 'editor' && 'Crop borders, rotate & apply OCR text enhancement'}
                {step === 'compile' && 'Arrange pages and compile to Vault PDF'}
              </p>
            </div>
          </div>

          {/* Stepper Progress */}
          <div className="hidden sm:flex items-center gap-2 font-mono text-xs">
            <span className={`px-3 py-1 rounded-full border transition-all ${step === 'camera' ? 'bg-teal-500 text-slate-950 font-bold border-teal-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
              1. Snap 📸
            </span>
            <span className="text-slate-600">→</span>
            <span className={`px-3 py-1 rounded-full border transition-all ${step === 'editor' ? 'bg-teal-500 text-slate-950 font-bold border-teal-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
              2. Crop ✏️
            </span>
            <span className="text-slate-600">→</span>
            <span className={`px-3 py-1 rounded-full border transition-all ${step === 'compile' ? 'bg-teal-500 text-slate-950 font-bold border-teal-400' : 'bg-slate-900 border-slate-800 text-slate-400'}`}>
              3. Compile PDF 💾
            </span>
          </div>

          <button 
            type="button" 
            onClick={onClose} 
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors font-bold text-sm cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto md:overflow-hidden flex flex-col md:flex-row min-h-0">
          
          {/* Main Viewfinder / Editor Area */}
          <div className="flex-1 bg-black/80 flex flex-col relative overflow-y-auto md:overflow-hidden p-4 justify-center items-center min-h-[350px] md:min-h-0">
            
            {/* Step 1: Camera Finder with Corner Brackets */}
            {step === 'camera' && (
              <div className="relative w-full max-w-[340px] xs:max-w-md aspect-[3/4] bg-slate-950 border-2 border-teal-500/50 rounded-3xl overflow-hidden shadow-2xl flex flex-col items-center justify-center group">
                
                {/* Live WebRTC Camera Stream */}
                <video 
                  ref={videoRef} 
                  className="w-full h-full object-cover" 
                  autoPlay 
                  playsInline 
                  muted 
                />

                {/* 4 Glowing Corner Target Brackets */}
                <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-teal-400 rounded-tl-xl pointer-events-none shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-teal-400 rounded-tr-xl pointer-events-none shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-teal-400 rounded-bl-xl pointer-events-none shadow-[0_0_10px_rgba(45,212,191,0.8)]" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-teal-400 rounded-br-xl pointer-events-none shadow-[0_0_10px_rgba(45,212,191,0.8)]" />

                {/* Live Scanner Overlay Guidance Text */}
                <div className="absolute top-6 px-4 py-1.5 rounded-full bg-slate-950/80 border border-teal-500/40 text-[10px] font-mono font-bold text-teal-300 tracking-wider uppercase pointer-events-none flex items-center gap-1.5 shadow-lg">
                  <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
                  <span>📄 Align Medical Document inside Frame</span>
                </div>

                {isCameraStarting && (
                  <div className="absolute inset-0 bg-slate-950 flex flex-col items-center justify-center gap-3 z-10">
                    <Spinner size="lg" />
                    <p className="text-xs text-teal-300 font-mono">Initializing High-Res Camera...</p>
                  </div>
                )}

                {cameraError && (
                  <div className="absolute inset-0 bg-slate-950 p-6 text-center flex flex-col items-center justify-center space-y-4 z-10">
                    <span className="text-4xl">⚠️</span>
                    <p className="text-xs font-semibold text-rose-400">{cameraError}</p>
                    <button
                      onClick={initCamera}
                      className="px-4 py-2 rounded-xl bg-teal-500 text-slate-950 font-bold text-xs"
                    >
                      Retry Camera Access
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Step 2: Page Editor (Crop & Filters) */}
            {step === 'editor' && pages[activePageIndex] && (
              <div className="flex flex-col items-center w-full h-full justify-between gap-4">
                
                <div 
                  ref={editorContainerRef}
                  onMouseMove={handleCropMouseMove}
                  onMouseUp={handleCropMouseUp}
                  onTouchMove={handleCropTouchMove}
                  onTouchEnd={handleCropMouseUp}
                  className="relative max-h-[60vh] md:max-h-[70vh] aspect-[3/4] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800 select-none flex items-center justify-center shadow-2xl"
                  style={{ maxHeight: 'calc(100vh - 240px)' }}
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
                    className="absolute border-2 border-teal-400 bg-teal-400/10 shadow-2xl"
                    style={{
                      top: `${pages[activePageIndex].crop.top}%`,
                      bottom: `${pages[activePageIndex].crop.bottom}%`,
                      left: `${pages[activePageIndex].crop.left}%`,
                      right: `${pages[activePageIndex].crop.right}%`,
                    }}
                  >
                    {/* Handles */}
                    <div 
                      onMouseDown={(e) => handleCropMouseDown('top', e)}
                      onTouchStart={(e) => handleCropTouchStart('top', e)}
                      className="absolute top-0 left-0 right-0 h-8 -mt-4 cursor-ns-resize flex items-center justify-center"
                    >
                      <div className="w-12 h-2 bg-teal-400 rounded-full border border-slate-950 shadow-md" />
                    </div>

                    <div 
                      onMouseDown={(e) => handleCropMouseDown('bottom', e)}
                      onTouchStart={(e) => handleCropTouchStart('bottom', e)}
                      className="absolute bottom-0 left-0 right-0 h-8 -mb-4 cursor-ns-resize flex items-center justify-center"
                    >
                      <div className="w-12 h-2 bg-teal-400 rounded-full border border-slate-950 shadow-md" />
                    </div>

                    <div 
                      onMouseDown={(e) => handleCropMouseDown('left', e)}
                      onTouchStart={(e) => handleCropTouchStart('left', e)}
                      className="absolute top-0 bottom-0 left-0 w-8 -ml-4 cursor-ew-resize flex items-center justify-center"
                    >
                      <div className="h-12 w-2 bg-teal-400 rounded-full border border-slate-950 shadow-md" />
                    </div>

                    <div 
                      onMouseDown={(e) => handleCropMouseDown('right', e)}
                      onTouchStart={(e) => handleCropTouchStart('right', e)}
                      className="absolute top-0 bottom-0 right-0 w-8 -mr-4 cursor-ew-resize flex items-center justify-center"
                    >
                      <div className="h-12 w-2 bg-teal-400 rounded-full border border-slate-950 shadow-md" />
                    </div>
                  </div>
                </div>

                {/* Editor Settings Bar */}
                <div className="w-full max-w-md bg-[#0c1220] border border-slate-800 rounded-2xl p-4 space-y-3">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
                    <span className="text-xs text-slate-400 font-bold font-mono">Page {activePageIndex + 1} of {pages.length}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => {
                          const r = (pages[activePageIndex].rotation + 90) % 360
                          updatePageConfig(activePageIndex, { rotation: r })
                        }}
                        className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-teal-400 font-bold text-xs hover:border-teal-500/40"
                      >
                        🔄 Rotate 90°
                      </button>
                      <button 
                        onClick={() => handleDeletePage(activePageIndex)}
                        className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 font-bold text-xs"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>

                  {/* Filter selector */}
                  <div className="space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">OCR Enhancement Filter</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { id: 'original', label: 'Original' },
                        { id: 'document', label: 'Document' },
                        { id: 'grayscale', label: 'Grayscale' },
                        { id: 'bw', label: 'B & W' }
                      ].map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => updatePageConfig(activePageIndex, { filter: f.id })}
                          className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                            pages[activePageIndex].filter === f.id
                              ? 'bg-teal-500/20 border-teal-500 text-teal-300'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
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

            {/* Step 3: Compilation and Reorder View */}
            {step === 'compile' && (
              <div className="w-full max-w-xl h-full flex flex-col justify-between py-2">
                <div className="flex-1 overflow-y-auto space-y-3 pr-2 min-h-0">
                  <div className="bg-[#0c1220] border border-slate-800 rounded-2xl p-4 space-y-3">
                    <span className="text-[10px] text-teal-400 uppercase font-black tracking-wider font-mono">Document Title & Vaulting</span>
                    <div className="space-y-1.5">
                      <label className="text-xs text-slate-300 font-bold block">Document PDF File Name</label>
                      <input 
                        type="text" 
                        value={pdfName} 
                        onChange={e => setPdfName(e.target.value)}
                        placeholder="Enter report name"
                        className="w-full bg-slate-900 border border-slate-800 text-xs px-3.5 py-2.5 rounded-xl text-teal-300 font-bold focus:outline-none focus:border-teal-500"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wider block font-mono">
                      Arranged Pages ({pages.length})
                    </span>
                    {pages.map((p, idx) => (
                      <div key={p.id} className="flex items-center gap-4 p-3 bg-slate-900 border border-slate-800 rounded-2xl justify-between">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-xs font-bold text-teal-400 font-mono w-4">{idx + 1}</span>
                          <img src={p.processedUrl} alt={`page-${idx}`} className="w-10 h-12 object-contain bg-black border border-slate-800 rounded-lg" />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-200 truncate">Page_{idx + 1}.jpeg</p>
                            <p className="text-[9px] text-slate-400 uppercase font-mono mt-0.5">{p.filter} · {p.rotation}° rot</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button 
                            disabled={idx === 0}
                            onClick={() => movePage(idx, 'up')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800 disabled:opacity-30 transition-colors"
                            title="Move Up"
                          >
                            ▲
                          </button>
                          <button 
                            disabled={idx === pages.length - 1}
                            onClick={() => movePage(idx, 'down')}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 hover:bg-slate-800 disabled:opacity-30 transition-colors"
                            title="Move Down"
                          >
                            ▼
                          </button>
                          <button 
                            onClick={() => handleDeletePage(idx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors ml-1"
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
                    <p className="text-xs font-bold text-teal-400 font-mono">Compiling Vaulted PDF...</p>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* Sidebar / Capture Control Panel */}
          <div className="w-full md:w-64 bg-[#0c1220] border-t md:border-t-0 md:border-l border-slate-800 p-5 flex flex-col justify-between shrink-0">
            
            {/* Queue & Thumbnails */}
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider font-mono">Document Queue</span>
                <h4 className="font-extrabold text-sm text-slate-100 mt-0.5">{pages.length} Pages Captured</h4>
              </div>

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
                          ? 'border-teal-500 shadow-lg shadow-teal-500/20'
                          : 'border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <img src={p.processedUrl} alt={`snap-${idx}`} className="w-full h-full object-cover pointer-events-none" />
                      <span className="absolute bottom-1 right-1 bg-slate-950/90 text-[8px] font-extrabold text-teal-300 font-mono px-1 rounded">
                        {idx + 1}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Bottom Actions section */}
            <div className="space-y-3 mt-4">
              
              {step === 'camera' && devices.length > 1 && (
                <div className="space-y-1">
                  <label className="text-[9px] text-slate-400 uppercase font-bold tracking-wider font-mono">Select Lens</label>
                  <select 
                    value={selectedDeviceId}
                    onChange={e => setSelectedDeviceId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {devices.map(d => (
                      <option key={d.deviceId} value={d.deviceId}>{d.label || `Camera ${devices.indexOf(d) + 1}`}</option>
                    ))}
                  </select>
                </div>
              )}

              {step === 'camera' && (
                <div className="flex flex-col items-center gap-3">
                  {/* Glowing Shutter Button */}
                  <button 
                    type="button" 
                    onClick={handleCapture}
                    disabled={isCameraStarting || !!cameraError}
                    className="w-16 h-16 rounded-full bg-gradient-to-tr from-teal-400 to-cyan-500 text-slate-950 flex items-center justify-center shadow-[0_0_25px_rgba(20,184,166,0.6)] hover:scale-110 active:scale-95 transition-all cursor-pointer border-4 border-slate-900"
                    title="Snap Document Photo"
                  >
                    <span className="text-xl">📸</span>
                  </button>

                  {pages.length > 0 && (
                    <button 
                      type="button" 
                      onClick={() => {
                        setActivePageIndex(pages.length - 1)
                        setStep('editor')
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-teal-300 text-xs font-bold transition-all cursor-pointer"
                    >
                      Review & Crop ({pages.length})
                    </button>
                  )}
                </div>
              )}

              {step === 'editor' && (
                <>
                  <button 
                    type="button" 
                    onClick={() => setStep('camera')}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 font-bold text-xs transition-all cursor-pointer"
                  >
                    ＋ Capture More Pages
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setStep('compile')}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-extrabold text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    ✓ Proceed to Compile PDF
                  </button>
                </>
              )}

              {step === 'compile' && (
                <>
                  <button 
                    type="button" 
                    onClick={() => setStep('camera')}
                    disabled={isCompiling}
                    className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 font-bold text-xs transition-all cursor-pointer"
                  >
                    📸 Back to Camera
                  </button>
                  <button 
                    type="button" 
                    onClick={handleCompile}
                    disabled={isCompiling || pages.length === 0}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 font-black text-xs uppercase tracking-wider transition-all shadow-md cursor-pointer"
                  >
                    💾 Save to Vault
                  </button>
                </>
              )}
            </div>

          </div>

        </div>

      </div>
    </div>
  )
}

export default DocumentScannerModal
