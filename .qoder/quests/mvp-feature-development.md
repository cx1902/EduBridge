# MVP Feature Development Design - Tutor Features Focus

## Overview
This document outlines the high-level design for implementing the Minimum Viable Product (MVP) tutor features for the EduBridge platform. The focus is on empowering tutors to create comprehensive courses, manage lessons and quizzes, schedule and conduct live sessions, and monitor their teaching activities through a centralized dashboard.

## Functional Requirements

### Tutor Functions (MVP)

#### Tutor Dashboard
**Purpose**: Provide tutors with a centralized command center for monitoring and managing their teaching activities.

**Core Capabilities**:
- Display today's scheduled sessions with countdown timers and quick join links
- Show unread Q&A items requiring tutor attention
- Present new course enrollments with student names and enrollment dates
- Provide summary statistics: total active students, published courses count, upcoming sessions count
- Quick action buttons: Create Course, Schedule Session, View All Courses
- Navigation shortcuts to key tutor tools and settings

**Information Architecture**:
- Top section: Session alerts and time-sensitive notifications
- Middle section: Activity feed (new enrollments, quiz submissions awaiting review)
- Bottom section: Performance summary cards (student count, course ratings, revenue overview)
- Side panel: Quick links to course builder, lesson editor, scheduling calendar

#### Course Builder
**Purpose**: Enable tutors to create, configure, and manage course structures and metadata.

**Core Capabilities**:
- Create new courses with essential metadata
- Edit existing course information
- Manage course visibility (publish/unpublish toggle)
- Delete courses with proper safeguards
- Organize courses by subject and difficulty level
- Upload and manage course cover images

**Course Configuration Fields**:
- Title: Text input, 5-200 characters, required
- Description: Rich text editor, minimum 50 characters, required
- Level: Dropdown selection (Beginner, Intermediate, Advanced), required
- Subject/Category: Selection from predefined taxonomy, required
- Cover Image: Upload interface with preview, optional (JPEG/PNG/WebP, max 5MB)
- Tags: Multi-select or tag input for searchability, optional
- Pricing: Free or paid designation with amount field, required
- Published Status: Toggle switch with confirmation prompt

**Course Management Views**:
- Course list view: Grid or table showing all tutor's courses with status indicators
- Course detail view: Comprehensive overview with lessons, quizzes, and enrollment stats
- Course editing interface: Form-based editor with auto-save functionality

#### Lesson Editor
**Purpose**: Allow tutors to create rich, multimedia lesson content within courses.

**Core Capabilities**:
- Create and edit individual lessons
- Support rich text formatting and MDX syntax for advanced layouts
- Integrate video content through URL linking or direct file upload
- Attach supplementary materials (PDFs, documents, images)
- Define lesson sequence and estimated duration
- Preview lessons before publishing
- Reorder lessons via drag-and-drop interface

**Lesson Configuration Fields**:
- Title: Text input, 5-150 characters, required
- Content: Rich text/MDX editor with formatting toolbar, required
- Video Source: Toggle between URL input or file upload
  - URL: Validation for supported platforms (YouTube, Vimeo, direct MP4)
  - Upload: File selector supporting MP4/WebM, max 500MB with upload progress indicator
- Attachments: Multi-file upload interface, each file max 20MB
- Sort Order: Automatic assignment with manual override option
- Estimated Duration: Number input in minutes, optional
- Visibility: Draft or published status

**Editor Features**:
- Auto-save mechanism every 30 seconds
- Version history tracking for content recovery
- Multimedia preview pane
- Accessibility checker for content compliance
- Mobile preview mode

#### Quiz Builder
**Purpose**: Provide tools for creating assessments to evaluate student learning.

**Core Capabilities**:
- Create quizzes associated with courses or individual lessons
- Build question banks with multiple question types
- Configure quiz behavior and grading rules
- Set passing thresholds and retake policies
- Provide explanatory feedback for answers

**Quiz Configuration**:
- Title: Text input, required
- Passing Score: Percentage input, optional (default 70%)
- Retake Attempts: Number input or unlimited option
- Show Correct Answers: Toggle to display/hide answers after submission
- Shuffle Questions: Randomize question order for each attempt
- Time Limit: Optional timer in minutes

**Question Types**:

1. Multiple Choice Question (MCQ):
   - Question text: Rich text editor
   - Answer options: Minimum 2, maximum 10 options
   - Correct answer designation: Single selection
   - Explanation: Optional feedback text
   - Point value: Integer input

2. True/False Question:
   - Question text: Rich text editor
   - Correct answer: True or False selection
   - Explanation: Optional feedback text
   - Point value: Integer input

3. Short Answer Question:
   - Question text: Rich text editor
   - Model answer: Text input for reference
   - Grading rubric: Optional scoring guidelines
   - Point value: Integer input

**Question Management**:
- Add, edit, delete, duplicate questions
- Reorder questions via drag-and-drop
- Question preview with student perspective
- Bulk import from CSV or JSON template
- Export question bank for reuse

#### Scheduling System
**Purpose**: Allow tutors to define availability and manage session bookings.

