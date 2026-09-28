const path = require('path');
const express = require('express');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const ALLOWED_CATEGORIES = [
  'Football',
  'Cricket',
  'Basketball',
  'Badminton',
  'Athletics',
  'Esports'
];

const ALLOWED_STATUSES = [
  'Scheduled',
  'Live',
  'Completed',
  'Postponed'
];

const INITIAL_MATCHES = [
  {
    id: 'match-101',
    title: 'MIT-WPU Inter-Department Football Championship Final',
    venue: 'MIT-WPU Main Synthetic Turf, Kothrud Campus',
    category: 'Football',
    status: 'Completed',
    rating: 5,
    teams: 'CET Stallions vs Mech Titans (3 - 2)',
    createdAt: '2026-09-20T14:30:00.000Z'
  },
  {
    id: 'match-102',
    title: 'West Zone University T20 Cricket Qualifier',
    venue: 'MCA International Stadium Annex, Pune',
    category: 'Cricket',
    status: 'Live',
    rating: 5,
    teams: 'MIT-WPU Peace XI vs COEP Royals',
    createdAt: '2026-09-24T09:00:00.000Z'
  },
  {
    id: 'match-103',
    title: 'National Collegiate 5v5 Basketball Invitational',
    venue: 'Indoor Sports Complex Court A',
    category: 'Basketball',
    status: 'Scheduled',
    rating: 4,
    teams: 'Pune Hawks vs Mumbai Hoopsters',
    createdAt: '2026-09-26T16:00:00.000Z'
  },
  {
    id: 'match-104',
    title: 'All-India Engineering Badminton Mixed Doubles',
    venue: 'Badminton Hall Court 2',
    category: 'Badminton',
    status: 'Completed',
    rating: 4,
    teams: 'K. Deshmukh & S. Kulkarni vs V. Patil & R. Joshi',
    createdAt: '2026-09-27T11:15:00.000Z'
  }
];

let matchesStore = [];

function resetStore() {
  matchesStore = INITIAL_MATCHES.map((item) => ({ ...item }));
}

resetStore();

function getCommitSha() {
  const raw = process.env.GIT_SHA || process.env.RENDER_GIT_COMMIT || 'local';
  return String(raw).slice(0, 7);
}

function sanitizeString(input) {
  if (typeof input !== 'string') {
    return '';
  }
  return input
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function calculateStats(items) {
  const totalItems = items.length;
  const completedCount = items.filter((item) => item.status === 'Completed').length;
  const liveCount = items.filter((item) => item.status === 'Live').length;
  const scheduledCount = items.filter((item) => item.status === 'Scheduled').length;
  const completionRate = totalItems > 0 ? Math.round((completedCount / totalItems) * 100) : 0;
  const sumRating = items.reduce((acc, item) => acc + Number(item.rating || 0), 0);
  const averageRating = totalItems > 0 ? Number((sumRating / totalItems).toFixed(2)) : 0;

  return {
    totalItems,
    completedCount,
    liveCount,
    scheduledCount,
    completionRate,
    averageRating,
    averageScore: averageRating,
    activeCommit: getCommitSha()
  };
}

app.get('/', (req, res) => {
  const stats = calculateStats(matchesStore);
  const successMsg = req.query.success ? sanitizeString(String(req.query.success)) : null;
  const errorMsg = req.query.error ? sanitizeString(String(req.query.error)) : null;

  res.render('index', {
    matches: matchesStore,
    stats,
    categories: ALLOWED_CATEGORIES,
    statuses: ALLOWED_STATUSES,
    success: successMsg,
    error: errorMsg,
    commitSha: getCommitSha()
  });
});

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    commit: getCommitSha(),
    uptime: Math.floor(process.uptime()),
    timestamp: new Date().toISOString()
  });
});

function handleGetApi(req, res) {
  const stats = calculateStats(matchesStore);
  res.status(200).json({
    matches: matchesStore,
    contracts: matchesStore,
    stats
  });
}

