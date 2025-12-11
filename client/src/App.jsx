import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/authStore';
import { useThemeStore } from './store/themeStore';

// Layout Components
import MainLayout from './components/Layout/MainLayout';
import AuthLayout from './components/Layout/AuthLayout';

// Public Pages
import LandingPage from './pages/Public/LandingPage';
import CourseCatalog from './pages/Public/CourseCatalog';
import CourseDetail from './pages/Public/CourseDetail';

// Auth Pages
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import ForgotPassword from './pages/Auth/ForgotPassword';
import OAuthCallback from './pages/Auth/OAuthCallback';

// Student Pages
import StudentDashboard from './pages/Student/Dashboard';
import MyCourses from './pages/Student/MyCourses';
import CourseLesson from './pages/Student/CourseLesson';
import MyProgress from './pages/Student/MyProgress';
import LiveSessions from './pages/Student/LiveSessions';

// Tutor Pages
import TutorDashboard from './pages/Tutor/Dashboard';
import CourseBuilder from './pages/Tutor/CourseBuilder';
import CourseEditor from './pages/Tutor/CourseEditor';
import CourseCreationWizard from './pages/Tutor/CourseCreationWizard';
import LessonBuilder from './pages/Tutor/LessonBuilder';
import TutorAnalytics from './pages/Tutor/Analytics';
import SessionManagement from './pages/Tutor/SessionManagement';

// Admin Pages
import AdminDashboard from './pages/Admin/Dashboard';
import UserManagement from './pages/Admin/UserManagement';
import CourseApproval from './pages/Admin/CourseApproval';
import PlatformAnalytics from './pages/Admin/Analytics';

// Common Pages
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

// Protected Route Component
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  const { theme, fontSize } = useThemeStore();
  const { checkAuth } = useAuthStore();

  useEffect(() => {
    // Check authentication status on app load
    checkAuth();
  }, [checkAuth]);

  useEffect(() => {
    // Apply theme and font size to document
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.setAttribute('data-font-size', fontSize);
  }, [theme, fontSize]);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<MainLayout />}>
        <Route index element={<LandingPage />} />
        <Route path="courses" element={<CourseCatalog />} />
        <Route path="courses/:id" element={<CourseDetail />} />
      </Route>

      {/* Auth Routes */}
      <Route path="/" element={<AuthLayout />}>
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        <Route path="forgot-password" element={<ForgotPassword />} />
      </Route>

      {/* OAuth Callback Route */}
      <Route path="/auth/callback" element={<OAuthCallback />} />

      {/* Student Routes */}
      <Route
        path="/student"
        element={
          <ProtectedRoute allowedRoles={['STUDENT']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<StudentDashboard />} />
        <Route path="courses" element={<MyCourses />} />
        <Route path="courses/:courseId/lesson/:lessonId" element={<CourseLesson />} />
        <Route path="progress" element={<MyProgress />} />
        <Route path="sessions" element={<LiveSessions />} />
      </Route>

      {/* Tutor Routes */}
      <Route
        path="/tutor"
        element={
          <ProtectedRoute allowedRoles={['TUTOR', 'ADMIN']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<TutorDashboard />} />
        <Route path="courses" element={<CourseBuilder />} />
        <Route path="courses/create" element={<CourseCreationWizard />} />
        <Route path="courses/wizard" element={<CourseCreationWizard />} />
        <Route path="course-editor/new" element={<CourseEditor />} />
        <Route path="course-editor/:courseId" element={<CourseEditor />} />
        <Route path="courses/new" element={<CourseBuilder />} />
        <Route path="courses/:id/edit" element={<CourseBuilder />} />
        <Route path="courses/:courseId/lessons" element={<LessonBuilder />} />
        <Route path="courses/:courseId/lessons/new" element={<LessonBuilder />} />
        <Route path="lessons/:id/edit" element={<LessonBuilder />} />
        <Route path="analytics" element={<TutorAnalytics />} />
        <Route path="sessions" element={<SessionManagement />} />
      </Route>

      {/* Admin Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['ADMIN']}>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="users" element={<UserManagement />} />
        <Route path="courses/approval" element={<CourseApproval />} />
        <Route path="analytics" element={<PlatformAnalytics />} />
      </Route>

      {/* Common Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route path="profile" element={<Profile />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* 404 Page */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default App;