**Core Capabilities**:
- Create availability blocks on calendar
- Define recurring availability patterns
- Set buffer times between consecutive sessions
- Configure session capacity (one-on-one or group workshops)
- View and manage booked sessions
- Cancel or reschedule sessions with student notifications

**Availability Configuration**:
- Date and time range selection with visual calendar interface
- Duration: Minimum 15 minutes, selectable in 15-minute increments
- Recurrence pattern: One-time, daily, weekly, custom intervals
- Buffer time: 0-60 minutes before/after sessions
- Maximum capacity: 1-50 students per session
- Session type: One-on-one tutoring or group workshop
- Pricing: Free or paid with amount specification

**Scheduling Workflows**:
- Conflict detection: Prevent overlapping availability blocks
- Booking confirmations: Automated notifications to tutor and students
- Cancellation policies: Time-based rules (e.g., 24-hour notice requirement)
- Rescheduling requests: Student-initiated with tutor approval

**Calendar Views**:
- Day view: Hourly breakdown with session details
- Week view: 7-day overview with color-coded sessions
- Month view: High-level availability snapshot
- Agenda list: Chronological session list with filters

#### Live Session Management
**Purpose**: Facilitate real-time interactive tutoring sessions via video conferencing.

**Core Capabilities**:
- Initiate live sessions at scheduled times
- Conduct video and audio communication
- Enable text-based chat during sessions
- Share files and links with participants
- Track attendance automatically
- Record session notes and summaries
- End sessions with wrap-up prompts

**Session Interface Components**:
- Video conference window: Primary display for tutor and student cameras
- Participant panel: List of attendees with status indicators
- Chat panel: Real-time messaging with message history
- File sharing area: Drag-and-drop upload with instant sharing
- Whiteboard/screen sharing: Visual collaboration tools
- Session timer: Countdown or elapsed time display
- Controls: Mute, camera toggle, screen share, end session buttons

**Session Flow**:
1. Pre-session: Tutor sees "Start Session" button 10 minutes before scheduled time
2. Session start: System generates video room and sends join links to students
3. During session: Tutor conducts lesson, monitors chat, shares resources
4. Attendance tracking: System logs join/leave times automatically
5. Session end: Tutor clicks "End Session" and is prompted for notes
6. Post-session: Notes, chat logs, and shared files saved to course materials

**Session Features**:
- Breakout rooms for group sessions (divide students into smaller groups)
- Polls and quizzes during live session for real-time feedback
- Recording capability with student consent management
- Closed captions and transcription for accessibility

### Supporting Infrastructure for Tutor Features

#### Authentication & Authorization
- Tutor role verification for accessing course management features
- Session-based authentication to maintain tutor identity across operations
- Permission checks ensuring tutors can only modify their own content
- Admin override capability for content moderation and platform management

#### File Management
- Secure upload mechanism with virus scanning
- Support for course cover images (JPEG, PNG, WebP)
- Video file handling for direct uploads or URL linking
- Attachment storage for lesson materials (PDF, DOCX, images)
- File size and type validation with clear error messaging
- Content Delivery Network (CDN) integration for fast media delivery

#### Data Persistence
- Course metadata storage with version tracking
- Lesson content storage with ordering and relationships to courses
- Quiz question banks with answer keys and scoring configurations
- Scheduling data for availability blocks and session bookings
- Session records with attendance, chat logs, and notes
- Relational integrity ensuring cascading updates/deletes

#### Notification Integration
- Alert tutors when new students enroll in their courses
- Remind tutors of upcoming sessions 15 minutes before start time
- Notify tutors when students ask questions (future Q&A feature)
- Send confirmation emails for booking and cancellation events
- Deliver system announcements and platform updates

## Non-Functional Requirements

### Performance
- Course builder page load time under 2 seconds
- Lesson editor text input responsiveness under 200 milliseconds
- Video upload with resumable chunks for large files
- Live session support for up to 50 concurrent workshops
- Dashboard data refresh within 1 second

### Usability
- Intuitive drag-and-drop interfaces for lesson and question reordering
- Inline validation with immediate feedback on form inputs
- Auto-save functionality to prevent content loss
- Responsive design supporting desktop and tablet devices
- Contextual help tooltips and documentation links

### Reliability
- 99.5% uptime for course management features
- 99.9% uptime for live session infrastructure
- Automatic retry for failed file uploads
- Graceful degradation when video conferencing service is unavailable
- Data backup and recovery procedures

### Scalability
- Support for 10,000 active tutors on the platform
- Handle 1,000 concurrent live sessions
- Store up to 100,000 courses with millions of lessons
- Efficiently query and filter large course catalogs

### Security
- All tutor endpoints require authentication and role verification
- Content sanitization to prevent XSS attacks in rich text fields
- File upload scanning for malware and malicious content
- Encryption of session chat logs and sensitive data at rest
- Rate limiting to prevent abuse (e.g., max 5 courses created per day)

## Implementation Strategy

### Phase 1: Tutor Dashboard Foundation
1. Create tutor-specific dashboard layout and navigation structure
2. Display today's scheduled sessions with countdown timers
3. Show new enrollment notifications with course breakdown
4. Provide quick action buttons for common tasks (create course, schedule session)
5. Implement summary statistics (total students, active courses, upcoming sessions)
6. Add notification center for platform alerts

