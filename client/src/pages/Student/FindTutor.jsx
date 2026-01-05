import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchTutors } from '../../api/tutors';
import { Link, useNavigate } from 'react-router-dom';
import './FindTutor.css';

const FindTutor = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({
    subject: '',
    level: '',
    maxPrice: '',
    name: ''
  });

  const { data: results, isLoading, error, refetch } = useQuery({
    queryKey: ['searchTutors', filters],
    queryFn: () => searchTutors(filters),
    enabled: true // Fetch on mount and when filters change? Or wait for button?
    // Let's fetch on mount and debounce or button. For now, button.
    // Actually, user expects instant search or "Apply".
    // I'll leave enabled=true so it updates as they type/select (with debounce ideal, but simple is fine).
  });

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = (e) => {
    e.preventDefault();
    refetch();
  };

  return (
    <div className="find-tutor-container">
      <div className="search-header">
        <h1>Find a Tutor</h1>
        <p>Browse our qualified tutors and find the perfect match for your learning goals.</p>
      </div>

      <div className="search-layout">
        <aside className="filters-sidebar">
          <form onSubmit={handleSearch}>
            <div className="filter-group">
              <label>Search by Name</label>
              <input
                type="text"
                name="name"
                value={filters.name}
                onChange={handleFilterChange}
                placeholder="e.g. John Doe"
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Subject</label>
              <input
                type="text"
                name="subject"
                value={filters.subject}
                onChange={handleFilterChange}
                placeholder="e.g. Mathematics"
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Level</label>
              <select
                name="level"
                value={filters.level}
                onChange={handleFilterChange}
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
                value={filters.maxPrice}
                onChange={handleFilterChange}
                placeholder="e.g. 50"
                className="filter-input"
              />
            </div>

            <button type="submit" className="btn-search">
              Apply Filters
            </button>
          </form>
        </aside>

        <main className="results-grid">
          {isLoading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Finding tutors...</p>
            </div>
          ) : error ? (
            <div className="error-state">
              <p>Failed to load tutors. Please try again.</p>
            </div>
          ) : results?.data?.length > 0 ? (
            results.data.map(tutor => (
              <div key={tutor.id} className="tutor-card">
                <div className="tutor-card-header">
                  <img 
                    src={tutor.user.profilePictureUrl || '/default-avatar.png'} 
                    alt={`${tutor.user.firstName}`} 
                    className="tutor-avatar-large"
                  />
                  <div className="tutor-header-info">
                    <h3>{tutor.user.firstName} {tutor.user.lastName}</h3>
                    <div className="rating-badge">
                      <i className="fas fa-star"></i>
                      <span>{tutor.averageRating?.toFixed(1) || 'New'}</span>
                      <span className="review-count">({tutor.reviewCount} reviews)</span>
                    </div>
                  </div>
                  <div className="price-tag">
                    ${tutor.hourlyRate}/hr
                  </div>
                </div>

                <div className="tutor-bio">
                  <p>{tutor.bio ? (tutor.bio.length > 100 ? tutor.bio.substring(0, 100) + '...' : tutor.bio) : 'No bio available.'}</p>
                </div>

                <div className="tutor-tags">
                  {tutor.user.tutorSubjects?.slice(0, 3).map(ts => (
                    <span key={ts.subject.id} className="tag subject-tag">
                      {ts.subject.name}
                    </span>
                  ))}
                </div>

                <div className="tutor-actions">
                  <Link to={`/tutors/${tutor.user.id}`} className="btn-view-profile">
                    View Profile
                  </Link>
                </div>
              </div>
            ))
          ) : (
            <div className="no-results">
              <i className="fas fa-search"></i>
              <p>No tutors found matching your criteria.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default FindTutor;
