import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useTranslation } from 'react-i18next';

const PlatformAnalytics = () => {
  const { t } = useTranslation('dashboard');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await api.get('/admin/detailed-analytics');
      if (response.data.success) {
        setData(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', marginTop: '10%' }}>
        <div className="loader">Loading Analytics...</div>
      </div>
    );
  }

  const { userGrowth, topCourses } = data || {};

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Platform Analytics</h1>
      </div>

      <p className="text-secondary" style={{ marginBottom: '2rem' }}>
        In-depth insights into user growth and course popularity.
      </p>

      {/* KPI Row */}
      <div className="grid grid-cols-3" style={{ gap: '1.5rem', marginBottom: '2rem' }}>
        <div className="card" style={{
          background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
          color: 'white',
          border: 'none',
          boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.2)'
        }}>
          <p style={{ opacity: 0.9, fontSize: '0.9rem', fontWeight: '500' }}>New Registrations (This Month)</p>
          <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0' }}>{userGrowth?.newRegistrationsThisMonth}</h2>
          <div style={{ fontSize: '0.8rem', background: 'rgba(255,255,255,0.2)', padding: '0.2rem 0.5rem', borderRadius: '4px', display: 'inline-block' }}>
            Current Month Growth
          </div>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #10b981' }}>
          <p className="text-secondary" style={{ fontSize: '0.9rem', fontWeight: '500' }}>Student Count</p>
          <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0', color: '#10b981' }}>{userGrowth?.totalStudents}</h2>
          <p className="text-secondary" style={{ fontSize: '0.8rem' }}>Authenticated learners</p>
        </div>

        <div className="card" style={{ borderLeft: '4px solid #8b5cf6' }}>
          <p className="text-secondary" style={{ fontSize: '0.9rem', fontWeight: '500' }}>Tutor Count</p>
          <h2 style={{ fontSize: '2.5rem', margin: '0.5rem 0', color: '#8b5cf6' }}>{userGrowth?.totalTutors}</h2>
          <p className="text-secondary" style={{ fontSize: '0.8rem' }}>Verified experts</p>
        </div>
      </div>

      <div className="grid grid-cols-2" style={{ gap: '2rem' }}>
        {/* Distribution Section */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>User Distribution</h3>
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Students</span>
              <span>{userGrowth?.totalStudents} Users</span>
            </div>
            <div style={{ height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `${(userGrowth?.totalStudents / (userGrowth?.totalStudents + userGrowth?.totalTutors || 1)) * 100}%`,
                height: '100%',
                background: '#10b981'
              }}></div>
            </div>
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>Tutors</span>
              <span>{userGrowth?.totalTutors} Users</span>
            </div>
            <div style={{ height: '12px', background: '#f1f5f9', borderRadius: '6px', overflow: 'hidden' }}>
              <div style={{
                width: `${(userGrowth?.totalTutors / (userGrowth?.totalStudents + userGrowth?.totalTutors || 1)) * 100}%`,
                height: '100%',
                background: '#8b5cf6'
              }}></div>
            </div>
          </div>

          <div className="card" style={{ background: 'rgba(255, 255, 255, 0.05)', border: '1px dashed rgba(255, 255, 255, 0.1)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p className="text-secondary" style={{ fontSize: '0.8rem', margin: 0 }}>Student to Tutor Ratio</p>
                <h4 style={{ margin: 0, fontSize: '1.2rem' }}>{userGrowth?.studentTutorRatio}:1</h4>
              </div>
              <div style={{ fontSize: '1.5rem' }}>📊</div>
            </div>
          </div>
        </div>

        {/* Top Courses Section */}
        <div className="card">
          <h3 style={{ marginBottom: '1.5rem' }}>Top 5 Performing Courses</h3>
          <div className="table-responsive">
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #f1f5f9', textAlign: 'left' }}>
                  <th style={{ padding: '0.75rem 0.5rem', color: '#64748b' }}>Course Title</th>
                  <th style={{ padding: '0.75rem 0.5rem', color: '#64748b', textAlign: 'center' }}>Enrollments</th>
                </tr>
              </thead>
              <tbody>
                {topCourses?.map((course, index) => (
                  <tr key={course.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '1rem 0.5rem' }}>
                      <div style={{ fontWeight: '600' }}>{course.title}</div>
                      <div style={{ fontSize: '0.75rem', color: '#64748b' }}>by {course.tutorName}</div>
                    </td>
                    <td style={{ padding: '1rem 0.5rem', textAlign: 'center' }}>
                      <span style={{
                        background: index === 0 ? '#dcfce7' : '#f1f5f9',
                        color: index === 0 ? '#166534' : '#64748b',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '20px',
                        fontWeight: '700',
                        fontSize: '0.9rem'
                      }}>
                        {course.enrollments}
                      </span>
                    </td>
                  </tr>
                ))}
                {(!topCourses || topCourses.length === 0) && (
                  <tr>
                    <td colSpan="2" style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>
                      No enrollment data available yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformAnalytics;
