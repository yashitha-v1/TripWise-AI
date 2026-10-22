# TripWise AI

A budget-conscious trip planner built with a React frontend, Express backend, and SQLite database. It generates budget breakdowns and itinerary suggestions based on trip details.

## Features

- Create and save trip requests.
- Specify origin, destination, travel dates, number of travellers, budget, and interests.
- Store trip requests using SQLite.
- Generate a structured trip plan with estimated budget allocations.
- View a day-by-day itinerary.
- Explore curated destination suggestions for supported destinations.
- Delete saved trip requests.
- Validate API health and backend connectivity.

## Tech Stack

- **Frontend:** React, Vite, JavaScript, CSS
- **Backend:** Node.js, Express
- **Database:** SQLite
- **Version Control:** Git and GitHub

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- Windows 10/11

## Run on Windows

1. Open the project folder in VS Code.
2. Open **Terminal → New Terminal**.
3. Install the root dependencies:

   ```bash
   npm install
   ```

4. Install the backend dependencies:

   ```bash
   npm --prefix server install
   ```

5. Install the frontend dependencies:

   ```bash
   npm --prefix client install
   ```

6. Start the application:

   ```bash
   npm run dev
   ```

7. Open the frontend at `http://localhost:5173`.

The backend API runs at `http://localhost:3001`.

## API Endpoints

- `GET /api/health` — Check backend health.
- `GET /api/trips` — Retrieve saved trips.
- `POST /api/trips` — Create a trip request.
- `DELETE /api/trips/:id` — Delete a saved trip.
- `POST /api/trips/:id/plan` — Generate a trip plan.

## Current Limitations

- Itinerary generation is deterministic and does not currently use an AI model.
- Budget allocations are estimates, not live transport or hotel prices.
- Curated destination recommendations are available only for supported destinations.
- Trip requests are stored locally in SQLite.
- Generated plans may need to be regenerated after a page refresh.

## Data and Security

- The SQLite database is created under `server/data/`.
- Database files and environment files are excluded from Git using `.gitignore`.
- Never commit passwords, API keys, or other secrets.

## Future Scope

- Integrate an AI model for personalized trip planning.
- Add live transport and accommodation pricing.
- Expand destination recommendations.
- Add maps, weather information, and booking links.

## Author

**Yashitha V**
