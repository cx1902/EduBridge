import React, { useState, useEffect } from 'react';
import axios from 'axios';

const SystemSettings = () => {
    const [settings, setSettings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('ALL');
    const [editingSetting, setEditingSetting] = useState(null);
    const [newValue, setNewValue] = useState('');

    const categories = ['GENERAL', 'USER_MANAGEMENT', 'COURSE', 'NOTIFICATION', 'SECURITY'];

    useEffect(() => {
        fetchSettings();
    }, [filter]);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await axios.get('/api/admin/settings', {
                params: { category: filter !== 'ALL' ? filter : undefined }
            });
            setSettings(response.data.settings || []);
        } catch (error) {
            console.error('Error fetching settings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSetting = async () => {
        if (!newValue.trim()) {
            alert('Please provide a value');
            return;
        }

        try {
            await axios.put(`/api/admin/settings/${editingSetting.settingKey}`, {
                value: newValue
            });
            alert('Setting updated successfully');
            setEditingSetting(null);
            setNewValue('');
            fetchSettings();
        } catch (error) {
            console.error('Error updating setting:', error);
            alert('Failed to update setting');
        }
    };

    const renderValueInput = (setting) => {
        const value = typeof setting.settingValue === 'object'
            ? JSON.stringify(setting.settingValue)
            : setting.settingValue;

        switch (setting.valueType) {
            case 'BOOLEAN':
                return (
                    <select
                        className="form-control"
                        value={value}
                        onChange={(e) => setNewValue(e.target.value)}
                    >
                        <option value="true">Enabled</option>
                        <option value="false">Disabled</option>
                    </select>
                );
            case 'NUMBER':
                return (
                    <input
                        type="number"
                        className="form-control"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                    />
                );
            default:
                return (
                    <input
                        type="text"
                        className="form-control"
                        value={newValue}
                        onChange={(e) => setNewValue(e.target.value)}
                    />
                );
        }
    };

    const getCategoryColor = (category) => {
        const colors = {
            GENERAL: '#3b82f6',
            USER_MANAGEMENT: '#10b981',
            COURSE: '#8b5cf6',
            NOTIFICATION: '#f59e0b',
            SECURITY: '#ef4444'
        };
        return colors[category] || '#6b7280';
    };

    return (
        <div className="container">
            <h1>System Settings</h1>
            <p>Manage platform-wide configuration</p>

            {/* Category Filter */}
            <div className="card" style={{ marginBottom: '1rem' }}>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <button
                        className={`btn ${filter === 'ALL' ? 'btn-primary' : 'btn-outline'}`}
                        onClick={() => setFilter('ALL')}
                    >
                        All
                    </button>
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`btn ${filter === cat ? 'btn-primary' : 'btn-outline'}`}
                            onClick={() => setFilter(cat)}
                        >
                            {cat.replace('_', ' ')}
                        </button>
                    ))}
                </div>
            </div>

            {/* Settings List */}
            {loading ? (
                <div className="card"><p>Loading...</p></div>
            ) : settings.length === 0 ? (
                <div className="card"><p>No settings found</p></div>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {categories.map(category => {
                        const categorySettings = settings.filter(s => s.category === category);
                        if (categorySettings.length === 0 && filter !== 'ALL') return null;
                        if (categorySettings.length === 0) return null;

                        return (
                            <div key={category} className="card">
                                <h3 style={{
                                    margin: '0 0 1rem 0',
                                    paddingBottom: '0.5rem',
                                    borderBottom: `3px solid ${getCategoryColor(category)}`
                                }}>
                                    {category.replace('_', ' ')}
                                </h3>
                                <div style={{ display: 'grid', gap: '1rem' }}>
                                    {categorySettings.map(setting => (
                                        <div
                                            key={setting.id}
                                            style={{
                                                padding: '1rem',
                                                backgroundColor: '#f9fafb',
                                                borderRadius: '0.5rem',
                                                border: '1px solid #e5e7eb'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                                                <div style={{ flex: 1 }}>
                                                    <h4 style={{ margin: '0 0 0.5rem 0' }}>
                                                        <code style={{ backgroundColor: '#e5e7eb', padding: '0.25rem 0.5rem', borderRadius: '0.25rem' }}>
                                                            {setting.settingKey}
                                                        </code>
                                                    </h4>
                                                    <p style={{ margin: '0 0 0.5rem 0', color: '#6b7280' }}>
                                                        {setting.description}
                                                    </p>
                                                    <div style={{ fontSize: '0.875rem' }}>
                                                        <strong>Current Value:</strong>{' '}
                                                        <span style={{
                                                            backgroundColor: '#dbeafe',
                                                            padding: '0.25rem 0.5rem',
                                                            borderRadius: '0.25rem',
                                                            fontFamily: 'monospace'
                                                        }}>
                                                            {typeof setting.settingValue === 'object'
                                                                ? JSON.stringify(setting.settingValue)
                                                                : String(setting.settingValue)}
                                                        </span>
                                                    </div>
                                                    {setting.lastModifiedAt && (
                                                        <div style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                                                            Last updated: {new Date(setting.lastModifiedAt).toLocaleString()}
                                                        </div>
                                                    )}
                                                </div>
                                                <button
                                                    className="btn btn-outline"
                                                    style={{ marginLeft: '1rem' }}
                                                    onClick={() => {
                                                        setEditingSetting(setting);
                                                        setNewValue(
                                                            typeof setting.settingValue === 'object'
                                                                ? JSON.stringify(setting.settingValue)
                                                                : String(setting.settingValue)
                                                        );
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Edit Modal */}
            {editingSetting && (
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
                        <h3>Edit Setting</h3>
                        <div style={{ marginBottom: '1rem' }}>
                            <strong>{editingSetting.settingKey}</strong>
                            <p style={{ fontSize: '0.875rem', color: '#6b7280', marginTop: '0.25rem' }}>
                                {editingSetting.description}
                            </p>
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label>New Value ({editingSetting.valueType}):</label>
                            {renderValueInput(editingSetting)}
                        </div>
                        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                            <button
                                className="btn btn-outline"
                                onClick={() => {
                                    setEditingSetting(null);
                                    setNewValue('');
                                }}
                            >
                                Cancel
                            </button>
                            <button className="btn btn-primary" onClick={handleUpdateSetting}>
                                Save Changes
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemSettings;
