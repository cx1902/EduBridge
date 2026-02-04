import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../../store/authStore'
import './CourseResourcesSection.css'
import {
  FaPen,
  FaTrash,
  FaCommentAlt,
  FaFileUpload,
  FaFileAlt,
  FaFilePdf,
  FaFolderOpen
} from 'react-icons/fa'

const api = path => `${import.meta.env.VITE_API_URL}${path}`

export default function CourseResourcesSection({
  courseId,
  canManage,
  isStudent
}) {
  const [components, setComponents] = useState([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(null)
  const [submitting, setSubmitting] = useState(null)

  // Tabbed state
  const [activeChannelId, setActiveChannelId] = useState(null)

  // Management states
  const [activeTab, setActiveTab] = useState(null) // For message/file creation
  const [newMessage, setNewMessage] = useState({
    title: '',
    content: '',
    scheduledAt: ''
  })
  const [scheduleDate, setScheduleDate] = useState('')
  const [attachedFile, setAttachedFile] = useState(null)
  const [editingDescId, setEditingDescId] = useState(null)
  const [editDesc, setEditDesc] = useState('')

  const [editingMessageId, setEditingMessageId] = useState(null)
  const [editMessageData, setEditMessageData] = useState({
    title: '',
    content: '',
    scheduledAt: ''
  })

  // Submission Grading State
  const [viewingSubmissions, setViewingSubmissions] = useState(null) // componentId
  const [submissionsList, setSubmissionsList] = useState([])
  const [gradingSubmission, setGradingSubmission] = useState(null)
  const [gradeInput, setGradeInput] = useState('')
  const [feedbackInput, setFeedbackInput] = useState('')

  const { token } = useAuthStore()

  const headers = () => {
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  useEffect(() => {
    fetchAll()
  }, [courseId])

  const fetchAll = async () => {
    try {
      setLoading(true)
      const res = await fetch(api(`/courses/${courseId}/components`), {
        headers: headers()
      })
      const json = await res.json().catch(() => ({ success: false }))
      if (json?.success) {
        const comps = json.data || []
        // Sort by sequenceOrder
        comps.sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0))
        setComponents(comps)

        // Set first channel as active by default
        if (comps.length > 0 && !activeChannelId) {
          setActiveChannelId(comps[0].id)
        }
      }
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateDescription = async id => {
    try {
      const res = await fetch(api(`/components/${id}`), {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ description: editDesc })
      })
      if (res.ok) {
        setEditingDescId(null)
        await fetchAll()
      }
    } catch (e) {
      alert('Failed to update description')
    }
  }

  const handleCreateMessage = async componentId => {
    // Validate: need either content or file
    if (!newMessage.content.trim() && !attachedFile) {
      alert('Please enter a message or attach a file')
      return
    }

    try {
      let messageId = null

      // Create message if there's content
      if (newMessage.content.trim()) {
        const res = await fetch(api(`/components/${componentId}/messages`), {
          method: 'POST',
          headers: { ...headers(), 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: newMessage.title,
            content: newMessage.content,
            scheduledAt: scheduleDate || null
          })
        })

        if (res.status === 401) {
          alert(
            'Your session may have expired. Please refresh the page or log in again.'
          )
          return
        }

        const json = await res.json()

        if (!res.ok) {
          alert(json.error?.message || 'Failed to post message')
          return
        }

        messageId = json.data?.id
      }

      // Upload file if attached
      if (attachedFile) {
        const form = new FormData()
        form.append('files', attachedFile)
        if (scheduleDate) form.append('scheduledAt', scheduleDate)

        const res = await fetch(api(`/components/${componentId}/files`), {
          method: 'POST',
          headers: headers(),
          body: form
        })

        const json = await res.json()
        if (!json.success) {
          alert(json.message || 'File upload failed')
          return
        }
      }

      // Reset form
      setNewMessage({ title: '', content: '', scheduledAt: '' })
      setScheduleDate('')
      setAttachedFile(null)
      setActiveTab(null)
      await fetchAll()
    } catch (e) {
      console.error(e)
      alert('Failed to create post')
    }
  }

  const handleUpdateMessage = async () => {
    if (!editMessageData.content.trim()) return
    try {
      const res = await fetch(api(`/messages/${editingMessageId}`), {
        method: 'PUT',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editMessageData.title,
          content: editMessageData.content,
          scheduledAt: editMessageData.scheduledAt || null
        })
      })

      if (res.status === 401) {
        alert(
          'Your session may have expired. Please refresh the page or log in again.'
        )
        return
      }

      const json = await res.json()

      if (res.ok) {
        setEditingMessageId(null)
        setEditMessageData({ title: '', content: '', scheduledAt: '' })
        await fetchAll()
      } else {
        alert(json.error?.message || 'Failed to update message')
      }
    } catch (e) {
      console.error(e)
      alert('Failed to update message')
    }
  }

  const handleDeleteMessage = async id => {
    if (!confirm('Delete this message?')) return
    try {
      const res = await fetch(api(`/messages/${id}`), {
        method: 'DELETE',
        headers: headers()
      })
      if (res.ok) await fetchAll()
    } catch (e) {
      alert('Failed to delete message')
    }
  }

  const handleDeleteFile = async id => {
    if (!confirm('Delete this file?')) return
    try {
      const res = await fetch(api(`/files/${id}`), {
        method: 'DELETE',
        headers: headers()
      })
      if (res.ok) await fetchAll()
    } catch (e) {
      alert('Failed to delete file')
    }
  }

  const handleUploadMaterial = async (componentId, e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const form = new FormData()
    form.append('files', file)
    if (scheduleDate) form.append('scheduledAt', scheduleDate)

    setUploading(componentId)
    try {
      const res = await fetch(api(`/components/${componentId}/files`), {
        method: 'POST',
        headers: headers(),
        body: form
      })
      const json = await res.json()
      if (json.success) {
        setScheduleDate('')
        setActiveTab(null)
        await fetchAll()
      } else {
        alert(json.message || 'Upload failed')
      }
    } catch (e) {
      alert('Upload failed')
    } finally {
      setUploading(null)
      e.target.value = ''
    }
  }

  const handleSubmitAssignment = async (assignmentId, file) => {
    if (!file) return
    const form = new FormData()
    form.append('files', file)
    setSubmitting(assignmentId)
    try {
      const res = await fetch(api(`/components/${assignmentId}/submit`), {
        method: 'POST',
        headers: headers(),
        body: form
      })
      await res.json()
      alert('Submission uploaded')
    } catch (e) {
      alert('Submission failed')
    } finally {
      setSubmitting(null)
    }
  }

  const handleDownload = async (fileId, fileName) => {
    try {
      const res = await fetch(api(`/files/${fileId}/download`), {
        headers: headers()
      })
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

  const handleFetchSubmissions = async componentId => {
    try {
      setViewingSubmissions(componentId)
      const res = await fetch(api(`/components/${componentId}/submissions`), {
        headers: headers()
      })
      const json = await res.json()
      if (json.success) {
        setSubmissionsList(json.data.all || [])
      } else {
        alert('Failed to fetch submissions')
      }
    } catch (e) {
      alert('Failed to fetch submissions')
    }
  }

  const handleDownloadSubmissionFile = async (fileId, fileName) => {
    try {
      const res = await fetch(api(`/submission-files/${fileId}/download`), {
        headers: headers()
      })
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
      alert('Unable to download submission file')
    }
  }

  const handleGradeSubmission = async () => {
    if (!gradingSubmission) return
    try {
      const res = await fetch(api(`/submissions/${gradingSubmission.id}/grade`), {
        method: 'PATCH',
        headers: { ...headers(), 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: parseFloat(gradeInput),
          feedback: feedbackInput,
          status: 'GRADED'
        })
      })
      const json = await res.json()
      if (json.success) {
        setGradingSubmission(null)
        setGradeInput('')
        setFeedbackInput('')
        // Refresh submissions list
        handleFetchSubmissions(viewingSubmissions)
      } else {
        alert(json.error?.message || 'Failed to grade submission')
      }
    } catch (e) {
      alert('Failed to grade submission')
    }
  }

  const handleInitialize = async () => {
    // Force re-fetch which triggers backend creation logic
    await fetchAll()
  }

  const formatDate = date => {
    if (!date) return ''
    return new Date(date).toLocaleString()
  }

  const isScheduledFuture = date => {
    if (!date) return false
    return new Date(date) > new Date()
  }

  const getInitials = (firstName, lastName) => {
    return `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase()
  }

  const getGradeLetter = (score) => {
    if (score === null || score === undefined) return ''
    const s = parseFloat(score)
    if (s >= 90) return 'A+'
    if (s >= 80) return 'A'
    if (s >= 75) return 'B+'
    if (s >= 70) return 'B'
    if (s >= 65) return 'C+'
    if (s >= 60) return 'C'
    if (s >= 50) return 'D'
    return 'F'
  }

  // Render helpers
  const renderChannelContent = c => {
    if (!c) return null
    return (
      <div className='rs-tab-content'>
        {/* Channel Header Info */}
        <div className='rs-info-box'>
          <div className='rs-info-header'>
            <h3>{c.title}</h3>
            {canManage && (
              <button
                className='rs-btn-icon'
                onClick={() => {
                  setEditDesc(c.description || '')
                  setEditingDescId(c.id)
                }}
                title='Edit Channel Info'
              >
                <FaPen />
              </button>
            )}
          </div>

          {editingDescId === c.id ? (
            <div className='rs-edit-desc'>
              <textarea
                className='rs-input rs-textarea'
                value={editDesc}
                onChange={e => setEditDesc(e.target.value)}
                placeholder='Write channel information/announcement...'
              />
              <div className='rs-actions'>
                <button
                  className='rs-btn'
                  onClick={() => setEditingDescId(null)}
                >
                  Cancel
                </button>
                <button
                  className='rs-btn rs-btn-primary'
                  onClick={() => handleUpdateDescription(c.id)}
                >
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className='rs-desc-text'>
              {c.description ||
                'Welcome to this channel. Check here for updates and materials.'}
            </p>
          )}
        </div>

        {/* Tutor Actions Toolbar */}
        {canManage && (
          <div className='rs-toolbar'>
            <button
              className={`rs-tool-btn ${activeTab === `msg-${c.id}` ? 'active' : ''
                }`}
              onClick={() =>
                setActiveTab(activeTab === `msg-${c.id}` ? null : `msg-${c.id}`)
              }
            >
              <FaCommentAlt /> New Post
            </button>
          </div>
        )}

        {/* Action Forms */}
        {activeTab === `msg-${c.id}` && (
          <div className='rs-action-panel'>
            <h4>Create New Post</h4>
            <input
              className='rs-input'
              placeholder='Title (Optional)'
              value={newMessage.title}
              onChange={e =>
                setNewMessage({ ...newMessage, title: e.target.value })
              }
            />
            <textarea
              className='rs-input rs-textarea'
              placeholder='Write your message here...'
              value={newMessage.content}
              onChange={e =>
                setNewMessage({ ...newMessage, content: e.target.value })
              }
            />

            {/* File Attachment */}
            <div className='rs-file-attach-section'>
              <label htmlFor={`attach-file-${c.id}`} className='rs-file-label'>
                <FaFileUpload /> {attachedFile ? 'Change File' : 'Attach File (Optional)'}
              </label>
              <input
                id={`attach-file-${c.id}`}
                type='file'
                style={{ display: 'none' }}
                onChange={e => setAttachedFile(e.target.files?.[0] || null)}
              />
              {attachedFile && (
                <div className='rs-attached-file'>
                  <FaFileAlt />
                  <span className='rs-filename'>{attachedFile.name}</span>
                  <button
                    className='rs-btn-remove'
                    onClick={() => setAttachedFile(null)}
                    type='button'
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            <div className='rs-schedule-row'>
              <label>Schedule (Optional):</label>
              <input
                type='datetime-local'
                className='rs-input'
                value={scheduleDate}
                onChange={e => setScheduleDate(e.target.value)}
              />
              <button
                className='rs-btn rs-btn-primary'
                onClick={() => handleCreateMessage(c.id)}
              >
                Post
              </button>
            </div>
          </div>
        )}



        {/* Content Stream (Mixed Messages & Files) */}
        <div className='rs-stream'>
          {/* Messages */}
          {c.messages?.map(m => (
            <div
              key={m.id}
              className={`rs-card-item message ${isScheduledFuture(m.scheduledAt) ? 'scheduled' : ''
                }`}
            >
              <div className='rs-item-header'>
                <div className='rs-user-badge'>
                  {m.creator.profilePictureUrl ? (
                    <img src={m.creator.profilePictureUrl} alt='avatar' />
                  ) : (
                    <div className='rs-avatar-placeholder'>
                      {getInitials(m.creator.firstName, m.creator.lastName)}
                    </div>
                  )}
                  <span>{m.creator.firstName}</span>
                </div>
                <div className='rs-meta-right'>
                  <span className='rs-date'>{formatDate(m.scheduledAt)}</span>
                  {isScheduledFuture(m.scheduledAt) && (
                    <span className='rs-tag-scheduled'>Scheduled</span>
                  )}
                  {canManage && (
                    <div className='rs-message-actions'>
                      <button
                        className='rs-btn-icon'
                        onClick={() => {
                          setEditingMessageId(m.id)
                          setEditMessageData({
                            title: m.title || '',
                            content: m.content || '',
                            scheduledAt: m.scheduledAt
                              ? new Date(m.scheduledAt)
                                .toISOString()
                                .slice(0, 16)
                              : ''
                          })
                        }}
                        title='Edit Message'
                      >
                        <FaPen />
                      </button>
                      <button
                        className='rs-btn-icon rs-text-danger'
                        onClick={() => handleDeleteMessage(m.id)}
                        title='Delete Message'
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {editingMessageId === m.id ? (
                <div className='rs-edit-message-form'>
                  <input
                    className='rs-input'
                    value={editMessageData.title}
                    onChange={e =>
                      setEditMessageData({
                        ...editMessageData,
                        title: e.target.value
                      })
                    }
                    placeholder='Title'
                  />
                  <textarea
                    className='rs-input rs-textarea'
                    value={editMessageData.content}
                    onChange={e =>
                      setEditMessageData({
                        ...editMessageData,
                        content: e.target.value
                      })
                    }
                    placeholder='Content'
                  />
                  <div className='rs-schedule-row'>
                    <label>Schedule:</label>
                    <input
                      type='datetime-local'
                      className='rs-input'
                      value={editMessageData.scheduledAt}
                      onChange={e =>
                        setEditMessageData({
                          ...editMessageData,
                          scheduledAt: e.target.value
                        })
                      }
                    />
                  </div>
                  <div className='rs-actions'>
                    <button
                      className='rs-btn'
                      onClick={() => setEditingMessageId(null)}
                    >
                      Cancel
                    </button>
                    <button
                      className='rs-btn rs-btn-primary'
                      onClick={handleUpdateMessage}
                    >
                      Save Changes
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  {m.title && <h4 className='rs-item-title'>{m.title}</h4>}
                  <div className='rs-item-body'>{m.content}</div>
                </>
              )}
            </div>
          ))}

          {/* Files */}
          {c.files?.map(f => (
            <div
              key={f.id}
              className={`rs-card-item file ${isScheduledFuture(f.scheduledAt) ? 'scheduled' : ''
                }`}
            >
              <div className='rs-file-icon'>
                {c.componentType === 'ASSIGNMENT' ? (
                  <FaFileAlt />
                ) : (
                  <FaFilePdf />
                )}
              </div>
              <div className='rs-file-info'>
                <div className='rs-filename'>{f.fileName}</div>
                <div className='rs-meta'>
                  Uploaded {formatDate(f.uploadedAt)}
                  {f.scheduledAt && isScheduledFuture(f.scheduledAt) && (
                    <span className='rs-tag-scheduled'>
                      Scheduled: {formatDate(f.scheduledAt)}
                    </span>
                  )}
                </div>
              </div>
              <div className='rs-file-actions'>
                <button
                  className='rs-btn rs-btn-sm'
                  onClick={() => handleDownload(f.id, f.fileName)}
                >
                  Download
                </button>
                {canManage && (
                  <button
                    className='rs-btn-icon rs-text-danger'
                    onClick={() => handleDeleteFile(f.id)}
                  >
                    <FaTrash />
                  </button>
                )}
              </div>
            </div>
          ))}

          {!c.messages?.length && !c.files?.length && (
            <div className='rs-empty-state'>
              <FaFolderOpen className='rs-empty-icon' />
              <p>No content in this channel yet.</p>
            </div>
          )}
        </div>

        {/* Assignment Submission Footer */}
        {c.componentType === 'ASSIGNMENT' && (
          <div className='rs-submission-footer'>
            <h4>Student Submission</h4>
            {isStudent ? (
              <div className='rs-submission-box-column'>
                <div className='rs-submission-box'>
                  <div className='rs-submission-status'>
                    Status:{' '}
                    {c.userSubmission ? (
                      <span className={`status-${c.userSubmission.status.toLowerCase()}`}>
                        {c.userSubmission.status}
                      </span>
                    ) : (
                      <span className='status-pending'>Pending</span>
                    )}
                  </div>
                  <label
                    className='rs-btn rs-btn-primary'
                    htmlFor={`rs-submit-${c.id}`}
                  >
                    {submitting === c.id
                      ? 'Submitting...'
                      : c.userSubmission
                        ? 'Resubmit Assignment'
                        : 'Submit Assignment'}
                  </label>
                  <input
                    id={`rs-submit-${c.id}`}
                    type='file'
                    style={{ display: 'none' }}
                    onChange={e =>
                      handleSubmitAssignment(c.id, e.target.files?.[0])
                    }
                  />
                </div>

                {/* Student Feedback Display */}
                {c.userSubmission && (c.userSubmission.grade !== null || c.userSubmission.feedback) && (
                  <div className='rs-feedback-box'>
                    <h5>Grade & Feedback</h5>
                    {c.userSubmission.grade !== null && (
                      <div className='rs-grade'>
                        <strong>Grade:</strong> {c.userSubmission.grade}/100 <span className={`grade-badge grade-${getGradeLetter(c.userSubmission.grade).replace('+', '-plus')}`}>({getGradeLetter(c.userSubmission.grade)})</span>
                      </div>
                    )}
                    {c.userSubmission.feedback && (
                      <div className='rs-feedback'>
                        <strong>Feedback:</strong>
                        <p>{c.userSubmission.feedback}</p>
                      </div>
                    )}
                    {c.userSubmission.gradedAt && (
                      <div className='rs-graded-date'>
                        Graded on {formatDate(c.userSubmission.gradedAt)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : canManage ? (
              <div className='rs-tutor-submission-area'>
                <button
                  className='rs-btn rs-btn-primary'
                  onClick={() => viewingSubmissions === c.id ? setViewingSubmissions(null) : handleFetchSubmissions(c.id)}
                >
                  {viewingSubmissions === c.id ? 'Hide Submissions' : 'View Submissions'}
                </button>

                {viewingSubmissions === c.id && (
                  <div className='rs-submissions-list'>
                    {submissionsList.length === 0 ? (
                      <p className='rs-no-submissions'>No submissions yet.</p>
                    ) : (
                      <table className='rs-submissions-table'>
                        <thead>
                          <tr>
                            <th>Student</th>
                            <th>Date</th>
                            <th>Status</th>
                            <th>Files</th>
                            <th>Grade</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {submissionsList.map(sub => (
                            <tr key={sub.id}>
                              <td>{sub.student.firstName} {sub.student.lastName}</td>
                              <td>{formatDate(sub.submittedAt)}</td>
                              <td>
                                <span className={`status-${sub.status.toLowerCase()}`}>
                                  {sub.status}
                                </span>
                              </td>
                              <td>
                                {sub.files?.map(file => (
                                  <div key={file.id} className='rs-sub-file'>
                                    <button
                                      className='rs-link-btn'
                                      onClick={() => handleDownloadSubmissionFile(file.id, file.fileName)}
                                    >
                                      {file.fileName}
                                    </button>
                                  </div>
                                ))}
                              </td>
                              <td>
                                {sub.grade !== null ? (
                                  <span>
                                    {sub.grade}/100
                                    <span className={`grade-badge grade-${getGradeLetter(sub.grade).replace('+', '-plus')}`}>
                                      ({getGradeLetter(sub.grade)})
                                    </span>
                                  </span>
                                ) : '-'}
                              </td>
                              <td>
                                <button
                                  className='rs-btn rs-btn-sm rs-btn-primary'
                                  onClick={() => {
                                    setGradingSubmission(sub)
                                    setGradeInput(sub.grade || '')
                                    setFeedbackInput(sub.feedback || '')
                                  }}
                                >
                                  Grade
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}

                {/* Grading Modal/Inline Form */}
                {gradingSubmission && (
                  <div className='rs-grading-modal'>
                    <div className='rs-grading-content'>
                      <h4>Grade Submission: {gradingSubmission.student.firstName} {gradingSubmission.student.lastName}</h4>
                      <div className='rs-form-group'>
                        <label>Grade (0-100)</label>
                        <input
                          type='number'
                          className='rs-input'
                          min='0'
                          max='100'
                          value={gradeInput}
                          onChange={e => setGradeInput(e.target.value)}
                        />
                      </div>
                      <div className='rs-form-group'>
                        <label>Feedback</label>
                        <textarea
                          className='rs-input rs-textarea'
                          value={feedbackInput}
                          onChange={e => setFeedbackInput(e.target.value)}
                          placeholder='Enter feedback for the student...'
                        />
                      </div>
                      <div className='rs-actions'>
                        <button
                          className='rs-btn'
                          onClick={() => setGradingSubmission(null)}
                        >
                          Cancel
                        </button>
                        <button
                          className='rs-btn rs-btn-primary'
                          onClick={handleGradeSubmission}
                        >
                          Submit Grade
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className='rs-note'>
                Students will see a submission button here.
              </p>
            )}
          </div>
        )}
      </div>
    )
  }

  return (
    <section className='resources-section'>
      <div className='resources-header'>
        <h2>Course Resources</h2>
        {canManage && components.length === 0 && (
          <button className='rs-btn rs-btn-primary' onClick={handleInitialize}>
            Initialize Channels
          </button>
        )}
      </div>

      {loading && components.length === 0 ? (
        <div className='rs-loading'>
          <div className='spinner' /> Loading resources...
        </div>
      ) : (
        <div className='rs-container'>
          {/* Tabs Navigation */}
          <div className='rs-tabs-nav'>
            {components.map(c => (
              <button
                key={c.id}
                className={`rs-nav-item ${activeChannelId === c.id ? 'active' : ''
                  }`}
                onClick={() => setActiveChannelId(c.id)}
              >
                {c.title}
              </button>
            ))}
          </div>

          {/* Active Channel Content */}
          <div className='rs-active-content'>
            {activeChannelId &&
              renderChannelContent(
                components.find(c => c.id === activeChannelId)
              )}
          </div>
        </div>
      )}
    </section>
  )
}
