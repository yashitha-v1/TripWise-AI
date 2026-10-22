# TripWise AI — Milestone 1

A local-first, zero-cost trip planner starter. This milestone includes a React + Vite frontend, Express API, and SQLite persistence. It does **not** use an AI model or paid API yet.

## Requirements
- Node.js 20.19+ or 22.12+ (use a current Node.js LTS release)
- npm (installed with Node.js)
- Windows 10/11

## Run on Windows
1. Extract this folder to a location such as `D:\TripWiseAI`.
2. Open PowerShell in that folder.
3. Run `node -v` and `npm -v` to verify Node.js and npm.
4. Run `npm install`.
5. Run `npm run install:all` is not configured; instead install each package with:
   - `npm install`
   - `npm --prefix server install`
   - `npm --prefix client install`
6. Run `npm run dev`.
7. Open the Vite URL printed in the terminal, usually `http://localhost:5173`.

The Express API runs on `http://localhost:3001`. SQLite database is created at `server/data/trips.db` automatically.

## Features in this milestone
- Create a trip request with origin, destination, dates, travellers, budget and interests.
- Save trips in local SQLite.
- Display saved trips and a basic budget summary.
- Clearly label cost as an estimate; no live transport or hotel pricing is claimed.
- Basic server-side validation.

## Troubleshooting
- If `node` or `npm` is not recognized, install the current Node.js LTS release from https://nodejs.org/en/download and reopen PowerShell.
- If port 3001 is already in use, close the other app or change `PORT` in `server/index.js`.
- Do not add API keys or download a local AI model for this milestone.
