import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { FaCalendarPlus, FaTrash, FaClock } from 'react-icons/fa';
import './ScheduleManagement.css';

const ScheduleManagement = () => {
    const { token } = useAuthStore();
    const [slots, setSlots] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newSlot, setNewSlot] = useState({
        date: '',
        startTime: '',
        endTime: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    useEffect(() => {
        fetchSlots();
    }, []);

    const fetchSlots = async () => {
        try {
            setLoading(true);
            const user = useAuthStore.getState().user;
            const response = await axios.get(`${API_URL}/availability`, {
                params: { tutorId: user.id },
                headers: { Authorization: `Bearer ${token}` }
            });
            setSlots(response.data.data);
        } catch (err) {
            console.error('Fetch slots error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleAddSlot = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        try {
            // Combine date and time
            const start = new Date(`${newSlot.date}T${newSlot.startTime}`);
            const end = new Date(`${newSlot.date}T${newSlot.endTime}`);

            if (start >= end) {
                setError('End time must be after start time');
                return;
            }

            const response = await axios.post(
                `${API_URL}/availability`,
                { slots: [{ startTime: start, endTime: end }] },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setSuccess('Slot added successfully');
                setNewSlot({ date: '', startTime: '', endTime: '' });
                fetchSlots();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to add slot');
        }
    };

    const handleDeleteSlot = async (slotId) => {
        if (!window.confirm('Are you sure you want to delete this slot?')) return;

        try {
            await axios.delete(`${API_URL}/availability/${slotId}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchSlots();
        } catch (err) {
            alert('Failed to delete slot');
        }
    };

    return (
        <div className="schedule-page">
            <div className="schedule-container">
                <div className="schedule-header">
                    <h1>Manage Availability</h1>
                    <p>Set the times you are available for tutoring sessions.</p>
                </div>

                <div className="schedule-grid">
                    {/* Add Slot Form */}
                    <div className="add-slot-card">
                        <h3><FaCalendarPlus /> Add New Slot</h3>
                        {error && <div className="alert error">{error}</div>}
                        {success && <div className="alert success">{success}</div>}

                        <form onSubmit={handleAddSlot}>
                            <div className="form-group">
                                <label>Date</label>
                                <input
                                    type="date"
                                    required
                                    min={new Date().toISOString().split('T')[0]}
                                    value={newSlot.date}
                                    onChange={e => setNewSlot({ ...newSlot, date: e.target.value })}
                                />
                            </div>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Start Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={newSlot.startTime}
                                        onChange={e => setNewSlot({ ...newSlot, startTime: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>End Time</label>
                                    <input
                                        type="time"
                                        required
                                        value={newSlot.endTime}
                                        onChange={e => setNewSlot({ ...newSlot, endTime: e.target.value })}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn-add">Add Availability</button>
                        </form>
                    </div>

                    {/* Slots List */}
                    <div className="slots-list-card">
                        <h3>Your Schedule</h3>
                        {loading ? (
                            <div className="spinner"></div>
                        ) : slots.length === 0 ? (
                            <p className="empty-text">No availability slots set.</p>
                        ) : (
                            <div className="slots-list">
                                {slots.map(slot => (
                                    <div key={slot.id} className="slot-item">
                                        <div className="slot-info">
                                            <div className="slot-date">
                                                {new Date(slot.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                                            </div>
                                            <div className="slot-time">
                                                <FaClock />
                                                {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                                {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                        <button
                                            className="btn-delete"
                                            onClick={() => handleDeleteSlot(slot.id)}
                                            title="Delete Slot"
                                        >
                                            <FaTrash />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ScheduleManagement;
