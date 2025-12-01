import React from 'react';
import { useAuthStore } from '../../store/authStore';

const AdminDashboard = () => {
  const { user } = useAuthStore();

  return (
    <div className="container">
      <h1>Admin Dashboard</h1>
      <p>Welcome, {user?.firstName}!</p>
      <div className="grid grid-cols-3 mt-lg">
        <div className="card">
          <h3>Users</h3>
          <p className="text-secondary">Manage platform users</p>
        </div>
        <div className="card">
          <h3>Pending Courses</h3>
          <p className="text-secondary">Review and approve courses</p>
        </div>
        <div className="card">
          <h3>Analytics</h3>
          <p className="text-secondary">Platform metrics</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
