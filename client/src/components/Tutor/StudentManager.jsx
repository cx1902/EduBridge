import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import './StudentManager.css';

const StudentManager = () => {
  const { courseId } = useParams();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);

  useEffect(() => {
    if (courseId) {
      fetchStudents();
    }
  }, [courseId]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await axios.get(
        `${API_URL}/courses/${courseId}/enrollments`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="student-manager">
      <div className="manager-header">
        <h3>Enrolled Students ({students.length})</h3>
        <p>View students currently enrolled in this course.</p>
      </div>

      {loading ? (
        <div className="loading">Loading students...</div>
      ) : students.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-users-slash"></i>
          <p>No students enrolled yet.</p>
        </div>
      ) : (
        <div className="students-list">
          {students.map((enrollment) => (
            <div key={enrollment.id} className="student-card">
              <div className="student-avatar">
                {enrollment.user?.profilePictureUrl ? (
                  <img
                    src={enrollment.user.profilePictureUrl}
                    alt={enrollment.user.firstName}
                  />
                ) : (
                  <div className="avatar-placeholder">
                    {enrollment.user?.firstName?.[0] || 'S'}
                    {enrollment.user?.lastName?.[0] || ''}
                  </div>
                )}
              </div>
              <div className="student-info">
                <h4>{enrollment.user?.firstName} {enrollment.user?.lastName}</h4>
                <br />
                <p className="student-email">{enrollment.user?.email}</p>
              </div>
              <div className="student-meta">
                <div className="meta-item">
                  <span className="label">Enrolled</span>
                  <span className="value">{formatDate(enrollment.createdAt)}</span>
                </div>
                <div className="meta-item">
                  <span className="label">Progress</span>
                  <span className="value">{enrollment.progressPercentage}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default StudentManager;
