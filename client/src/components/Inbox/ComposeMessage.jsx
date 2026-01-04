import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import '../../pages/Inbox/Inbox.css'; // Reusing CSS

const ComposeMessage = ({ onClose, onSendSuccess, replyTo }) => {
  const { user, token } = useAuthStore();
  const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
  const [content, setContent] = useState('');
  const [recipientType, setRecipientType] = useState('ADMIN'); // ADMIN, TUTOR, CLASS
  const [selectedCourseId, setSelectedCourseId] = useState('');
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (replyTo) {
      // If replying, we don't need to fetch courses or select recipient
      // We just lock the recipient to the original sender
      return;
    }
    fetchContextOptions();
  }, [user.role]);

  const fetchContextOptions = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      
      if (user.role === 'STUDENT') {
        // Fetch enrolled courses to find tutors
        const response = await axios.get(`${API_URL}/courses/enrolled`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setCourses(response.data.data);
        }
      } else if (user.role === 'TUTOR') {
        // Fetch created courses to send updates
        const response = await axios.get(`${API_URL}/tutor/courses`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (response.data.success) {
          setCourses(response.data.data);
        }
      }
    } catch (error) {
      console.error('Failed to fetch context options:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    try {
      setSending(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

      let payload = {
        subject,
        content,
        type: 'GENERAL'
      };

      if (replyTo) {
        payload.receiverId = replyTo.senderId; // Reply to sender
        payload.subject = subject; // Use edited subject
      } else {
        // New Message Logic
        if (recipientType === 'ADMIN') {
          payload.type = 'ADMIN_TICKET';
        } else if (recipientType === 'TUTOR') {
          // Student sending to Tutor of a specific course
          // We need to find the tutorId from the selected course
          const course = courses.find(c => c.id === selectedCourseId);
          if (course) {
             payload.receiverId = course.tutorId;
             payload.courseId = course.id; // Optional context
             payload.type = 'GENERAL';
          }
        } else if (recipientType === 'CLASS') {
          // Tutor sending to Class
          payload.type = 'CLASS_UPDATE';
          payload.courseId = selectedCourseId;
        }
      }

      await axios.post(`${API_URL}/inbox/send`, payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      onSendSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to send message:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Failed to send message. Please try again.';
      alert(errorMessage);
    } finally {
      setSending(false);
    }
  };

  if (replyTo) {
    // Simplified view for Reply
    return (
      <div className="compose-modal-overlay">
        <div className="compose-modal">
          <div className="compose-header">
            <h3>Reply to {replyTo.sender.firstName} {replyTo.sender.lastName}</h3>
            <button className="btn-close-modal" onClick={onClose}>&times;</button>
          </div>
          <div className="compose-body">
            <div className="compose-form-group">
              <label>Subject</label>
              <input
                type="text"
                className="compose-input"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </div>
            <div className="compose-form-group">
              <label>Message</label>
              <textarea
                className="compose-textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Write your reply..."
              />
            </div>
          </div>
          <div className="compose-footer">
            <button className="btn-cancel" onClick={onClose}>Cancel</button>
            <button className="btn-send" onClick={handleSend} disabled={sending || !content}>
              {sending ? 'Sending...' : 'Send Reply'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="compose-modal-overlay">
      <div className="compose-modal">
        <div className="compose-header">
          <h3>Compose Message</h3>
          <button className="btn-close-modal" onClick={onClose}>&times;</button>
        </div>
        <div className="compose-body">
          {/* Recipient Selection */}
          <div className="compose-form-group">
            <label>To</label>
            <select
              className="compose-select"
              value={recipientType}
              onChange={(e) => {
                setRecipientType(e.target.value);
                setSelectedCourseId('');
              }}
            >
              <option value="ADMIN">Admin Support</option>
              {user.role === 'STUDENT' && <option value="TUTOR">My Tutor</option>}
              {user.role === 'TUTOR' && <option value="CLASS">My Class (All Students)</option>}
            </select>
          </div>

          {/* Context Selection (Course) */}
          {recipientType !== 'ADMIN' && (
            <div className="compose-form-group">
              <label>
                {recipientType === 'TUTOR' ? 'Select Course (Tutor)' : 'Select Class'}
              </label>
              <select
                className="compose-select"
                value={selectedCourseId}
                onChange={(e) => setSelectedCourseId(e.target.value)}
              >
                <option value="">-- Select Course --</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="compose-form-group">
            <label>Subject</label>
            <input
              type="text"
              className="compose-input"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Enter subject..."
            />
          </div>

          <div className="compose-form-group">
            <label>Message</label>
            <textarea
              className="compose-textarea"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your message..."
            />
          </div>
        </div>
        <div className="compose-footer">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button 
            className="btn-send" 
            onClick={handleSend} 
            disabled={sending || !subject || !content || (recipientType !== 'ADMIN' && !selectedCourseId)}
          >
            {sending ? 'Sending...' : 'Send Message'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ComposeMessage;
