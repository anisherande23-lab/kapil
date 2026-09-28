import express from 'express';
import path from 'path';
import fs from 'fs';
import { execSync } from 'child_process';
import { createRequire } from 'module';
import { createServer as createViteServer } from 'vite';

const require = createRequire(import.meta.url);
const PROJECT_DIR = path.resolve(process.cwd(), 'sports-manager-system-web');

// Load the CommonJS Express app from sports-manager-system-web/app.js
const sportsApp = require(path.join(PROJECT_DIR, 'app.js'));

const FILES_TO_EXPOSE = [
  'package.json',
  'server.js',
  'app.js',
  'views/index.ejs',
  'public/css/style.css',
  'eslint.config.js',
  'test/app.test.js',
  'Dockerfile',
  '.dockerignore',
  '.github/workflows/ci-cd.yml',
  'setup_git.py',
  'generate_report.py',
  'README.md',
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static CSS from sports-manager-system-web/public so /ejs-preview has full styling
  app.use('/css', express.static(path.join(PROJECT_DIR, 'public', 'css')));

  // Mount /health, /api/matches, /api/contracts, /matches, /contracts from sports-manager-system-web/app.js
  app.get('/health', (req, res, next) => sportsApp(req, res, next));
  app.get('/api/matches', (req, res, next) => sportsApp(req, res, next));
  app.get('/api/contracts', (req, res, next) => sportsApp(req, res, next));
  app.post('/matches', (req, res, next) => sportsApp(req, res, next));
  app.post('/contracts', (req, res, next) => sportsApp(req, res, next));
  app.post('/matches/:id/delete', (req, res, next) => sportsApp(req, res, next));
  app.post('/contracts/:id/delete', (req, res, next) => sportsApp(req, res, next));

  // Direct SSR EJS preview route (/ejs-preview) rendering views/index.ejs from sports-manager-system-web
  app.get('/ejs-preview', (req, res) => {
    req.url = '/';
    sportsApp(req, res);
  });

  // Reset store endpoint for interactive testing
  app.post('/api/cca2/reset-store', (_req, res) => {
    if (typeof sportsApp.resetStore === 'function') {
      sportsApp.resetStore();
    }
    res.json({ status: 'ok', message: 'In-memory fixture store reset to initial 4 fixtures.' });
  });

  // CCA2 Project Overview API
  app.get('/api/cca2/overview', (_req, res) => {
    const files: Record<string, string> = {};
    for (const relPath of FILES_TO_EXPOSE) {
      const fullPath = path.join(PROJECT_DIR, relPath);
      if (fs.existsSync(fullPath)) {
        files[relPath] = fs.readFileSync(fullPath, 'utf-8');
      }
    }

    let gitLog = '';
    let gitRemotes = '';
    let headSha = 'local';
    try {
      gitLog = execSync('git log --oneline --graph --all', {
        cwd: PROJECT_DIR,
        encoding: 'utf-8',
      }).trim();
      gitRemotes = execSync('git remote -v', {
        cwd: PROJECT_DIR,
        encoding: 'utf-8',
      }).trim();
      headSha = execSync('git rev-parse --short HEAD', {
        cwd: PROJECT_DIR,
        encoding: 'utf-8',
      }).trim();
    } catch (err) {
      gitLog = String(err);
    }

    const metaPath = path.join(PROJECT_DIR, 'student_meta.json');
    let studentMeta = {
      name: 'Kapil',
      prn: '103223XXXX',
      roll_no: 'Panel A / Roll No. XX',
      project_title: 'ArenaOps — Sports Management System & Automated CI/CD Pipeline',
      github_url: 'https://github.com/kapil2908/sports-manager-system-web.git',
      live_url: 'https://sports-manager-system-web.onrender.com',
      date: 'September 28, 2026',
      faculty: 'Prof. Pranati Waghodekar',
    };
    if (fs.existsSync(metaPath)) {
      try {
        studentMeta = { ...studentMeta, ...JSON.parse(fs.readFileSync(metaPath, 'utf-8')) };
      } catch {
        // keep default
      }
    }

    const pdfPath = path.join(PROJECT_DIR, 'CCA2_SUBMISSION_REPORT.pdf');
    const pdfExists = fs.existsSync(pdfPath);
    const pdfSizeBytes = pdfExists ? fs.statSync(pdfPath).size : 0;

    res.json({
      projectFolder: 'sports-manager-system-web',
      headSha,
      gitLog,
      gitRemotes,
      studentMeta,
      pdfExists,
      pdfSizeBytes,
      files,
    });
  });

  // Run ESLint & Node:test live inside sports-manager-system-web
  app.post('/api/cca2/run-checks', (_req, res) => {
    let lintOutput = '';
    let lintPassed = false;
    try {
      lintOutput = execSync('npm run lint', {
        cwd: PROJECT_DIR,
        encoding: 'utf-8',
      });
      lintPassed = true;
    } catch (err: any) {
      lintOutput = (err.stdout || '') + '\n' + (err.stderr || err.message || '');
    }

    let testOutput = '';
    let testPassed = false;
    try {
      testOutput = execSync('npm test', {
        cwd: PROJECT_DIR,
        encoding: 'utf-8',
      });
      testPassed = true;
    } catch (err: any) {
      testOutput = (err.stdout || '') + '\n' + (err.stderr || err.message || '');
    }

    res.json({
      lintPassed,
      lintOutput: lintOutput.trim(),
      testPassed,
      testOutput: testOutput.trim(),
      timestamp: new Date().toISOString(),
    });
  });

  // Update Student Details & Live Render URL -> updates README.md + generate_report.py -> regenerates PDF + commits
  app.post('/api/cca2/update-student-meta', (req, res) => {
    try {
      const {
        name = 'Kapil',
        prn = '103223XXXX',
        roll_no = 'Panel A / Roll No. XX',
        project_title = 'ArenaOps — Sports Management System & Automated CI/CD Pipeline',
        github_url = 'https://github.com/kapil2908/sports-manager-system-web.git',
        live_url = 'https://sports-manager-system-web.onrender.com',
        date = 'September 28, 2026',
        faculty = 'Prof. Pranati Waghodekar',
      } = req.body || {};

      const metaObj = {
        name: String(name).trim(),
        prn: String(prn).trim(),
        roll_no: String(roll_no).trim(),
        project_title: String(project_title).trim(),
        github_url: String(github_url).trim(),
        live_url: String(live_url).trim(),
        date: String(date).trim(),
        faculty: String(faculty).trim(),
      };

      fs.writeFileSync(
        path.join(PROJECT_DIR, 'student_meta.json'),
        JSON.stringify(metaObj, null, 2),
        'utf-8'
      );

      // Update README.md table rows dynamically
      const readmePath = path.join(PROJECT_DIR, 'README.md');
      if (fs.existsSync(readmePath)) {
        let readme = fs.readFileSync(readmePath, 'utf-8');
        readme = readme
          .replace(/\| \*\*Student Name\*\* \| .* \|/, `| **Student Name** | ${metaObj.name} |`)
          .replace(/\| \*\*PRN\*\* \| .* \|/, `| **PRN** | ${metaObj.prn} |`)
          .replace(/\| \*\*Roll No\. \/ Panel\*\* \| .* \|/, `| **Roll No. / Panel** | ${metaObj.roll_no} |`)
          .replace(/\| \*\*Project Title\*\* \| .* \|/, `| **Project Title** | ${metaObj.project_title} |`)
          .replace(
            /\| \*\*GitHub Repository URL\*\* \| .* \|/,
            `| **GitHub Repository URL** | [${metaObj.github_url}](${metaObj.github_url}) |`
          )
          .replace(
            /\| \*\*Live Render App URL\*\* \| .* \|/,
            `| **Live Render App URL** | [${metaObj.live_url}](${metaObj.live_url}) |`
          );
        fs.writeFileSync(readmePath, readme, 'utf-8');
      }

      // Regenerate 4-page PDF report
      execSync('python3 generate_report.py', { cwd: PROJECT_DIR });

      // Update remote origin if github_url changed
      try {
        execSync(`git remote set-url origin "${metaObj.github_url}"`, { cwd: PROJECT_DIR });
      } catch {
        // ignore if remote error
      }

      // Commit changes as required by Requirement 8
      execSync('git add README.md generate_report.py CCA2_SUBMISSION_REPORT.pdf', {
        cwd: PROJECT_DIR,
      });
      try {
        execSync(`git commit -m "docs: add live Render deployment URL ${metaObj.live_url}"`, {
          cwd: PROJECT_DIR,
        });
      } catch {
        // If no changes, create empty commit
        execSync(
          `git commit --allow-empty -m "docs: add live Render deployment URL ${metaObj.live_url}"`,
          { cwd: PROJECT_DIR }
        );
      }

      const gitLog = execSync('git log --oneline --graph --all', {
        cwd: PROJECT_DIR,
        encoding: 'utf-8',
      }).trim();

      res.json({
        status: 'ok',
        message: `Updated README.md, regenerated 4-page CCA2_SUBMISSION_REPORT.pdf, and committed "docs: add live Render deployment URL ${metaObj.live_url}"`,
        studentMeta: metaObj,
        gitLog,
      });
    } catch (err: any) {
      res.status(500).json({ error: String(err.message || err) });
    }
  });

  // Download 4-Page PDF Submission Report
  app.get('/api/cca2/report.pdf', (_req, res) => {
    const pdfPath = path.join(PROJECT_DIR, 'CCA2_SUBMISSION_REPORT.pdf');
    if (!fs.existsSync(pdfPath)) {
      execSync('python3 generate_report.py', { cwd: PROJECT_DIR });
    }
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      'inline; filename="CCA2_SUBMISSION_REPORT.pdf"'
    );
    res.sendFile(pdfPath);
  });

  // Download complete sports-manager-system-web project archive (including .git history & PDF)
  app.get('/api/cca2/download-project.tar.gz', (_req, res) => {
    const archivePath = '/tmp/sports-manager-system-web.tar.gz';
    execSync(
      'tar --exclude="sports-manager-system-web/node_modules" -czf /tmp/sports-manager-system-web.tar.gz sports-manager-system-web',
      { cwd: process.cwd() }
    );
    res.setHeader('Content-Type', 'application/gzip');
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="sports-manager-system-web.tar.gz"'
    );
    res.sendFile(archivePath);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
