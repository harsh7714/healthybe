import React, { useState, useEffect } from 'react'
import { Button } from './ui/Button'

function EditProfileModal({ editingProfile, onClose, onSave }) {
  const [editName, setEditName] = useState('')
  const [editAge, setEditAge] = useState('')
  const [editRelation, setEditRelation] = useState('')

  useEffect(() => {
    if (editingProfile) {
      const rawAge = editingProfile.age ? editingProfile.age.replace(/\s*Yrs/i, '') : ''
      setEditName(editingProfile.name || '')
      setEditAge(rawAge)
      setEditRelation(editingProfile.relation || '')
    }
  }, [editingProfile])

  if (!editingProfile) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!editName.trim() || !editAge.trim()) return

    const updates = {
      name: editName.trim(),
      age: editAge.trim()
    }
    if (editingProfile.id !== 'self') {
      updates.relation = editRelation
    }

    onSave(editingProfile.id, updates)
  }

  return (
    <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl animate-fade-in space-y-4 text-left max-h-[calc(100vh-2rem)] overflow-y-auto no-scrollbar">
        <div className="flex justify-between items-center pb-2 border-b border-slate-900">
          <h3 className="font-extrabold text-sm text-slate-200 uppercase tracking-wider font-mono">Edit Profile</h3>
          <button 
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-350 font-extrabold text-xs transition-colors"
          >
            ✕
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Full Name</label>
            <input 
              type="text" 
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-xs px-3 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500/30"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Age</label>
            <input 
              type="number" 
              value={editAge}
              onChange={(e) => setEditAge(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 text-xs px-3 py-2.5 rounded-xl text-slate-200 focus:outline-none focus:border-teal-500/30"
              required
            />
          </div>

          {editingProfile.id !== 'self' && (
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Relation</label>
              <select 
                value={editRelation}
                onChange={(e) => setEditRelation(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 text-xs px-3 py-2.5 rounded-xl text-slate-400 focus:outline-none focus:border-teal-500/30 cursor-pointer"
              >
                <option value="Spouse">Spouse</option>
                <option value="Child">Child</option>
                <option value="Father">Father</option>
                <option value="Mother">Mother</option>
                <option value="Sibling">Sibling</option>
                <option value="Grandparent">Grandparent</option>
                <option value="Other">Other</option>
              </select>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button 
              type="submit"
              size="sm"
              className="flex-1 rounded-xl text-xs py-2.5"
            >
              Save Changes
            </Button>
            <Button 
              type="button"
              variant="secondary"
              size="sm"
              onClick={onClose}
              className="flex-1 rounded-xl text-xs py-2.5"
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EditProfileModal
