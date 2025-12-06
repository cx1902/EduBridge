import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import './ScheduleSessionCard.css';

const ScheduleSessionCard = () => {
  const { user } = useAuthStore();
  const [enrolledStudents, setEnrolledStudents] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    courseId: '',
    subject: '',
    educationLevel: 'SECONDARY',
    sessionType: 'ONE_ON_ONE',
    scheduledStart: '',
    scheduledEnd: '',
    duration: 60,
    topic: '',
    objectives: '',
    videoRoomId: '',
    sendImmediately: true,
  });

  // Fetch tutor's courses
  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const response = await fetch('/api/tutor/courses', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });
        const data = await response.json();
        if (data.success) {
          setCourses(data.data);
        }
      } catch (error) {
        console.error('Error fetching courses:', error);
      }
    };

    fetchCourses();
  }, []);

  // Fetch enrolled students when course is selected
  useEffect(() => {
    if (formData.courseId) {
      const fetchEnrolledStudents = async () => {
        try {
          const response = await fetch(`/api/courses/${formData.courseId}/enrollments`, {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
            },
          });
          const data = await response.json();
          if (data.success) {
            setEnrolledStudents(data.data);
          }
        } catch (error) {
          console.error('Error fetching enrolled students:', error);
        }
      };

      fetchEnrolledStudents();
    }
  }, [formData.courseId]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));

    // Auto-calculate end time based on duration
    if (name === 'scheduledStart' || name === 'duration') {
      const start = name === 'scheduledStart' ? new Date(value) : new Date(formData.scheduledStart);
      const duration = name === 'duration' ? parseInt(value) : formData.duration;
      
      if (start && duration) {
        const end = new Date(start.getTime() + duration * 60000);
        setFormData(prev => ({
          ...prev,
          scheduledEnd: end.toISOString().slice(0, 16),
        }));
      }
    }
  };

  const handleStudentSelection = (studentId) => {
    setSelectedStudents(prev => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId);
      } else {
        return [...prev, studentId];
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedStudents.length === enrolledStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(enrolledStudents.map(s => s.userId));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (selectedStudents.length === 0) {
      alert('Please select at least one student');
      return;
    }

    setLoading(true);

    try {
      // Create session
      const sessionResponse = await fetch('/api/sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          subject: formData.topic || formData.subject,
          educationLevel: formData.educationLevel,
          scheduledStart: formData.scheduledStart,
          scheduledEnd: formData.scheduledEnd,
          maxParticipants: selectedStudents.length,
          pricePerStudent: 0,
          sessionType: formData.sessionType,
          videoRoomId: formData.videoRoomId || `room_${Date.now()}`,
        }),
      });

      const sessionData = await sessionResponse.json();

      if (sessionData.success) {
        // Send invitations
        const inviteResponse = await fetch(`/api/sessions/${sessionData.data.id}/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
          body: JSON.stringify({
            studentIds: selectedStudents,
          }),
        });

        const inviteData = await inviteResponse.json();

        if (inviteData.success) {
          alert(`Session created and invitations sent to ${inviteData.data.sent} students!`);
          // Reset form
          setFormData({
            courseId: '',
            subject: '',
            educationLevel: 'SECONDARY',
            sessionType: 'ONE_ON_ONE',
            scheduledStart: '',
            scheduledEnd: '',
            duration: 60,
            topic: '',
            objectives: '',
            videoRoomId: '',
            sendImmediately: true,
          });
          setSelectedStudents([]);
        } else {
          alert('Session created but failed to send invitations: ' + inviteData.message);
        }
      } else {
        alert('Failed to create session: ' + sessionData.message);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      alert('An error occurred while creating the session');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="schedule-session-card card">
      <h3>📅 Schedule Class Session</h3>
      <p className="text-secondary">Schedule one-on-one or group classes with enrolled students</p>

      <form onSubmit={handleSubmit} className="schedule-form">
        {/* Course Selection */}
        <div className="form-group">
          <label htmlFor="courseId">Select Course *</label>
          <select
            id="courseId"
            name="courseId"
            value={formData.courseId}
            onChange={handleInputChange}
            required
          >
            <option value="">Choose a course...</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.title} ({course.enrollmentCount} students)
              </option>
            ))}
          </select>
        </div>

        {/* Session Details */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="topic">Session Topic *</label>
            <input
              type="text"
              id="topic"
              name="topic"
              value={formData.topic}
              onChange={handleInputChange}
              placeholder="e.g., Introduction to Algebra"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="sessionType">Session Type *</label>
            <select
              id="sessionType"
              name="sessionType"
              value={formData.sessionType}
              onChange={handleInputChange}
              required
            >
              <option value="ONE_ON_ONE">One-on-One</option>
              <option value="GROUP">Small Group</option>
              <option value="OFFICE_HOURS">Office Hours</option>
            </select>
          </div>
        </div>

        {/* Date and Time */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="scheduledStart">Start Date & Time *</label>
            <input
              type="datetime-local"
              id="scheduledStart"
              name="scheduledStart"
              value={formData.scheduledStart}
              onChange={handleInputChange}
              min={new Date().toISOString().slice(0, 16)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="duration">Duration (minutes) *</label>
            <select
              id="duration"
              name="duration"
              value={formData.duration}
              onChange={handleInputChange}
              required
            >
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">1 hour</option>
              <option value="90">1.5 hours</option>
              <option value="120">2 hours</option>
            </select>
          </div>
        </div>

        {/* Learning Objectives */}
        <div className="form-group">
          <label htmlFor="objectives">Learning Objectives</label>
          <textarea
            id="objectives"
            name="objectives"
            value={formData.objectives}
            onChange={handleInputChange}
            placeholder="What will students learn in this session?"
            rows="3"
          />
        </div>

        {/* Student Selection */}
        {formData.courseId && (
          <div className="student-selection">
            <div className="student-selection-header">
              <h4>Select Students ({selectedStudents.length}/{enrolledStudents.length})</h4>
              <button
                type="button"
                className="btn-link"
                onClick={handleSelectAll}
              >
                {selectedStudents.length === enrolledStudents.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="student-list">
              {enrolledStudents.length === 0 ? (
                <p className="text-muted">No enrolled students in this course</p>
              ) : (
                enrolledStudents.map(enrollment => (
                  <label key={enrollment.userId} className="student-item">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(enrollment.userId)}
                      onChange={() => handleStudentSelection(enrollment.userId)}
                    />
                    <div className="student-info">
                      <span className="student-name">
                        {enrollment.user.firstName} {enrollment.user.lastName}
                      </span>
                      <span className="student-progress">
                        Progress: {enrollment.progressPercentage}%
                      </span>
                    </div>
                  </label>
                ))
              )}
            </div>
          </div>
        )}

        {/* Email Notification Options */}
        <div className="form-group">
          <label className="checkbox-label">
            <input
              type="checkbox"
              name="sendImmediately"
              checked={formData.sendImmediately}
              onChange={handleInputChange}
            />
            Send email invitations immediately
          </label>
          <small className="text-muted">
            Students will receive email invitations with calendar attachments
          </small>
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={loading || selectedStudents.length === 0}
          >
            {loading ? 'Creating Session...' : 'Schedule Session & Send Invitations'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ScheduleSessionCard;