### Phase 2: Course Builder
1. Design course creation form with field validation
2. Implement course metadata management (title, description, level, subject)
3. Add cover image upload with preview and cropping functionality
4. Create publish/unpublish toggle with status indicators
5. Build course listing view for tutors to manage multiple courses
6. Enable course editing workflow with auto-save
7. Implement course deletion with confirmation and safeguards

### Phase 3: Lesson Editor
1. Develop rich text editor interface with formatting toolbar
2. Integrate MDX support for advanced content formatting
3. Implement video integration with URL input and file upload options
4. Create attachment management system for supplementary files
5. Build drag-and-drop lesson reordering interface
6. Add lesson duration estimation field
7. Enable lesson preview mode before publishing
8. Implement auto-save with version history

### Phase 4: Quiz Builder
1. Design question creation interface with type selection dropdown
2. Implement multiple-choice question builder with dynamic option inputs
3. Create true/false question format with explanation field
4. Build short answer question template with model answer
5. Add correct answer designation and feedback fields
6. Implement point value assignment per question
7. Create quiz preview functionality from student perspective
8. Enable question bank management (add, edit, delete, reorder, duplicate)
9. Add bulk import/export capabilities

### Phase 5: Scheduling System
1. Design availability calendar interface with day/week/month views
2. Implement time slot creation with date/time pickers
3. Add buffer time configuration between consecutive sessions
4. Create recurring availability pattern support (daily, weekly, custom)
5. Build session capacity controls for one-on-one and workshop sessions
6. Implement booking confirmation workflow with notifications
7. Enable schedule modification and cancellation with student alerts
8. Add conflict detection to prevent double-booking

### Phase 6: Live Session Management
1. Integrate real-time video conferencing solution (WebRTC, Agora, or Twilio)
2. Create session start/end controls with automatic timer display
3. Build attendance tracking interface with participant list
4. Implement in-session chat functionality with message persistence
5. Add file/link sharing capabilities during live sessions
6. Create post-session notes interface with rich text editor
7. Implement automatic session summary generation and storage
8. Enable optional session recording with consent management
9. Add screen sharing and whiteboard collaboration tools

## Data Model Requirements

### Course Entity
- Unique identifier (UUID or auto-increment)
- Title (string, required, max 200 characters)
- Description (rich text, required, min 50 characters)
- Level (enumeration: Beginner, Intermediate, Advanced)
- Subject/Category (reference to subject taxonomy)
- Cover image URL (string, optional)
- Pricing type (enumeration: Free, Paid)
- Price amount (decimal, required if paid)
- Published status (boolean, default false)
- Created by tutor (foreign key to user entity)
- Created timestamp
- Updated timestamp

### Lesson Entity
- Unique identifier
- Course association (foreign key to course)
- Title (string, required, max 150 characters)
- Content (rich text/MDX, required)
- Video URL (string, optional)
- Video file reference (file storage path, optional)
- Attachments (JSON array of file references)
- Sort order (integer, for sequencing within course)
- Estimated duration (integer, in minutes, optional)
- Published status (boolean, default true)
- Created timestamp
- Updated timestamp

### Quiz Entity
- Unique identifier
- Course or lesson association (foreign key)
- Title (string, required, max 100 characters)
- Passing score threshold (integer, percentage, default 70)
- Retake attempts allowed (integer, null for unlimited)
- Show correct answers (boolean, default true)
- Shuffle questions (boolean, default false)
- Time limit (integer, in minutes, optional)
- Created timestamp
- Updated timestamp

### Question Entity
- Unique identifier
- Quiz association (foreign key to quiz)
- Question text (rich text, required)
- Question type (enumeration: MultipleChoice, TrueFalse, ShortAnswer)
- Options (JSON array, for MCQ)
- Correct answer(s) (varies by type: string, boolean, or array)
- Explanation (rich text, optional)
- Point value (integer, default 1)
- Sort order (integer, for sequencing within quiz)

### Availability Block Entity
- Unique identifier
- Tutor reference (foreign key to user)
- Start date and time
- End date and time
- Recurrence pattern (JSON: frequency, interval, end date)
- Buffer time (integer, in minutes, default 0)
- Maximum capacity (integer, default 1)
- Session type (enumeration: OneOnOne, Workshop)
- Pricing type (enumeration: Free, Paid)
- Price amount (decimal, required if paid)
- Status (enumeration: Available, Booked, PartiallyBooked, Cancelled)

### Session Entity
- Unique identifier
- Availability block reference (foreign key)
- Tutor reference (foreign key to user)
- Student references (JSON array or junction table for workshops)
- Session type (enumeration: OneOnOne, Workshop)
- Scheduled start time
- Scheduled end time
- Actual start time
- Actual end time
- Status (enumeration: Scheduled, InProgress, Completed, Cancelled, NoShow)
- Video room URL or ID
- Session notes (rich text, optional)
- Chat log (JSON array of messages)
- Shared files (JSON array of file references)
- Attendance records (embedded or referenced)

## Technical Architecture

### Frontend Components

