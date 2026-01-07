import React, { useState, useEffect } from 'react';
import api from '../../api/axios';

const AuditLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState({
        actionType: '',
        adminId: '',
        startDate: '',
        endDate: ''
    });
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchLogs();
    }, [page, filter]);

    const fetchLogs = async () => {
        try {
            setLoading(true);
            const response = await api.get('/admin/audit-logs', {
                params: { ...filter, page, limit: 50 }
            });
            setLogs(response.data.logs || []);
            setTotalPages(response.data.pagination?.totalPages || 1);
        } catch (error) {
            console.error('Error fetching audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleExport = async () => {
        try {
            const response = await api.get('/admin/audit-logs/export', {
                params: filter,
                responseType: 'blob'
            });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `audit-logs-${new Date().toISOString()}.csv`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Error exporting logs:', error);
            alert('Failed to export logs');
        }
    };

    const getActionStyle = (type) => {
        const style = { padding: '0.25rem 0.5rem', borderRadius: '0.25rem', fontSize: '0.75rem', fontWeight: '600' };

        if (type.includes('CREATE') || type.includes('PUBLISH') || type.includes('APPROVE') || type.includes('VERIFY')) {
            return { ...style, backgroundColor: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)' }; // Green
        }
        if (type.includes('DELETE') || type.includes('REMOVE') || type.includes('REJECT') || type.includes('BAN')) {
            return { ...style, backgroundColor: 'rgba(239, 68, 68, 0.2)', color: '#f87171', border: '1px solid rgba(239, 68, 68, 0.3)' }; // Red
        }
        if (type.includes('UPDATE') || type.includes('EDIT') || type.includes('CHANGE')) {
            return { ...style, backgroundColor: 'rgba(59, 130, 246, 0.2)', color: '#60a5fa', border: '1px solid rgba(59, 130, 246, 0.3)' }; // Blue
        }
        return { ...style, backgroundColor: 'rgba(107, 114, 128, 0.2)', color: '#9ca3af', border: '1px solid rgba(107, 114, 128, 0.3)' }; // Gray
    };

    return (
        <div className="container">
            <h1>Audit Logs</h1>
            <p>Track all administrative actions</p>

            {/* Filters */}
            <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <div>
                        <label>Action Type:</label>
                        <input
                            type="text"
                            className="form-control"
                            placeholder="e.g., APPROVE_COURSE"
                            value={filter.actionType}
                            onChange={(e) => setFilter({ ...filter, actionType: e.target.value })}
                        />
                    </div>
                    <div>
                        <label>Start Date:</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filter.startDate}
                            onChange={(e) => setFilter({ ...filter, startDate: e.target.value })}
                        />
                    </div>
                    <div>
                        <label>End Date:</label>
                        <input
                            type="date"
                            className="form-control"
                            value={filter.endDate}
                            onChange={(e) => setFilter({ ...filter, endDate: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                        <button className="btn btn-primary" onClick={handleExport}>
                            📥 Export CSV
                        </button>
                    </div>
                </div>
            </div>

            {/* Logs Table */}
            {loading ? (
                <div className="card"><p>Loading...</p></div>
            ) : logs.length === 0 ? (
                <div className="card"><p>No logs found</p></div>
            ) : (
                <>
                    <div className="card" style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ borderBottom: '2px solid #e5e7eb', textAlign: 'left' }}>
                                    <th style={{ padding: '0.75rem' }}>Timestamp</th>
                                    <th style={{ padding: '0.75rem' }}>Admin</th>
                                    <th style={{ padding: '0.75rem' }}>Action</th>
                                    <th style={{ padding: '0.75rem' }}>Target</th>
                                    <th style={{ padding: '0.75rem' }}>Details</th>
                                </tr>
                            </thead>
                            <tbody>
                                {logs.map((log) => (
                                    <tr key={log.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                                            {new Date(log.timestamp).toLocaleString()}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            {log.admin?.firstName} {log.admin?.lastName}
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            <span style={getActionStyle(log.actionType)}>
                                                {log.actionType}
                                            </span>
                                        </td>
                                        <td style={{ padding: '0.75rem' }}>
                                            {log.targetResourceType}
                                            {log.targetResourceId && (
                                                <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>
                                                    ID: {log.targetResourceId.substring(0, 8)}...
                                                </div>
                                            )}
                                        </td>
                                        <td style={{ padding: '0.75rem', fontSize: '0.875rem' }}>
                                            {log.reason || 'N/A'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginTop: '1rem' }}>
                            <button
                                className="btn btn-outline"
                                disabled={page === 1}
                                onClick={() => setPage(page - 1)}
                            >
                                Previous
                            </button>
                            <span style={{ padding: '0.5rem 1rem', display: 'flex', alignItems: 'center' }}>
                                Page {page} of {totalPages}
                            </span>
                            <button
                                className="btn btn-outline"
                                disabled={page === totalPages}
                                onClick={() => setPage(page + 1)}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default AuditLogs;
