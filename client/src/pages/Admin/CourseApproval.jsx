import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import './CourseApproval.css';

const CourseManagement = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState(''); // Default to ALL
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const navigate = useNavigate();
  const { token } = useAuthStore();

  useEffect(() => {
    fetchCourses();
  }, [filter]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await axios.get(`${API_URL}/admin/courses`, {
        params: { status: filter, limit: 100 },
        headers: { Authorization: `Bearer ${token}` } // Ensure token is sent
      });
      setCourses(response.data.courses || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to approve this course?')) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      await axios.put(`${API_URL}/admin/courses/${courseId}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Course approved and published successfully!');
      fetchCourses();
    } catch (error) {
      console.error('Error approving course:', error);
      alert('Failed to approve course');
    }
  };

  const handleRejectCourse = async (courseId) => {
    if (!rejectionReason.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      await axios.put(`${API_URL}/admin/courses/${courseId}/unpublish`, {
        reason: rejectionReason
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Course rejected successfully');
      setShowRejectModal(null);
      setRejectionReason('');
      fetchCourses();
    } catch (error) {
      console.error('Error rejecting course:', error);
      alert('Failed to reject course');
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (!window.confirm('Are you sure you want to delete this course? This action cannot be undone.')) return;

    try {
      // Use tutor endpoint for deletion (we've enabled admin access)
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      await axios.delete(`${API_URL}/tutor/courses/${courseId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course');
    }
  };

  const handleEditCourse = (courseId) => {
    // Redirect to Tutor Editor (we've enabled admin access)
    navigate(`/tutor/courses/${courseId}/edit`);
  };

  const getStatusBadge = (status) => {
    const badges = {
      PENDING_APPROVAL: { color: '#f59e0b', text: 'Pending Approval' },
      PUBLISHED: { color: '#10b981', text: 'Published' },
      DRAFT: { color: '#6b7280', text: 'Draft' },
      ARCHIVED: { color: '#ef4444', text: 'Archived' }
    };
    const badge = badges[status] || badges.DRAFT;
    return (
      <span style={{
        backgroundColor: badge.color,
        color: 'white',
        padding: '0.25rem 0.75rem',
        borderRadius: '0.25rem',
        fontSize: '0.875rem',
        fontWeight: '500'
      }}>
        {badge.text}
      </span>
    );
  };

  return (
    <div className="container">
      <h1>Course Management</h1>
      <p>Manage, review, and edit all platform courses</p>

      <div className="card mt-lg" style={{ marginBottom: '1rem' }}>
        <div className="admin-course-filters">
          <button
            className={`btn ${filter === '' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('')}
          >
            All Courses
          </button>
          <button
            className={`btn ${filter === 'PENDING_APPROVAL' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('PENDING_APPROVAL')}
          >
            Pending Review
          </button>
          <button
            className={`btn ${filter === 'PUBLISHED' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter('PUBLISHED')}
          >
            Published
          </button>
        </div>
      </div>

      {/* Course List */}
      {loading ? (
        <div className="card">
          <p>Loading courses...</p>
        </div>
      ) : courses.length === 0 ? (
        <div className="card">
          <p>No courses found</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1rem' }}>
          {courses.map((course) => (
            <div key={course.id} className="card" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                <div style={{ flex: 1 }}>
                  <h2 style={{ margin: '0 0 0.5rem 0' }}>{course.title}</h2>
                  <p style={{ color: '#6b7280', margin: '0 0 0.5rem 0' }}>{course.subtitle}</p>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem', fontSize: '0.875rem', color: '#6b7280' }}>
                    <span>👨‍🏫 {course.tutor?.firstName} {course.tutor?.lastName}</span>
                    <span>📚 {course.subjectCategory}</span>
                    <span>🎓 {course.educationLevel}</span>
                    <span>⏱️ {course.estimatedHours}h</span>
                  </div>
                </div>
                <div>{getStatusBadge(course.status)}</div>
              </div>

              <p style={{ marginBottom: '1rem', color: '#4b5563' }}>
                {course.description?.substring(0, 200)}...
              </p>

              <div className="course-action-buttons">
                {/* Approval Actions (Only for Pending) */}
                {course.status === 'PENDING_APPROVAL' && (
                  <>
                    <button
                      className="btn btn-success"
                      onClick={() => handleApproveCourse(course.id)}
                    >
                      ✅ Approve
                    </button>
                    <button
                      className="btn btn-danger"
                      onClick={() => setShowRejectModal(course.id)}
                    >
                      ❌ Reject
                    </button>
                  </>
                )}

                {/* Management Actions (Always visible for Admins) */}
                <button
                  className="btn btn-primary"
                  onClick={() => handleEditCourse(course.id)}
                >
                  ✏️ Edit
                </button>
                <button
                  className="btn btn-outline"
                  onClick={() => window.open(`/courses/${course.id}`, '_blank')}
                >
                  👁️ Preview
                </button>
                <button
                  className="btn btn-outline btn-delete-outline"
                  onClick={() => handleDeleteCourse(course.id)}
                >
                  🗑️ Delete
                </button>
              </div>

              {course.rejectionReason && (
                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#fee2e2', borderRadius: '0.5rem' }}>
                  <strong>Rejection Reason:</strong>
                  <p style={{ margin: '0.5rem 0 0 0' }}>{course.rejectionReason}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
            <h3>Reject Course</h3>
            <p>Please provide a reason for rejecting this course:</p>
            <textarea
              className="form-control"
              rows="5"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              placeholder="Provide detailed feedback for the tutor..."
              style={{ marginBottom: '1rem' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
              <button
                className="btn btn-outline"
                onClick={() => {
                  setShowRejectModal(null);
                  setRejectionReason('');
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleRejectCourse(showRejectModal)}
              >
                Reject Course
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CourseManagement;