#### Tutor Dashboard Page
- Summary statistics cards component (students, courses, sessions)
- Today's sessions timeline component with countdown timers
- New enrollments list component with student profiles
- Quick actions toolbar component with prominent CTAs
- Navigation menu to course management, scheduling, analytics
- Notification bell with dropdown for recent alerts

#### Course Builder Interface
- Course form component with field validation and error display
- Image upload component with cropping and preview
- Rich text editor for course description with formatting toolbar
- Subject/level/tag selector components with search
- Publish status toggle component with confirmation modal
- Course list/grid view component with filtering and sorting
- Course detail view with nested lesson/quiz listings

#### Lesson Editor Interface
- MDX-enabled text editor component with syntax highlighting
- Video input component supporting both URL and file upload modes
- Attachment manager component with drag-and-drop upload
- Drag-and-drop lesson sorter component with visual feedback
- Lesson preview modal component rendering student view
- Auto-save indicator with last saved timestamp
- Version history drawer for content recovery

#### Quiz Builder Interface
- Question type selector component (dropdown or segmented control)
- Dynamic question editor component adapting to selected type
- MCQ option manager component with add/remove buttons
- Answer key designator component with visual indicators
- Explanation field component for feedback text
- Point value input component with validation
- Quiz preview component simulating student experience
- Question list with reorder handles and action buttons

#### Scheduling Interface
- Calendar view component supporting day/week/month displays
- Time slot creator modal with date/time pickers
- Recurring pattern selector component with frequency options
- Session capacity input component with validation
- Buffer time slider component
- Booking list component with filters (upcoming, past, cancelled)
- Session detail modal with student information

#### Live Session Interface
- Video conference embed component with responsive layout
- Chat panel component with scrollable message history
- Participant list component with status indicators (joined, left, muted)
- File sharing panel component with upload progress
- Screen sharing controls component
- Whiteboard component for visual collaboration
- Session notes editor component with rich text support
- Session timer display component with elapsed/remaining time
- Control bar with mute, camera, screen share, end session buttons

### Backend API Endpoints

#### Dashboard Endpoints
- `GET /api/tutor/dashboard/stats` - Retrieve summary statistics (students, courses, sessions)
- `GET /api/tutor/dashboard/sessions/today` - Fetch today's scheduled sessions
- `GET /api/tutor/dashboard/enrollments/recent` - Get recent course enrollments (last 7 days)
- `GET /api/tutor/dashboard/notifications` - Retrieve unread notifications

#### Course Management Endpoints
- `POST /api/tutor/courses` - Create new course
- `GET /api/tutor/courses` - List all courses by authenticated tutor
- `GET /api/tutor/courses/:id` - Retrieve specific course details with lessons/quizzes
- `PUT /api/tutor/courses/:id` - Update course information
- `DELETE /api/tutor/courses/:id` - Delete course (with validation checks)
- `PATCH /api/tutor/courses/:id/publish` - Toggle publish status

#### Lesson Management Endpoints
- `POST /api/tutor/courses/:courseId/lessons` - Create lesson in course
- `GET /api/tutor/courses/:courseId/lessons` - List all lessons in course
- `GET /api/tutor/lessons/:id` - Retrieve lesson details
- `PUT /api/tutor/lessons/:id` - Update lesson content and metadata
- `DELETE /api/tutor/lessons/:id` - Delete lesson
- `PATCH /api/tutor/lessons/reorder` - Update lesson sequence (bulk operation)

#### Quiz Management Endpoints
- `POST /api/tutor/courses/:courseId/quizzes` - Create quiz for course
- `GET /api/tutor/quizzes/:id` - Retrieve quiz details with questions
- `PUT /api/tutor/quizzes/:id` - Update quiz configuration
- `DELETE /api/tutor/quizzes/:id` - Delete quiz
- `POST /api/tutor/quizzes/:quizId/questions` - Add question to quiz
- `PUT /api/tutor/questions/:id` - Update question
- `DELETE /api/tutor/questions/:id` - Delete question
- `PATCH /api/tutor/questions/reorder` - Update question sequence

#### Scheduling Endpoints
- `POST /api/tutor/availability` - Create availability block
- `GET /api/tutor/availability` - List tutor's availability blocks
- `PUT /api/tutor/availability/:id` - Update availability block
- `DELETE /api/tutor/availability/:id` - Remove availability block
- `GET /api/tutor/sessions` - List all sessions (with filters: upcoming, past, status)
- `GET /api/tutor/sessions/:id` - Retrieve session details
- `PATCH /api/tutor/sessions/:id/cancel` - Cancel session with notification

#### Live Session Endpoints
- `POST /api/tutor/sessions/:id/start` - Initiate live session, generate video room
- `PATCH /api/tutor/sessions/:id/end` - End live session, finalize attendance
- `POST /api/tutor/sessions/:id/notes` - Save or update session notes
- `GET /api/tutor/sessions/:id/attendance` - Retrieve attendance records
- `POST /api/tutor/sessions/:id/share` - Share file or link during session
- `GET /api/tutor/sessions/:id/chat` - Retrieve chat log

