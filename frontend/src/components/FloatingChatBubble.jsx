import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'

export function FloatingChatBubble() {
  const navigate = useNavigate()

  const [position, setPosition] = useState({ x: -100, y: -100 }) // initial placeholder, computed on mount
  const [isDragging, setIsDragging] = useState(false)
  const [dragOverTrash, setDragOverTrash] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  const bubbleRef = useRef(null)
  const dragStartRef = useRef({ x: 0, y: 0 })
  const dragPosRef = useRef({ x: 0, y: 0 })
  const initialTouchRef = useRef({ x: 0, y: 0 })

  const bubbleSize = 56 // w-14 h-14 is 56px
  const trashZoneRadius = 60

  // Center coordinates of the dismiss trash zone at the bottom
  const getTrashCenter = () => {
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight - 80 // 80px from bottom (above mobile bottom bar)
    }
  }

  // Initialize position to bottom right
  useEffect(() => {
    const handleInitPosition = () => {
      const padding = 16
      const initialX = window.innerWidth - bubbleSize - padding
      const initialY = window.innerHeight - bubbleSize - 100 // clear bottom nav bar
      setPosition({ x: initialX, y: initialY })
    }
    handleInitPosition()
    window.addEventListener('resize', handleInitPosition)
    return () => window.removeEventListener('resize', handleInitPosition)
  }, [])

  if (isDismissed) return null

  // ────────────────────────────────────────────────────────
  // Drag Handlers
  // ────────────────────────────────────────────────────────
  
  const handleDragStart = (clientX, clientY) => {
    setIsDragging(true)
    dragStartRef.current = { x: clientX - position.x, y: clientY - position.y }
    initialTouchRef.current = { x: clientX, y: clientY }
    dragPosRef.current = { x: position.x, y: position.y }
  }

  const handleDragMove = (clientX, clientY) => {
    if (!isDragging) return

    // Calculate new position bounded to screen
    let newX = clientX - dragStartRef.current.x
    let newY = clientY - dragStartRef.current.y

    const padding = 8
    const maxX = window.innerWidth - bubbleSize - padding
    const maxY = window.innerHeight - bubbleSize - padding - 80 // clear bottom navigation bar
    
    newX = Math.max(padding, Math.min(newX, maxX))
    newY = Math.max(padding + 64, Math.min(newY, maxY)) // clear top header

    dragPosRef.current = { x: newX, y: newY }
    setPosition({ x: newX, y: newY })

    // Check distance to trash zone
    const bubbleCenter = { x: newX + bubbleSize / 2, y: newY + bubbleSize / 2 }
    const trashCenter = getTrashCenter()
    const dist = Math.hypot(bubbleCenter.x - trashCenter.x, bubbleCenter.y - trashCenter.y)

    if (dist < trashZoneRadius) {
      setDragOverTrash(true)
    } else {
      setDragOverTrash(false)
    }
  }

  const handleDragEnd = () => {
    if (!isDragging) return
    setIsDragging(false)

    // Calculate drag distance to determine click vs drag
    const moveDist = Math.hypot(
      position.x - dragPosRef.current.x,
      position.y - dragPosRef.current.y
    )

    // If dropped on trash zone, remove
    if (dragOverTrash) {
      setIsDismissed(true)
      setDragOverTrash(false)
      return
    }

    // Snap to nearest edge (left or right)
    const padding = 16
    const leftDist = position.x
    const rightDist = window.innerWidth - position.x - bubbleSize
    let snapX = leftDist < rightDist ? padding : window.innerWidth - bubbleSize - padding
    
    setPosition(prev => ({ ...prev, x: snapX }))

    // Determine click: if total travel was very small
    const startTouch = initialTouchRef.current
    const endTouch = { x: position.x + dragStartRef.current.x, y: position.y + dragStartRef.current.y }
    const actualTravel = Math.hypot(endTouch.x - startTouch.x, endTouch.y - startTouch.y)

    if (actualTravel < 6) {
      navigate('/chat')
    }
  }

  // Mouse Listeners
  const onMouseDown = (e) => {
    if (e.button !== 0) return // Left click only
    handleDragStart(e.clientX, e.clientY)
    
    const handleMouseMove = (moveEv) => handleDragMove(moveEv.clientX, moveEv.clientY)
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      handleDragEnd()
    }
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  // Touch Listeners
  const onTouchStart = (e) => {
    const touch = e.touches[0]
    handleDragStart(touch.clientX, touch.clientY)
  }

  const onTouchMove = (e) => {
    const touch = e.touches[0]
    handleDragMove(touch.clientX, touch.clientY)
  }

  const onTouchEnd = () => {
    handleDragEnd()
  }

  return (
    <>
      {/* Drag Dismiss Zone (Shows at bottom center when dragging) */}
      {isDragging && (
        <div 
          className={`fixed bottom-24 left-1/2 -translate-x-1/2 w-28 h-28 rounded-full border-2 border-dashed z-[90] flex flex-col items-center justify-center backdrop-blur-sm transition-all duration-300 ${
            dragOverTrash 
              ? 'bg-rose-950/80 border-rose-500 scale-110 shadow-2xl shadow-rose-900/30 text-rose-400' 
              : 'bg-black/60 border-slate-700 text-slate-500'
          }`}
          style={{ pointerEvents: 'none' }}
        >
          <span className="text-2xl animate-pulse">🗑️</span>
          <span className="text-[9px] font-bold uppercase tracking-wider mt-1.5">Drop to remove</span>
        </div>
      )}

      {/* Draggable Chat Bubble */}
      <div
        ref={bubbleRef}
        onMouseDown={onMouseDown}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        className={`fixed z-[85] w-14 h-14 bg-gradient-to-tr from-teal-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 rounded-full flex items-center justify-center shadow-[0_6px_24px_rgba(20,184,166,0.35)] cursor-grab active:cursor-grabbing select-none transition-transform duration-200 hover:scale-105 active:scale-95 ${
          isDragging ? 'scale-110 shadow-2xl opacity-90' : ''
        }`}
        style={{
          left: `${position.x}px`,
          top: `${position.y}px`,
          touchAction: 'none'
        }}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-7 h-7 text-slate-950 pointer-events-none">
          <path d="M12 2a1 1 0 0 1 .927.62l1.91 4.457 4.457 1.91a1 1 0 0 1 0 1.854l-4.457 1.91-1.91 4.457a1 1 0 0 1-1.854 0l-1.91-4.457-4.457-1.91a1 1 0 0 1 0-1.854l4.457-1.91L11.073 2.62A1 1 0 0 1 12 2zM19 17a1 1 0 0 1 .894.553l.553 1.105 1.105.553a1 1 0 0 1 0 1.788l-1.105.553-.553 1.105a1 1 0 0 1-1.788 0l-.553-1.105-1.105-.553a1 1 0 0 1 0-1.788l1.105-.553.553-1.105A1 1 0 0 1 19 17z"/>
        </svg>
      </div>
    </>
  )
}
