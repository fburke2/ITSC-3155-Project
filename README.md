# ITSC-3155-Project

## Application

A React and TypeScript course-selection prototype for students. Students can use separate Survey and Course Selection pages, set a degree goal and areas of interest, receive course recommendations, search and filter the sample course list, and view illustrative program-path information for a selected course. Survey responses are stored in the current browser for demonstration purposes.

Course credits, semesters, and salary figures are sample estimates only. They are not verified degree requirements or salary averages.

## Install

Requirements: Node.js LTS and npm.

From the repository root, install the app dependencies:

```powershell
cd app
npm ci
```

## Run Locally

From the `app` directory, start the Vite development server:

```powershell
npm run dev
```

Open the local URL printed by Vite, usually `http://localhost:5173/`.

On Windows, you can also run `run-app.cmd` from the repository root. It installs dependencies if needed and starts the app.

## Implemented Features

- Survey for a degree goal and one or more areas of interest, with edit and reset actions.
- Graduate planning and certification follow-up prompts for degree type, with salary asked only when the user has a degree.
- Degree status question with a salary range follow-up for users who already have a degree; submitting the survey opens Course Selection.
- Navigation between the Survey and Course Selection pages, including direct links and browser back/forward navigation.
- Course recommendations based on survey interests.
- Course category filtering, case-insensitive search, and keyboard-accessible selection.
- Course information panel with a prominent sample annual salary, credits, semesters, and a link to Class Information when available.
- Survey responses and selected course are saved in this browser and restored when you return.

## Test

Run the Mocha feature tests and TypeScript check/production build from the `app` directory:

```powershell
npm test
npm run build
```

The Mocha suite uses jsdom and React Testing Library to check survey prompts and navigation, course filtering and browser retention, course metrics, and class information. Vite loads the app components during tests so they use the same TSX and CSS handling as the application.

Manually test the app in the browser:

1. Complete the survey and submit it. Confirm the app navigates to Course Selection and shows recommendations.
2. Use the navigation links and browser back/forward buttons to switch between pages. Reload each page and confirm the selected page is retained.
3. Edit the survey and change an interest. Confirm the recommendations update; reload the page and confirm the survey is retained in that browser.
4. Use the category selector and course search. Select a course with the mouse, then repeat using the arrow keys and Enter. Reload the page and confirm the selected course is restored.
5. Confirm the course information panel updates with the selected course and shows sample metrics where available. Courses without sample metrics should say “Not provided.”
6. Reset the survey and clear the course filters/selection. Confirm the initial empty states return.