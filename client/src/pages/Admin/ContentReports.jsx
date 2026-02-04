import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import './ContentReports.css';

const ContentReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('NEW');
    const [selectedReport, setSelectedReport] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [newStatus, setNewStatus] = useState('');
    const [action, setAction] = useState('DISMISS');

    useEffect(() => {
        fetchReports();
    }, [filter]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/reports', {
                params: { status: filter !== 'ALL' ? filter : undefined }
            });
            setReports(response.data.reports || []);
        } catch (error) {
            console.error('Error fetching reports:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateStatus = async () => {
        if (!action) {
            alert('Please select an action');
            return;
        }

        if (adminNotes.trim().length < 10) {
            alert('Resolution notes must be at least 10 characters');
            return;
        }

        try {
            await api.put(`/admin/reports/${selectedReport.id}/resolve`, {
                action: action,
                resolution: adminNotes
            });
            alert('Report updated successfully');
            setSelectedReport(null);
            setAdminNotes('');
            setAction('DISMISS');
            fetchReports();
        } catch (error) {
            console.error('Error updating report:', error);
            alert(error.response?.data?.message || 'Failed to update report');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            NEW: '#ef4444', // Red
            UNDER_REVIEW: '#3b82f6', // Blue
            RESOLVED: '#10b981', // Green
            DISMISSED: '#6b7280' // Gray
        };
        const labels = {
            NEW: 'New',
            UNDER_REVIEW: 'Under Review',
            RESOLVED: 'Resolved',
            DISMISSED: 'Dismissed'
        };
        return (
            <span style={{
                backgroundColor: colors[status] || '#6b7280',
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                fontWeight: '600',
                height: 'fit-content',
                alignSelf: 'flex-start'
            }}>
                {labels[status] || status}
            </span>
        );
    };

    return (
        <div className="container">
            <h1>Content Reports</h1>
            <p>Review user-submitted content reports</p>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1rem' }}>
                <div className="report-filters">
                    {['NEW', 'UNDER_REVIEW', 'RESOLVED', 'DISMISSED', 'ALL'].map(status => (
                        <button
                            key={status}
                            className={`btn ${filter === status ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setFilter(status)}
                        >
                            {status === 'ALL' ? 'All' : status.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Reports List */}
            {loading ? (
                <div className="card"><p>Loading...</p></div>
            ) : reports.length === 0 ? (
                <div className="card"><p>No reports found</p></div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {reports.map((report) => (
                        <div key={report.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>
                                        {report.reportedItemType} Report
                                    </h3>
                                    <p style={{ color: '#6b7280', margin: '0.25rem 0' }}>
                                        Reported by: {report.reporter?.firstName} {report.reporter?.lastName}
                                    </p>
                                    <p style={{ color: '#6b7280', fontSize: '0.875rem' }}>
                                        {new Date(report.createdAt).toLocaleString()}
                                    </p>
                                </div>
                                {getStatusBadge(report.status)}
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Category:</strong> {report.category}
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <strong>Description:</strong>
                                <p>{report.description}</p>
                            </div>

                            {report.evidenceUrls && report.evidenceUrls.length > 0 && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <strong>Evidence:</strong>
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                                        {JSON.parse(typeof report.evidenceUrls === 'string' ? report.evidenceUrls : JSON.stringify(report.evidenceUrls)).map((url, idx) => (
                                            <img
                                                key={idx}
                                                src={url}
                                                alt={`Evidence ${idx + 1}`}
                                                style={{ width: '150px', height: '150px', objectFit: 'cover', borderRadius: '0.5rem' }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(report.status === 'NEW' || report.status === 'UNDER_REVIEW') && (
                                <div className="report-item-actions">
                                    <button
                                        className="btn btn-primary"
                                        onClick={() => {
                                            setSelectedReport(report);
                                            setAdminNotes(report.resolution || '');
                                            setAction(report.status === 'NEW' ? 'DISMISS' : 'RESOLVED');
                                        }}
                                    >
                                        Take Action
                                    </button>
                                </div>
                            )}

                            {report.resolution && (
                                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
                                    <div style={{ color: '#1f2937', fontWeight: '600', marginBottom: '0.5rem' }}>
                                        Resolution {report.resolvedAt && `(${new Date(report.resolvedAt).toLocaleString()})`}:
                                    </div>
                                    <p style={{ color: '#4b5563', margin: 0 }}>{report.resolution}</p>
                                    {report.resolver && (
                                        <div style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.5rem' }}>
                                            Handled by: {report.resolver.firstName} {report.resolver.lastName}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Update Modal */}
            {selectedReport && (
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
                    zIndex: 1000
                }}>
                    <div className="card" style={{ width: '500px', maxWidth: '90%' }}>
                        <h3>Take Action on Report</h3>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Action:</label>
                            <select
                                className="form-control"
                                value={action}
                                onChange={(e) => setAction(e.target.value)}
                            >
                                <option value="DISMISS">Dismiss (Spam/No evidence)</option>
                                <option value="REQUIRE_EDIT">Require Edit (Notify User)</option>
                                <option value="HIDE_CONTENT">Hide Content (Sensitive/Violating)</option>
                                <option value="WARN_USER">Warn User (Violation)</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', marginBottom: '0.5rem' }}>Resolution Notes (Min 10 chars):</label>
                            <textarea
                                className="form-control"
                                rows="4"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add notes about how this was resolved..."
                            />
                        </div>
                        <div className="modal-footer-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => {
                                    setSelectedReport(null);
                                    setAdminNotes('');
                                    setAction('DISMISS');
                                }}
                            >
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleUpdateStatus}>
                                Confirm Action
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentReports;
