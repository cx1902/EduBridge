import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import './CourseBuilder.css';

const CourseBuilder = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    subjectCategory: '',
    educationLevel: 'SECONDARY',
    difficulty: 'BEGINNER',
    prerequisites: '',
    price: 0,
    pricingModel: 'FREE',
    estimatedHours: 0,
    language: 'en',
    thumbnailUrl: '',
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/tutor/courses`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCourses(response.data);
    } catch (error) {
      console.error('Error fetching courses:', error);
      alert('Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.title.length < 5 || formData.title.length > 200) {
      alert('Title must be between 5-200 characters');
      return;
    }

    if (formData.description.length < 50) {
      alert('Description must be at least 50 characters');
      return;
    }

    try {
      setLoading(true);
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (editingCourse) {
        // Update existing course
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/tutor/courses/${editingCourse.id}`,
          formData,
          config
        );
        alert('Course updated successfully');
      } else {
        // Create new course
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/tutor/courses`,
          formData,
          config
        );
        alert('Course created successfully');
      }

      // Reset form and refresh courses
      resetForm();
      fetchCourses();
    } catch (error) {
      console.error('Error saving course:', error);
      alert(error.response?.data?.error || 'Failed to save course');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      subjectCategory: course.subjectCategory,
      educationLevel: course.educationLevel,
      difficulty: course.difficulty,
      prerequisites: course.prerequisites || '',
      price: course.price,
      pricingModel: course.pricingModel,
      estimatedHours: course.estimatedHours,
      language: course.language,
      thumbnailUrl: course.thumbnailUrl,
    });
    setShowForm(true);
  };

  const handleDelete = async (courseId) => {
    if (!confirm('Are you sure you want to delete this course?')) return;

    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/tutor/courses/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Course deleted successfully');
      fetchCourses();
    } catch (error) {
      console.error('Error deleting course:', error);
      alert(error.response?.data?.error || 'Failed to delete course');
    }
  };

  const handleTogglePublish = async (courseId, currentStatus) => {
    try {
      await axios.patch(
        `${import.meta.env.VITE_API_URL}/api/tutor/courses/${courseId}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert(
        currentStatus === 'PUBLISHED'
          ? 'Course unpublished successfully'
          : 'Course published successfully'
      );
      fetchCourses();
    } catch (error) {
      console.error('Error toggling publish status:', error);
      alert(error.response?.data?.error || 'Failed to update course status');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      subjectCategory: '',
      educationLevel: 'SECONDARY',
      difficulty: 'BEGINNER',
      prerequisites: '',
      price: 0,
      pricingModel: 'FREE',
      estimatedHours: 0,
      language: 'en',
      thumbnailUrl: '',
    });
    setEditingCourse(null);
    setShowForm(false);
  };

  const getStatusBadgeClass = (status) => {
    const classes = {
      DRAFT: 'status-draft',
      PUBLISHED: 'status-published',
      PENDING_APPROVAL: 'status-pending',
      ARCHIVED: 'status-archived',
    };
    return classes[status] || 'status-draft';
  };

  return (
    <div className="course-builder">
      <div className="builder-header">
        <h1>Course Management</h1>
        <div className="header-actions">
          {!showForm && (
            <>
              <button className="btn-primary" onClick={() => navigate('/tutor/courses/wizard')}>
                <i className="fas fa-magic"></i> Create with Wizard (Recommended)
              </button>
              <button className="btn-secondary" onClick={() => navigate('/tutor/course-editor/new')}>
                <i className="fas fa-cog"></i> Advanced Editor
              </button>
              <button className="btn-secondary" onClick={() => setShowForm(true)}>
                <i className="fas fa-plus"></i> Quick Create
              </button>
            </>
          )}
        </div>
      </div>

      {showForm ? (
        <div className="course-form-container">
          <div className="form-header">
            <h2>{editingCourse ? 'Edit Course' : 'Create New Course'}</h2>
            <button className="btn-close" onClick={resetForm}>
              <i className="fas fa-times"></i>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="course-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="title">Course Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  minLength={5}
                  maxLength={200}
                  placeholder="e.g., Introduction to Mathematics"
                />
                <small>{formData.title.length}/200 characters</small>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                required
                minLength={50}
                rows={6}
                placeholder="Provide a detailed description of your course..."
              />
              <small>{formData.description.length} characters (minimum 50)</small>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="subjectCategory">Subject Category *</label>
                <input
                  type="text"
                  id="subjectCategory"
                  name="subjectCategory"
                  value={formData.subjectCategory}
                  onChange={handleInputChange}
                  required
                  placeholder="e.g., Mathematics, Science, Languages"
                />
              </div>

              <div className="form-group">
                <label htmlFor="educationLevel">Education Level *</label>
                <select
                  id="educationLevel"
                  name="educationLevel"
                  value={formData.educationLevel}
                  onChange={handleInputChange}
                  required
                >
                  <option value="PRIMARY">Primary</option>
                  <option value="SECONDARY">Secondary</option>
                  <option value="UNIVERSITY">University</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="difficulty">Difficulty Level *</label>
                <select
                  id="difficulty"
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  required
                >
                  <option value="BEGINNER">Beginner</option>
                  <option value="INTERMEDIATE">Intermediate</option>
                  <option value="ADVANCED">Advanced</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="prerequisites">Prerequisites</label>
              <textarea
                id="prerequisites"
                name="prerequisites"
                value={formData.prerequisites}
                onChange={handleInputChange}
                rows={3}
                placeholder="List any prerequisites for this course (optional)"
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="pricingModel">Pricing Model *</label>
                <select
                  id="pricingModel"
                  name="pricingModel"
                  value={formData.pricingModel}
                  onChange={handleInputChange}
                  required
                >
                  <option value="FREE">Free</option>
                  <option value="ONE_TIME">One-time Payment</option>
                  <option value="SUBSCRIPTION">Subscription</option>
                </select>
              </div>

              {formData.pricingModel !== 'FREE' && (
                <div className="form-group">
                  <label htmlFor="price">Price ($) *</label>
                  <input
                    type="number"
                    id="price"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    min={0}
                    step={0.01}
                    required={formData.pricingModel !== 'FREE'}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="estimatedHours">Estimated Hours</label>
                <input
                  type="number"
                  id="estimatedHours"
                  name="estimatedHours"
                  value={formData.estimatedHours}
                  onChange={handleInputChange}
                  min={0}
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn-secondary" onClick={resetForm}>
                Cancel
              </button>
              <button type="submit" className="btn-primary" disabled={loading}>
                {loading ? 'Saving...' : editingCourse ? 'Update Course' : 'Create Course'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="courses-grid">
          {loading ? (
            <div className="loading">Loading courses...</div>
          ) : courses.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-book"></i>
              <h3>No Courses Yet</h3>
              <p>Create your first course to get started</p>
            </div>
          ) : (
            courses.map((course) => (
              <div key={course.id} className="course-card">
                <div className="course-image">
                  <img
                    src={course.thumbnailUrl || '/uploads/default-course.png'}
                    alt={course.title}
                  />
                  <span className={`course-status ${getStatusBadgeClass(course.status)}`}>
                    {course.status}
                  </span>
                </div>

                <div className="course-content">
                  <h3>{course.title}</h3>
                  <p className="course-description">
                    {course.description.substring(0, 100)}...
                  </p>

                  <div className="course-meta">
                    <span>
                      <i className="fas fa-book-open"></i> {course._count.lessons} Lessons
                    </span>
                    <span>
                      <i className="fas fa-question-circle"></i> {course._count.quizzes} Quizzes
                    </span>
                    <span>
                      <i className="fas fa-users"></i> {course._count.enrollments} Students
                    </span>
                  </div>

                  <div className="course-info">
                    <span className="difficulty">{course.difficulty}</span>
                    <span className="category">{course.subjectCategory}</span>
                  </div>
                </div>

                <div className="course-actions">
                  <button
                    className="btn-action"
                    onClick={() => navigate(`/tutor/course-editor/${course.id}`)}
                    title="Edit (Enhanced)"
                  >
                    <i className="fas fa-cog"></i>
                  </button>
                  <button
                    className="btn-action"
                    onClick={() => navigate(`/tutor/courses/${course.id}/lessons`)}
                    title="Manage Lessons"
                  >
                    <i className="fas fa-list"></i>
                  </button>
                  <button className="btn-action" onClick={() => handleEdit(course)} title="Edit (Simple)">
                    <i className="fas fa-edit"></i>
                  </button>
                  <button
                    className="btn-action"
                    onClick={() => handleTogglePublish(course.id, course.status)}
                    title={course.status === 'PUBLISHED' ? 'Unpublish' : 'Publish'}
                  >
                    <i
                      className={`fas fa-${course.status === 'PUBLISHED' ? 'eye-slash' : 'eye'}`}
                    ></i>
                  </button>
                  <button
                    className="btn-action btn-delete"
                    onClick={() => handleDelete(course.id)}
                    title="Delete"
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default CourseBuilder;
