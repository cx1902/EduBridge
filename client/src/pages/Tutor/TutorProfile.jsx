import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';

const TutorProfile = () => {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState({
    bio: '',
    hourlyRate: 0,
    languages: [],
    levelsSupported: [],
    subjects: [] // { subjectId, skillLevel }
  });
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  const LANGUAGES = ['English', 'Spanish', 'French', 'German', 'Chinese', 'Japanese'];
  const LEVELS = ['PRIMARY', 'SECONDARY', 'UNIVERSITY'];
  const SKILL_LEVELS = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'];

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, subjectsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tutor/profile`),
        axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tutoring/subjects`)
      ]);

      const profileData = profileRes.data.data;
      setProfile({
        bio: profileData.bio || '',
        hourlyRate: profileData.hourlyRate || 0,
        languages: profileData.languages || [],
        levelsSupported: profileData.levelsSupported || [],
        subjects: profileData.subjects.map(s => ({
          subjectId: s.subjectId,
          skillLevel: s.skillLevel
        }))
      });
      setAvailableSubjects(subjectsRes.data.data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setProfile(prev => ({ ...prev, [field]: value }));
  };

  const handleSubjectChange = (subjectId, isChecked) => {
    if (isChecked) {
      setProfile(prev => ({
        ...prev,
        subjects: [...prev.subjects, { subjectId, skillLevel: 'BEGINNER' }]
      }));
    } else {
      setProfile(prev => ({
        ...prev,
        subjects: prev.subjects.filter(s => s.subjectId !== subjectId)
      }));
    }
  };

  const handleSkillLevelChange = (subjectId, level) => {
    setProfile(prev => ({
      ...prev,
      subjects: prev.subjects.map(s => 
        s.subjectId === subjectId ? { ...s, skillLevel: level } : s
      )
    }));
  };

  const handleArrayChange = (field, item) => {
    setProfile(prev => {
      const list = prev[field];
      if (list.includes(item)) {
        return { ...prev, [field]: list.filter(i => i !== item) };
      }
      return { ...prev, [field]: [...list, item] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    try {
      await axios.put(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/tutor/profile`, profile);
      setMessage({ type: 'success', text: 'Profile updated successfully' });
    } catch (error) {
      setMessage({ type: 'error', text: error.response?.data?.error || 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Tutor Profile</h1>
      
      {message && (
        <div className={`p-4 mb-6 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-6">
        
        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
          <textarea
            value={profile.bio}
            onChange={(e) => handleChange('bio', e.target.value)}
            className="w-full p-2 border rounded-md h-32"
            placeholder="Tell students about yourself..."
          />
        </div>

        {/* Hourly Rate */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Hourly Rate ($)</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={profile.hourlyRate}
            onChange={(e) => handleChange('hourlyRate', e.target.value)}
            className="w-full p-2 border rounded-md max-w-xs"
          />
        </div>

        {/* Languages */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Languages Spoken</label>
          <div className="flex flex-wrap gap-2">
            {LANGUAGES.map(lang => (
              <button
                key={lang}
                type="button"
                onClick={() => handleArrayChange('languages', lang)}
                className={`px-3 py-1 rounded-full text-sm ${
                  profile.languages.includes(lang) 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {lang}
              </button>
            ))}
          </div>
        </div>

        {/* Education Levels */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Levels Supported</label>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map(level => (
              <button
                key={level}
                type="button"
                onClick={() => handleArrayChange('levelsSupported', level)}
                className={`px-3 py-1 rounded-full text-sm ${
                  profile.levelsSupported.includes(level) 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {level}
              </button>
            ))}
          </div>
        </div>

        {/* Subjects */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-4">Subjects & Skill Levels</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableSubjects.map(subject => {
              const isSelected = profile.subjects.some(s => s.subjectId === subject.id);
              const selectedSubject = profile.subjects.find(s => s.subjectId === subject.id);

              return (
                <div key={subject.id} className={`p-3 border rounded-lg ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{subject.name}</span>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) => handleSubjectChange(subject.id, e.target.checked)}
                      className="h-5 w-5 text-blue-600"
                    />
                  </div>
                  
                  {isSelected && (
                    <select
                      value={selectedSubject.skillLevel}
                      onChange={(e) => handleSkillLevelChange(subject.id, e.target.value)}
                      className="w-full p-1 text-sm border rounded"
                    >
                      {SKILL_LEVELS.map(level => (
                        <option key={level} value={level}>{level}</option>
                      ))}
                    </select>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Profile'}
          </button>
        </div>

      </form>
    </div>
  );
};

export default TutorProfile;