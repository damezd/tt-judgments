const express = require('express');
const cors    = require('cors');
require('dotenv').config();

const authRoutes     = require('./routes/auth');
const searchRoutes   = require('./routes/search');
const casesRoutes    = require('./routes/cases');
const insightsRoutes = require('./routes/insights');
const networkRoutes  = require('./routes/network');
const crimeRoutes    = require('./routes/crime');
const requireAuth    = require('./middleware/auth');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || '*' }));
app.use(express.json());

// Health check (Railway requires this)
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Public — login
app.use('/api/auth', authRoutes);

// Protected — everything else requires a valid JWT
app.use('/api', requireAuth, searchRoutes);
app.use('/api', requireAuth, casesRoutes);
app.use('/api', requireAuth, insightsRoutes);
app.use('/api', requireAuth, networkRoutes);
app.use('/api', requireAuth, crimeRoutes);

app.listen(PORT, () => {
  console.log(`TT Judgments backend running on port ${PORT}`);
});
