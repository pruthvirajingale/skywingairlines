// server.js
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// In-Memory Data Store (Can be easily swapped with MongoDB / PostgreSQL)
let users = [
  { id: 'usr-admin', name: 'SkyWing Admin', email: 'admin@skywing.com', password: 'admin123', role: 'admin' },
  { id: 'usr-demo', name: 'Rahul Sharma', email: 'customer@demo.com', password: 'pass123', role: 'customer' }
];

let flights = [
  { id: 'FL-101', flightNo: 'AI-802', airline: 'Air India', origin: 'BOM', dest: 'DEL', departTime: '06:30', arriveTime: '08:45', duration: '2h 15m', durationMinutes: 135, stops: 0, layover: null, basePrice: 4800, cabinClass: 'Economy', aircraft: 'Airbus A321neo', availableSeats: 14 },
  { id: 'FL-102', flightNo: '6E-451', airline: 'IndiGo', origin: 'BOM', dest: 'DEL', departTime: '09:15', arriveTime: '11:25', duration: '2h 10m', durationMinutes: 130, stops: 0, layover: null, basePrice: 4200, cabinClass: 'Economy', aircraft: 'Airbus A320neo', availableSeats: 8 },
  { id: 'FL-103', flightNo: 'UK-927', airline: 'Vistara', origin: 'BOM', dest: 'DEL', departTime: '13:00', arriveTime: '17:10', duration: '4h 10m', durationMinutes: 250, stops: 1, layover: 'HYD (1h 15m)', basePrice: 3850, cabinClass: 'Economy', aircraft: 'Boeing 737-800', availableSeats: 19 },
  { id: 'FL-104', flightNo: 'EK-501', airline: 'Emirates', origin: 'BOM', dest: 'DXB', departTime: '04:30', arriveTime: '06:45', duration: '3h 45m', durationMinutes: 225, stops: 0, layover: null, basePrice: 19500, cabinClass: 'Economy', aircraft: 'Boeing 777-300ER', availableSeats: 22 },
  { id: 'FL-105', flightNo: 'SQ-421', airline: 'Singapore Air', origin: 'DEL', dest: 'SIN', departTime: '08:50', arriveTime: '17:05', duration: '5h 45m', durationMinutes: 345, stops: 0, layover: null, basePrice: 24000, cabinClass: 'Economy', aircraft: 'Airbus A350-900', availableSeats: 11 },
  { id: 'FL-106', flightNo: 'AI-131', airline: 'Air India', origin: 'BOM', dest: 'LHR', departTime: '06:15', arriveTime: '11:30', duration: '9h 45m', durationMinutes: 585, stops: 0, layover: null, basePrice: 42000, cabinClass: 'Economy', aircraft: 'Boeing 787-9 Dreamliner', availableSeats: 7 }
];

let bookings = [];

// --- Auth Routes ---
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email.toLowerCase() === email?.toLowerCase() && u.password === password);
  if (!user) return res.status(401).json({ message: 'Invalid credentials' });
  const { password: _, ...userData } = user;
  res.json({ user: userData });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password, role } = req.body;
  if (users.some(u => u.email.toLowerCase() === email?.toLowerCase())) {
    return res.status(400).json({ message: 'Email already registered' });
  }
  const newUser = { id: `usr-${Date.now()}`, name, email, password, role: role || 'customer' };
  users.push(newUser);
  const { password: _, ...userData } = newUser;
  res.status(201).json({ user: userData });
});

// --- Flight Routes ---
app.get('/api/flights', (req, res) => {
  const { origin, dest } = req.query;
  let result = flights;
  if (origin && dest) {
    result = result.filter(f => f.origin === origin && f.dest === dest);
  }
  res.json(result);
});

app.post('/api/flights', (req, res) => {
  const newFlight = { id: `FL-${Date.now()}`, ...req.body };
  flights.unshift(newFlight);
  res.status(201).json(newFlight);
});

app.put('/api/flights/:id', (req, res) => {
  const { id } = req.params;
  const index = flights.findIndex(f => f.id === id);
  if (index === -1) return res.status(404).json({ message: 'Flight not found' });
  flights[index] = { ...flights[index], ...req.body };
  res.json(flights[index]);
});

app.delete('/api/flights/:id', (req, res) => {
  const { id } = req.params;
  flights = flights.filter(f => f.id !== id);
  res.json({ message: 'Flight deleted successfully' });
});

// --- Booking Routes ---
app.get('/api/bookings', (req, res) => {
  const { userId, email } = req.query;
  if (userId || email) {
    return res.json(bookings.filter(b => b.userId === userId || b.userEmail === email));
  }
  res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
  const booking = { pnr: `SKW-${Math.floor(1000 + Math.random() * 9000)}`, createdAt: new Date().toISOString(), ...req.body };
  bookings.unshift(booking);

  // Decrement seats
  const flight = flights.find(f => f.id === booking.flightId);
  if (flight) {
    flight.availableSeats = Math.max(0, flight.availableSeats - (booking.seats?.length || 1));
  }
  res.status(201).json(booking);
});

app.delete('/api/bookings/:pnr', (req, res) => {
  const { pnr } = req.params;
  bookings = bookings.filter(b => b.pnr !== pnr);
  res.json({ message: 'Booking cancelled' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`SkyWing backend running on http://localhost:${PORT}`));