I will implement the three requested features for the Tutor Dashboard.

### 1. Fix "View All Courses" (Redirect Issue)
The "View All Courses" link is broken because the route and page do not exist.
- **Frontend:** Create a new page `client/src/pages/Tutor/MyCourses.jsx` to list all courses created by the tutor.
- **Routing:** Add the route `/tutor/courses` in `client/src/App.jsx` pointing to this new page.
- **Integration:** Ensure the API `GET /api/tutor/courses` (which already exists) is correctly consumed.

### 2. Implement "Student Engagement" Page
This page will track student progress and quiz scores.
- **Backend:** Add a new endpoint `GET /api/tutor/analytics/engagement` in `tutor.controller.js` that fetches:
    - Enrolled students per course.
    - Their lesson completion progress (%).
    - Their quiz scores and pass/fail status.
- **Frontend:** Update the existing placeholder `client/src/pages/Tutor/Analytics.jsx` to display a detailed table of student performance.
- **Features:** Filter by course, view student names, progress bars, and quiz grades.

### 3. Implement "Session Statistics" Page
This page will show session completion rates and ratings.
- **Backend:** Add a new endpoint `GET /api/tutor/analytics/sessions` in `tutor.controller.js` that fetches:
    - Total sessions conducted.
    - Session completion rate.
    - Average student rating and reviews.
    - Earnings summary (optional/basic).
- **Frontend:** Create a new page `client/src/pages/Tutor/SessionReports.jsx`.
- **Routing:** Add the route `/tutor/reports` in `client/src/App.jsx`.
- **Features:** Charts or summary cards for ratings and completed sessions.

I will start by implementing the backend endpoints, then move to the frontend pages and routing.