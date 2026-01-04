import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

const TutorAvailability = () => {
  const { user } = useAuthStore();
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newSlot, setNewSlot] = useState({ date: '', startTime: '', endTime: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tutor/availability?tutorId=${user.id}`);
      setSlots(res.data.data);
    } catch (err) {
      console.error('Failed to fetch slots', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();
    setError(null);

    try {
      // Combine date and time
      const start = new Date(`${newSlot.date}T${newSlot.startTime}`);
      const end = new Date(`${newSlot.date}T${newSlot.endTime}`);

      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tutor/availability`, {
        startTime: start.toISOString(),
        endTime: end.toISOString()
      });

      fetchSlots(); // Refresh list
      setNewSlot({ date: '', startTime: '', endTime: '' }); // Reset form
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to add slot');
    }
  };

  const handleDeleteSlot = async (id) => {
    if (!window.confirm('Are you sure you want to remove this slot?')) return;
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tutor/availability/${id}`);
      setSlots(slots.filter(s => s.id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete slot');
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Manage Availability</h1>

      {/* Add Slot Form */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h2 className="text-xl font-semibold mb-4">Add New Slot</h2>
        {error && <div className="text-red-600 mb-4">{error}</div>}
        <form onSubmit={handleAddSlot} className="flex gap-4 items-end flex-wrap">
          <div>
            <label className="block text-sm text-gray-600">Date</label>
            <input
              type="date"
              required
              min={new Date().toISOString().split('T')[0]}
              value={newSlot.date}
              onChange={e => setNewSlot({ ...newSlot, date: e.target.value })}
              className="border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">Start Time</label>
            <input
              type="time"
              required
              value={newSlot.startTime}
              onChange={e => setNewSlot({ ...newSlot, startTime: e.target.value })}
              className="border rounded p-2"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600">End Time</label>
            <input
              type="time"
              required
              value={newSlot.endTime}
              onChange={e => setNewSlot({ ...newSlot, endTime: e.target.value })}
              className="border rounded p-2"
            />
          </div>
          <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Add Slot
          </button>
        </form>
      </div>

      {/* Slots List */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Upcoming Slots</h2>
        {loading ? (
          <p>Loading...</p>
        ) : slots.length === 0 ? (
          <p className="text-gray-500">No slots available. Add some above.</p>
        ) : (
          <div className="grid gap-4">
            {slots.map(slot => (
              <div key={slot.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">
                    {new Date(slot.startTime).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">
                    {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                    {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  {slot.isBooked ? (
                    <span className="text-red-600 font-bold bg-red-100 px-2 py-1 rounded text-xs">BOOKED</span>
                  ) : (
                    <span className="text-green-600 font-bold bg-green-100 px-2 py-1 rounded text-xs">AVAILABLE</span>
                  )}
                  {!slot.isBooked && (
                    <button
                      onClick={() => handleDeleteSlot(slot.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TutorAvailability;