import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'
import { getProfilePictureUrl } from '../../utils/images'
import './CourseStudents.css'

const CourseStudents = ({ courseId }) => {
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { token } = useAuthStore()

  useEffect(() => {
    fetchEnrolledStudents()
  }, [courseId])

  const fetchEnrolledStudents = async () => {
    try {
      setLoading(true)
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

      const response = await axios.get(
        `${API_URL}/courses/${courseId}/enrollments`,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        setStudents(response.data.data)
      }
    } catch (err) {
      console.error('Failed to fetch enrolled students:', err)
      setError('Failed to load students. You might not have permission.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }



  if (loading) return <div className="cs-loading">Loading students...</div>
  if (error) return <div className="cs-error">{error}</div>

  return (
    <section className='course-section'>
      <h2>Enrolled Students ({students.length})</h2>
      <div className='participants-list'>
        {students.length > 0 ? (
          students.map(enrollment => (
            <div key={enrollment.id} className='participant-card'>
              <div className='participant-avatar'>
                {enrollment.user?.profilePictureUrl ? (
                  <>
                    <img
                      src={getProfilePictureUrl(enrollment.user.profilePictureUrl)}
                      alt={enrollment.user.firstName}
                      className='participant-avatar-img'
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                      onError={(e) => {
                        e.target.style.display = 'none'
                        e.target.nextSibling.style.display = 'flex'
                      }}
                    />
                    <div className='avatar-placeholder' style={{ display: 'none', width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 600 }}>
                      {enrollment.user?.firstName?.[0] || 'S'}
                      {enrollment.user?.lastName?.[0] || ''}
                    </div>
                  </>
                ) : (
                  <div className='avatar-placeholder' style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.25rem', fontWeight: 600 }}>
                    {enrollment.user?.firstName?.[0] || 'S'}
                    {enrollment.user?.lastName?.[0] || ''}
                  </div>
                )}
              </div>
              <div className='participant-info'>
                <div className='participant-name'>
                  {enrollment.user?.firstName} {enrollment.user?.lastName}
                </div>
                <div className='participant-email'>
                  {enrollment.user?.email}
                </div>
              </div>
              <div className='enrollment-date'>
                Enrolled: {formatDate(enrollment.enrolledAt || enrollment.createdAt)}
              </div>
            </div>
          ))
        ) : (
          <div className='no-lessons'>
            <i className='fas fa-user-slash'></i>
            <p>No students enrolled yet.</p>
          </div>
        )}
      </div>
    </section>
  )
}

export default CourseStudents
