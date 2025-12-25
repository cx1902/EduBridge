import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import './LessonBuilder.css';

const LessonBuilder = () => {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [draggedLesson, setDraggedLesson] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    learningObjectives: '',
    videoUrl: '',
    videoFileUrl: '',
    notesContent: '',
    attachments: [],
    estimatedDuration: 30,
    published: true,
  });

  useEffect(() => {
    if (courseId) {
      fetchCourse();
      fetchLessons();
    }
  }, [courseId]);

  const fetchCourse = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await axios.get(
        `${API_URL}/tutor/courses/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCourse(response.data);
    } catch (error) {
      console.error('Error fetching course:', error);
      alert('Failed to load course');
    }
  };

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await axios.get(
        `${API_URL}/tutor/courses/${courseId}/lessons`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLessons(response.data);
    } catch (error) {
      console.error('Error fetching lessons:', error);
      alert('Failed to load lessons');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.title.length < 5 || formData.title.length > 150) {
      alert('Title must be between 5-150 characters');
      return;
    }

    if (formData.content && formData.content.length < 20) {
      alert('Content must be at least 20 characters');
      return;
    }

    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

      if (editingLesson) {
        // Update existing lesson
        await axios.put(
          `${API_URL}/tutor/lessons/${editingLesson.id}`,
          formData,
          config
        );
        alert('Lesson updated successfully');
      } else {
        // Create new lesson
        await axios.post(
          `${API_URL}/tutor/courses/${courseId}/lessons`,
          formData,
          config
        );
        alert('Lesson created successfully');
      }

      resetForm();
      fetchLessons();
    } catch (error) {
      console.error('Error saving lesson:', error);
      alert(error.response?.data?.error || 'Failed to save lesson');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (lesson) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title,
      content: lesson.content || '',
      learningObjectives: lesson.learningObjectives || '',
      videoUrl: lesson.videoUrl || '',
      videoFileUrl: lesson.videoFileUrl || '',
      notesContent: lesson.notesContent || '',
      attachments: lesson.attachments || [],
      estimatedDuration: lesson.estimatedDuration,
      published: lesson.published,
    });
    setShowForm(true);
  };

  const handleDelete = async (lessonId) => {
    if (!confirm('Are you sure you want to delete this lesson?')) return;

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      await axios.delete(
        `${API_URL}/tutor/lessons/${lessonId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Lesson deleted successfully');
      fetchLessons();
    } catch (error) {
      console.error('Error deleting lesson:', error);
      alert('Failed to delete lesson');
    }
  };

  const handleDragStart = (e, lesson) => {
    setDraggedLesson(lesson);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = async (e, targetLesson) => {
    e.preventDefault();

    if (!draggedLesson || draggedLesson.id === targetLesson.id) {
      setDraggedLesson(null);
      return;
    }

    // Create new order
    const reorderedLessons = [...lessons];
    const draggedIndex = reorderedLessons.findIndex((l) => l.id === draggedLesson.id);
    const targetIndex = reorderedLessons.findIndex((l) => l.id === targetLesson.id);

    // Remove dragged item and insert at target position
    const [removed] = reorderedLessons.splice(draggedIndex, 1);
    reorderedLessons.splice(targetIndex, 0, removed);

    // Update sequence orders
    const lessonOrders = reorderedLessons.map((lesson, index) => ({
      id: lesson.id,
      sequenceOrder: index + 1,
    }));

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      await axios.patch(
        `${API_URL}/tutor/lessons/reorder`,
        { lessonOrders },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLessons(reorderedLessons);
    } catch (error) {
      console.error('Error reordering lessons:', error);
      alert('Failed to reorder lessons');
    }

    setDraggedLesson(null);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      content: '',
      learningObjectives: '',
      videoUrl: '',
      videoFileUrl: '',
      notesContent: '',
      attachments: [],
      estimatedDuration: 30,
      published: true,
    });
    setEditingLesson(null);
    setShowForm(false);
  };

  return (
    <div className="lesson-builder">
      <div className="builder-header">
        <div>
          <button className="btn-back" onClick={() => navigate('/tutor/courses')}>
            <i className="fas fa-arrow-left"></i> Back to Courses
          </button>
          <h1>{course?.title || 'Loading...'}</h1>
          <p className="course-subtitle">Manage course lessons</p>
        </div>
        {!showForm && (
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <i className="fas fa-plus"></i> Add Lesson
          </button>
        )}
      </div>

      {showForm ? (
        <div className="lesson-form-container">
          <div className="form-header">
            <h2>{editingLesson ? 'Edit Lesson' : 'Create New Lesson'}</h2>
            <button className="btn-close" onClick={resetForm}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="lesson-form">
            <div className="form-group">
              <label htmlFor="title">Lesson Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                minLength={5}
                maxLength={150}
                placeholder="e.g., Introduction to Variables"
              />
              <small>{formData.title.length}/150 characters</small>
            </div>

            <div className="form-group">
              <label htmlFor="learningObjectives">Learning Objectives *</label>
              <textarea
                id="learningObjectives"
                name="learningObjectives"
                value={formData.learningObjectives}
                onChange={handleInputChange}
                required
                rows={3}
                placeholder="What will students learn in this lesson?"
              />
            </div>

            <div className="form-group">
              <label htmlFor="content">Lesson Content</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                rows={10}
                placeholder="Enter the main lesson content here..."
                className="content-editor"
              />
              <small>Tip: You can use Markdown formatting</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="videoUrl">Video URL</label>
                <input
                  type="url"
                  id="videoUrl"
                  name="videoUrl"
                  value={formData.videoUrl}
                  onChange={handleInputChange}
                  placeholder="https://youtube.com/watch?v=..."
                />
                <small>YouTube, Vimeo, or direct video link</small>
              </div>

              <div className="form-group">
                <label htmlFor="estimatedDuration">Duration (minutes)</label>
                <input
                  type="number"
                  id="estimatedDuration"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleInputChange}
                  min={1}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notesContent">Additional Notes</label>
              <textarea
                id="notesContent"
                name="notesContent"
                value={formData.notesContent}
                onChange={handleInputChange}
                rows={4}
                placeholder="Supplementary notes, tips, or resources..."
              />
            </div>

            <div className="form-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="published"
                  checked={formData.published}
                  onChange={handleInputChange}
                />
                <span>Publish this lesson immediately</span>
              </label>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : editingLesson ? 'Update Lesson' : 'Create Lesson'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="lessons-container">
          {loading ? (
            <div className="loading">Loading lessons...</div>
          ) : lessons.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-book-open"></i>
              <h3>No Lessons Yet</h3>
              <p>Create your first lesson to start building your course</p>
            </div>
          ) : (
            <div className="lessons-list">
              <div className="list-header">
                <span className="col-order">#</span>
                <span className="col-title">Title</span>
                <span className="col-duration">Duration</span>
                <span className="col-quizzes">Quizzes</span>
                <span className="col-status">Status</span>
                <span className="col-actions">Actions</span>
              </div>
              {lessons.map((lesson) => (
                <div
                  key={lesson.id}
                  className="lesson-item"
                  draggable
                  onDragStart={(e) => handleDragStart(e, lesson)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, lesson)}
                >
                  <span className="col-order">
                    <i className="fas fa-grip-vertical drag-handle"></i>
                    {lesson.sequenceOrder}
                  </span>
                  <span className="col-title">
                    <strong>{lesson.title}</strong>
                    {lesson.videoUrl && <i className="fas fa-video video-icon"></i>}
                  </span>
                  <span className="col-duration">{lesson.estimatedDuration} min</span>
                  <span className="col-quizzes">{lesson._count?.quizzes || 0}</span>
                  <span className="col-status">
                    <span className={`status-badge ${lesson.published ? 'published' : 'draft'}`}>
                      {lesson.published ? 'Published' : 'Draft'}
                    </span>
                  </span>
                  <span className="col-actions">
                    <button
                      className="btn-icon"
                      onClick={() => handleEdit(lesson)}
                      title="Edit"
                    >
                      <i className="fas fa-edit"></i>
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => handleDelete(lesson.id)}
                      title="Delete"
                    >
                      <i className="fas fa-trash"></i>
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default LessonBuilder;
