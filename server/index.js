
import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, 'data');

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'trips.db'));
db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS trips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    origin TEXT NOT NULL,
    destination TEXT NOT NULL,
    start_date TEXT NOT NULL,
    end_date TEXT NOT NULL,
    travelers INTEGER NOT NULL CHECK (travelers > 0),
    budget_inr INTEGER NOT NULL CHECK (budget_inr > 0),
    interests TEXT NOT NULL DEFAULT '',
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

const app = express();
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '100kb' }));

const PORT = Number(process.env.PORT || 3001);

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    service: 'tripwise-api',
    database: 'sqlite',
    aiEnabled: false,
    plannerEnabled: true
  });
});

app.get('/api/trips', (_req, res) => {
  const trips = db.prepare(
    'SELECT * FROM trips ORDER BY id DESC'
  ).all();

  res.json({ trips });
});

app.post('/api/trips', (req, res) => {
  const {
    origin,
    destination,
    startDate,
    endDate,
    travelers,
    budgetInr,
    interests = ''
  } = req.body ?? {};

  const cleanOrigin =
    typeof origin === 'string' ? origin.trim() : '';
  const cleanDestination =
    typeof destination === 'string' ? destination.trim() : '';
  const cleanStart =
    typeof startDate === 'string' ? startDate : '';
  const cleanEnd =
    typeof endDate === 'string' ? endDate : '';

  const count = Number(travelers);
  const budget = Number(budgetInr);

  if (
    !cleanOrigin ||
    !cleanDestination ||
    !cleanStart ||
    !cleanEnd
  ) {
    return res.status(400).json({
      error: 'Please fill in origin, destination and both dates.'
    });
  }

  if (
    !isValidDate(cleanStart) ||
    !isValidDate(cleanEnd)
  ) {
    return res.status(400).json({
      error: 'Please enter valid departure and return dates.'
    });
  }

  if (cleanEnd < cleanStart) {
    return res.status(400).json({
      error: 'Return date must be on or after the departure date.'
    });
  }

  if (
    !Number.isInteger(count) ||
    count < 1 ||
    count > 30
  ) {
    return res.status(400).json({
      error: 'Travellers must be a whole number between 1 and 30.'
    });
  }

  if (
    !Number.isFinite(budget) ||
    budget < 1 ||
    budget > 100000000
  ) {
    return res.status(400).json({
      error: 'Enter a valid total budget in INR.'
    });
  }

  const result = db.prepare(`
    INSERT INTO trips (
      origin,
      destination,
      start_date,
      end_date,
      travelers,
      budget_inr,
      interests
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    cleanOrigin,
    cleanDestination,
    cleanStart,
    cleanEnd,
    count,
    Math.round(budget),
    String(interests).trim().slice(0, 500)
  );

  const trip = db.prepare(
    'SELECT * FROM trips WHERE id = ?'
  ).get(result.lastInsertRowid);

  return res.status(201).json({ trip });
});

/*
 * Milestone 2:
 * Generate a deterministic trip plan and budget allocation.
 * These amounts are planning estimates, not live prices or quotes.
 */
app.post('/api/trips/:id/plan', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({
      error: 'Invalid trip ID.'
    });
  }

  const trip = db.prepare(
    'SELECT * FROM trips WHERE id = ?'
  ).get(id);

  if (!trip) {
    return res.status(404).json({
      error: 'Trip not found.'
    });
  }

  const start = parseDateOnly(trip.start_date);
  const end = parseDateOnly(trip.end_date);

  if (!start || !end || end < start) {
    return res.status(400).json({
      error: 'This trip has invalid dates. Please recreate it with valid dates.'
    });
  }

  const nights = Math.round(
    (end.getTime() - start.getTime()) / 86400000
  );
  const days = nights + 1;

  // The percentages add up to 100% of the total trip budget.
  const allocations = [
    { key: 'transport', label: 'Travel to and from destination', percent: 25 },
    { key: 'accommodation', label: 'Accommodation', percent: 30 },
    { key: 'food', label: 'Food and drinks', percent: 20 },
    { key: 'activities', label: 'Activities and attractions', percent: 12 },
    { key: 'localTransport', label: 'Local transport', percent: 8 },
    { key: 'emergency', label: 'Emergency reserve', percent: 5 }
  ];

  const budgetBreakdown = allocations.map((item) => ({
    ...item,
    amountInr: Math.round(trip.budget_inr * item.percent / 100)
  }));

  // Ensure rounding never causes the allocations to exceed or fall
  // short of the submitted budget: adjust the reserve by the difference.
  const allocatedTotal = budgetBreakdown.reduce(
    (sum, item) => sum + item.amountInr,
    0
  );

  budgetBreakdown[budgetBreakdown.length - 1].amountInr +=
    trip.budget_inr - allocatedTotal;

  const dailyBudget = Math.round(trip.budget_inr / days);

  const itinerary = [];

  for (let day = 0; day < days; day += 1) {
    const date = new Date(start);
    date.setUTCDate(date.getUTCDate() + day);

    let morning;
    let afternoon;
    let evening;

    if (days === 1) {
      morning = 'Travel from your starting point and settle in.';
      afternoon = 'Explore an activity that matches your interests.';
      evening = 'Return home or finish your day trip.';
    } else if (day === 0) {
      morning = `Travel from ${trip.origin} towards ${trip.destination}.`;
      afternoon = 'Arrive, check in if applicable, and explore nearby places.';
      evening = 'Enjoy a relaxed evening and plan for the next day.';
    } else if (day === days - 1) {
      morning = 'Visit one final nearby attraction, if time permits.';
      afternoon = 'Check out and prepare for the return journey.';
      evening = `Return towards ${trip.origin}.`;
    } else {
      morning = 'Explore a verified attraction or nature spot.';
      afternoon = 'Plan a local experience, activity, or cultural visit.';
      evening = 'Try local food and enjoy a relaxed evening.';
    }

    itinerary.push({
      day: day + 1,
      date: formatDate(date),
      title: day === 0
        ? 'Arrival and settling in'
        : day === days - 1
          ? 'Final activities and return'
          : `Explore ${trip.destination}`,
      morning,
      afternoon,
      evening,
      suggestedBudgetInr: dailyBudget
    });
  }

  res.json({
    plan: {
      tripId: trip.id,
      origin: trip.origin,
      destination: trip.destination,
      startDate: trip.start_date,
      endDate: trip.end_date,
      travelers: trip.travelers,
      totalBudgetInr: trip.budget_inr,
      duration: {
        days,
        nights
      },
      interests: trip.interests,
      budgetBreakdown,
      itinerary,
      notes: [
        'Budget allocations are heuristic estimates, not verified prices.',
        'Transport, accommodation, and activity costs have not been checked against live providers.',
        'The itinerary is a starting outline. Specific attractions and opening hours still need verification.',
        'The total budget is for the entire trip, including all travellers.'
      ]
    }
  });
});

app.delete('/api/trips/:id', (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id < 1) {
    return res.status(400).json({
      error: 'Invalid trip ID.'
    });
  }

  const result = db.prepare(
    'DELETE FROM trips WHERE id = ?'
  ).run(id);

  if (!result.changes) {
    return res.status(404).json({
      error: 'Trip not found.'
    });
  }

  return res.status(204).end();
});

function isValidDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = parseDateOnly(value);
  return date !== null && formatDate(date) === value;
}

function parseDateOnly(value) {
  if (typeof value !== 'string') return null;

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return date;
}

function formatDate(date) {
  return [
    date.getUTCFullYear(),
    String(date.getUTCMonth() + 1).padStart(2, '0'),
    String(date.getUTCDate()).padStart(2, '0')
  ].join('-');
}

app.listen(PORT, () => {
  console.log(`TripWise API running at http://localhost:${PORT}`);
});

