import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { getProfilePictureUrl } from '../../utils/images';
import StudentQuizDetailModal from './StudentQuizDetailModal';
import './StudentManager.css';

const StudentManager = () => {
  const { courseId } = useParams();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedAttempt, setSelectedAttempt] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);

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
        // One-time log of the data structure for debugging
        console.log('Fetched students (stringified):', JSON.stringify(response.data.data, null, 2));
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

  const getAvatarUrl = (user) => {
    if (user?.profilePictureUrl) {
      return getProfilePictureUrl(user.profilePictureUrl);
    }
    return null;
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
        <div className="students-table-container">
          <table className="student-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}></th>
                <th>Student</th>
                <th>Enrolled Date</th>
                <th>Progress</th>
                <th>Quiz Score</th>
                <th>Attempts</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {students.map((enrollment) => (
                <tr key={enrollment.id}>
                  <td>
                    <div className="table-avatar">
                      {enrollment.user?.profilePictureUrl ? (
                        <img
                          src={getProfilePictureUrl(enrollment.user.profilePictureUrl)}
                          alt={enrollment.user?.firstName}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            const placeholder = e.target.parentElement.querySelector('.avatar-placeholder');
                            if (placeholder) placeholder.style.display = 'flex';
                          }}
                        />
                      ) : null}

                      <div
                        className="avatar-placeholder"
                        style={{ display: enrollment.user?.profilePictureUrl ? 'none' : 'flex' }}
                      >
                        {enrollment.user?.firstName?.[0] || 'S'}
                        {enrollment.user?.lastName?.[0] || ''}
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="student-cell-info">
                      <span className="student-name">{enrollment.user?.firstName} {enrollment.user?.lastName}</span>
                      <span className="student-email">{enrollment.user?.email}</span>
                    </div>
                  </td>
                  <td>{formatDate(enrollment.enrolledAt || enrollment.createdAt)}</td>
                  <td>
                    <div className="progress-cell">
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${enrollment.progressPercentage}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{enrollment.progressPercentage}%</span>
                    </div>
                  </td>
                  <td>
                    {enrollment.user?.quizAttempts && enrollment.user.quizAttempts.length > 0 ? (
                      <div className="quiz-score-cell">
                        <span className={`score-value ${enrollment.user.quizAttempts[0].passed ? 'pass' : 'fail'}`}>
                          {parseFloat(enrollment.user.quizAttempts[0].scorePercentage).toFixed(0)}%
                        </span>
                        <span className="quiz-title-hint">{enrollment.user.quizAttempts[0].quiz?.title}</span>
                      </div>
                    ) : (
                      <span className="no-data">-</span>
                    )}
                  </td>
                  <td>
                    {enrollment.user?.quizAttempts && enrollment.user.quizAttempts.length > 0 ? (
                      <span className="attempt-count">{enrollment.user.quizAttempts.length}</span>
                    ) : (
                      <span className="no-data">-</span>
                    )}
                  </td>
                  <td>
                    {enrollment.user?.quizAttempts && enrollment.user.quizAttempts.length > 0 ? (
                      <span className={`status-badge ${enrollment.user.quizAttempts[0].passed ? 'active' : 'fail-badge'}`}>
                        {enrollment.user.quizAttempts[0].passed ? 'PASSED' : 'FAILED'}
                      </span>
                    ) : (
                      <span className="no-data">-</span>
                    )}
                  </td>
                  <td>
                    {enrollment.user?.quizAttempts && enrollment.user.quizAttempts.length > 0 && (
                      <button
                        className="btn-view-answers"
                        onClick={() => {
                          setSelectedStudent(enrollment.user);
                        }}
                      >
                        View Answers
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedStudent && (
        <StudentQuizDetailModal
          student={selectedStudent}
          onClose={() => {
            setSelectedStudent(null);
          }}
        />
      )}
    </div>
  );
};

export default StudentManager;
