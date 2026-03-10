# Style Guide

## Design Direction
The product should feel:
- calm
- modern
- clean
- trustworthy
- focused

Avoid:
- toy-like UI
- overly playful visuals
- excessive cards
- visually noisy layouts
- unnecessary decoration

---

## Layout Principles
- Desktop-first responsive design
- Clear visual hierarchy
- Comfortable spacing
- Focus on the active task
- One obvious primary action per screen

The exam solving screen should prioritize:
- readability
- low distraction
- fast answer selection
- easy navigation between questions

---

## Color Direction
Use a bright navy-centered palette.

Suggested direction:
- primary: bright navy
- secondary: cool gray or soft slate
- background: white or very light neutral
- accent: restrained blue tones
- danger/error: clear but not aggressive
- success: calm and readable

Do not use:
- saturated rainbow accents
- candy-like colors
- overly dark heavy UI unless requested later

---

## Typography
Font feeling:
- clean
- modern
- highly readable
- professional

Prefer:
- sans-serif
- medium visual density
- strong readability for long exam sessions

Use clear hierarchy:
- page title
- section title
- question title
- body text
- helper text

---

## Components

### Buttons
- Slightly rounded corners
- Clear primary vs secondary distinction
- Large enough click targets
- Strong focus states

### Cards
- Use only where structure benefits from grouping
- Do not overuse cards
- Keep borders and shadows subtle

### Inputs
- Clean and obvious labels
- Comfortable padding
- Gentle validation messages
- Friendly helper text when needed

### Question blocks
- Strong separation between question text and choices
- Choice items should be easy to scan
- Keep image placement consistent
- Avoid clutter around answer options

---

## UX Writing
Tone:
- friendly
- calm
- simple
- supportive

Examples of style:
- soft validation messages
- clear action labels
- no robotic system language unless necessary

Prefer:
- “Please enter your name”
- “Select one answer”
- “Your result has been saved”

Avoid:
- harsh warning language
- overly technical wording on student-facing screens

---

## Empty / Loading / Error States
These are not the highest priority, but they should still be clean.

### Empty states
- brief and neutral
- clearly explain what to do next

### Loading states
- simple
- avoid unnecessary animation

### Error states
- polite
- specific enough to guide correction
- never blame the user

---

## Recommended UI Stack
- Tailwind CSS
- shadcn/ui

Reason:
- easy consistency
- fast implementation
- good accessibility foundation
- flexible enough for a calm custom visual style