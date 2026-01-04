import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const TutorMatches = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchMatches();
  }, [requestId]);

  const fetchMatches = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tutoring/requests/${requestId}/matches`);
      setMatches(res.data.data);
    } catch (err) {
      console.error('Failed to fetch matches', err);
      setError('Failed to load matches. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBook = (tutorId) => {
    navigate(`/student/tutoring/book/${requestId}?tutorId=${tutorId}`);
  };

  if (loading) return <div>Finding best tutors...</div>;
  if (error) return <div className="text-red-600">{error}</div>;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-2">Recommended Tutors</h1>
      <p className="text-gray-600 mb-8">Based on your preferences, we found these matches for you.</p>

      {matches.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <p className="text-xl text-gray-500">No matching tutors found.</p>
          <button 
            onClick={() => navigate('/student/tutoring/request')}
            className="mt-4 text-blue-600 hover:underline"
          >
            Try adjusting your criteria
          </button>
        </div>
      ) : (
        <div className="grid gap-6">
          {matches.map(tutor => (
            <div key={tutor.tutorId} className="bg-white p-6 rounded-lg shadow-md flex flex-col md:flex-row gap-6 hover:shadow-lg transition-shadow">
              {/* Avatar */}
              <div className="flex-shrink-0">
                <img 
                  src={tutor.photoUrl || 'https://via.placeholder.com/100'} 
                  alt={tutor.name}
                  className="w-24 h-24 rounded-full object-cover border-2 border-gray-100"
                />
              </div>

              {/* Info */}
              <div className="flex-grow">
                <div className="flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{tutor.name}</h2>
                    <p className="text-gray-600">${tutor.hourlyRate}/hr</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-sm font-bold ${
                    tutor.score >= 80 ? 'bg-green-100 text-green-800' :
                    tutor.score >= 50 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {tutor.score}% Match
                  </div>
                </div>

                <div className="mt-3 space-y-2">
                  <p className="text-sm text-gray-500">
                    <span className="font-medium text-gray-700">Why?</span> {tutor.explanation}
                  </p>
                  
                  <div className="flex flex-wrap gap-2">
                    {tutor.languages.map(lang => (
                      <span key={lang} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">
                        {lang}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex flex-col justify-center items-end min-w-[150px] border-l pl-6 border-gray-100">
                {tutor.nextAvailableSlot ? (
                  <div className="text-right mb-4">
                    <p className="text-xs text-gray-500 uppercase font-semibold">Next Available</p>
                    <p className="text-sm font-medium text-green-600">
                      {new Date(tutor.nextAvailableSlot.startTime).toLocaleDateString()}
                    </p>
                  </div>
                ) : (
                   <p className="text-xs text-red-500 mb-4">No slots soon</p>
                )}
                
                <button
                  onClick={() => handleBook(tutor.tutorId)}
                  className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                >
                  View Slots
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TutorMatches;