#### File Upload Endpoints
- `POST /api/tutor/upload/course-cover` - Upload course cover image
- `POST /api/tutor/upload/video` - Upload lesson video (chunked upload support)
- `POST /api/tutor/upload/attachment` - Upload lesson attachment
- `POST /api/tutor/upload/session-file` - Upload file during live session

## Business Logic & Workflows

### Course Creation Workflow
1. Tutor navigates to course builder from dashboard or quick action button
2. System presents course creation form with empty fields
3. Tutor fills in required fields (title, description, level, subject)
4. Tutor optionally uploads cover image with preview and cropping
5. System validates input (title length, description minimum, valid level)
6. On validation success, system saves course as draft (unpublished status)
7. System generates unique course ID and returns tutor to course detail view
8. Success message displayed: "Course created successfully. Add lessons to get started."
9. Tutor can immediately begin adding lessons or return to course list

### Lesson Creation Workflow
1. Tutor selects a course from dashboard or course list
2. Tutor clicks "Add Lesson" button in course detail view
3. System displays lesson editor interface with blank content
4. Tutor enters lesson title and content using rich text editor
5. Tutor optionally adds video by pasting URL or uploading file
6. If uploading video, system shows upload progress and validates format/size
7. Tutor optionally attaches supplementary files (PDFs, documents)
8. Tutor sets estimated duration and system auto-assigns sort order
9. System validates lesson data (title length, content presence)
10. On save, lesson is added to course and appears in lesson list
11. Lesson is immediately visible in tutor's course view for further editing
12. Auto-save runs every 30 seconds to prevent content loss

### Quiz Creation Workflow
1. Tutor navigates to quiz builder from course detail view
2. System presents quiz configuration form (title, passing score, retake rules)
3. Tutor fills in quiz settings and clicks "Add Questions"
4. For each question:
   - Tutor selects question type (MCQ, True/False, Short Answer)
   - Editor adapts to show appropriate input fields
   - Tutor enters question text using rich text editor
   - For MCQ: Tutor adds options (minimum 2), designates correct answer
   - For True/False: Tutor selects correct answer (true or false)
   - For Short Answer: Tutor enters model answer and optional rubric
   - Tutor adds optional explanation for feedback
   - Tutor assigns point value (default 1)
5. System validates each question (required fields, correct answer designated)
6. Tutor can preview quiz from student perspective before finalizing
7. On save, quiz becomes part of course content structure
8. Quiz is available for student attempts once course is published

### Scheduling Workflow
1. Tutor accesses scheduling interface from dashboard or navigation menu
2. System displays calendar with existing availability blocks color-coded
3. Tutor clicks on calendar date/time to create new availability block
4. Modal appears with configuration options:
   - Date and time range selection
   - Buffer time slider (0-60 minutes)
   - Maximum capacity input (1-50 students)
   - Session type selection (one-on-one or workshop)
   - Recurrence pattern (one-time, daily, weekly, custom)
   - Pricing (free or paid with amount)
5. System validates input and checks for conflicts with existing blocks
6. If conflict detected, system highlights conflicting blocks and prevents creation
7. If no conflicts, system saves availability block and displays on calendar
8. Block becomes immediately bookable by students matching criteria
9. When student books session:
   - System creates session record linked to availability block
   - Updates block status (Booked or PartiallyBooked if workshop)
   - Sends confirmation email to tutor and student
   - Adds session to tutor's dashboard "Today's Sessions" (if today)
10. Tutor can modify or cancel availability blocks with automatic student notifications

### Live Session Workflow
1. Session appears on tutor dashboard with "Start Session" button (available 10 minutes before scheduled time)
2. Tutor clicks "Start Session" at or near scheduled time
3. System performs pre-session checks:
   - Verifies video conferencing service availability
   - Generates unique video room URL or ID
   - Updates session status to "InProgress"
4. System sends join link notifications to enrolled students via email and in-app
5. Tutor enters video room and waits for students to join
6. System tracks attendance automatically (join time, leave time)
7. During session:
   - Tutor conducts lesson using video, audio, screen sharing
   - Participants use chat for questions and discussions
   - Tutor shares files or links via sharing panel
   - System persists chat messages and shared files in real-time
   - Session timer displays elapsed time
8. Tutor clicks "End Session" when complete
9. System prompts tutor to add session notes/summary
10. Tutor enters notes using rich text editor (optional but encouraged)
11. System finalizes session:
    - Updates status to "Completed"
    - Saves attendance records
    - Stores chat log and shared files
    - Makes session materials accessible to students in course view
12. Post-session, students can review notes, chat log, and access shared resources

### Course Publishing Workflow
1. Tutor reviews course content (lessons, quizzes, metadata) in course detail view
2. Tutor clicks "Publish Course" button or toggle
3. System performs validation checks:
   - At least one lesson exists in the course
   - All required metadata fields are populated (title, description, level, subject)
   - No broken video links or missing attachments in lessons
   - Cover image is present (optional but recommended)
4. If validation fails, system displays specific error messages and prevents publishing
5. If validation passes, system shows confirmation modal: "Are you sure you want to publish this course? It will be visible to all students."
6. Tutor confirms publication
7. System updates course published status to true
8. Course immediately appears in student catalog and search results
9. System sends notification to tutor: "Course published successfully"
10. Tutor can unpublish at any time to make updates (triggers confirmation to avoid accidental unpublish)
11. Unpublishing removes course from catalog but preserves enrolled students' access

