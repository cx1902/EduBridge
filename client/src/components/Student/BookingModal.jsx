import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { FaCalendarAlt, FaClock, FaCheckCircle, FaTimes, FaSpinner } from 'react-icons/fa';
import './BookingModal.css';

const BookingModal = ({ tutor, onClose }) => {
    const { token } = useAuthStore();
    const [step, setStep] = useState(1); // 1: Select Slot, 2: Confirm, 3: Success
    const [slots, setSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [loading, setLoading] = useState(true);
    const [bookingNote, setBookingNote] = useState('');
    const [isBooking, setIsBooking] = useState(false);
    const [dateFilter, setDateFilter] = useState('');

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

    useEffect(() => {
        if (tutor) {
            fetchSlots();
        }
    }, [tutor]);

    const fetchSlots = async () => {
        try {
            setLoading(true);
            const response = await axios.get(`${API_URL}/availability`, {
                params: {
                    tutorId: tutor.id,
                    start: new Date().toISOString() // Only future slots
                },
                headers: { Authorization: `Bearer ${token}` }
            });
            setSlots(response.data.data);
        } catch (err) {
            console.error('Fetch slots error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleBookSlot = async () => {
        if (!selectedSlot) return;

        setIsBooking(true);
        try {
            const response = await axios.post(
                `${API_URL}/availability/${selectedSlot.id}/book`,
                {
                    subject: tutor.tutorSubjects?.[0]?.subject?.name || 'General Session',
                    note: bookingNote
                },
                { headers: { Authorization: `Bearer ${token}` } }
            );

            if (response.data.success) {
                setStep(3);
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Booking failed');
        } finally {
            setIsBooking(false);
        }
    };

    if (!tutor) return null;

    // Filter slots by date if selected
    const filteredSlots = dateFilter
        ? slots.filter(slot => new Date(slot.startTime).toLocaleDateString() === new Date(dateFilter).toLocaleDateString())
        : slots;

    // Group slots by date for display
    const slotsByDate = filteredSlots.reduce((acc, slot) => {
        const dateStr = new Date(slot.startTime).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
        if (!acc[dateStr]) acc[dateStr] = [];
        acc[dateStr].push(slot);
        return acc;
    }, {});

    return (
        <div className="booking-modal-overlay">
            <div className="booking-modal">
                <button className="close-btn" onClick={onClose}><FaTimes /></button>

                {step === 1 && (
                    <>
                        <div className="modal-header">
                            <h2>Book a Session with {tutor.user.firstName}</h2>
                            <p>Select a time slot that works for you.</p>
                        </div>

                        <div className="modal-body">
                            <div className="date-filter">
                                <label>Filter by Date:</label>
                                <input
                                    type="date"
                                    min={new Date().toISOString().split('T')[0]}
                                    onChange={(e) => setDateFilter(e.target.value)}
                                />
                            </div>

                            {loading ? (
                                <div className="spinner-container"><FaSpinner className="spinner" /></div>
                            ) : slots.length === 0 ? (
                                <div className="empty-slots">
                                    <p>No available slots found.</p>
                                </div>
                            ) : (
                                <div className="slots-container">
                                    {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                                        <div key={date} className="date-group">
                                            <h4>{date}</h4>
                                            <div className="time-grid">
                                                {dateSlots.map(slot => (
                                                    <button
                                                        key={slot.id}
                                                        className={`time-slot ${selectedSlot?.id === slot.id ? 'selected' : ''}`}
                                                        onClick={() => setSelectedSlot(slot)}
                                                    >
                                                        {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="modal-footer">
                            <button
                                className="btn-primary"
                                disabled={!selectedSlot}
                                onClick={() => setStep(2)}
                            >
                                Continue
                            </button>
                        </div>
                    </>
                )}

                {step === 2 && (
                    <>
                        <div className="modal-header">
                            <h2>Confirm Booking</h2>
                        </div>
                        <div className="modal-body">
                            <div className="confirm-details">
                                <div className="detail-row">
                                    <span className="label">Tutor:</span>
                                    <span className="value">{tutor.user.firstName} {tutor.user.lastName}</span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Date:</span>
                                    <span className="value">
                                        {new Date(selectedSlot.startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="label">Time:</span>
                                    <span className="value">
                                        {new Date(selectedSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} -
                                        {new Date(selectedSlot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>

                                <div className="note-input">
                                    <label>Add a note (optional):</label>
                                    <textarea
                                        value={bookingNote}
                                        onChange={(e) => setBookingNote(e.target.value)}
                                        placeholder="What would you like to focus on?"
                                        rows={3}
                                    />
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button className="btn-secondary" onClick={() => setStep(1)} disabled={isBooking}>Back</button>
                            <button className="btn-primary" onClick={handleBookSlot} disabled={isBooking}>
                                {isBooking ? 'Booking...' : 'Confirm Booking'}
                            </button>
                        </div>
                    </>
                )}

                {step === 3 && (
                    <div className="success-view">
                        <FaCheckCircle className="success-icon" />
                        <h2>Booking Confirmed!</h2>
                        <p>Your session has been scheduled.</p>
                        <p>You can view your upcoming sessions in your dashboard.</p>
                        <button className="btn-primary" onClick={onClose}>Done</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingModal;
