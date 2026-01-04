# Implementation Plan: Tutor Matching & Booking System

I have updated the plan to strictly follow your provided schema code and instructions, while ensuring the full booking functionality is still achievable.

## 1. Database Schema Updates (server/prisma/schema.prisma)

I will modify the schema exactly as requested:

- **Add Enum**: `TutoringRequestStatus` { PENDING, MATCHED, BOOKED, CANCELLED }
- **Add Models**:
  - `TutorProfile`: Stores rates, languages, bio, levels.
  - `Subject`: Standardized subject list.
  - `TutorSubject`: Links tutors to subjects with skill levels.
  - `TutoringRequest`: Stores student preferences and matched tutor.
- **Update User Model**: Add the 4 specific relation fields (`tutorProfile`, `tutorSubjects`, `tutoringRequests`, `matchedRequests`).

- **Additional Requirement for Booking**:
  - To fulfill the "Availability" and "Booking" goals from your original request, I will also add an `AvailabilitySlot` model and ensure `TutoringSession` links to it. (The provided snippets covered matching, but we still need slots for the booking constraint).

## 2. Migration & Setup

I will execute the commands exactly as specified in your image:

1.  `npx prisma format`
2.  `npx prisma generate`
3.  `npx prisma migrate dev --name add_tutor_matching_core`

## 3. Backend Implementation (Node.js/Express)

- **Routes**: `server/src/routes/tutoring.routes.js` (and `tutors.routes.js`)
- **Services**:
  - **Matching Service**: Implements the weighted scoring algorithm (Subject 40%, Level 20%, Availability 20%, Rating 10%, Budget 10%) using the new `TutorSubject` and `TutorProfile` tables.
  - **Booking Service**: Handles the transaction to lock `AvailabilitySlot` and create `TutoringSession`.

## 4. Frontend Implementation (React)

- **Student Flow**:
  - **Request Page**: Form to submit `TutoringRequest`.
  - **Matches Page**: Lists tutors ranked by the algorithm.
  - **Booking Page**: Selects a slot from `AvailabilitySlot` to finalize.
- **Tutor Flow**:
  - **Profile Page**: Edit `TutorProfile` and `TutorSubject`.
  - **Availability Page**: Manage `AvailabilitySlot`s.

I will start by applying the schema changes and running the migration.
