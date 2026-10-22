
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const API = 'http://localhost:3001/api';

const emptyForm = {
  origin: '',
  destination: '',
  startDate: '',
  endDate: '',
  travelers: '1',
  budgetInr: '',
  interests: ''
};

const money = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(Number(value) || 0);

// Curated suggestions, not live-verified recommendations.
// Add more destinations here as the project grows.
const destinationPlaces = {
  mysuru: [
    {
      name: 'Mysuru Palace',
      time: 'Afternoon',
      description: 'Explore the royal palace and its architecture.',
      note: 'Check visitor timings and entry rules before visiting.'
    },
    {
      name: 'Devaraja Market',
      time: 'Evening',
      description: 'Browse a historic local market and its colourful stalls.',
      note: 'Opening hours may vary.'
    },
    {
      name: 'Chamundi Hill',
      time: 'Morning',
      description: 'Visit the hill and enjoy views over Mysuru.',
      note: 'Plan for travel time and check temple timings if relevant.'
    },
    {
      name: 'St. Philomena’s Church',
      time: 'Afternoon',
      description: 'See the historic church and its distinctive architecture.',
      note: 'Respect visitor and service timings.'
    },
    {
      name: 'Brindavan Gardens',
      time: 'Evening',
      description: 'Walk around the gardens near the Krishna Raja Sagara dam.',
      note: 'Check garden and fountain schedules before travelling.'
    },
    {
      name: 'Mysuru Zoo',
      time: 'Morning',
      description: 'Visit one of Mysuru’s well-known zoological attractions.',
      note: 'Check weekly closing day and entry hours.'
    },
    {
      name: 'Karanji Lake',
      time: 'Morning',
      description: 'Enjoy a nature-focused visit around the lake.',
      note: 'Check access and opening times.'
    },
    {
      name: 'Rail Museum, Mysuru',
      time: 'Afternoon',
      description: 'Explore railway exhibits and historic locomotives.',
      note: 'Verify visitor hours before your visit.'
    }
  ],
  bengaluru: [
    {
      name: 'Lalbagh Botanical Garden',
      time: 'Morning',
      description: 'Walk through the botanical garden and see its plant collections.',
      note: 'Check entry and glasshouse event timings.'
    },
    {
      name: 'Bengaluru Palace',
      time: 'Afternoon',
      description: 'Explore the palace grounds and architecture.',
      note: 'Check current visitor access and ticket details.'
    },
    {
      name: 'Cubbon Park',
      time: 'Morning',
      description: 'Enjoy a walk in the central green space.',
      note: 'Check access restrictions for your planned activities.'
    },
    {
      name: 'Vidhana Soudha area',
      time: 'Evening',
      description: 'See the landmark government building from permitted public areas.',
      note: 'Entry inside the building is restricted.'
    },
    {
      name: 'Visvesvaraya Industrial and Technological Museum',
      time: 'Afternoon',
      description: 'Explore science and technology exhibits.',
      note: 'Check opening hours and ticket availability.'
    },
    {
      name: 'Church Street',
      time: 'Evening',
      description: 'Explore the lively central area with cafés and shops.',
      note: 'Allow extra time for traffic and crowds.'
    }
  ],
  coorg: [
    {
      name: 'Abbey Falls',
      time: 'Morning',
      description: 'Visit a popular waterfall surrounded by greenery.',
      note: 'Check access, weather, and seasonal conditions.'
    },
    {
      name: 'Raja’s Seat',
      time: 'Evening',
      description: 'Enjoy the viewpoint and surrounding gardens.',
      note: 'Visibility depends on weather.'
    },
    {
      name: 'Madikeri Fort',
      time: 'Afternoon',
      description: 'Explore a historic landmark in Madikeri.',
      note: 'Check which areas are open to visitors.'
    },
    {
      name: 'Coffee plantation experience',
      time: 'Morning',
      description: 'Consider a local plantation visit.',
      note: 'Arrange permission or a tour with a verified operator.'
    },
    {
      name: 'Dubare Elephant Camp',
      time: 'Morning',
      description: 'Consider a visit to the riverside wildlife and conservation area.',
      note: 'Check current activities, access, and responsible wildlife guidelines.'
    },
    {
      name: 'Talakaveri',
      time: 'Afternoon',
      description: 'Visit the sacred source region of the Kaveri River.',
      note: 'Account for road travel and check local conditions.'
    }
  ]
};

function getDestinationKey(destination) {
  const value = destination.toLowerCase().trim();

  if (value.includes('mysuru') || value.includes('mysore')) return 'mysuru';
  if (value.includes('bengaluru') || value.includes('bangalore')) return 'bengaluru';
  if (value.includes('coorg') || value.includes('kodagu') || value.includes('madikeri')) {
    return 'coorg';
  }

  return null;
}

