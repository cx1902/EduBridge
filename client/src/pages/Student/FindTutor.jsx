import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaSearch, FaChalkboardTeacher, FaStar } from 'react-icons/fa';
import { searchTutors } from '../../api/bookings';
import TutorContactModal from '../../components/Student/TutorContactModal';
import BookingModal from '../../components/Student/BookingModal';
import { useAuthStore } from '../../store/authStore';
import './FindTutor.css';

const FindTutor = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    subject: '',
    level: '',
    maxPrice: ''
  });
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [bookingTutor, setBookingTutor] = useState(null); // New
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Feature is now enabled!
  const FEATURE_ENABLED = true;

  const handleSearch = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const params = {
        name: searchQuery,
        subject: filters.subject,
        level: filters.level,
        maxPrice: filters.maxPrice
      };
      // Filter out empty string values from params
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== '' && value !== null)
      );
      const response = await searchTutors(filteredParams);
      setTutors(response.data);
    } catch (err) {
      setError('Failed to fetch tutors. Please try again.');
      console.error('Search Tutors Error:', err);
    } finally {
      setLoading(false);
    }
  };

  // This useEffect seems to be for initial fetch or filter changes,
  // but the existing handleSearch is triggered by form submission.
  // If you intend to fetch on filter change, you might want to call handleSearch
  // or a dedicated fetch function here. For now, I'll keep it as is,
  // assuming `fetchTutors` is a placeholder or will be defined.
  // If `fetchTutors` is not defined, this will cause an error.
  // Given the context, it's likely `handleSearch` should be called here.
  // For now, I'll comment it out to avoid introducing an undefined function.
  // useEffect(() => {
  //   fetchTutors();
  // }, [filters]);

  return (
    <div className="find-tutor-page">
      <div className="find-tutor-header">
        <button className="btn-back-tutor" onClick={() => navigate('/student')}>
          <FaArrowLeft /> Back
        </button>
        <h1><FaChalkboardTeacher /> Find a Tutor</h1>
        <p>Browse our qualified tutors and book 1-on-1 sessions</p>
      </div>

      <div className="find-tutor-container">
        <aside className="filters-sidebar">
          <h3>Search Filters</h3>
          <form onSubmit={handleSearch}>
            <div className="filter-group">
              <label>Search by Name</label>
              <input
                type="text"
                placeholder="e.g. John Doe"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Subject</label>
              <input
                type="text"
                name="subject"
                placeholder="e.g. Mathematics"
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Level</label>
              <select
                name="level"
                value={filters.level}
                onChange={(e) => setFilters({ ...filters, level: e.target.value })}
                className="filter-select"
              >
                <option value="">All Levels</option>
                <option value="PRIMARY">Primary</option>
                <option value="SECONDARY">Secondary</option>
                <option value="UNIVERSITY">University</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Max Hourly Rate ($)</label>
              <input
                type="number"
                name="maxPrice"
                placeholder="e.g. 50"
                value={filters.maxPrice}
                onChange={(e) => setFilters({ ...filters, maxPrice: e.target.value })}
                className="filter-input"
              />
            </div>

            <button type="submit" className="btn-search" disabled={!FEATURE_ENABLED}>
              <FaSearch /> {FEATURE_ENABLED ? 'Search Tutors' : 'Coming Soon'}
            </button>
          </form>
        </aside>

        <main className="tutors-grid">
          {loading ? (
            <div className="loading">
              <div className="spinner"></div>
              <p>Searching for tutors...</p>
            </div>
          ) : error ? (
            <div className="error">
              <i className="fas fa-exclamation-circle"></i>
              <p>{error}</p>
              <button onClick={handleSearch} className="btn-retry">Try Again</button>
            </div>
          ) : tutors.length > 0 ? (
            <div className="tutors-grid">
              {tutors.map(tutor => (
                <div key={tutor.id} className="tutor-card">
                  <div className="tutor-header">
                    <div className="tutor-avatar">
                      {tutor.user.profilePictureUrl ? (
                        <img src={tutor.user.profilePictureUrl} alt={tutor.user.firstName} />
                      ) : (
                        <div className="avatar-placeholder">
                          {tutor.user.firstName.charAt(0)}{tutor.user.lastName.charAt(0)}
                        </div>
                      )}
                    </div>
                    <div className="tutor-info">
                      <h3>{tutor.user.firstName} {tutor.user.lastName}</h3>
                      <div className="rating">
                        <FaStar className="star-icon" />
                        <span>{tutor.averageRating ? parseFloat(tutor.averageRating).toFixed(1) : 'New'}</span>
                      </div>
                    </div>
                    <div className="tutor-rate">
                      ${tutor.hourlyRate || 0}/hr
                    </div>
                  </div>

                  <div className="tutor-bio">
                    <p>{tutor.bio || 'No bio available.'}</p>
                  </div>

                  <div className="tutor-subjects">
                    {tutor.tutorSubjects && tutor.tutorSubjects.length > 0 ? (
                      tutor.tutorSubjects.slice(0, 3).map((ts, index) => (
                        <span key={index} className="subject-tag">
                          {ts.subject?.name || 'Subject'}
                        </span>
                      ))
                    ) : (
                      <span className="subject-tag">General Tutoring</span>
                    )}
                  </div>

                  <div className="tutor-actions">
                    <button
                      className="btn-secondary"
                      onClick={() => setSelectedTutor(tutor)}
                    >
                      View Profile
                    </button>
                    <button className="btn-primary" onClick={() => setBookingTutor(tutor)}>
                      Book Session
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-results">
              <FaSearch className="empty-icon" />
              <h3>No tutors found</h3>
              <p>Try adjusting your search filters or browse all tutors</p>
              <button onClick={() => {
                setSearchQuery('');
                setFilters({ subject: '', level: '', maxPrice: '' });
                handleSearch({ preventDefault: () => { } });
              }} className="btn-clear-filters">
                Clear Filters
              </button>
            </div>
          )}
        </main>
      </div>

      {
        selectedTutor && (
          <TutorContactModal
            tutor={selectedTutor}
            onClose={() => setSelectedTutor(null)}
          />
        )
      }

      {
        bookingTutor && (
          <BookingModal
            tutor={bookingTutor}
            onClose={() => setBookingTutor(null)}
          />
        )
      }
    </div>
  );
};

export default FindTutor;
