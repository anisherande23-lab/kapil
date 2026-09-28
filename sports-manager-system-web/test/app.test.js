const { test, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert/strict');
const app = require('../app');

let server;
let baseUrl;

beforeEach(async () => {
  app.resetStore();
  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const { port } = server.address();
      baseUrl = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

afterEach(async () => {
  if (server) {
    await new Promise((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  }
});

test('1. GET /health returns HTTP 200 and { status: "ok", commit, timestamp }', async () => {
  const res = await fetch(`${baseUrl}/health`);
  assert.equal(res.status, 200);

  const body = await res.json();
  assert.equal(body.status, 'ok');
  assert.equal(typeof body.commit, 'string');
  assert.ok(body.commit.length > 0 && body.commit.length <= 7);
  assert.equal(typeof body.uptime, 'number');
  assert.equal(typeof body.timestamp, 'string');
  assert.ok(!Number.isNaN(Date.parse(body.timestamp)));
});

test('2. POST /matches with valid input returns HTTP 201 and creates a new entry (verify via GET /api/matches)', async () => {
  const payload = new URLSearchParams({
    title: 'National Inter-College Athletics 100m Sprint <Final>',
    venue: 'MIT-WPU Track & Field Complex',
    teams: 'Heat 1 Qualifiers',
    category: 'Athletics',
    status: 'Scheduled',
    rating: '5'
  });

  const postRes = await fetch(`${baseUrl}/matches`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: payload.toString()
  });

  assert.equal(postRes.status, 201);
  const created = await postRes.json();
  assert.ok(created.match);
  assert.equal(
    created.match.title,
    'National Inter-College Athletics 100m Sprint &lt;Final&gt;'
  );
  assert.equal(created.match.category, 'Athletics');
  assert.equal(created.match.status, 'Scheduled');
  assert.equal(created.match.rating, 5);

  const apiRes = await fetch(`${baseUrl}/api/matches`);
  assert.equal(apiRes.status, 200);
  const apiData = await apiRes.json();
  assert.equal(apiData.matches.length, 5);
  assert.equal(apiData.matches[0].id, created.match.id);
});

test('3. POST /matches with missing required field returns HTTP 400 AND with invalid numeric value returns HTTP 400', async () => {
  const missingPayload = new URLSearchParams({
    title: '',
    category: 'Football',
    status: 'Scheduled',
    rating: '4'
  });

  const missingRes = await fetch(`${baseUrl}/matches`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: missingPayload.toString()
  });
  assert.equal(missingRes.status, 400);

  const invalidRatingPayload = new URLSearchParams({
    title: 'State Level Badminton Open',
    category: 'Badminton',
    status: 'Live',
    rating: '9'
  });

  const invalidRatingRes = await fetch(`${baseUrl}/matches`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: invalidRatingPayload.toString()
  });
  assert.equal(invalidRatingRes.status, 400);
});

test('4. GET /api/matches returns valid JSON with contracts array and stats object with numeric fields', async () => {
  const res = await fetch(`${baseUrl}/api/matches`);
  assert.equal(res.status, 200);

  const data = await res.json();
  assert.ok(Array.isArray(data.contracts));
  assert.ok(Array.isArray(data.matches));
  assert.equal(data.contracts.length, 4);
  assert.ok(data.stats && typeof data.stats === 'object');
  assert.equal(typeof data.stats.totalItems, 'number');
  assert.equal(typeof data.stats.completionRate, 'number');
  assert.equal(typeof data.stats.averageRating, 'number');
  assert.equal(data.stats.totalItems, 4);
});
