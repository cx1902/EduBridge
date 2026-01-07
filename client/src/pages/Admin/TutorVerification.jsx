import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const TutorVerification = () => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('PENDING');
    const [selectedApp, setSelectedApp] = useState(null);
    const [reviewNotes, setReviewNotes] = useState('');

    useEffect(() => {
        fetchApplications();
    }, [filter]);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/tutor-applications', {
                params: { status: filter !== 'ALL' ? filter : undefined }
            });
            setApplications(response.data.applications || []);
        } catch (error) {
            console.error('Error fetching applications:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleReview = async (applicationId, decision) => {
        if (!reviewNotes.trim() && decision === 'REJECTED') {
            alert('Please provide notes for rejection');
            return;
        }

        const confirmed = window.confirm(
            `Are you sure you want to ${decision === 'APPROVED' ? 'approve' : 'reject'} this tutor application?`
        );
        if (!confirmed) return;

        try {
            await api.put(`/admin/tutor-applications/${applicationId}/review`, {
                decision,
                notes: reviewNotes
            });
            alert(`Application ${decision.toLowerCase()} successfully`);
            setSelectedApp(null);
            setReviewNotes('');
            fetchApplications();
        } catch (error) {
            console.error('Error reviewing application:', error);
            alert('Failed to review application');
        }
    };

    const getStatusBadge = (status) => {
        const colors = {
            PENDING: '#f59e0b',
            APPROVED: '#10b981',
            REJECTED: '#ef4444',
            DECLINED: '#ef4444'
        };
        return (
            <span style={{
                backgroundColor: colors[status],
                color: 'white',
                padding: '0.25rem 0.75rem',
                borderRadius: '0.25rem',
                fontSize: '0.875rem',
                fontWeight: '500'
            }}>
                {status}
            </span>
        );
    };

    return (
        <div className="container">
            <h1>Tutor Verification</h1>
            <p>Review and approve tutor applications</p>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    {['PENDING', 'APPROVED', 'REJECTED', 'ALL'].map(status => (
                        <button
                            key={status}
                            className={`btn ${filter === status ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setFilter(status)}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {/* Applications List */}
            {loading ? (
                <div className="card"><p>Loading...</p></div>
            ) : applications.length === 0 ? (
                <div className="card"><p>No applications found</p></div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {applications.map((app) => (
                        <div key={app.id} className="card">
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div>
                                    <h3 style={{ margin: 0 }}>
                                        {app.tutor?.firstName} {app.tutor?.lastName}
                                    </h3>
                                    <p style={{ color: '#6b7280', margin: '0.25rem 0' }}>{app.tutor?.email}</p>
                                </div>
                                {getStatusBadge(app.status)}
                            </div>

                            {app.bio && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <strong>Bio:</strong>
                                    <p>{app.bio}</p>
                                </div>
                            )}

                            {app.qualifications && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <strong>Qualifications:</strong>
                                    <p>{app.qualifications}</p>
                                </div>
                            )}

                            {app.experience && (
                                <div style={{ marginBottom: '1rem' }}>
                                    <strong>Experience:</strong>
                                    <p>{app.experience}</p>
                                </div>
                            )}

                            {app.status === 'PENDING' && (
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                    <button
                                        className="btn btn-success"
                                        onClick={() => setSelectedApp({ ...app, decision: 'APPROVED' })}
                                    >
                                        ✅ Approve
                                    </button>
                                    <button
                                        className="btn btn-danger"
                                        onClick={() => setSelectedApp({ ...app, decision: 'REJECTED' })}
                                    >
                                        ❌ Reject
                                    </button>
                                </div>
                            )}

                            {app.reviewNotes && (
                                <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: '0.5rem', border: '1px solid var(--color-border)' }}>
                                    <strong>Review Notes:</strong>
                                    <p>{app.reviewNotes}</p>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Review Modal */}
            {selectedApp && (
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
                        <h3>{selectedApp.decision === 'APPROVED' ? 'Approve' : 'Reject'} Application</h3>
                        <p>Reviewing: {selectedApp.tutor?.firstName} {selectedApp.tutor?.lastName}</p>
                        <textarea
                            className="form-control"
                            rows="4"
                            value={reviewNotes}
                            onChange={(e) => setReviewNotes(e.target.value)}
                            placeholder="Add notes (optional for approval, required for rejection)..."
                            style={{ marginBottom: '1rem' }}
                        />
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => {
                                    setSelectedApp(null);
                                    setReviewNotes('');
                                }}
                            >
                                Cancel
                            </button>
                            <button
                                className={`btn ${selectedApp.decision === 'APPROVED' ? 'btn-success' : 'btn-danger'}`}
                                onClick={() => handleReview(selectedApp.id, selectedApp.decision)}
                            >
                                {selectedApp.decision === 'APPROVED' ? 'Approve' : 'Reject'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TutorVerification;
