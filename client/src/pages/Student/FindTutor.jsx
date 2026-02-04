import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaSearch, FaChalkboardTeacher, FaStar, FaCalendarCheck, FaGraduationCap } from 'react-icons/fa';
import { searchTutors } from '../../api/bookings';
import TutorContactModal from '../../components/Student/TutorContactModal';
import BookingModal from '../../components/Student/BookingModal';
import './FindTutor.css';

const FindTutor = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    subject: '',
    onlyAvailable: false
  });
  const [sortBy, setSortBy] = useState('rating'); // rating, sessions, name
  const [selectedTutor, setSelectedTutor] = useState(null);
  const [bookingTutor, setBookingTutor] = useState(null);
  const [tutors, setTutors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const FEATURE_ENABLED = true;

  // Popular subjects for quick selection
  const popularSubjects = [
    'Mathematics', 'Physics', 'Chemistry', 'Biology',
    'English', 'Computer Science', 'Economics', 'Accounting'
  ];

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const params = {
        name: searchQuery,
        subject: filters.subject,
        available: filters.onlyAvailable || undefined
      };

      // Filter out empty/undefined values
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined)
      );

      console.log('Searching tutors with params:', filteredParams);
      const response = await searchTutors(filteredParams);
      console.log('Tutors response:', response);

      let fetchedTutors = response.data || [];

      // Apply client-side sorting
      fetchedTutors = sortTutors(fetchedTutors, sortBy);

      setTutors(fetchedTutors);
    } catch (err) {
      setError('Failed to fetch tutors. Please try again.');
      console.error('Search Tutors Error:', err);
      console.error('Error details:', err.response?.data);
    } finally {
      setLoading(false);
    }
  };

  const sortTutors = (tutorList, sortType) => {
    const sorted = [...tutorList];
    switch (sortType) {
      case 'rating':
        return sorted.sort((a, b) => {
          const ratingA = parseFloat(a.averageRating) || 0;
          const ratingB = parseFloat(b.averageRating) || 0;
          return ratingB - ratingA; // Highest rating first
        });
      case 'sessions':
        return sorted.sort((a, b) => (b.totalSessions || 0) - (a.totalSessions || 0));
      case 'name':
        return sorted.sort((a, b) => {
          const nameA = `${a.user.firstName} ${a.user.lastName}`.toLowerCase();
          const nameB = `${b.user.firstName} ${b.user.lastName}`.toLowerCase();
          return nameA.localeCompare(nameB);
        });
      default:
        return sorted;
    }
  };

  // Fetch all tutors on initial load
  useEffect(() => {
    handleSearch({ preventDefault: () => { } });
  }, []);

  // Re-sort when sortBy changes
  useEffect(() => {
    if (tutors.length > 0) {
      setTutors(prevTutors => sortTutors(prevTutors, sortBy));
    }
  }, [sortBy]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setFilters({ subject: '', onlyAvailable: false });
    setSortBy('rating');
  };

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
            {/* Search by Name */}
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

            {/* Subject Expertise Filter */}
            <div className="filter-group">
              <label><FaGraduationCap className="label-icon" /> Subject Expertise</label>
              <select
                name="subject"
                value={filters.subject}
                onChange={(e) => setFilters({ ...filters, subject: e.target.value })}
                className="filter-select"
              >
                <option value="">All Subjects</option>
                {popularSubjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
                <option value="other">Other</option>
              </select>
            </div>


            {/* Availability Check */}
            <div className="filter-group filter-checkbox">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={filters.onlyAvailable}
                  onChange={(e) => setFilters({ ...filters, onlyAvailable: e.target.checked })}
                />
                <span className="checkbox-text">
                  <FaCalendarCheck className="checkbox-icon" /> Only show available tutors
                </span>
              </label>
            </div>

            {/* Sort By */}
            <div className="filter-group">
              <label>Sort By</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="filter-select"
              >
                <option value="rating">Rating (High to Low)</option>
                <option value="sessions">Total Sessions</option>
                <option value="name">Name (A-Z)</option>
              </select>
            </div>

            <button type="submit" className="btn-search" disabled={!FEATURE_ENABLED}>
              <FaSearch /> {FEATURE_ENABLED ? 'Search Tutors' : 'Coming Soon'}
            </button>

            {(searchQuery || filters.subject || filters.onlyAvailable) && (
              <button type="button" onClick={handleClearFilters} className="btn-clear-filters-sidebar">
                Clear All Filters
              </button>
            )}
          </form>
        </aside>

        <main className="tutors-results">
          {/* Results Summary */}
          {!loading && tutors.length > 0 && (
            <div className="results-summary">
              <p>Found <strong>{tutors.length}</strong> tutor{tutors.length !== 1 ? 's' : ''}</p>
            </div>
          )}

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
                        <span className="sessions-count">• {tutor.totalSessions || 0} sessions</span>
                      </div>
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
              <button onClick={handleClearFilters} className="btn-clear-filters">
                Clear Filters
              </button>
            </div>
          )}
        </main>
      </div>

      {selectedTutor && (
        <TutorContactModal
          tutor={selectedTutor}
          onClose={() => setSelectedTutor(null)}
        />
      )}

      {bookingTutor && (
        <BookingModal
          tutor={bookingTutor}
          onClose={() => setBookingTutor(null)}
        />
      )}
    </div>
  );
};

export default FindTutor;