## Validation Rules

### Course Validation
- **Title**: Required, 5-200 characters, must be unique per tutor
- **Description**: Required, minimum 50 characters, rich text format
- **Level**: Required, must be one of: Beginner, Intermediate, Advanced
- **Subject**: Required, must reference existing subject in taxonomy
- **Cover Image**: Optional, if provided:
  - Valid image format (JPEG, PNG, WebP)
  - Maximum file size 5MB
  - Minimum dimensions 400x300 pixels recommended
- **Pricing Type**: Required, must be Free or Paid
- **Price Amount**: Required if pricing type is Paid, must be positive decimal

### Lesson Validation
- **Title**: Required, 5-150 characters
- **Content**: Required, minimum 20 characters
- **Video URL**: Optional, if provided:
  - Must be valid URL format
  - Supported platforms: YouTube, Vimeo, or direct MP4/WebM link
- **Video File**: Optional, if provided:
  - Maximum file size 500MB
  - Supported formats: MP4, WebM
  - Minimum resolution 480p recommended
- **Attachments**: Optional, each file:
  - Maximum size 20MB per file
  - Allowed formats: PDF, DOCX, PPTX, images (JPEG, PNG), ZIP
- **Sort Order**: Required, must be positive integer, unique within course
- **Duration**: Optional, if provided must be positive integer (minutes)

### Quiz Validation
- **Title**: Required, 5-100 characters
- **Passing Score**: Optional, if provided must be 0-100 (percentage)
- **Retake Attempts**: Optional, if provided must be positive integer or unlimited
- **Must contain at least one question** for quiz to be considered complete
- **Time Limit**: Optional, if provided must be positive integer (minutes)

### Question Validation
- **Question Text**: Required, minimum 10 characters
- **Question Type**: Required, must be MultipleChoice, TrueFalse, or ShortAnswer
- **For Multiple Choice**:
  - Minimum 2 options, maximum 10 options
  - Each option: required, 1-200 characters
  - Exactly one correct answer must be designated
- **For True/False**:
  - Correct answer must be explicitly set to true or false
- **For Short Answer**:
  - Model answer recommended (optional)
  - Grading rubric recommended for consistent scoring
- **Explanation**: Optional, maximum 500 characters
- **Point Value**: Required, must be positive integer (typically 1-10)

### Availability Block Validation
- **Start Time**: Required, must be in the future for new blocks (at least 1 hour ahead)
- **End Time**: Required, must be after start time
- **Duration**: Minimum 15 minutes, maximum 8 hours
- **Buffer Time**: Optional, 0-60 minutes
- **Max Capacity**: Required, 1-50 students
- **No Overlapping Blocks**: System must prevent creation of overlapping availability for same tutor
- **Session Type**: Required, must be OneOnOne or Workshop
- **Pricing**: If paid, amount must be positive decimal

### Session Validation
- **Cannot start session more than 15 minutes before scheduled time**
- **Cannot start session if tutor has another active (InProgress) session**
- **Cancellation requires reason if within 24 hours of scheduled time**
- **Attendance records must have valid join/leave timestamps**

## Error Handling

### Course Management Errors

**Duplicate Course Title**:
- Detection: When tutor attempts to create course with same title as existing course by same tutor
- Response: Display warning message: "You already have a course with this title. Please choose a unique title."
- Suggestion: Append version number or year (e.g., "Intro to Math 2024")

**Missing Required Fields**:
- Detection: Form validation on submit
- Response: Highlight missing fields in red, display inline error messages
- Prevention: Disable submit button until all required fields are valid

**Image Upload Failure**:
- Detection: Upload timeout, network error, or server error
- Response: Retry mechanism (up to 3 attempts), then fallback to default placeholder
- User notification: "Image upload failed. Using default image. You can update it later."

**Course Deletion with Enrolled Students**:
- Detection: When tutor attempts to delete course with active enrollments
- Response: Show confirmation modal: "This course has X enrolled students. Are you sure you want to delete it? Students will lose access."
- Alternative: Suggest archiving instead of deletion to preserve student records

**Publish Validation Failures**:
- Detection: Pre-publish validation check
- Response: Display checklist of requirements with status indicators (complete/incomplete)
- Guidance: "Complete the following before publishing: [list of missing items]"

### Lesson/Quiz Editor Errors

**Video Upload Timeout**:
- Detection: Upload exceeds 5 minutes or connection lost
- Response: Resume capability using chunked upload protocol
- User notification: "Upload paused. Click resume to continue."
- For very large files, suggest using video URL instead

**Invalid Video URL**:
- Detection: URL format validation on blur or save
- Response: Immediate inline feedback: "Invalid video URL. Please use YouTube, Vimeo, or direct MP4 link."
- Guidance: Show example formats

**Content Lost Due to Network Issue**:
- Prevention: Auto-save draft every 30 seconds to local storage and server
- Recovery: On page reload, prompt: "We found unsaved changes. Would you like to restore them?"
- Notification: Display last saved timestamp for user confidence

