import React from 'react';
import { useAuthStore } from '../../store/authStore';

const TutorDashboard = () => {
  const { user } = useAuthStore();

  return (
    <div className="container">
      <h1>Tutor Dashboard</h1>
      <p>Welcome, {user?.firstName}!</p>
      <div className="grid grid-cols-3 mt-lg">
        <div className="card">
          <h3>My Courses</h3>
          <p className="text-secondary">Manage your courses</p>
        </div>
        <div className="card">
          <h3>Students</h3>
          <p className="text-secondary">Track student progress</p>
        </div>
        <div className="card">
          <h3>Earnings</h3>
          <p className="text-secondary">View your revenue</p>
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;