app.get('/api/matches', handleGetApi);
app.get('/api/contracts', handleGetApi);

function handleCreateMatch(req, res) {
  const rawTitle = req.body.title;
  const rawVenue = req.body.venue || 'MIT-WPU Main Sports Complex';
  const rawTeams = req.body.teams || 'TBD vs TBD';
  const rawCategory = req.body.category;
  const rawStatus = req.body.status;
  const rawRating = req.body.rating;

  const isHtmlRequest =
    req.headers.accept &&
    req.headers.accept.includes('text/html') &&
    !req.headers.accept.includes('application/json');
  const wantsJson = !isHtmlRequest;

  function sendValidationError(message) {
    if (wantsJson) {
      return res.status(400).json({ error: message });
    }
    return res.status(400).render('index', {
      matches: matchesStore,
      stats: calculateStats(matchesStore),
      categories: ALLOWED_CATEGORIES,
      statuses: ALLOWED_STATUSES,
      success: null,
      error: sanitizeString(message),
      commitSha: getCommitSha()
    });
  }

  if (
    !rawTitle ||
    typeof rawTitle !== 'string' ||
    rawTitle.trim() === '' ||
    !rawCategory ||
    !rawStatus ||
    rawRating === undefined ||
    rawRating === null ||
    String(rawRating).trim() === ''
  ) {
    return sendValidationError(
      'Validation failed: title, category, status, and rating are required fields.'
    );
  }

  if (!ALLOWED_CATEGORIES.includes(rawCategory)) {
    return sendValidationError(
      `Invalid category. Allowed values: ${ALLOWED_CATEGORIES.join(', ')}`
    );
  }

  if (!ALLOWED_STATUSES.includes(rawStatus)) {
    return sendValidationError(
      `Invalid status. Allowed values: ${ALLOWED_STATUSES.join(', ')}`
    );
  }

  const numericRating = Number(rawRating);
  if (Number.isNaN(numericRating) || numericRating < 1 || numericRating > 5) {
    return sendValidationError(
      'Invalid rating: numeric rating must be between 1 and 5.'
    );
  }

  const newEntry = {
    id: `match-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    title: sanitizeString(rawTitle),
    venue: sanitizeString(String(rawVenue)),
    teams: sanitizeString(String(rawTeams)),
    category: sanitizeString(rawCategory),
    status: sanitizeString(rawStatus),
    rating: numericRating,
    createdAt: new Date().toISOString()
  };

  matchesStore.unshift(newEntry);

  if (wantsJson) {
    return res.status(201).json({
      message: 'Sports match fixture created successfully',
      match: newEntry,
      contract: newEntry,
      stats: calculateStats(matchesStore)
    });
  }

  return res.redirect(
    '/?success=' + encodeURIComponent(`Fixture "${newEntry.title}" registered successfully!`)
  );
}

app.post('/matches', handleCreateMatch);
app.post('/contracts', handleCreateMatch);

function handleDeleteMatch(req, res) {
  const targetId = req.params.id;
  const initialLength = matchesStore.length;
  matchesStore = matchesStore.filter((item) => item.id !== targetId);
  const removed = matchesStore.length < initialLength;

  const wantsJson =
    req.headers.accept && req.headers.accept.includes('application/json');

  if (wantsJson) {
    if (!removed) {
      return res.status(404).json({ error: 'Match fixture not found' });
    }
    return res.status(200).json({
      message: 'Match fixture deleted successfully',
      id: targetId,
      stats: calculateStats(matchesStore)
    });
  }

  if (!removed) {
    return res.redirect('/?error=' + encodeURIComponent('Fixture could not be found.'));
  }

  return res.redirect('/?success=' + encodeURIComponent('Fixture removed from schedule.'));
}

app.post('/matches/:id/delete', handleDeleteMatch);
app.post('/contracts/:id/delete', handleDeleteMatch);

app.resetStore = resetStore;

module.exports = app;
