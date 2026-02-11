import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import UserDetailModal from '../../components/Admin/UserDetailModal';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const UserManagement = () => {
  const { t } = useTranslation(['admin', 'common']);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [emailVerifiedFilter, setEmailVerifiedFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({});
  const [statistics, setStatistics] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [modalType, setModalType] = useState(''); // 'role', 'status', 'delete'
  const [reason, setReason] = useState('');
  const [newRole, setNewRole] = useState('');
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page, roleFilter, statusFilter, emailVerifiedFilter]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('auth-storage') || sessionStorage.getItem('auth-storage');
      let authToken = null;
      if (token) {
        try {
          const parsed = JSON.parse(token);
          authToken = parsed.state?.token || parsed.token;
        } catch (e) {
          console.error('Failed to parse auth token');
        }
      }

      const response = await axios.get(`${API_URL}/admin/users`, {
        params: {
          page,
          limit: 20,
          search,
          role: roleFilter,
          status: statusFilter,
          emailVerified: emailVerifiedFilter,
        },
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });

      if (response.data.success) {
        console.log('✅ API Response:', response.data);
        console.log('📊 Users returned:', response.data.users.length);
        console.log('📊 Total in DB:', response.data.pagination.total);
        console.log('🔍 Search params used:', { search, roleFilter, statusFilter, emailVerifiedFilter });
        setUsers(response.data.users);
        setPagination(response.data.pagination);
        setStatistics(response.data.statistics);
      } else {
        console.error('❌ API returned success: false');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      console.error('Error details:', error.response?.data);
      alert('Failed to fetch users: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setPage(1);
    fetchUsers();
  };

  const openModal = (user, type) => {
    setSelectedUser(user);
    setModalType(type);
    setReason('');
    if (type === 'role') setNewRole(user.role);
    if (type === 'status') setNewStatus(user.status);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedUser(null);
    setReason('');
  };

  const handleRoleChange = async () => {
    if (!reason || reason.trim().length < 10) {
      alert('Please provide a reason (minimum 10 characters)');
      return;
    }

    try {
      const token = localStorage.getItem('auth-storage') || sessionStorage.getItem('auth-storage');
      let authToken = null;
      if (token) {
        const parsed = JSON.parse(token);
        authToken = parsed.state?.token || parsed.token;
      }
      const response = await axios.put(`${API_URL}/admin/users/${selectedUser.id}/role`, {
        newRole,
        reason,
      }, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });

      if (response.data.success) {
        alert('User role updated successfully');
        closeModal();
        fetchUsers();
      }
    } catch (error) {
      console.error('Error changing role:', error);
      alert(error.response?.data?.message || 'Failed to change user role');
    }
  };

  const handleStatusChange = async () => {
    if ((newStatus === 'SUSPENDED' || newStatus === 'BANNED') && (!reason || reason.trim().length < 10)) {
      alert('Please provide a reason (minimum 10 characters)');
      return;
    }

    try {
      const token = localStorage.getItem('auth-storage') || sessionStorage.getItem('auth-storage');
      let authToken = null;
      if (token) {
        const parsed = JSON.parse(token);
        authToken = parsed.state?.token || parsed.token;
      }
      const response = await axios.put(`${API_URL}/admin/users/${selectedUser.id}/status`, {
        status: newStatus,
        reason,
      }, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });

      if (response.data.success) {
        alert('User status updated successfully');
        closeModal();
        fetchUsers();
      }
    } catch (error) {
      console.error('Error changing status:', error);
      alert(error.response?.data?.message || 'Failed to change user status');
    }
  };

  const handlePasswordReset = async (user) => {
    if (!confirm(`Send password reset email to ${user.email}?`)) return;

    try {
      const token = localStorage.getItem('auth-storage') || sessionStorage.getItem('auth-storage');
      let authToken = null;
      if (token) {
        const parsed = JSON.parse(token);
        authToken = parsed.state?.token || parsed.token;
      }
      const response = await axios.post(`${API_URL}/admin/users/${user.id}/reset-password`, {}, {
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });
      if (response.data.success) {
        alert('Password reset email sent successfully');
      }
    } catch (error) {
      console.error('Error sending password reset:', error);
      alert('Failed to send password reset');
    }
  };

  const handleDeleteUser = async () => {
    if (!reason || reason.trim().length < 10) {
      alert('Please provide a reason (minimum 10 characters)');
      return;
    }

    try {
      const token = localStorage.getItem('auth-storage') || sessionStorage.getItem('auth-storage');
      let authToken = null;
      if (token) {
        const parsed = JSON.parse(token);
        authToken = parsed.state?.token || parsed.token;
      }
      const response = await axios.delete(`${API_URL}/admin/users/${selectedUser.id}`, {
        data: { reason },
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
      });

      if (response.data.success) {
        alert('User deleted successfully');
        closeModal();
        fetchUsers();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const openDetailModal = (userId) => {
    setSelectedUserId(userId);
    setShowDetailModal(true);
  };

  const closeDetailModal = () => {
    setShowDetailModal(false);
    setSelectedUserId(null);
  };

  return (
    <div className="container">
      <h1>{t('admin:userManagement.title')}</h1>

      {/* Search and Filters */}
      <div className="card mt-lg">
        <form onSubmit={handleSearch}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr auto', gap: '1rem', alignItems: 'end' }}>
            <div>
              <label>{t('common:action.search')}</label>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t('admin:userManagement.searchPlaceholder')}
                className="input"
              />
            </div>
            <div>
              <label>{t('admin:userManagement.filters.role')}</label>
              <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="input">
                <option value="">{t('admin:userManagement.filters.allRoles')}</option>
                <option value="STUDENT">{t('common:role.student')}</option>
                <option value="TUTOR">{t('common:role.tutor')}</option>
                <option value="ADMIN">{t('common:role.admin')}</option>
              </select>
            </div>
            <div>
              <label>{t('admin:userManagement.filters.status')}</label>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="input">
                <option value="">{t('admin:userManagement.filters.allStatuses')}</option>
                <option value="ACTIVE">{t('common:status.active')}</option>
                <option value="SUSPENDED">{t('common:status.suspended')}</option>
                <option value="BANNED">{t('common:status.banned')}</option>
              </select>
            </div>

            <div>
              <label>{t('admin:userManagement.filters.emailVerified')}</label>
              <select value={emailVerifiedFilter} onChange={(e) => setEmailVerifiedFilter(e.target.value)} className="input">
                <option value="">All</option>
                <option value="true">Verified</option>
                <option value="false">Unverified</option>
              </select>
            </div>
            <button type="submit" className="btn btn-primary">{t('common:action.search')}</button>
          </div>
        </form>

        {/* Statistics */}
        {statistics && (
          <div style={{
            marginTop: '1rem',
            padding: '1rem',
            background: 'var(--color-surface)',
            borderRadius: '8px',
            border: '1px solid var(--color-border)'
          }}>
            <strong style={{ color: 'var(--color-text)', fontSize: '1.1rem' }}>
              {t('admin:userManagement.statistics.totalUsers')}: {statistics.totalUsers}
            </strong>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '0.5rem',
              marginTop: '0.5rem',
              fontSize: '0.9rem',
              color: 'var(--color-text-secondary)'
            }}>

              {statistics.emailVerified !== undefined && (
                <div style={{ color: 'var(--color-text-secondary)' }}>
                  {t('admin:userManagement.statistics.emailVerified')}: {statistics.emailVerified}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* User Table */}
      <div className="card mt-lg">
        {loading ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--color-text-secondary)'
          }}>
            <div style={{ marginBottom: '1rem' }}>Loading users...</div>
          </div>
        ) : users.length === 0 ? (
          <div style={{
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--color-text-secondary)'
          }}>
            <div style={{ fontSize: '1.1rem', marginBottom: '0.5rem', color: 'var(--color-text)' }}>
              No users found
            </div>
            <div>Try adjusting your search filters</div>
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>User</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Role</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Status</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Points</th>
                  <th style={{ padding: '0.75rem', textAlign: 'left' }}>Joined</th>
                  <th style={{ padding: '0.75rem', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #eee' }}>
                    <td style={{ padding: '0.75rem' }}>
                      <div>
                        <div style={{ fontWeight: '500' }}>
                          {user.firstName} {user.lastName}
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#666' }}>{user.email}</div>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge badge-${user.role === 'ADMIN' ? 'danger' : user.role === 'TUTOR' ? 'success' : 'primary'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span className={`badge badge-${user.status === 'ACTIVE' ? 'success' : user.status === 'SUSPENDED' ? 'warning' : 'danger'}`}>
                        {user.status}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>{user.totalPoints}</td>
                    <td style={{ padding: '0.75rem' }}>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                      <button onClick={() => openDetailModal(user.id)} className="btn btn-sm btn-secondary" style={{ marginRight: '0.5rem' }}>
                        {t('admin:userManagement.actions.viewDetails')}
                      </button>
                      <button onClick={() => openModal(user, 'role')} className="btn btn-sm btn-secondary" style={{ marginRight: '0.5rem' }}>
                        {t('admin:userManagement.actions.changeRole')}
                      </button>
                      <button onClick={() => openModal(user, 'status')} className="btn btn-sm btn-secondary" style={{ marginRight: '0.5rem' }}>
                        {t('admin:userManagement.actions.changeStatus')}
                      </button>
                      <button onClick={() => handlePasswordReset(user)} className="btn btn-sm btn-secondary" style={{ marginRight: '0.5rem' }}>
                        {t('admin:userManagement.actions.resetPassword')}
                      </button>
                      <button onClick={() => openModal(user, 'delete')} className="btn btn-sm btn-danger">
                        {t('admin:userManagement.actions.delete')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
                <button
                  onClick={() => setPage(page - 1)}
                  disabled={page === 1}
                  className="btn btn-secondary"
                >
                  Previous
                </button>
                <span style={{ padding: '0.5rem 1rem' }}>
                  Page {page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => setPage(page + 1)}
                  disabled={page === pagination.totalPages}
                  className="btn btn-secondary"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <div className="card" style={{ minWidth: '500px', maxWidth: '600px' }}>
            <h3>
              {modalType === 'role' && 'Change User Role'}
              {modalType === 'status' && 'Change User Status'}
              {modalType === 'delete' && 'Delete User'}
            </h3>
            {selectedUser && (
              <div style={{
                marginBottom: '1rem',
                padding: '0.75rem',
                backgroundColor: 'var(--color-surface)',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--color-border)'
              }}>
                <strong style={{ color: 'var(--color-text)', display: 'block' }}>
                  {selectedUser.firstName} {selectedUser.lastName}
                </strong>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-secondary)' }}>
                  {selectedUser.email}
                </div>
              </div>
            )}

            {modalType === 'role' && (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label>New Role</label>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="input">
                    <option value="STUDENT">Student</option>
                    <option value="TUTOR">Tutor</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label>Reason (required, min 10 characters)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="input"
                    rows="3"
                    placeholder="Explain why this role change is necessary..."
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button onClick={closeModal} className="btn btn-secondary">Cancel</button>
                  <button onClick={handleRoleChange} className="btn btn-primary">Change Role</button>
                </div>
              </div>
            )}

            {modalType === 'status' && (
              <div>
                <div style={{ marginBottom: '1rem' }}>
                  <label>New Status</label>
                  <select value={newStatus} onChange={(e) => setNewStatus(e.target.value)} className="input">
                    <option value="ACTIVE">Active</option>
                    <option value="SUSPENDED">Suspended</option>
                    <option value="BANNED">Banned</option>
                  </select>
                </div>
                <div style={{ marginBottom: '1rem' }}>
                  <label>Reason {(newStatus === 'SUSPENDED' || newStatus === 'BANNED') && '(required, min 10 characters)'}</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="input"
                    rows="3"
                    placeholder="Explain why this status change is necessary..."
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button onClick={closeModal} className="btn btn-secondary">Cancel</button>
                  <button onClick={handleStatusChange} className="btn btn-primary">Change Status</button>
                </div>
              </div>
            )}

            {modalType === 'delete' && (
              <div>
                <p style={{ color: '#dc3545', marginBottom: '1rem' }}>
                  ⚠️ This action will soft-delete the user. This action is logged in the audit trail.
                </p>
                <div style={{ marginBottom: '1rem' }}>
                  <label>Reason (required, min 10 characters)</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="input"
                    rows="3"
                    placeholder="Explain why this user is being deleted..."
                  />
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                  <button onClick={closeModal} className="btn btn-secondary">Cancel</button>
                  <button onClick={handleDeleteUser} className="btn btn-danger">Delete User</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      {showDetailModal && (
        <UserDetailModal
          userId={selectedUserId}
          onClose={closeDetailModal}
        />
      )}
    </div>
  );
};

export default UserManagement;
