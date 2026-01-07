import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import QuizBuilder from '../../components/Tutor/QuizBuilder';
import { FaTrash, FaEdit, FaQuestionCircle, FaGripVertical, FaVideo, FaTimes, FaPlus, FaArrowLeft, FaInfoCircle, FaBook, FaCog, FaBookOpen } from 'react-icons/fa';
import './LessonBuilder.css';

const LessonBuilder = ({ embedded = false }) => {
  const navigate = useNavigate();
  const { courseId: paramCourseId } = useParams();
  // If embedded, we might get courseId from props, but currently it's not passed as prop. 
  // However, CourseEditor is under the same route /tutor/courses/:courseId, so useParams works.
  const courseId = paramCourseId;
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [course, setCourse] = useState(null);
  const [lessons, setLessons] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingLesson, setEditingLesson] = useState(null);
  const [draggedLesson, setDraggedLesson] = useState(null);

  // Quiz Builder State
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [currentLessonForQuiz, setCurrentLessonForQuiz] = useState(null);
  const [existingQuiz, setExistingQuiz] = useState(null);

  const [formData, setFormData] = useState({
    type: 'TEXT',
    title: '',
    content: '',
    learningObjectives: '',
    videoUrl: '',
    videoFileUrl: '',
    fileUrl: '',
    fileName: '',
    fileSize: '',
    linkUrl: '',
    difficulty: 'BEGINNER',
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
      type: lesson.type || 'TEXT',
      title: lesson.title,
      content: lesson.content || '',
      learningObjectives: lesson.learningObjectives || '',
      videoUrl: lesson.videoUrl || '',
      videoFileUrl: lesson.videoFileUrl || '',
      fileUrl: lesson.fileUrl || '',
      fileName: lesson.fileName || '',
      fileSize: lesson.fileSize || '',
      linkUrl: lesson.linkUrl || '',
      difficulty: lesson.difficulty || 'BEGINNER',
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

  const handleManageQuiz = async (lesson) => {
    setCurrentLessonForQuiz(lesson);
    setExistingQuiz(null); // Reset first

    // Check if lesson already has a quiz (based on count or fetch)
    // Optimization: Only fetch if we know a quiz exists to prevent 404 console errors
    if (lesson._count?.quizzes > 0) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        const response = await axios.get(
          `${API_URL}/quizzes/lesson/${lesson.id}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success && response.data.data.quiz) {
          setExistingQuiz(response.data.data.quiz);
        }
      } catch (error) {
        // If 404, it just means no quiz exists yet, which is fine
        if (error.response && error.response.status !== 404) {
          console.error('Error fetching quiz:', error);
        }
      }
    }

    setShowQuizBuilder(true);
  };

  const resetForm = () => {
    setFormData({
      type: 'TEXT',
      title: '',
      content: '',
      learningObjectives: '',
      videoUrl: '',
      videoFileUrl: '',
      fileUrl: '',
      fileName: '',
      fileSize: '',
      linkUrl: '',
      difficulty: 'BEGINNER',
      notesContent: '',
      attachments: [],
      estimatedDuration: 30,
      published: true,
    });
    setEditingLesson(null);
    setShowForm(false);
  };

  return (
    <div className={`lesson-builder ${embedded ? 'embedded' : ''}`}>
      {!embedded && (
        <div className="builder-header">
          <div>
            <button className="btn-back" onClick={() => navigate('/tutor')}>
              <FaArrowLeft /> Back to Courses
            </button>
            <h1>{course?.title || 'Loading...'}</h1>
            <p className="course-subtitle">Manage course lessons</p>
          </div>
          {!showForm && (
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <FaPlus /> Add Lesson
            </button>
          )}
        </div>
      )}

      {embedded && !showForm && (
        <div className="curriculum-header">
          <h2 className="curriculum-title">Course Lessons</h2>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <FaPlus /> Add Lesson
          </button>
        </div>
      )}

      {showForm ? (
        <div className="lesson-form-container">
          <div className="form-header">
            <h2>{editingLesson ? 'Edit Lesson' : 'Create New Lesson'}</h2>
            <button className="btn-close" onClick={resetForm}>
              <FaTimes />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="lesson-form">
            {/* Basic Information Section */}
            <div className="form-section">
              <h3 className="section-title">
                <FaInfoCircle />
                Basic Information
              </h3>

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

              <div className="form-row three-col">
                <div className="form-group">
                  <label htmlFor="type">Lesson Type</label>
                  <select
                    id="type"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                  >
                    <option value="TEXT">Text / Article</option>
                    <option value="VIDEO_LINK">Video Link</option>
                    <option value="FILE">File / Download</option>
                    <option value="LIVE_INFO">Live Lecture Info</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="difficulty">Difficulty</label>
                  <select
                    id="difficulty"
                    name="difficulty"
                    value={formData.difficulty}
                    onChange={handleInputChange}
                  >
                    <option value="BEGINNER">Beginner</option>
                    <option value="INTERMEDIATE">Intermediate</option>
                    <option value="ADVANCED">Advanced</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="estimatedDuration">Duration (minutes) *</label>
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
                <label htmlFor="learningObjectives">Learning Objectives</label>
                <textarea
                  id="learningObjectives"
                  name="learningObjectives"
                  value={formData.learningObjectives}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder="What will students learn in this lesson? (e.g. Determine the usage of...)"
                />
              </div>
            </div>

            {/* Content Section */}
            <div className="form-section">
              <h3 className="section-title">
                <FaBook />
                Lesson Content
              </h3>

              {formData.type === 'TEXT' && (
                <div className="form-group">
                  <label htmlFor="content">Main Content</label>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={12}
                    placeholder="Enter the main lesson content here..."
                    className="content-editor"
                  />
                  <small>Tip: You can use Markdown formatting for rich text.</small>
                </div>
              )}

              {formData.type === 'LIVE_INFO' && (
                <div className="form-group">
                  <label htmlFor="content">Live Session Details</label>
                  <textarea
                    id="content"
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    rows={5}
                    placeholder="Enter meeting link, time, and instructions..."
                    className="content-editor"
                  />
                </div>
              )}

              {(formData.type === 'VIDEO_LINK' || formData.type === 'LIVE_INFO') && (
                <div className="form-group">
                  <label htmlFor="linkUrl">Link URL {formData.type === 'VIDEO_LINK' && '*'}</label>
                  <input
                    type="url"
                    id={formData.type === 'VIDEO_LINK' ? "videoUrl" : "linkUrl"}
                    name={formData.type === 'VIDEO_LINK' ? "videoUrl" : "linkUrl"}
                    value={formData.type === 'VIDEO_LINK' ? formData.videoUrl : formData.linkUrl}
                    onChange={handleInputChange}
                    placeholder={formData.type === 'VIDEO_LINK' ? "https://youtube.com/..." : "https://zoom.us/..."}
                    required={formData.type === 'VIDEO_LINK'}
                  />
                </div>
              )}

              {formData.type === 'FILE' && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="fileUrl">File URL *</label>
                    <input
                      type="url"
                      id="fileUrl"
                      name="fileUrl"
                      value={formData.fileUrl}
                      onChange={handleInputChange}
                      placeholder="https://..."
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="fileName">File Name</label>
                    <input
                      type="text"
                      id="fileName"
                      name="fileName"
                      value={formData.fileName}
                      onChange={handleInputChange}
                      placeholder="e.g. Lecture_Slides.pdf"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="fileSize">File Size</label>
                    <input
                      type="text"
                      id="fileSize"
                      name="fileSize"
                      value={formData.fileSize}
                      onChange={handleInputChange}
                      placeholder="e.g. 5 MB"
                    />
                  </div>
                </div>
              )}

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
              <FaBookOpen />
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
                    <FaGripVertical className="drag-handle" />
                    {lesson.sequenceOrder}
                  </span>
                  <span className="col-title">
                    <strong>{lesson.title}</strong>
                    {lesson.videoUrl && <FaVideo className="video-icon" />}
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
                      onClick={() => handleManageQuiz(lesson)}
                      title="Manage Quiz"
                      style={{ color: '#6366f1' }}
                    >
                      <FaQuestionCircle />
                    </button>
                    <button
                      className="btn-icon"
                      onClick={() => handleEdit(lesson)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="btn-icon btn-delete"
                      onClick={() => handleDelete(lesson.id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {showQuizBuilder && (
        <QuizBuilder
          lessonId={currentLessonForQuiz?.id}
          existingQuiz={existingQuiz}
          onClose={() => setShowQuizBuilder(false)}
          onSave={() => {
            fetchLessons(); // Refresh to update quiz count
          }}
        />
      )}
    </div>
  );
};

export default LessonBuilder;
