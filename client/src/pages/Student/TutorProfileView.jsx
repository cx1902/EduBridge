import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTutorById } from '../../api/tutors';
import './TutorProfileView.css';

const TutorProfileView = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: tutor, isLoading, error } = useQuery({
    queryKey: ['tutorProfile', id],
    queryFn: () => getTutorById(id),
    enabled: !!id
  });

  if (isLoading) return <div className="loading-spinner">Loading profile...</div>;
  if (error) return <div className="error-message">Error loading profile: {error.message}</div>;
  if (!tutor) return <div className="error-message">Tutor not found</div>;

  const { user, hourlyRate, bio, languages, levelsSupported, stats } = tutor.data;

  const handleBookNow = () => {
    // Navigate to Request Tutor page with this tutor pre-selected
    navigate(`/student/tutoring/request?tutorId=${user.id}`);
  };

  return (
    <div className="tutor-profile-view">
      <div className="profile-header-card">
        <div className="profile-main-info">
          <img
            src={user.profilePictureUrl || '/default-avatar.png'}
            alt={`${user.firstName} ${user.lastName}`}
            className="profile-avatar"
          />
          <div className="profile-names">
            <h1>{user.firstName} {user.lastName}</h1>
            <p className="location"><i className="fas fa-map-marker-alt"></i> Online Tutor</p>
            <div className="rating-row">
              <span className="stars">
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star"></i>
                <i className="fas fa-star-half-alt"></i>
              </span>
              <span className="rating-val">4.8</span>
              <span className="reviews">(24 reviews)</span>
            </div>
          </div>
        </div>
        <div className="profile-actions">
          <div className="rate-box">
            <span className="rate-label">Hourly Rate</span>
            <span className="rate-value">${hourlyRate}</span>
          </div>
          <button className="btn-book-now" onClick={handleBookNow}>
            Book a Session
          </button>

        </div>
      </div>

      <div className="profile-content-grid">
        <div className="main-content">
          <section className="profile-section">
            <h2>About Me</h2>
            <p className="bio-text">{bio || 'No biography provided.'}</p>
          </section>

          <section className="profile-section">
            <h2>Subjects & Skills</h2>
            <div className="skills-list">
              {user.tutorSubjects?.map(ts => (
                <div key={ts.subject.id} className="skill-item">
                  <span className="skill-name">{ts.subject.name}</span>
                  <span className={`skill-level ${ts.skillLevel.toLowerCase()}`}>{ts.skillLevel}</span>
                </div>
              ))}
            </div>
          </section>

          <section className="profile-section">
            <h2>Reviews</h2>
            <div className="reviews-list">
              {/* Placeholder for reviews since API might not return them fully populated yet */}
              <p className="text-muted">Reviews coming soon...</p>
            </div>
          </section>
        </div>

        <aside className="sidebar-content">
          <div className="sidebar-card">
            <h3>Information</h3>
            <ul className="info-list">
              <li>
                <i className="fas fa-user-graduate"></i>
                <span>{stats?.totalStudents || 0} Students Taught</span>
              </li>
              <li>
                <i className="fas fa-book"></i>
                <span>{stats?.courseCount || 0} Courses</span>
              </li>
              <li>
                <i className="fas fa-globe"></i>
                <span>{languages.join(', ') || 'English'}</span>
              </li>
              <li>
                <i className="fas fa-layer-group"></i>
                <span>{levelsSupported.join(', ')}</span>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default TutorProfileView;
