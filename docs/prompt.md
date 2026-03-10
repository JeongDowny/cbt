Read AGENTS.md, docs/product-spec.md, docs/style-guide.md, and docs/task-order.md first.

Then scaffold a Next.js App Router project structure for this CBT application using:
- TypeScript
- Tailwind CSS
- shadcn/ui
- React Hook Form
- Zustand
- Supabase client setup

Do not implement full features yet.
Only create the initial folder structure, base layout, shared types, utility setup, and placeholder routes for:
- exam selection
- exam solving
- result page
- result lookup
- admin login
- admin dashboard

Follow the project rules strictly.

2.
Read AGENTS.md and docs/product-spec.md first.

Design the Supabase database schema for this CBT project.

Include tables for:
- exams
- questions
- choices
- reports/submissions

Also suggest how question images should be stored in Supabase Storage.

Then generate:
1. SQL schema
2. TypeScript domain types
3. brief explanation of relationships

Do not implement UI yet.

3.
Read AGENTS.md, docs/product-spec.md, and docs/style-guide.md first.

Implement the admin authentication flow using Supabase Auth for admin-only access.

Build:
- admin login page
- protected admin layout
- admin dashboard placeholder

Keep the implementation minimal and clean.
Do not build full exam management yet.

4.Read AGENTS.md, docs/product-spec.md, docs/style-guide.md, and docs/task-order.md first.

Implement the admin exam management feature.

Build:
- exam creation form
- exam edit form
- question editor
- 4-choice and 5-choice support
- correct answer selection
- image upload support

Use React Hook Form where appropriate.
Keep the UI calm and simple.

5.Read AGENTS.md, docs/product-spec.md, and docs/style-guide.md first.

Implement the student exam selection page.

Include:
- certification / exam selection
- year / round selection
- options for time limit, random mode, and question count
- start button
- result lookup entry point

Do not build the full solving logic yet.

6.Read AGENTS.md, docs/product-spec.md, and docs/style-guide.md first.

Implement the exam solving page.

Requirements:
- render question text and answer choices
- support both 4-choice and 5-choice questions
- show optional question images
- track selected answers
- show progress
- support timer option if enabled
- allow submission

Focus on a clean desktop-first solving experience.

7.Read AGENTS.md and docs/product-spec.md first.

Implement grading and result saving.

Requirements:
- compare submitted answers with correct answers
- calculate score
- save result report to Supabase
- include user name and birth date for later lookup
- prepare data for result page rendering

Do not do a major UI redesign.

8.Read AGENTS.md, docs/product-spec.md, and docs/style-guide.md first.

Implement:
1. result page after submission
2. result lookup page using name and birth date

The result page should show:
- score
- summary
- per-question review
- correct answer vs user answer

The lookup page should be simple and friendly.