**Exceeding File Size Limits**:
- Detection: Client-side validation before upload begins
- Response: Block upload, display clear error: "File size exceeds 20MB limit. Please compress or choose a smaller file."
- Suggestion: Provide link to file compression tool or instructions

**Rich Text Content XSS Risk**:
- Detection: Server-side sanitization on save
- Response: Strip potentially malicious code, notify tutor of changes
- Message: "Some content was modified for security reasons. Please review."

### Scheduling Errors

**Conflicting Time Slots**:
- Detection: Overlap check when creating or modifying availability block
- Response: Highlight conflicting blocks on calendar, prevent save
- Message: "This time slot overlaps with an existing block. Please choose a different time."

**Student Cancellation Too Close to Session**:
- Detection: Cancellation request timestamp check against policy (e.g., 24-hour rule)
- Response: If within policy window, require admin approval or apply cancellation fee
- Notification to tutor: "Student X requested to cancel session Y less than 24 hours in advance."

**Tutor Cancellation**:
- Detection: Cancellation action initiated by tutor
- Response: Prompt for cancellation reason (required)
- Automatic actions:
  - Send notification to enrolled students
  - If paid session, initiate refund process
  - Update session status to Cancelled
  - Remove from tutor's active sessions
- Message: "Session cancelled. Students have been notified and refunds initiated."

**Double-Booking Attempt**:
- Detection: Student tries to book slot already at capacity
- Response: Real-time capacity check, prevent booking if full
- Message: "This session is fully booked. Please choose another time."

### Live Session Errors

**Video Service Unavailable**:
- Detection: Health check fails when starting session or during session
- Response: Fallback to alternative video provider or text-based session mode
- Notification: "Video is temporarily unavailable. Session will proceed with audio and chat only."
- Escalation: If persistent, notify admin and log incident

**Network Interruption During Session**:
- Detection: Connection loss detected by video SDK
- Response: Auto-reconnect attempts (up to 5 times)
- User experience: "Reconnecting..." overlay, session timer pauses
- If reconnection succeeds: Resume seamlessly
- If fails: Prompt to manually rejoin session

**Recording Failure**:
- Detection: Recording service error or storage failure
- Response: Notify tutor immediately during session: "Recording failed. Session notes will be saved."
- Fallback: Ensure chat log and shared files are still captured
- Post-session: Allow tutor to manually upload recording if available locally

**Participant Connection Issues**:
- Detection: Student unable to join video room (network, browser compatibility)
- Response: Provide troubleshooting steps in join error message
- Guidance: "Try refreshing, using Chrome/Firefox, or check your camera/microphone permissions."
- Support: Link to help documentation or live support chat

## Security Considerations

### Authentication & Authorization

**Tutor Role Verification**:
- Every tutor-specific endpoint must verify user has TUTOR role via middleware
- Reject requests with 403 Forbidden if user lacks tutor role
- Session timeout: 2 hours of inactivity, require re-authentication

**Content Ownership**:
- Tutors can only view, edit, delete their own courses, lessons, quizzes
- API endpoints must check content.tutorId === authenticatedUser.id
- Prevent cross-tutor content access or modification

**Admin Override**:
- Admins have read-write access to all tutor content for moderation
- Admin actions are logged for audit trail
- Tutors are notified when admin modifies their content

### Input Sanitization

**Rich Text Content**:
- All rich text fields (descriptions, lesson content, questions) must be sanitized server-side
- Use trusted library (e.g., DOMPurify, sanitize-html) to strip XSS vectors
- Whitelist allowed HTML tags and attributes
- Remove JavaScript event handlers, <script> tags, iframes from untrusted sources

**File Uploads**:
- Scan all uploaded files for malware using antivirus service
- Validate file types by inspecting file headers, not just extensions
- Reject executable files (.exe, .sh, .bat, etc.)
- Store uploaded files outside web root to prevent direct execution
- Generate random filenames to prevent path traversal attacks

**Video URLs**:
- Validate URLs to prevent Server-Side Request Forgery (SSRF)
- Whitelist allowed domains (YouTube, Vimeo, trusted CDNs)
- Reject URLs pointing to localhost, internal IPs, or file:// protocol
- Use URL parsing library to ensure proper format

### Data Privacy

**Student Enrollment Data**:
- Tutors can only view enrollment data for their own courses
- Display student names and enrollment dates, but hide sensitive info (email, phone) unless student opts in
- No bulk export of student data to prevent scraping

**Attendance Records**:
- Session attendance and chat logs accessible only to session participants (tutor and enrolled students) and admins
- Anonymize attendance data in aggregated analytics
- Students can opt out of recording, attendance tracking

**Session Chat Logs**:
- Chat messages encrypted at rest using AES-256
- Accessible only to session participants for 90 days, then archived
- Students can request chat log deletion (right to be forgotten)

### Rate Limiting

**Course Creation**:
- Maximum 5 courses created per day per tutor
- Prevents spam and low-quality content flooding
- Resets daily at midnight UTC

**File Uploads**:
- Maximum 50MB total uploads per hour per tutor
- Individual file size limits enforced (cover image 5MB, video 500MB, attachment 20MB)
- Upload queue with max 10 concurrent uploads