function makePlaceItinerary(plan) {
  const key = getDestinationKey(plan.destination);
  const places = key ? destinationPlaces[key] : [];

  return plan.itinerary.map((day, index) => {
    const selected = places.length
      ? [0, 1, 2].map((offset) => places[(index * 2 + offset) % places.length])
      : [];

    const uniquePlaces = selected.filter(
      (place, i, all) => all.findIndex((p) => p.name === place.name) === i
    );

    return {
      ...day,
      places: uniquePlaces,
      isCurated: Boolean(key)
    };
  });
}

function App() {
  const [form, setForm] = useState(emptyForm);
  const [trips, setTrips] = useState([]);
  const [plans, setPlans] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planningId, setPlanningId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [apiOnline, setApiOnline] = useState(false);
  const [activeTripId, setActiveTripId] = useState(null);

  async function loadTrips() {
    try {
      const [healthResponse, tripsResponse] = await Promise.all([
        fetch(`${API}/health`),
        fetch(`${API}/trips`)
      ]);

      if (!healthResponse.ok || !tripsResponse.ok) {
        throw new Error('API unavailable');
      }

      const health = await healthResponse.json();
      const data = await tripsResponse.json();

      setApiOnline(Boolean(health.ok));
      setTrips(data.trips || []);
    } catch {
      setApiOnline(false);
      setError(
        'Could not reach the local API. Make sure the frontend and backend are running.'
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTrips();
  }, []);

  const update = (event) => {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  };

  async function submit(event) {
    event.preventDefault();
    setError('');
    setNotice('');
    setSaving(true);

    try {
      const response = await fetch(`${API}/trips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          travelers: Number(form.travelers),
          budgetInr: Number(form.budgetInr)
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not save trip.');
      }

      setTrips((current) => [data.trip, ...current]);
      setForm(emptyForm);
      setNotice('Trip saved successfully. Generate its plan from your workspace.');
    } catch (e) {
      setError(e.message || 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  }

  async function generatePlan(id) {
    setError('');
    setNotice('');
    setPlanningId(id);

    try {
      const response = await fetch(`${API}/trips/${id}/plan`, {
        method: 'POST'
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Could not generate the trip plan.');
      }

      const plan = {
        ...data.plan,
        itinerary: makePlaceItinerary(data.plan)
      };

      setPlans((current) => ({
        ...current,
        [id]: plan
      }));

      setActiveTripId(id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e.message || 'Could not generate the trip plan.');
    } finally {
      setPlanningId(null);
    }
  }

  async function removeTrip(id) {
    setError('');
    setNotice('');

    try {
      const response = await fetch(`${API}/trips/${id}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Could not delete this trip.');
      }

      setTrips((current) => current.filter((trip) => trip.id !== id));

      setPlans((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });

      if (activeTripId === id) setActiveTripId(null);
      setNotice('Trip deleted.');
    } catch (e) {
      setError(e.message || 'Could not delete this trip.');
    }
  }

  const totalBudget = trips.reduce(
    (sum, trip) => sum + Number(trip.budget_inr || 0),
    0
  );

  const activeTrip = trips.find((trip) => trip.id === activeTripId);
  const activePlan = plans[activeTripId];
  const destinationKey = activePlan
    ? getDestinationKey(activePlan.destination)
    : null;

  function goHome() {
    setActiveTripId(null);
    setError('');
    setNotice('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <button type="button" className="brand brand-button" onClick={goHome}>
          <span className="brand-mark">✳</span>
          <span>tripwise<span className="brand-ai"> AI</span></span>
        </button>

        <div className="topbar-right">
          <span className={`status-dot ${apiOnline ? 'online' : ''}`} />
          <span>{apiOnline ? 'Local workspace ready' : 'Connecting to local API…'}</span>
          <span className="avatar">Y</span>
        </div>
      </header>

      <main id="top" className="main-layout">
        {error && (
          <div className="message error" role="alert">
            {error}
          </div>
        )}

        {notice && !activeTrip && (
          <div className="message success" role="status">
            {notice}
          </div>
        )}

        {activeTrip && activePlan ? (
          <section className="details-page">
            <button type="button" className="back-button" onClick={goHome}>
              ← Back to my trips
            </button>

            <section className="details-hero">
              <p className="step-label">YOUR PERSONAL TRIP PLAN</p>
              <h1>
                {activePlan.origin} <span>→</span> {activePlan.destination}
              </h1>
              <p>
                {activePlan.startDate} to {activePlan.endDate}
                {' · '}
                {activePlan.travelers} traveller{activePlan.travelers === 1 ? '' : 's'}
              </p>
              <div className="details-tags">
                <span>{activePlan.duration.days} days</span>
                <span>{activePlan.duration.nights} nights</span>
                <span>Personalised planning outline</span>
              </div>
            </section>

            <section className="budget-overview">
              <div className="budget-summary-card budget-summary-primary">
                <span>Total trip budget</span>
                <strong>{money(activePlan.totalBudgetInr)}</strong>
                <small>For all travellers combined</small>
              </div>
              <div className="budget-summary-card">
                <span>Daily budget average</span>
                <strong>
                  {money(Math.round(activePlan.totalBudgetInr / activePlan.duration.days))}
                </strong>
                <small>Whole-group average per day</small>
              </div>
              <div className="budget-summary-card">
                <span>Travellers</span>
                <strong>{activePlan.travelers}</strong>
                <small>Included in the total budget</small>
              </div>
            </section>

            <section className="details-section">
              <div className="details-section-heading">
                <div>
                  <p className="step-label">PLAN YOUR SPENDING</p>
                  <h2>Budget breakdown</h2>
                </div>
                <span className="estimate-label">ESTIMATES ONLY</span>
              </div>

              <p className="section-description">
                This is a suggested allocation of your budget, not a quote from
                transport providers or hotels.
              </p>

              <div className="budget-breakdown">
                {activePlan.budgetBreakdown.map((item) => (
                  <article className="budget-category-card" key={item.key}>
                    <div className="budget-category-top">
                      <span>{item.label}</span>
                      <strong>{money(item.amountInr)}</strong>
                    </div>
                    <div className="budget-track">
                      <div className="budget-fill" style={{ width: `${item.percent}%` }} />
                    </div>
                    <span className="budget-percent">{item.percent}% of total budget</span>
                  </article>
                ))}
              </div>
            </section>

            <section className="details-section">
              <div className="details-section-heading">
                <div>
                  <p className="step-label">EXPLORE YOUR DESTINATION</p>
                  <h2>Day-by-day itinerary</h2>
                </div>
                <span className="count-badge">{activePlan.itinerary.length} days</span>
              </div>

              {!destinationKey && (
                <div className="message">
                  We don't have a curated place list for this destination yet.
                  The days below will show general travel guidance until a local
                  destination guide is added.
                </div>
              )}

              <div className="itinerary-list">
                {activePlan.itinerary.map((day) => (
                  <article className="itinerary-day" key={day.day}>
                    <div className="day-heading">
                      <span className="day-number">DAY {day.day}</span>
                      <span className="day-date">{day.date}</span>
                    </div>

                    <h3>{day.title}</h3>

                    {day.places.length > 0 ? (
                      <div className="place-list">
                        {day.places.map((place, index) => (
                          <div className="place-item" key={`${day.day}-${place.name}`}>
                            <div className="place-time">
                              <span className="place-dot" />
                              <span>{place.time}</span>
                            </div>
                            <div className="place-content">
                              <h4>{place.name}</h4>
                              <p>{place.description}</p>
                              <small>{place.note}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="general-day-plan">
                        <p><strong>Morning:</strong> {day.morning}</p>
                        <p><strong>Afternoon:</strong> {day.afternoon}</p>
                        <p><strong>Evening:</strong> {day.evening}</p>
                      </div>
                    )}

                    <div className="day-budget">
                      Suggested daily allocation
                      <strong>{money(day.suggestedBudgetInr)}</strong>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="details-section notes-section">
              <h2>Before you travel</h2>
              <ul className="plan-notes">
                {activePlan.notes.map((note, index) => (
                  <li key={index}>{note}</li>
                ))}
                <li>Confirm attraction opening hours, ticket prices, and travel times before departure.</li>
                <li>Attractions shown are suggestions, not confirmed reservations.</li>
              </ul>
            </section>

            <button type="button" className="back-button" onClick={goHome}>
              ← Back to my trips
            </button>
          </section>
        ) : (
          <>
            <section className="hero">
              <div className="eyebrow">
                <span className="sparkle">✦</span> YOUR PERSONAL TRAVEL PLANNER
              </div>
              <h1>Big adventures.<br /><span>Thoughtful budgets.</span></h1>
              <p className="hero-copy">
                Plan your next journey with a budget breakdown and a destination
                itinerary, built step by step.
              </p>
              <div className="hero-pills">
                <span>₹0 API spend</span>
                <span>Saved locally</span>
                <span>India first</span>
              </div>
            </section>

            <section className="planner-card" aria-labelledby="planner-heading">
              <div className="section-heading">
                <div>
                  <p className="step-label">STEP 01 <span>•</span> YOUR NEXT ADVENTURE</p>
                  <h2 id="planner-heading">Where are we going?</h2>
                </div>
                <div className="round-icon">↗</div>
              </div>

              <form onSubmit={submit}>
                <div className="field-grid two-col">
                  <label>
                    Starting from
                    <input name="origin" value={form.origin} onChange={update}
                      placeholder="e.g. Bengaluru" required maxLength="100" />
                  </label>
                  <label>
                    Destination
                    <input name="destination" value={form.destination} onChange={update}
                      placeholder="e.g. Mysuru" required maxLength="100" />
                  </label>
                </div>

                <div className="field-grid two-col date-grid">
                  <label>
                    Departure date
                    <input type="date" name="startDate" value={form.startDate}
                      onChange={update} required />
                  </label>
                  <label>
                    Return date
                    <input type="date" name="endDate" value={form.endDate}
                      min={form.startDate || undefined} onChange={update} required />
                  </label>
                </div>

                <div className="field-grid two-col">
                  <label>
                    Number of travellers
                    <select name="travelers" value={form.travelers} onChange={update}>
                      {Array.from({ length: 10 }, (_, i) => (
                        <option key={i + 1} value={i + 1}>
                          {i + 1} {i === 0 ? 'traveller' : 'travellers'}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Total trip budget (₹)
                    <input type="number" name="budgetInr" value={form.budgetInr}
                      onChange={update} placeholder="e.g. 12000" min="1"
                      max="100000000" required />
                  </label>
                </div>

                <label>
                  What do you enjoy? <span className="optional">OPTIONAL</span>
                  <textarea name="interests" value={form.interests} onChange={update}
                    placeholder="Nature, local food, temples, trekking, quiet stays…"
                    rows="3" maxLength="500" />
                </label>

                <div className="form-foot">
                  <span><span className="lock">⌑</span> No paid APIs. No bookings. Just your plan.</span>
                  <button type="submit" disabled={saving}>
                    {saving ? 'Saving…' : 'Save trip request'} <span>↗</span>
                  </button>
                </div>
              </form>
            </section>

            <section className="saved-section">
              <div className="section-heading saved-heading">
                <div>
                  <p className="step-label">YOUR WORKSPACE</p>
                  <h2>Trips you're dreaming of</h2>
                </div>
                <span className="count-badge">{trips.length} saved</span>
              </div>

              <div className="stats-row">
                <div className="stat-card">
                  <span className="stat-icon">⌁</span>
                  <div><p>Saved trip requests</p><strong>{trips.length}</strong></div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon rupee">₹</span>
                  <div><p>Combined budget</p><strong>{money(totalBudget)}</strong></div>
                </div>
                <div className="stat-card">
                  <span className="stat-icon">◎</span>
                  <div><p>Trip planner</p><strong className="not-yet">Milestone 2</strong></div>
                </div>
              </div>

              {loading ? (
                <div className="empty-state">Loading your saved trips…</div>
              ) : trips.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-art">✈</div>
                  <h3>Your next story starts here.</h3>
                  <p>Save your first trip request, then generate its plan.</p>
                </div>
              ) : (
                <div className="trip-list">
                  {trips.map((trip) => (
                    <article className="trip-card trip-card-compact" key={trip.id}>
                      <div className="trip-symbol">✈</div>
                      <div className="trip-info">
                        <h3>{trip.origin} <span>→</span> {trip.destination}</h3>
                        <p>{trip.start_date} to {trip.end_date} · {trip.travelers} traveller{trip.travelers === 1 ? '' : 's'}</p>
                        {trip.interests && <p className="interests">{trip.interests}</p>}
                        <span className="estimate-label">REQUEST SAVED · NO LIVE PRICES</span>
                      </div>
                      <div className="trip-budget">
                        <span>Total budget</span>
                        <strong>{money(trip.budget_inr)}</strong>
                        <button type="button" className="delete-btn" onClick={() => removeTrip(trip.id)}>
                          Delete
                        </button>
                      </div>
                      <div className="trip-card-actions">
                        <button type="button" className="plan-btn"
                          disabled={planningId !== null}
                          onClick={() => generatePlan(trip.id)}>
                          {planningId === trip.id ? 'Generating…' : 'Generate trip plan'}
                          <span>↗</span>
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              )}
            </section>

            <footer>
              <span>✳ tripwise AI</span>
              <span>Built locally, for better journeys.</span>
            </footer>
          </>
        )}
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')).render(
  <React.StrictMode><App /></React.StrictMode>
);
