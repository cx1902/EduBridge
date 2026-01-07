import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ContentReports = () => {
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');
    const [selectedReport, setSelectedReport] = useState(null);
    const [adminNotes, setAdminNotes] = useState('');
    const [newStatus, setNewStatus] = useState('');

    useEffect(() => {
        fetchReports();
    }, [filter]);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/admin/reports', {
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
        if (!newStatus) {
            alert('Please select a status');
            return;
        }

        try {
            await axios.put(`/api/admin/reports/${selectedReport.id}/resolve`, {
                status: newStatus,
                adminNotes
            });
            alert('Report updated successfully');
            setSelectedReport(null);
            setAdminNotes('');
            setNewStatus('');
            fetchReports();
        } catch (error) {
            console.error('Error updating report:', error);
            alert('Failed to update report');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            PENDING: '#f59e0b',
            IN_PROGRESS: '#3b82f6',
            RESOLVED: '#10b981',
            CLOSED: '#6b7280'
        };
        return (
            <span style={{
                backgroundColor: colors[status],
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '0.25rem',
                fontSize: '0.875rem'
            }}>
                {status.replace('_', ' ')}
            </span>
        );
    };

    return (
        <div className="container">
            <h1>Content Reports</h1>
            <p>Review user-submitted content reports</p>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {['PENDING', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ALL'].map(status => (
                        <button
                            key={status}
                            className={`btn ${filter === status ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setFilter(status)}
                        >
                            {status.replace('_', ' ')}
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
                                        {report.evidenceUrls.map((url, idx) => (
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

                            {report.status !== 'CLOSED' && (
                                <button
                                    className="btn btn-primary"
                                    onClick={() => {
                                        setSelectedReport(report);
                                        setAdminNotes(report.resolution || '');
                                        setNewStatus(report.status);
                                    }}
                                >
                                    Update Status
                                </button>
                            )}

                            {report.resolution && (
                                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f3f4f6', borderRadius: '0.5rem' }}>
                                    <strong>Admin Notes:</strong>
                                    <p>{report.resolution}</p>
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
                        <h3>Update Report Status</h3>
                        <div style={{ marginBottom: '1rem' }}>
                            <label>New Status:</label>
                            <select
                                className="form-control"
                                value={newStatus}
                                onChange={(e) => setNewStatus(e.target.value)}
                            >
                                <option value="PENDING">Pending</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="RESOLVED">Resolved</option>
                                <option value="CLOSED">Closed</option>
                            </select>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label>Admin Notes:</label>
                            <textarea
                                className="form-control"
                                rows="4"
                                value={adminNotes}
                                onChange={(e) => setAdminNotes(e.target.value)}
                                placeholder="Add notes about how this was resolved..."
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => {
                                    setSelectedReport(null);
                                    setAdminNotes('');
                                    setNewStatus('');
                                }}
                            >
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleUpdateStatus}>
                                Update
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ContentReports;