**API Requests**:
- Standard rate limiting: 100 requests per minute per tutor
- Burst allowance: 20 requests in 1 second
- Response headers include rate limit status (X-RateLimit-Remaining)
- 429 Too Many Requests status on limit exceeded

**Live Session Creation**:
- Maximum 10 sessions started per hour (prevents abuse or testing loops)
- Prevents resource exhaustion on video conferencing service

### Additional Security Measures

**HTTPS Enforcement**:
- All tutor dashboard and API endpoints require HTTPS
- Redirect HTTP requests to HTTPS automatically

**CSRF Protection**:
- Use anti-CSRF tokens for all state-changing operations (POST, PUT, DELETE)
- Validate tokens server-side before processing

**SQL Injection Prevention**:
- Use parameterized queries or ORM (e.g., Prisma) for all database operations
- Never concatenate user input into SQL strings

**Secure Session Management**:
- Use HTTP-only, Secure, SameSite cookies for session tokens
- Rotate session tokens on privilege escalation (e.g., login)
- Implement session expiration and idle timeout

## Success Metrics

### Tutor Engagement Metrics

**Active Tutors**:
- Definition: Tutors who have created at least one course in the last 30 days
- Target: 60% of registered tutors become active within first month

**Courses per Tutor**:
- Average number of courses created by active tutors
- Target: 2.5 courses per active tutor
- Indicates sustained engagement and content production

**Lessons per Course**:
- Average number of lessons in published courses
- Target: 8-12 lessons per course (indicates comprehensive curriculum)

**Quiz Creation Rate**:
- Percentage of courses that include at least one quiz
- Target: 70% of courses have quizzes
- Indicates commitment to assessment and student learning outcomes

**Scheduling Utilization**:
- Percentage of availability blocks that get booked by students
- Target: 50% booking rate for one-on-one sessions, 70% for workshops
- Low utilization may indicate pricing, timing, or demand issues

**Live Session Completion Rate**:
- Percentage of scheduled sessions that are completed (not cancelled or no-show)
- Target: 90% completion rate
- High cancellation rates indicate scheduling friction or commitment issues

### Content Quality Metrics

**Average Course Rating**:
- Student ratings of courses (1-5 stars)
- Target: Average rating ≥ 4.0 across all tutor courses
- Indicates quality of content and teaching effectiveness

**Lesson Completion Rate**:
- Percentage of students who complete lessons they start
- Target: 75% completion rate
- Low rates may indicate content is too long, unclear, or not engaging

**Quiz Performance**:
- Average student scores on quizzes
- Target: 60-80% average scores (indicates appropriate difficulty)
- Too low: Content or questions may be confusing
- Too high: Quizzes may be too easy, not challenging enough

**Video Content Ratio**:
- Percentage of lessons that include video content
- Target: 60% of lessons with video
- Video enhances engagement and learning outcomes

**Content Update Frequency**:
- How often tutors update course content (lessons, quizzes)
- Target: At least one update per course per quarter
- Indicates tutors are maintaining and improving content

### System Performance Metrics

**Course Builder Load Time**:
- Time to load course creation/editing page
- Target: < 2 seconds for 95th percentile
- Slow load times frustrate tutors and reduce productivity

**Lesson Editor Responsiveness**:
- Input latency in rich text editor
- Target: < 200 milliseconds for typing response
- Laggy editors hurt user experience and content creation

**Video Upload Success Rate**:
- Percentage of video uploads that complete successfully
- Target: > 95% success rate
- Failed uploads waste tutor time and require re-upload

**Live Session Connection Success**:
- Percentage of session start attempts that successfully connect to video room
- Target: > 98% success rate
- Connection failures disrupt sessions and damage trust

**Concurrent Live Sessions Supported**:
- Maximum number of simultaneous live sessions without degradation
- Target: Support 1,000 concurrent sessions
- Scalability benchmark for platform growth

### Business Outcome Metrics

**Tutor Retention Rate**:
- Percentage of tutors still active after 3 months and 6 months
- Target: 70% retention at 3 months, 50% at 6 months
- High churn indicates onboarding or platform issues

**Course Publication Rate**:
- Percentage of drafted courses that get published
- Target: 80% of started courses get published
- Low rates indicate tutors abandon course creation (complexity, time, unclear value)

**Revenue per Tutor**:
- Average earnings per tutor from paid courses and sessions
- Target: Varies by market, aim for enough to motivate continued content creation
- Tracks tutor satisfaction and platform viability

**Student Satisfaction with Tutors**:
- Net Promoter Score (NPS) or satisfaction rating for tutor-created courses
- Target: NPS ≥ 50, satisfaction ≥ 4.2/5
- Measures overall student experience and content quality

**Time to First Course**:
- Average time from tutor registration to publishing first course
- Target: < 7 days
- Faster time indicates effective onboarding and intuitive tools

**Support Tickets per Tutor**:
- Number of help requests submitted by tutors
- Target: < 0.5 tickets per tutor per month
- Lower is better, indicates intuitive platform and good documentation- Target: < 0.5 tickets per tutor per month
