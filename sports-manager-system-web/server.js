const app = require('./app');

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  const rawSha = process.env.GIT_SHA || process.env.RENDER_GIT_COMMIT || 'local';
  const sha = String(rawSha).slice(0, 7);
  console.log(`[ArenaOps Sports Manager] Server running on http://localhost:${PORT} (commit ${sha})`);
});
