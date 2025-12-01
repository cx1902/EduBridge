import React from 'react';
import { useAuthStore } from '../../store/authStore';

const StudentDashboard = () => {
  const { user } = useAuthStore();

  return (
    <div className="container">
      <h1>Welcome back, {user?.firstName}!</h1>
      <div className="grid grid-cols-3 mt-lg">
        <div className="card">
          <h3>My Courses</h3>
          <p className="text-secondary">Continue your learning journey</p>
          <div className="mt-md">
            <p className="text-muted">No courses enrolled yet</p>
          </div>
        </div>
        <div className="card">
          <h3>Progress</h3>
          <p className="text-secondary">Track your achievements</p>
          <div className="mt-md">
            <p>Points: {user?.totalPoints || 0}</p>
            <p>Streak: {user?.currentStreak || 0} days</p>
          </div>
        </div>
        <div className="card">
          <h3>Upcoming Sessions</h3>
          <p className="text-secondary">Your scheduled tutoring</p>
          <div className="mt-md">
            <p className="text-muted">No upcoming sessions</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
