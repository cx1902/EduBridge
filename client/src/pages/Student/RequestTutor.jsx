import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';

const RequestTutor = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedTutorId = searchParams.get('tutorId');

  const [subjects, setSubjects] = useState([]);
  const [formData, setFormData] = useState({
    subjectId: '',
    preferredLevel: 'SECONDARY',
    preferredLanguage: 'English',
    preferredStart: '',
    budgetMax: '',
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tutoring/subjects`);
      setSubjects(res.data.data);
    } catch (err) {
      console.error('Failed to fetch subjects', err);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tutoring/requests`, formData);
      const requestId = res.data.data.id;

      if (preSelectedTutorId) {
        // Direct booking flow
        navigate(`/student/tutoring/book/${requestId}?tutorId=${preSelectedTutorId}`);
      } else {
        // Standard matching flow
        navigate(`/student/tutoring/matches/${requestId}`);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div>Loading subjects...</div>;

  return (
    <div className="container mx-auto p-6 max-w-2xl">
      <h1 className="text-3xl font-bold mb-6">
        {preSelectedTutorId ? 'Book a Session' : 'Find a Tutor'}
      </h1>

      {preSelectedTutorId && (
        <div className="bg-blue-50 text-blue-800 p-4 rounded-md mb-6">
          <p>Please provide some details about your request to proceed with booking.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-6">
        {error && <div className="bg-red-100 text-red-700 p-3 rounded">{error}</div>}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
          <select
            name="subjectId"
            value={formData.subjectId}
            onChange={handleChange}
            required
            className="w-full p-2 border rounded-md"
          >
            <option value="">Select a subject</option>
            {subjects.map(subject => (
              <option key={subject.id} value={subject.id}>{subject.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Education Level</label>
          <select
            name="preferredLevel"
            value={formData.preferredLevel}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          >
            <option value="PRIMARY">Primary School</option>
            <option value="SECONDARY">Secondary School</option>
            <option value="PRE_UNIVERSITY">Pre-University / A-Level</option>
            <option value="DIPLOMA">Diploma</option>
            <option value="UNDERGRADUATE">Undergraduate</option>
            <option value="POSTGRADUATE">Postgraduate</option>
            <option value="PROFESSIONAL">Professional / Continuing Education</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Language</label>
          <select
            name="preferredLanguage"
            value={formData.preferredLanguage}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          >
            <option value="English">English</option>
            <option value="Spanish">Spanish</option>
            <option value="French">French</option>
            <option value="German">German</option>
            <option value="Chinese">Chinese</option>
            <option value="Japanese">Japanese</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Preferred Start Time (Optional)</label>
          <input
            type="datetime-local"
            name="preferredStart"
            value={formData.preferredStart}
            onChange={handleChange}
            min={new Date().toISOString().slice(0, 16)}
            className="w-full p-2 border rounded-md"
          />
          <p className="text-xs text-gray-500 mt-1">We'll prioritize tutors available around this time (+/- 3 days).</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Max Hourly Budget ($)</label>
          <input
            type="number"
            name="budgetMax"
            value={formData.budgetMax}
            onChange={handleChange}
            min="0"
            step="0.01"
            placeholder="Optional"
            className="w-full p-2 border rounded-md"
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 font-medium"
        >
          {submitting ? 'Searching...' : 'Find Tutors'}
        </button>
      </form>
    </div>
  );
};

export default RequestTutor;