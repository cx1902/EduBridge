import React, { useEffect, useState } from 'react'
import './CourseDrawer.css'

const api = (path) => `${import.meta.env.VITE_API_URL}${path}`

export default function CourseDrawer({ courseId, open, onClose, canManage, isStudent }) {
  const [materials, setMaterials] = useState([])
  const [assignments, setAssignments] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(null)
  const token = localStorage.getItem('token')

  useEffect(() => {
    if (!open) return
    fetchAll()
  }, [open])

  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  const fetchAll = async () => {
    try {
      setLoading(true)
      const [m, a] = await Promise.all([
        fetch(api(`/courses/${courseId}/materials`), { headers }).then(r => r.json()).catch(() => ({ success: false })),
        fetch(api(`/courses/${courseId}/assignments`), { headers }).then(r => r.json()).catch(() => ({ success: false }))
      ])
      if (m?.success) setMaterials(m.data || [])
      if (a?.success) setAssignments(a.data || [])
    } finally {
      setLoading(false)
    }
  }

  const handleUploadMaterial = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    setUploading(true)
    try {
      const res = await fetch(api(`/courses/${courseId}/materials`), {
        method: 'POST',
        headers,
        body: form
      })
      const json = await res.json()
      if (json.success) setMaterials(prev => [json.data, ...prev])
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const handleSubmitAssignment = async (assignmentId, file) => {
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    setSubmitting(assignmentId)
    try {
      const res = await fetch(api(`/courses/${courseId}/assignments/${assignmentId}/submissions`), {
        method: 'POST',
        headers,
        body: form
      })
      await res.json()
      alert('Submission uploaded')
    } finally {
      setSubmitting(null)
    }
  }

  if (!open) return null

  return (
    <div className="course-drawer-overlay" onClick={onClose}>
      <aside className="course-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <span className="drawer-title">Course Resources</span>
          <button className="small-btn" onClick={onClose}>Close</button>
        </div>
        <div className="drawer-content">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <>
              <div className="drawer-section">
                <div className="drawer-section-header">
                  <span className="drawer-section-title">Assignment Submission</span>
                </div>
                <div className="section-items">
                  {assignments.length === 0 ? (
                    <div className="section-item">
                      <div className="item-left"><i className="far fa-file-alt"></i><span>No assignments</span></div>
                    </div>
                  ) : assignments.map(a => (
                    <div key={a.id} className="section-item">
                      <div className="item-left">
                        <i className="far fa-file-alt"></i>
                        <div>
                          <div className="link-btn" title="View assignment">{a.title}</div>
                          {a.dueDate && <small>Due {new Date(a.dueDate).toLocaleString()}</small>}
                        </div>
                      </div>
                      {isStudent && (
                        <div className="item-actions">
                          <label className="small-btn" htmlFor={`submit-${a.id}`}>{submitting===a.id?'Submitting...':'Submit'}</label>
                          <input id={`submit-${a.id}`} type="file" style={{display:'none'}} onChange={(e)=>handleSubmitAssignment(a.id, e.target.files?.[0])} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="drawer-section">
                <div className="drawer-section-header">
                  <span className="drawer-section-title">Teaching and Learning Materials</span>
                  {canManage && (
                    <div className="item-actions">
                      <label className="small-btn" htmlFor="material-upload">{uploading?'Uploading...':'Upload'}</label>
                      <input id="material-upload" type="file" style={{display:'none'}} onChange={handleUploadMaterial} />
                    </div>
                  )}
                </div>
                <div className="section-items">
                  {materials.length===0 ? (
                    <div className="section-item">
                      <div className="item-left"><i className="far fa-folder"></i><span>No materials</span></div>
                    </div>
                  ) : materials.map(m => (
                    <div key={m.id || m.url} className="section-item">
                      <div className="item-left">
                        <i className="far fa-folder"></i>
                        <a className="link-btn" href={m.url} target="_blank" rel="noreferrer">{m.name || 'Download'}</a>
                      </div>
                      <div className="item-actions">
                        <button className="small-btn">Mark as done</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="drawer-section">
                <div className="drawer-section-header">
                  <span className="drawer-section-title">General</span>
                </div>
                <div className="section-items">
                  <div className="section-item">
                    <div className="item-left"><i className="far fa-info-circle"></i><span>Course announcements and links may appear here.</span></div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
        <div className="drawer-footer">
          <button className="small-btn" onClick={onClose}>Done</button>
        </div>
      </aside>
    </div>
  )
}
