import React, { useEffect, useState } from 'react'
import './CourseResourcesSection.css'

const api = (path) => `${import.meta.env.VITE_API_URL}${path}`

export default function CourseResourcesSection({ courseId, canManage, isStudent }) {
  const [materialComponents, setMaterialComponents] = useState([])
  const [assignmentComponents, setAssignmentComponents] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [submitting, setSubmitting] = useState(null)
  const [expanded, setExpanded] = useState({ general: true, materials: true, assignments: true })
  const token = localStorage.getItem('token')
  const headers = token ? { Authorization: `Bearer ${token}` } : {}

  useEffect(() => { fetchAll() }, [courseId])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const res = await fetch(api(`/courses/${courseId}/components`), { headers })
      const json = await res.json().catch(()=>({success:false}))
      if (json?.success) {
        const comps = json.data || []
        setMaterialComponents(comps.filter(c => c.componentType === 'LEARNING_MATERIALS'))
        setAssignmentComponents(comps.filter(c => c.componentType === 'ASSIGNMENT'))
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUploadMaterial = async (componentId, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('file', file)
    setUploading(true)
    try {
      const res = await fetch(api(`/components/${componentId}/files`), { method: 'POST', headers, body: form })
      const json = await res.json()
      if (json.success) {
        await fetchAll()
      }
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
      const res = await fetch(api(`/components/${assignmentId}/submit`), { method: 'POST', headers, body: form })
      await res.json()
      alert('Submission uploaded')
    } finally {
      setSubmitting(null)
    }
  }

  const handleDownload = async (fileId, fileName) => {
    try {
      const res = await fetch(api(`/files/${fileId}/download`), { headers })
      if (!res.ok) throw new Error('Download failed')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName || 'download'
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Unable to download file')
    }
  }
  const toggle = (key) => setExpanded(s => ({ ...s, [key]: !s[key] }))
  const expandAll = () => setExpanded({ general: true, materials: true, assignments: true })
  const collapseAll = () => setExpanded({ general: false, materials: false, assignments: false })

  return (
    <section className="resources-section">
      <div className="resources-header">
        <h2>Course Resources</h2>
        <div className="resources-actions">
          <button className="rs-btn" onClick={expandAll}>Expand all</button>
          <button className="rs-btn" onClick={collapseAll}>Collapse all</button>
        </div>
      </div>
      {loading ? (
        <div className="rs-loading"><div className="spinner" /> Loading resources...</div>
      ) : (
        <>
          <div className="rs-card">
            <div className="rs-card-header" onClick={()=>toggle('general')}>
              <i className={`rs-chevron ${expanded.general ? 'down' : 'right'}`} />
              <span className="rs-title">General</span>
            </div>
            {expanded.general && (
              <div className="rs-items">
                <div className="rs-item">
                  <div className="rs-left"><i className="far fa-info-circle"></i><span>Course announcements and links may appear here.</span></div>
                </div>
              </div>
            )}
          </div>

          <div className="rs-card">
            <div className="rs-card-header" onClick={()=>toggle('materials')}>
              <i className={`rs-chevron ${expanded.materials ? 'down' : 'right'}`} />
              <span className="rs-title">Teaching and Learning Materials</span>
            </div>
            {expanded.materials && (
              <div className="rs-items">
                {materialComponents.length === 0 ? (
                  <div className="rs-item"><div className="rs-left"><i className="far fa-folder"></i><span>No materials</span></div></div>
                ) : materialComponents.map(c => (
                  <div key={c.id} className="rs-item">
                    <div className="rs-left"><i className="far fa-folder"></i><span className="rs-link">{c.title || 'Materials'}</span></div>
                    <div className="rs-right">
                      {canManage && (
                        <>
                          <label className="rs-btn" htmlFor={`rs-upload-${c.id}`}>{uploading ? 'Uploading...' : 'Upload'}</label>
                          <input id={`rs-upload-${c.id}`} type="file" style={{display:'none'}} onChange={(e)=>handleUploadMaterial(c.id, e)} />
                        </>
                      )}
                    </div>
                  </div>
                ))}
                {materialComponents.flatMap(c => c.files || []).map(f => (
                  <div key={f.id} className="rs-item">
                    <div className="rs-left"><i className="far fa-file"></i><span>{f.fileName}</span></div>
                    <div className="rs-right"><button className="rs-btn" onClick={()=>handleDownload(f.id, f.fileName)}>Download</button></div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rs-card">
            <div className="rs-card-header" onClick={()=>toggle('assignments')}>
              <i className={`rs-chevron ${expanded.assignments ? 'down' : 'right'}`} />
              <span className="rs-title">Assignment Submission</span>
            </div>
            {expanded.assignments && (
              <div className="rs-items">
                {assignmentComponents.length === 0 ? (
                  <div className="rs-item"><div className="rs-left"><i className="far fa-file-alt"></i><span>No assignments</span></div></div>
                ) : assignmentComponents.map(a => (
                  <div key={a.id} className="rs-item">
                    <div className="rs-left"><i className="far fa-file-alt"></i><span className="rs-link">{a.title}</span></div>
                    {isStudent && (
                      <div className="rs-right">
                        <label className="rs-btn" htmlFor={`rs-submit-${a.id}`}>{submitting===a.id?'Submitting...':'Submit'}</label>
                        <input id={`rs-submit-${a.id}`} type="file" style={{display:'none'}} onChange={(e)=>handleSubmitAssignment(a.id, e.target.files?.[0])} />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </section>
  )
}

