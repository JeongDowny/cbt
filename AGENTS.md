# AGENTS.md

## Purpose
This project is a desktop-first CBT (Computer-Based Test) web application built with Next.js and Supabase.

The product allows:
- Students to select an exam and solve multiple-choice questions
- Automatic grading and result review
- Result lookup by name and birth date
- Admins to create, edit, and manage exams and questions

Always read this file before making changes.

---

## Core Product Rules

### Student-side rules
- No student login is required
- A student can:
  - select an exam
  - choose options such as time limit, random order, and question count
  - solve 4-choice or 5-choice multiple-choice questions
  - submit answers
  - view the result immediately
  - look up previous results using name and birth date

### Admin-side rules
- Admin authentication is required
- Admin can:
  - create exams
  - edit exams
  - upload question images
  - manage questions and answer choices
  - review all exam result records

### Data persistence rules
The system must store:
- exam metadata
- questions
- answer choices
- correct answers
- student result records
- optional question images

---

## Tech Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zustand
- Supabase Auth (admin only)
- Supabase Database
- Supabase Storage

---

## Engineering Standards

### Type safety
- Never use `any`
- Prefer explicit types and inferred types with strong boundaries
- Create shared domain types for exam, question, and report data

### Component boundaries
- Clearly separate Server Components and Client Components
- Use Client Components only where interactivity is required
- Prefer Server Components for initial data fetching when appropriate

### Accessibility
- Use semantic HTML
- Ensure keyboard accessibility
- Associate labels with all form inputs
- Provide accessible button names and form validation messages

### Error handling
- Add error handling for all async operations
- Never swallow errors silently
- Show user-friendly error messages
- Log useful debugging information for admin-side flows when appropriate

### Code quality
- Keep components small and focused
- Avoid deeply nested logic inside page files
- Extract reusable UI and domain logic
- Prefer feature-oriented organization over arbitrary splitting

### Forms
- Use React Hook Form for all non-trivial forms
- Validate inputs clearly
- Keep the input burden minimal for students

---

## UX Principles
- Keep the interface calm, modern, and easy to scan
- Minimize input burden
- Make the primary action obvious on each screen
- Use friendly and soft wording
- Avoid overly decorative UI
- Avoid excessive cards and visual clutter

---

## UI Rules
- Desktop-first responsive layout
- Slightly rounded buttons and inputs
- Card-based layout, but only where useful
- Clean spacing and clear hierarchy
- Bright navy-based visual tone
- No playful or toy-like styling
- No overly complex dashboard visuals unless requested

---

## Domain Model Expectations
Main entities:
- Exam
- Question
- Choice
- ExamSession or Submission
- Report

Expected relationships:
- One exam has many questions
- One question has multiple choices
- One submission belongs to one exam
- One submission stores user answers and grading results

---

## Suggested Folder Direction
Prefer feature-oriented structure.

Example direction:
- `app/`
- `components/`
- `features/exams/`
- `features/admin/`
- `features/reports/`
- `lib/`
- `types/`

Do not reorganize the whole project unless necessary.

---

## Delivery Style for Codex
When implementing tasks:
1. Read `AGENTS.md`
2. Read `docs/product-spec.md`
3. Read `docs/style-guide.md`
4. Read `docs/task-order.md`
5. Implement only the requested scope
6. Keep changes minimal and focused
7. Explain what was changed and what remains

When asked to build a feature:
- first understand the existing structure
- then implement the smallest complete version
- then improve structure if needed

Do not introduce:
- unnecessary abstractions
- excessive dependencies
- premature optimization
- test frameworks unless explicitly requested

---

## Preferred Build Approach
Use an iterative workflow:
1. scaffold the data model and routing
2. build admin exam creation
3. build student exam solving flow
4. build grading and result review
5. build result lookup
6. improve UI and edge cases
7. add tests later if requested

Student result lookup must be simple, but the implementation should minimize accidental exposure of other users' results.