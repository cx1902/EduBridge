import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { FaTrophy, FaMedal, FaFire, FaStar, FaCrown, FaLock, FaChartLine } from 'react-icons/fa';
import './MyProgress.css';

const MyProgress = () => {
  const { token, user } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState([]);
  const [stats, setStats] = useState({
    totalPoints: 0,
    currentStreak: 0,
    rank: '-',
    level: 1
  });

  useEffect(() => {
    fetchProgressData();
  }, []);

  const fetchProgressData = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const config = { headers: { Authorization: `Bearer ${token}` } };

      // Fetch badges, streaks, and leaderboard data in parallel
      const [badgesRes, streakRes, leaderboardRes] = await Promise.allSettled([
        axios.get(`${API_URL}/gamification/badges/available`, config),
        axios.get(`${API_URL}/gamification/streaks`, config),
        axios.get(`${API_URL}/gamification/leaderboard?limit=10`, config) // Fetch top 10 to find user rank roughly
      ]);

      // Process Badges
      if (badgesRes.status === 'fulfilled' && badgesRes.value.data.success) {
        setBadges(badgesRes.value.data.data);
      }

      // Process Stats
      const newStats = {
        totalPoints: user?.totalPoints || 0,
        currentStreak: 0,
        rank: '-',
        level: Math.floor((user?.totalPoints || 0) / 1000) + 1 // Simple level calculation
      };

      if (streakRes.status === 'fulfilled' && streakRes.value.data.success) {
        newStats.currentStreak = streakRes.value.data.data.currentStreak;
      }

      if (leaderboardRes.status === 'fulfilled' && leaderboardRes.value.data.success) {
        const { currentUserRank, leaderboard } = leaderboardRes.value.data.data;
        // Try to find in top list, otherwise use currentUserRank
        const userInTop = leaderboard.find(u => u.isCurrentUser);
        if (userInTop) {
          newStats.rank = `#${userInTop.rank}`;
        } else if (currentUserRank) {
          newStats.rank = `#${currentUserRank.rank}`;
        }
      }

      setStats(newStats);

    } catch (error) {
      console.error('Error fetching progress data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBadgeIcon = (criteriaType, rarity) => {
    // Return icon based on type or rarity
    switch (criteriaType) {
      case 'SEVEN_DAY_STREAK': return <FaFire style={{ color: '#ef4444' }} />;
      case 'QUIZ_MASTER': return <FaStar style={{ color: '#fbbf24' }} />;
      case 'FIRST_COURSE': return <FaMedal style={{ color: '#8b5cf6' }} />;
      case 'CENTURY_CLUB': return <FaTrophy style={{ color: '#10b981' }} />;
      default: return <FaMedal style={{ color: '#6366f1' }} />;
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="progress-container">
      <div className="progress-header">
        <h1>My Learning Journey</h1>
        <p>Track your achievements, streaks, and badges as you learn.</p>
      </div>

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card-progress stat-xp">
          <div className="stat-icon-wrapper">
            <FaStar />
          </div>
          <div className="stat-info">
            <h3>Total XP</h3>
            <div className="value">{stats.totalPoints}</div>
          </div>
        </div>

        <div className="stat-card-progress stat-streak">
          <div className="stat-icon-wrapper">
            <FaFire />
          </div>
          <div className="stat-info">
            <h3>Day Streak</h3>
            <div className="value">{stats.currentStreak} 🔥</div>
          </div>
        </div>

        <div className="stat-card-progress stat-rank">
          <div className="stat-icon-wrapper">
            <FaCrown />
          </div>
          <div className="stat-info">
            <h3>Global Rank</h3>
            {/* If rank is very high, just show Top X% maybe? For now showing exact rank */}
            <div className="value">{stats.rank}</div>
          </div>
        </div>

        <div className="stat-card-progress stat-level">
          <div className="stat-icon-wrapper">
            <FaChartLine />
          </div>
          <div className="stat-info">
            <h3>Current Level</h3>
            <div className="value">Lvl {stats.level}</div>
          </div>
        </div>
      </div>

      {/* Badges Section */}
      <div className="badges-section">
        <div className="section-title">
          <FaTrophy style={{ color: '#fbbf24' }} />
          <h2>Badges & Achievements</h2>
        </div>

        <div className="badges-grid">
          {badges.map((badge) => (
            <div
              key={badge.id}
              className={`badge-card ${badge.isEarned ? 'earned' : 'locked'}`}
              title={badge.description}
            >
              <div className="badge-icon">
                {getBadgeIcon(badge.criteriaType, badge.rarity)}
              </div>
              <div className="badge-name">{badge.name}</div>
              <div className="badge-desc">{badge.description}</div>

              {badge.isEarned ? (
                <div className="earned-details">
                  <div className="badge-status">Earned</div>
                  <div className="earned-date">
                    on {new Date(badge.earnedAt).toLocaleDateString()}
                  </div>
                  {badge.course && (
                    <div className="earned-course">
                      in {badge.course.title}
                    </div>
                  )}
                </div>
              ) : (
                <div className="badge-progress-container">
                  <div className="badge-status">Locked</div>
                  {badge.target > 0 && (
                    <div className="badge-progress">
                      <div className="progress-track">
                        <div
                          className="progress-fill"
                          style={{ width: `${Math.min(badge.progressPercentage, 100)}%` }}
                        ></div>
                      </div>
                      <div className="progress-text" style={{ width: '100%', textAlign: 'center', display: 'block' }}>
                        {badge.progress} / {badge.target}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {badges.length === 0 && (
            <p style={{ color: '#9ca3af', gridColumn: '1/-1', textAlign: 'center' }}>
              No badges available yet. Start your learning journey to earn some!
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyProgress;
