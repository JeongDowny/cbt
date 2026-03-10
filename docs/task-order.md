# Task Order

## Implementation Strategy
Build the project in small, focused steps.
Do not try to complete the whole product in one prompt.

Use an iterative approach:
- scaffold first
- implement core features
- improve UX and polish later

---

## Phase 1: Project Foundation
Goal:
Set up the application structure and basic dependencies.

Tasks:
1. Initialize Next.js App Router project with TypeScript
2. Set up Tailwind CSS
3. Install and configure shadcn/ui
4. Install React Hook Form
5. Install Zustand
6. Set up Supabase client structure
7. Create base folder structure
8. Add shared types and utility files

Deliverable:
A clean scaffold ready for feature work

---

## Phase 2: Database Schema
Goal:
Define the core data model.

Tasks:
1. Design tables for exams
2. Design tables for questions
3. Design tables for choices
4. Design tables for reports / submissions
5. Add storage strategy for question images
6. Create TypeScript types aligned with schema

Deliverable:
Stable schema for exams and results

---

## Phase 3: Admin Authentication
Goal:
Allow admin-only access to management pages.

Tasks:
1. Configure Supabase Auth for admin login
2. Create admin login page
3. Protect admin routes
4. Add basic admin layout

Deliverable:
Working admin authentication flow

---

## Phase 4: Admin Exam Management
Goal:
Allow admins to create and edit exam content.

Tasks:
1. Build admin dashboard page
2. Build exam creation form
3. Build exam edit form
4. Build question editor
5. Build 4-choice and 5-choice option editor
6. Add correct answer selector
7. Add image upload support
8. Save exam data to database

Deliverable:
Admins can create and maintain exams

---

## Phase 5: Student Exam Selection
Goal:
Allow students to choose an exam and configure options.

Tasks:
1. Build exam selection page
2. Add certification / year / round filters
3. Add option controls:
   - time limit
   - random mode
   - question count
4. Validate start conditions
5. Start the exam session

Deliverable:
Students can choose and start an exam

---

## Phase 6: Exam Solving Flow
Goal:
Build the core solving experience.

Tasks:
1. Build the exam solving page
2. Render question text and choices
3. Support optional question image
4. Track selected answers
5. Show progress
6. Handle timer if enabled
7. Allow submission after completion

Deliverable:
Complete test-taking flow

---

## Phase 7: Grading and Result Saving
Goal:
Grade answers and store result records.

Tasks:
1. Compare submitted answers with correct answers
2. Calculate score
3. Save report with:
   - exam id
   - user name
   - birth date
   - answers
   - score
3. Return result payload for result page

Deliverable:
Reliable grading and persistence

---

## Phase 8: Result Review
Goal:
Show clear immediate feedback.

Tasks:
1. Build result page
2. Show exam summary
3. Show score
4. Show per-question review
5. Show correct answer and user answer

Deliverable:
Students can review completed exams

---

## Phase 9: Result Lookup
Goal:
Allow previous result retrieval.

Tasks:
1. Build result lookup page
2. Add name and birth date form
3. Search matching reports
4. Show saved result list or latest result

Deliverable:
Students can find old results without login

---

## Phase 10: UI Polish
Goal:
Improve usability and consistency.

Tasks:
1. Refine spacing and hierarchy
2. Improve question readability
3. Improve button and input states
4. Refine validation messages
5. Improve desktop layout quality

Deliverable:
More polished user experience

---

## Phase 11: Optional Later Work
- bulk upload for questions
- analytics dashboard
- export features
- tests
- stronger security rules