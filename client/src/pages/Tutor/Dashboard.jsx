import React from 'react';
import { useAuthStore } from '../../store/authStore';
import ScheduleSessionCard from '../../components/Tutor/ScheduleSessionCard';
import TodaySchedulePanel from '../../components/Tutor/TodaySchedulePanel';

const TutorDashboard = () => {
  const { user } = useAuthStore();

  return (
    <div className="container">
      <div className="dashboard-header">
        <h1>Tutor Dashboard</h1>
        <p>Welcome back, {user?.firstName}!</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 mt-lg gap-md">
        <div className="card">
          <h4>Active Courses</h4>
          <p className="stat-number">0</p>
          <p className="text-secondary">Published courses</p>
        </div>
        <div className="card">
          <h4>Total Students</h4>
          <p className="stat-number">0</p>
          <p className="text-secondary">Across all courses</p>
        </div>
        <div className="card">
          <h4>Today's Sessions</h4>
          <p className="stat-number">0</p>
          <p className="text-secondary">Scheduled for today</p>
        </div>
        <div className="card">
          <h4>This Month Revenue</h4>
          <p className="stat-number">$0</p>
          <p className="text-secondary">Completed payments</p>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="dashboard-grid mt-lg">
        {/* Left Column - Schedule Session */}
        <div className="dashboard-main">
          <ScheduleSessionCard />
        </div>

        {/* Right Column - Today's Schedule */}
        <div className="dashboard-sidebar">
          <TodaySchedulePanel />
        </div>
      </div>

      {/* Additional Cards */}
      <div className="grid grid-cols-3 mt-lg gap-md">
        <div className="card">
          <h3>My Courses</h3>
          <p className="text-secondary">Manage and edit your courses</p>
          <button className="btn btn-link mt-md">View All Courses →</button>
        </div>
        <div className="card">
          <h3>Student Engagement</h3>
          <p className="text-secondary">Track student progress</p>
          <button className="btn btn-link mt-md">View Analytics →</button>
        </div>
        <div className="card">
          <h3>Session Statistics</h3>
          <p className="text-secondary">Session completion & ratings</p>
          <button className="btn btn-link mt-md">View Reports →</button>
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;
