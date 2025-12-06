# EduBridge - Modern Learning Platform

EduBridge is a comprehensive learning platform that combines self-paced courses, live tutoring, interactive assessments, and gamification to create an engaging educational experience.

## Features

### For Students

- 📚 Browse and enroll in courses across multiple subjects and education levels
- 🎥 Watch video lessons with progress tracking
- 📝 Take interactive quizzes with instant feedback
- 🏆 Earn points, badges, and maintain learning streaks
- 👨‍🏫 Book live tutoring sessions with qualified tutors
- 📊 Track progress with detailed analytics dashboard
- 🌙 Dark mode and accessibility features

### For Tutors

- 📖 Create and manage courses with rich content
- ✏️ Build lessons with videos, notes, and quizzes
- 📅 Schedule and conduct live tutoring sessions
- 📈 Monitor student performance and engagement
- 💰 Track earnings and revenue

### For Administrators

- 👥 Manage users and roles
- ✅ Review and approve course submissions
- 📊 Access platform-wide analytics
- ⚙️ Configure system settings

## Tech Stack

### Backend

- Node.js with Express.js
- PostgreSQL database
- Prisma ORM
- JWT authentication
- bcrypt for password hashing

### Frontend

- React with Vite
- React Router for navigation
- Axios for API calls
- Zustand for state management
- React Query for data fetching

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone <repository-url>
cd EB
```

2. Install server dependencies

```bash
cd server
npm install
```

3. Install client dependencies

```bash
cd ../client
npm install
```

4. Setup database

```bash
cd ../server
# Copy .env.example to .env and update DATABASE_URL
cp .env.example .env

# Run Prisma migrations
npm run prisma:migrate

# Seed the database
npm run prisma:seed
```

5. Start the development servers

Terminal 1 (Backend):

```bash
cd server
npm run dev
```

Terminal 2 (Frontend):

```bash
cd client
npm run dev
```

The application will be available at:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Health Check: http://localhost:3000/health

### Default Login Credentials

After seeding the database, you can login with:

**Admin Account:**

- Email: admin@edubridge.com
- Password: Admin@123

**Tutor Account:**

- Email: tutor@edubridge.com
- Password: Tutor@123

**Student Account:**

- Email: student@edubridge.com
- Password: Student@123

## Project Structure

```
EB/
├── server/                 # Backend application
│   ├── prisma/            # Database schema and migrations
│   │   ├── schema.prisma  # Prisma schema definition
│   │   └── seed.js        # Database seeding script
│   ├── src/
│   │   ├── controllers/   # Request handlers
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Custom middleware
│   │   ├── utils/         # Utility functions
│   │   └── server.js      # Express app entry point
│   ├── .env               # Environment variables
│   └── package.json
│
└── client/                # Frontend application
    ├── src/
    │   ├── components/    # Reusable React components
    │   ├── pages/         # Page components
    │   ├── store/         # State management
    │   ├── api/           # API client functions
    │   ├── utils/         # Utility functions
    │   └── App.jsx        # Main app component
    └── package.json
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh-token` - Refresh access token
- `POST /api/auth/forgot-password` - Request password reset
- `POST /api/auth/reset-password` - Reset password
- `GET /api/auth/verify-email/:token` - Verify email address
- `GET /api/auth/me` - Get current user

### Courses

- `GET /api/courses` - Get all courses
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create course (Tutor/Admin)
- `PUT /api/courses/:id` - Update course (Tutor/Admin)
- `DELETE /api/courses/:id` - Delete course (Tutor/Admin)
- `POST /api/courses/:id/enroll` - Enroll in course

### User Management

- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `PUT /api/users/preferences` - Update user preferences

### Admin

- `GET /api/admin/users` - Get all users
- `GET /api/admin/courses/pending` - Get pending courses
- `POST /api/admin/courses/:id/approve` - Approve course
- `POST /api/admin/courses/:id/reject` - Reject course
- `GET /api/admin/analytics` - Get platform analytics

## Database Schema

The application uses PostgreSQL with Prisma ORM. Key entities include:

- Users (students, tutors, admins)
- Courses and Lessons
- Quizzes and Questions
- Enrollments and Progress
- Badges and Points
- Tutoring Sessions
- Transactions

See `server/prisma/schema.prisma` for the complete schema definition.

## Development

### Running Prisma Studio

```bash
cd server
npm run prisma:studio
```

### Creating Database Migrations

```bash
cd server
npm run prisma:migrate
```

### Generating Prisma Client

```bash
cd server
npm run prisma:generate
```

## Future Enhancements

- Payment integration (Stripe/PayPal)
- Video conferencing integration (Agora/Twilio)
- Email notifications
- File upload for videos and documents
- Advanced analytics and reporting
- Mobile applications (iOS/Android)
- Social learning features
- AI-powered recommendations

## License

This project is licensed under the ISC License.

## Support

For support, please contact the development team or create an issue in the repository.
