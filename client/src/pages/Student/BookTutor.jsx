import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const BookTutor = () => {
  const { requestId } = useParams();
  const [searchParams] = useSearchParams();
  const tutorId = searchParams.get('tutorId');
  const navigate = useNavigate();

  const [slots, setSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (tutorId) {
      fetchSlots();
    }
  }, [tutorId]);

  const fetchSlots = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tutor/availability?tutorId=${tutorId}`);
      setSlots(res.data.data);
    } catch (err) {
      console.error('Failed to fetch slots', err);
      setError('Failed to load availability.');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedSlot) return;
    
    setBooking(true);
    setError(null);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tutoring/requests/${requestId}/book`, {
        tutorId,
        slotId: selectedSlot.id
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to book session. The slot might have been taken.');
    } finally {
      setBooking(false);
    }
  };

  if (!tutorId) return <div>Invalid link. Missing Tutor ID.</div>;
  if (loading) return <div>Loading availability...</div>;

  if (success) {
    return (
      <div className="container mx-auto p-6 max-w-2xl text-center">
        <div className="bg-green-50 border border-green-200 rounded-lg p-8">
          <h2 className="text-3xl font-bold text-green-700 mb-4">Booking Confirmed!</h2>
          <p className="text-lg text-gray-700 mb-6">
            Your session has been scheduled successfully.
          </p>
          <div className="flex justify-center gap-4">
            <button 
              onClick={() => navigate('/dashboard')}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700"
            >
              Go to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Select a Time Slot</h1>
      
      {error && (
        <div className="bg-red-100 text-red-700 p-4 rounded mb-6 border border-red-200">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-8">
        {/* Slot Selection */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Available Slots</h2>
          
          {slots.length === 0 ? (
            <p className="text-gray-500">This tutor has no available slots right now.</p>
          ) : (
            <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
              {slots.map(slot => (
                <button
                  key={slot.id}
                  onClick={() => setSelectedSlot(slot)}
                  className={`w-full text-left p-4 rounded-lg border transition-all ${
                    selectedSlot?.id === slot.id
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                      : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium">
                    {new Date(slot.startTime).toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
                  </div>
                  <div className="text-gray-600 mt-1">
                    {new Date(slot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                    {new Date(slot.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Summary & Confirm */}
        <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 h-fit sticky top-6">
          <h2 className="text-xl font-semibold mb-4">Booking Summary</h2>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between">
              <span className="text-gray-600">Tutor</span>
              <span className="font-medium">Selected Tutor</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Subject</span>
              <span className="font-medium">Tutoring Session</span>
            </div>
            
            {selectedSlot && (
              <div className="border-t pt-4 mt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Date</span>
                  <span className="font-medium">
                    {new Date(selectedSlot.startTime).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time</span>
                  <span className="font-medium">
                    {new Date(selectedSlot.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleConfirmBooking}
            disabled={!selectedSlot || booking}
            className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {booking ? 'Confirming...' : 'Confirm Booking'}
          </button>
          
          {!selectedSlot && (
            <p className="text-center text-sm text-gray-500 mt-2">
              Please select a time slot to continue
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookTutor;