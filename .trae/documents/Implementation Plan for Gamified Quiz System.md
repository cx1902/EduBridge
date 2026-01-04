# Implementation Plan: Comprehensive Gamification Quiz System

I have designed a complete solution to integrate flexible, media-rich quizzes into your course structure. This plan covers both the Tutor's ability to create complex quizzes and the Student's experience of taking them.

## 1. Backend Implementation (Server)

We need to expand the `QuizController` to support full CRUD (Create, Read, Update, Delete) operations, as currently, it only supports *taking* quizzes.

* **Update** **`server/src/controllers/quiz.controller.js`**:

  * **`createQuiz`**: A new function to create a quiz linked to a `lessonId`. It will handle nested creation of `questions` and `answerOptions` in a single database transaction.

  * **`updateQuiz`**: logic to update quiz settings (time limit, passing score) and modify questions (add/remove/edit) and their options.

  * **`deleteQuiz`**: logic to safely remove a quiz and its related data.

* **Update** **`server/src/routes/quiz.routes.js`**:

  * Add protected routes (`POST /`, `PUT /:id`, `DELETE /:id`) restricted to Tutors and Admins.

* **Image Handling**:

  * We will leverage the existing `upload.controller.js` to handle image uploads. The frontend will upload the image first, get a URL, and then save that URL with the question.

## 2. Frontend: Tutor Experience (Quiz Builder)

We will integrate quiz management directly into the existing Lesson Builder for a smooth workflow.

* **Modify** **`LessonBuilder.jsx`**:

  * Add a **"Manage Quiz"** button to the "Actions" column of the lesson list.

  * This button will open a new **Quiz Builder Modal**.

* **Create** **`QuizBuilder.jsx`** **(New Component)**:

  * **Quiz Settings**: Fields for Title, Instructions, Time Limit, Passing Score, and Max Attempts.

  * **Question Editor**: A dynamic form to add questions.

    * **Type Selector**: Choose between Multiple Choice, Short Answer, True/False, etc.

    * **Media Support**: An "Upload Image" button that connects to the backend upload service.

    * **Options Manager**: For MCQs, add/remove options and mark the correct one.

    * **Points**: Assign points per question.

## 3. Frontend: Student Experience (Quiz Player)

Students need a seamless way to take quizzes within their lessons.

* **Modify** **`CourseLesson.jsx`**:

  * Check if the current lesson has an attached quiz.

  * If yes, display a **"Take Quiz"** tab or button alongside the lesson content.

* **Create** **`QuizPlayer.jsx`** **(New Component)**:

  * **Start Screen**: Shows instructions, time limit, and "Start" button.

  * **Game Interface**:

    * Displays one question at a time (or list view).

    * Renders question images if present.

    * Handles different input types (Radio buttons for MCQ, Text area for Short Answer).

    * **Timer**: Countdown based on the quiz settings.

  * **Results Screen**:

    * Shows Score, Pass/Fail status, and Earned Points/Badges.

    * Option to "Retake" if attempts allow.

## 4. Integration & Verification

* **Database**: Ensure `Question` model fields (`questionImageUrl`, `questionType`) are correctly utilized.

* **Testing**:

  1. **Tutor**: Create a lesson -> Add a Quiz -> Add an Image Question -> Save.
  2. **Student**: Open Lesson -> Click "Take Quiz" -> See Image -> Submit Answer -> See Result.

