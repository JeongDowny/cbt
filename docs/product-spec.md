# Product Specification

## Product Name
CBT Program

## Definition
CBT means Computer-Based Test.

## Core Goal
Provide a simple web-based system for:
- solving multiple-choice exams
- grading answers automatically
- reviewing results
- allowing admins to manage exam content

---

## User Roles

### 1. Student
A student does not need an account.

Student capabilities:
- select an exam by category, year, and round
- configure options before starting
- solve questions
- submit answers
- view immediate results
- look up previous results using name and birth date

### 2. Admin
Admin login is required.

Admin capabilities:
- create exams
- edit existing exams
- input questions and choices
- mark correct answers
- upload question images
- review all stored exam results

---

## Main User Flow

### Student flow
1. Open exam selection page
2. Select certification / exam / year / round
3. Set options:
   - time limit
   - random question order
   - question count
4. Start exam
5. Solve all questions
6. Submit answers
7. Enter name and birth date if required for result saving
8. View graded result
9. Later, search previous result using name and birth date

### Admin flow
1. Log in
2. Open admin dashboard
3. Create or edit an exam
4. Add questions
5. Add 4 or 5 answer choices
6. Mark correct answer
7. Upload image if needed
8. Save and publish exam
9. Review result records

---

## MVP Scope

### Must-have
- Exam selection page
- Admin exam creation/edit page
- Student exam solving page
- Automatic grading
- Immediate result page
- Result lookup page by name and birth date
- Data persistence for exams and reports

### Post-MVP
- Bulk upload for question-answer sets
- More advanced analytics
- Better admin filtering and exports
- Additional exam configuration tools

---

## Required Pages

### 1. Exam Selection Page
Purpose:
- let the student choose which exam to solve

Includes:
- certification name
- exam year
- exam round
- option settings
  - time limit
  - random mode
  - question count
- start button
- link to result lookup

### 2. Exam Solving Page
Purpose:
- let the student solve the selected exam

Includes:
- question content
- 4-choice or 5-choice options
- optional question image
- answer selection
- progress status
- submit action

This is the most important screen.

### 3. Result Page
Purpose:
- show the result immediately after submission

Includes:
- exam information
- score
- correct / incorrect summary
- question-by-question review
- user answer vs correct answer

### 4. Result Lookup Page
Purpose:
- allow previous result retrieval

Includes:
- name input
- birth date input
- matching result history or latest result

### 5. Admin Exam Input Page
Purpose:
- allow admins to create and edit exams

Includes:
- exam title and metadata
- question list editor
- answer choice editor
- correct answer selector
- image upload
- save and edit actions

### 6. Admin Dashboard
Purpose:
- central place for admin management

Includes:
- exam list
- edit links
- result list
- student result records with name and birth date

---

## Domain Entities

### Exam
Fields may include:
- id
- certification name
- title
- year
- round
- default time limit
- created at
- updated at

### Question
Fields may include:
- id
- exam id
- question number
- question text
- image url
- choice count
- correct choice index
- explanation (optional for future)

### Choice
Fields may include:
- id
- question id
- label
- text

### Report / Submission
Fields may include:
- id
- exam id
- user name
- birth date
- score
- total questions
- submitted answers
- grading result
- created at

---

## Product Constraints
- Desktop-first
- Clean and simple UI
- Friendly wording
- No student authentication
- No advanced audit logging needed
- No strict RLS-first design requirement for initial version