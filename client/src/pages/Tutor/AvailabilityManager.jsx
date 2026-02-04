import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { FaChevronLeft, FaChevronRight, FaCalendar, FaClock, FaTrash, FaTimes } from 'react-icons/fa';
import './AvailabilityManager.css';

const AvailabilityManager = () => {
  const { user } = useAuthStore();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Calendar state
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDates, setSelectedDates] = useState([]);
  const [showTimeSlotModal, setShowTimeSlotModal] = useState(false);

  // Time slot state
  const [selectedTimeSlots, setSelectedTimeSlots] = useState([]);

  // Helper to format 24h to 12h time (e.g., "13" -> "1:00 PM")
  const formatTime24to12 = (hour24) => {
    let h = parseInt(hour24);
    if (h === 24) h = 0; // Handle midnight wrap for end times
    const ampm = h >= 12 ? 'PM' : 'AM';
    const hour12 = h % 12 || 12;
    return `${hour12}:00 ${ampm}`;
  };

  // Generate time slots (every hour, 24-hour format)
  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 0; hour < 24; hour++) {
      const startHour = hour.toString().padStart(2, '0');
      const endHour = (hour + 1).toString().padStart(2, '0');
      slots.push({
        start: `${startHour}:00`,
        end: `${endHour}:00`,
        label: `${formatTime24to12(startHour)} - ${formatTime24to12(endHour)}`
      });
    }
    return slots;
  };

  const timeSlots = generateTimeSlots();

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tutor/availability?tutorId=${user.id}`);
      setSlots(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch slots', err);
    } finally {
      setLoading(false);
    }
  };

  // Calendar helpers
  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startingDayOfWeek = firstDay.getDay();

    return {
      year,
      month,
      firstDay,
      lastDay,
      daysInMonth: lastDay.getDate(),
      startingDayOfWeek
    };
  };

  const getAvailabilityForDate = (dateStr) => {
    return slots.filter(slot => {
      const slotDate = new Date(slot.startTime).toDateString();
      return slotDate === new Date(dateStr).toDateString();
    });
  };

  const isDatePast = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date < today;
  };

  const isDateSelected = (dateStr) => {
    return selectedDates.some(d => d.toDateString() === dateStr);
  };

  const handleDateClick = (date) => {
    if (isDatePast(date)) return;

    const dateStr = date.toDateString();

    if (isDateSelected(dateStr)) {
      // Deselect
      setSelectedDates(selectedDates.filter(d => d.toDateString() !== dateStr));
    } else {
      // Select
      setSelectedDates([...selectedDates, date]);
    }
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleTimeSlotToggle = (timeSlot) => {
    const exists = selectedTimeSlots.find(t => t.start === timeSlot.start);
    if (exists) {
      setSelectedTimeSlots(selectedTimeSlots.filter(t => t.start !== timeSlot.start));
    } else {
      setSelectedTimeSlots([...selectedTimeSlots, timeSlot]);
    }
  };

  const handleAddAvailability = async () => {
    if (selectedDates.length === 0 || selectedTimeSlots.length === 0) {
      setError('Please select at least one date and one time slot');
      return;
    }

    setError(null);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const now = new Date();

    try {
      // Create availability for each combination of date and time slot
      const promises = [];
      let skippedCount = 0;
      let duplicateCount = 0;
      let pastCount = 0;

      selectedDates.forEach(date => {
        selectedTimeSlots.forEach(timeSlot => {
          // Manually format date to YYYY-MM-DD using local time components to avoid UTC shift
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;
          const startDateTime = new Date(`${dateStr}T${timeSlot.start}`);
          const endDateTime = new Date(`${dateStr}T${timeSlot.end}`);

          // 1. Check if time is in the past
          if (startDateTime < now) {
            pastCount++;
            return;
          }

          // 2. Check for duplicates
          const isDuplicate = slots.some(slot =>
            new Date(slot.startTime).getTime() === startDateTime.getTime()
          );

          if (isDuplicate) {
            duplicateCount++;
            return;
          }

          promises.push(
            axios.post(`${API_URL}/tutor/availability`, {
              startTime: startDateTime.toISOString(),
              endTime: endDateTime.toISOString()
            })
          );
        });
      });

      if (promises.length === 0) {
        if (pastCount > 0 && duplicateCount > 0) {
          setError(`Cannot add slots: ${pastCount} are in the past and ${duplicateCount} already exist.`);
        } else if (pastCount > 0) {
          setError('Cannot add availability for past dates/times.');
        } else if (duplicateCount > 0) {
          setError('Selected time slots already exist in your schedule.');
        }
        return;
      }

      await Promise.all(promises);

      // Reset and refresh
      setSelectedDates([]);
      setSelectedTimeSlots([]);
      setShowTimeSlotModal(false);
      await fetchSlots();

      // Show success feedback if some were skipped
      if (duplicateCount > 0 || pastCount > 0) {
        // Ideally show a toast, but clearing error is good for now
        // We could set a temporary success message state if we had one
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add availability');
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!window.confirm('Remove this time slot?')) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tutor/availability/${slotId}`);
      setSlots(slots.filter(s => s.id !== slotId));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete slot');
    }
  };

  const openTimeSlotModal = () => {
    if (selectedDates.length === 0) {
      setError('Please select at least one date first');
      return;
    }
    setShowTimeSlotModal(true);
    setError(null);
  };

  // Render calendar
  const renderCalendar = () => {
    const { year, month, daysInMonth, startingDayOfWeek } = getDaysInMonth(currentMonth);
    const days = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toDateString();
      const isPast = isDatePast(date);
      const isToday = date.toDateString() === today.toDateString();
      const isSelected = isDateSelected(dateStr);
      const availability = getAvailabilityForDate(dateStr);
      const hasAvailability = availability.length > 0;

      days.push(
        <div
          key={day}
          className={`calendar-day ${isPast ? 'past' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasAvailability ? 'has-availability' : ''}`}
          onClick={() => handleDateClick(date)}
        >
          <span className="day-number">{day}</span>
          {hasAvailability && <span className="availability-indicator">{availability.length}</span>}
        </div>
      );
    }

    return days;
  };

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'];

  return (
    <div className="availability-container">
      <div className="availability-header">
        <h1><FaCalendar /> Manage Availability</h1>
        <p>Set the times you are available for tutoring sessions</p>
      </div>

      {error && (
        <div className="error-banner">
          {error}
          <button onClick={() => setError(null)}><FaTimes /></button>
        </div>
      )}

      <div className="availability-content">
        {/* Calendar Section */}
        <div className="calendar-section">
          <div className="calendar-header">
            <button onClick={handlePrevMonth} className="btn-nav">
              <FaChevronLeft />
            </button>
            <h2>{monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}</h2>
            <button onClick={handleNextMonth} className="btn-nav">
              <FaChevronRight />
            </button>
          </div>

          <div className="calendar-weekdays">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="weekday">{day}</div>
            ))}
          </div>

          <div className="calendar-grid">
            {renderCalendar()}
          </div>

          <div className="calendar-legend">
            <span><span className="legend-dot today"></span> Today</span>
            <span><span className="legend-dot selected"></span> Selected</span>
            <span><span className="legend-dot has-slots"></span> Has Availability</span>
          </div>

          {selectedDates.length > 0 && (
            <div className="selected-dates-info">
              <div className="selection-summary">
                <div className="selection-badge">
                  <FaCalendar />
                  {selectedDates.length}
                </div>
                <p>Date{selectedDates.length > 1 ? 's' : ''} Selected</p>
              </div>
              <button onClick={openTimeSlotModal} className="btn-primary-selection">
                <FaClock /> Choose Time Slots
              </button>
            </div>
          )}
        </div>

        {/* Existing Availability List */}
        <div className="slots-section">
          <h2>Your Schedule</h2>
          {loading ? (
            <div className="loading">Loading...</div>
          ) : slots.length === 0 ? (
            <div className="empty-state">
              <FaCalendar className="empty-icon" />
              <p>No availability slots set</p>
              <p className="empty-hint">Select dates on the calendar to get started</p>
            </div>
          ) : (
            <div className="slots-list">
              {slots.map(slot => (
                <div key={slot.id} className="slot-item">
                  <div className="slot-info">
                    <div className="slot-date">
                      {new Date(slot.startTime).toLocaleDateString('en-US', {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                    <div className="slot-time">
                      {new Date(slot.startTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })} - {new Date(slot.endTime).toLocaleTimeString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true
                      })}
                    </div>
                  </div>
                  <div className="slot-actions">
                    {slot.isBooked ? (
                      <span className="badge booked">Booked</span>
                    ) : (
                      <>
                        <span className="badge available">Available</span>
                        <button
                          onClick={() => handleDeleteSlot(slot.id)}
                          className="btn-delete"
                          title="Remove slot"
                        >
                          <FaTrash />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Time Slot Modal */}
      {showTimeSlotModal && (
        <div className="modal-overlay" onClick={() => setShowTimeSlotModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Select Time Slots</h2>
              <button onClick={() => setShowTimeSlotModal(false)} className="btn-close">
                <FaTimes />
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-subtitle">
                Choose 1-hour time slots for {selectedDates.length} selected date{selectedDates.length > 1 ? 's' : ''}
              </p>

              {error && (
                <div className="modal-error-banner" style={{
                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  padding: '12px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '0.9rem',
                  border: '1px solid rgba(239, 68, 68, 0.2)'
                }}>
                  {error}
                </div>
              )}

              <div className="time-slots-grid">
                {timeSlots.map(timeSlot => {
                  const isSelected = selectedTimeSlots.some(t => t.start === timeSlot.start);

                  // Check if this slot already exists for ANY of the selected dates
                  const isExisting = selectedDates.some(date => {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    const dateStr = `${year}-${month}-${day}`;
                    // Reconstruct local time check
                    // We need to match existing slots (ISO strings) to this Local Date + Slot Time
                    return slots.some(s => {
                      const sTime = new Date(s.startTime);
                      // Check matching date (local)
                      const isSameDate = sTime.getFullYear() === year &&
                        (sTime.getMonth() + 1) === Number(month) &&
                        sTime.getDate() === Number(day);
                      // Check matching hour
                      const isSameHour = sTime.getHours().toString().padStart(2, '0') + ':00' === timeSlot.start;
                      return isSameDate && isSameHour;
                    });
                  });

                  return (
                    <button
                      key={timeSlot.start}
                      className={`time-slot-btn ${isSelected ? 'selected' : ''} ${isExisting ? 'existing' : ''}`}
                      onClick={() => handleTimeSlotToggle(timeSlot)}
                      title={isExisting ? 'This slot is already added for one or more selected dates' : ''}
                    >
                      {timeSlot.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowTimeSlotModal(false)} className="btn-secondary">
                Cancel
              </button>
              <button
                onClick={handleAddAvailability}
                className="btn-primary"
                disabled={selectedTimeSlots.length === 0}
              >
                Add {selectedTimeSlots.length} Time Slot{selectedTimeSlots.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AvailabilityManager;