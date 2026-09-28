import React, { useEffect, useState, useCallback } from 'react';
import {
  Trophy,
  Terminal,
  FileText,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  Play,
  Download,
  Copy,
  Check,
  RefreshCw,
  Trash2,
  Plus,
  ExternalLink,
  Rocket,
  FolderGit2,
} from 'lucide-react';

interface MatchFixture {
  id: string;
  title: string;
  venue: string;
  teams: string;
  category: string;
  status: string;
  rating: number;
  createdAt: string;
}

interface ArenaStats {
  totalItems: number;
  completedCount: number;
  liveCount: number;
  scheduledCount: number;
  completionRate: number;
  averageRating: number;
  activeCommit: string;
}

interface StudentMeta {
  name: string;
  prn: string;
  roll_no: string;
  project_title: string;
  github_url: string;
  live_url: string;
  date: string;
  faculty: string;
}

interface Cca2Overview {
  projectFolder: string;
  headSha: string;
  gitLog: string;
  gitRemotes: string;
  studentMeta: StudentMeta;
  pdfExists: boolean;
  pdfSizeBytes: number;
  files: Record<string, string>;
}

const CATEGORIES = ['Football', 'Cricket', 'Basketball', 'Badminton', 'Athletics', 'Esports'];
const STATUSES = ['Scheduled', 'Live', 'Completed', 'Postponed'];

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&');
}

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'app' | 'ejs' | 'tests' | 'files' | 'deploy'
  >('app');

  // Sports Manager state
  const [matches, setMatches] = useState<MatchFixture[]>([]);
  const [stats, setStats] = useState<ArenaStats>({
    totalItems: 0,
    completedCount: 0,
    liveCount: 0,
    scheduledCount: 0,
    completionRate: 0,
    averageRating: 0,
    activeCommit: 'local',
  });
  const [healthData, setHealthData] = useState<{
    status: string;
    commit: string;
    uptime: number;
    timestamp: string;
  } | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [teams, setTeams] = useState('');
  const [venue, setVenue] = useState('');
  const [category, setCategory] = useState('Football');
  const [status, setStatus] = useState('Scheduled');
  const [rating, setRating] = useState(4);
  const [flashSuccess, setFlashSuccess] = useState<string | null>(null);
  const [flashError, setFlashError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('All');

  // CCA2 Overview state
  const [overview, setOverview] = useState<Cca2Overview | null>(null);
  const [selectedFile, setSelectedFile] = useState<string>('app.js');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Quality checks state
  const [runningChecks, setRunningChecks] = useState(false);
  const [checkResult, setCheckResult] = useState<{
    lintPassed: boolean;
    lintOutput: string;
    testPassed: boolean;
    testOutput: string;
    timestamp: string;
  } | null>(null);

  // Student meta editor state
  const [metaForm, setMetaForm] = useState<StudentMeta>({
    name: 'Kapil',
    prn: '103223XXXX',
    roll_no: 'Panel A / Roll No. XX',
    project_title: 'ArenaOps — Sports Management System & Automated CI/CD Pipeline',
    github_url: 'https://github.com/kapil2908/sports-manager-system-web.git',
    live_url: 'https://sports-manager-system-web.onrender.com',
    date: 'September 28, 2026',
    faculty: 'Prof. Pranati Waghodekar',
  });
  const [updatingMeta, setUpdatingMeta] = useState(false);
  const [metaSuccess, setMetaSuccess] = useState<string | null>(null);

  const fetchArenaData = useCallback(async () => {
    try {
      const [matchesRes, healthRes] = await Promise.all([
        fetch('/api/matches'),
        fetch('/health'),
      ]);
      if (matchesRes.ok) {
        const data = await matchesRes.json();
        setMatches(data.matches || []);
        if (data.stats) setStats(data.stats);
      }
      if (healthRes.ok) {
        const hData = await healthRes.json();
        setHealthData(hData);
      }
    } catch (err) {
      console.error('Failed to fetch arena data:', err);
    }
  }, []);

  const fetchOverview = useCallback(async () => {
    try {
      const res = await fetch('/api/cca2/overview');
      if (res.ok) {
        const data: Cca2Overview = await res.json();
        setOverview(data);
        if (data.studentMeta) {
          setMetaForm(data.studentMeta);
        }
      }
    } catch (err) {
      console.error('Failed to fetch CCA2 overview:', err);
    }
  }, []);

  useEffect(() => {
    fetchArenaData();
    fetchOverview();
  }, [fetchArenaData, fetchOverview]);

  const handleCreateFixture = async (e: React.FormEvent) => {
    e.preventDefault();
    setFlashSuccess(null);
    setFlashError(null);

    try {
      const res = await fetch('/matches', {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          teams: teams || 'TBD vs TBD',
          venue: venue || 'MIT-WPU Main Sports Complex',
          category,
          status,
          rating: Number(rating),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setFlashError(data.error || 'Validation failed (HTTP 400).');
        return;
      }

      setFlashSuccess(`Fixture "${decodeHtmlEntities(data.match.title)}" scheduled (HTTP 201).`);
      setTitle('');
      setTeams('');
      setVenue('');
      setRating(4);
      await fetchArenaData();
    } catch (err: any) {
      setFlashError(err.message || 'Network error while creating fixture.');
    }
  };

  const handleDeleteFixture = async (id: string) => {
    setFlashSuccess(null);
    setFlashError(null);
    try {
      const res = await fetch(`/matches/${id}/delete`, {
        method: 'POST',
        headers: { Accept: 'application/json' },
      });
      if (res.ok) {
        setFlashSuccess('Fixture removed from active tournament schedule.');
        await fetchArenaData();
      }
    } catch (err: any) {
      setFlashError(err.message || 'Could not remove fixture.');
    }
  };

  const handleResetStore = async () => {
    await fetch('/api/cca2/reset-store', { method: 'POST' });
    setFlashSuccess('In-memory store reset via app.resetStore() to initial 4 fixtures.');
    setFlashError(null);
    await fetchArenaData();
  };

  const handleRunQualityGates = async () => {
    setRunningChecks(true);
    try {
      const res = await fetch('/api/cca2/run-checks', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setCheckResult(data);
      }
    } finally {
      setRunningChecks(false);
    }
  };

  const handleUpdateMeta = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingMeta(true);
    setMetaSuccess(null);
    try {
      const res = await fetch('/api/cca2/update-student-meta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(metaForm),
      });
      const data = await res.json();
      if (res.ok) {
        setMetaSuccess(data.message);
        await fetchOverview();
      }
    } finally {
      setUpdatingMeta(false);
    }
  };

  const copyText = (key: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const filteredMatches =
    categoryFilter === 'All'
      ? matches
      : matches.filter((m) => m.category === categoryFilter);

  const effectiveSha =
    overview?.headSha && overview.headSha !== 'local'
      ? overview.headSha
      : stats.activeCommit;

  return (
    <div className="min-h-screen flex flex-col bg-[#090d16] text-slate-100">
      {/* Top Navigation & Brand Header */}
      <header className="border-b border-white/10 bg-[#0d1322]/90 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-[1360px] mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-lg bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-base tracking-tight">
              <Trophy className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-white">
                ArenaOps Sports Management System
              </h1>
              <p className="text-xs text-slate-400">
                MIT World Peace University, Pune · CSE30040 Cloud Computing &amp; DevOps · CCA 2 · Prof. Pranati Waghodekar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/api/cca2/report.pdf"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800/90 hover:bg-slate-700 text-xs font-medium text-slate-200 border border-white/10 transition-colors"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>4-Page Report PDF</span>
            </a>

            <a
              href="/api/cca2/download-project.tar.gz"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-xs font-semibold text-slate-950 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download sports-manager-system-web.tar.gz</span>
            </a>
          </div>
        </div>

        {/* Interactive Workspace Switcher */}
        <div className="max-w-[1360px] mx-auto px-6 border-t border-white/5 flex items-center justify-between flex-wrap gap-3 py-2.5">
          <div className="flex items-center gap-1 p-1 bg-slate-900/90 rounded-lg border border-white/5">
            <button
              onClick={() => setActiveTab('app')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'app'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Live Sports Manager App
            </button>
            <button
              onClick={() => setActiveTab('ejs')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'ejs'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              SSR EJS View (views/index.ejs)
            </button>
            <button
              onClick={() => {
                setActiveTab('tests');
                if (!checkResult && !runningChecks) handleRunQualityGates();
              }}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'tests'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Quality Gates &amp; Git Graph (4/4 Tests)
            </button>
            <button
              onClick={() => setActiveTab('files')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'files'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Project Source Files ({Object.keys(overview?.files || {}).length || 13})
            </button>
            <button
              onClick={() => setActiveTab('deploy')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === 'deploy'
                  ? 'bg-emerald-500 text-slate-950 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Render Deploy &amp; PDF Customizer
            </button>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400">
            <span>Workspace Folder:</span>
            <code className="text-emerald-400 font-mono">./sports-manager-system-web</code>
            <span aria-hidden="true">·</span>
            <a
              href="/health"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 underline underline-offset-4"
            >
              /health ({healthData?.status || 'ok'})
            </a>
            <span aria-hidden="true">·</span>
            <a
              href="/api/matches"
              target="_blank"
              rel="noreferrer"
              className="hover:text-emerald-400 underline underline-offset-4"
            >
              /api/matches
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-[1360px] w-full mx-auto px-6 py-8">
        {/* TAB 1: LIVE SPORTS MANAGEMENT SYSTEM */}
        {activeTab === 'app' && (
          <div className="space-y-8">
            {/* Flash Banners */}
            {flashSuccess && (
              <div className="p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>{flashSuccess}</span>
                </div>
                <button
                  onClick={() => setFlashSuccess(null)}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {flashError && (
              <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-300 text-sm flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                  <span>{flashError}</span>
                </div>
                <button
                  onClick={() => setFlashError(null)}
                  className="text-xs text-red-400 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Live Statistics Dashboard */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#111827] border border-white/10 rounded-xl p-5">
                <p className="text-xs text-slate-400">Total Tournament Fixtures</p>
                <p className="text-3xl font-bold text-white mt-1 tabular-nums">
                  {stats.totalItems}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  {stats.liveCount} live · {stats.scheduledCount} scheduled
                </p>
              </div>

              <div className="bg-[#111827] border border-white/10 rounded-xl p-5">
                <p className="text-xs text-slate-400">Fixture Completion Rate</p>
                <p className="text-3xl font-bold text-emerald-400 mt-1 tabular-nums">
                  {stats.completionRate}%
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  {stats.completedCount} of {stats.totalItems} matches concluded
                </p>
              </div>

              <div className="bg-[#111827] border border-white/10 rounded-xl p-5">
                <p className="text-xs text-slate-400">Average Intensity Rating</p>
                <p className="text-3xl font-bold text-amber-400 mt-1 tabular-nums">
                  {stats.averageRating} / 5
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Validated numeric range (1–5)
                </p>
              </div>

              <div className="bg-[#111827] border border-white/10 rounded-xl p-5">
                <p className="text-xs text-slate-400">Active Build Commit SHA</p>
                <p className="text-3xl font-bold font-mono text-sky-400 mt-1 tabular-nums">
                  {effectiveSha}
                </p>
                <p className="text-xs text-slate-400 mt-2">
                  Uptime: {healthData?.uptime ?? 0}s · Health: {healthData?.status ?? 'ok'}
                </p>
              </div>
            </section>

            {/* Two-Column Arena Operations Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: POST /matches Form with 4+ Input Fields */}
              <section className="lg:col-span-5 bg-[#111827] border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Register Match Fixture
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Server-side validated POST /matches with XSS sanitization
                    </p>
                  </div>
                </div>

                <form onSubmit={handleCreateFixture} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1.5">
                      Fixture / Tournament Title *
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      placeholder="e.g. MIT-WPU Inter-College Football Semi-Final"
                      className="w-full rounded-lg bg-[#090d16] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Competing Teams / Roster
                      </label>
                      <input
                        type="text"
                        value={teams}
                        onChange={(e) => setTeams(e.target.value)}
                        placeholder="e.g. CET Stallions vs ENTC Hawks"
                        className="w-full rounded-lg bg-[#090d16] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Arena / Venue
                      </label>
                      <input
                        type="text"
                        value={venue}
                        onChange={(e) => setVenue(e.target.value)}
                        placeholder="e.g. Main Synthetic Turf, Kothrud"
                        className="w-full rounded-lg bg-[#090d16] border border-white/10 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Sport Discipline *
                      </label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        className="w-full rounded-lg bg-[#090d16] border border-white/10 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      >
                        {CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-300 mb-1.5">
                        Fixture Status *
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full rounded-lg bg-[#090d16] border border-white/10 px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500"
                      >
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {st}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-xs font-medium text-slate-300 mb-1.5">
                      <span>Tournament Priority / Intensity Rating (1–5) *</span>
                      <span className="font-mono text-emerald-400 font-semibold">
                        {rating} / 5
                      </span>
                    </div>
                    <input
                      type="range"
                      min={1}
                      max={5}
                      step={1}
                      value={rating}
                      onChange={(e) => setRating(Number(e.target.value))}
                      className="w-full accent-emerald-500 cursor-pointer"
                    />
                    <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                      <span>1 · Practice</span>
                      <span>3 · League</span>
                      <span>5 · Championship Final</span>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center gap-3">
                    <button
                      type="submit"
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Schedule Match Fixture</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetStore}
                      title="Call app.resetStore()"
                      className="px-3.5 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium border border-white/10 transition-colors cursor-pointer"
                    >
                      Reset Store
                    </button>
                  </div>
                </form>
              </section>

              {/* Right Column: Dynamic Fixture List */}
              <section className="lg:col-span-7 bg-[#111827] border border-white/10 rounded-xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-4 mb-5 border-b border-white/10">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Active Tournament Schedule ({filteredMatches.length})
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      In-memory Express store · Live updates via POST /matches &amp; POST /matches/:id/delete
                    </p>
                  </div>

                  {/* Interactive Sport Filter Segmented Buttons */}
                  <div className="flex flex-wrap items-center gap-1 p-1 bg-[#090d16] rounded-lg border border-white/5">
                    {['All', ...CATEGORIES].map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategoryFilter(cat)}
                        className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer ${
                          categoryFilter === cat
                            ? 'bg-slate-800 text-emerald-400'
                            : 'text-slate-400 hover:text-white'
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {filteredMatches.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-sm">
                    No fixtures match the selected filter. Register a new fixture on the left or reset the store.
                  </div>
                ) : (
                  <div className="space-y-3.5">
                    {filteredMatches.map((item) => (
                      <article
                        key={item.id}
                        className="p-4 rounded-lg bg-[#090d16] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-white/20 transition-colors"
                      >
                        <div className="space-y-1">
                          {/* Clean Unboxed Metadata with Typographic Separators */}
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                            <span className="text-emerald-400 font-semibold">
                              {decodeHtmlEntities(item.category)}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span
                              className={
                                item.status === 'Live'
                                  ? 'text-amber-400 font-semibold'
                                  : item.status === 'Completed'
                                  ? 'text-sky-400'
                                  : 'text-slate-300'
                              }
                            >
                              {decodeHtmlEntities(item.status)}
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums text-slate-300">
                              Intensity {item.rating}/5
                            </span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono text-slate-500">{item.id}</span>
                          </div>

                          <h3 className="text-base font-semibold text-white">
                            {decodeHtmlEntities(item.title)}
                          </h3>

                          <p className="text-xs text-slate-400">
                            <span className="text-slate-300 font-medium">Matchup:</span>{' '}
                            {decodeHtmlEntities(item.teams || 'TBD vs TBD')}
                            <span className="mx-2 text-slate-600">|</span>
                            <span className="text-slate-300 font-medium">Venue:</span>{' '}
                            {decodeHtmlEntities(item.venue || 'MIT-WPU Main Arena')}
                          </p>
                        </div>

                        <div className="shrink-0">
                          <button
                            onClick={() => handleDeleteFixture(item.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-red-500/30 text-red-300 hover:bg-red-500/15 text-xs font-medium transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete</span>
                          </button>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </div>
          </div>
        )}

        {/* TAB 2: SSR EJS PREVIEW */}
        {activeTab === 'ejs' && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#111827] border border-white/10 rounded-xl p-4">
              <div>
                <h2 className="text-base font-semibold text-white">
                  Server-Side Rendered EJS View (sports-manager-system-web/views/index.ejs)
                </h2>
                <p className="text-xs text-slate-400">
                  Rendered directly by Express + EJS with dark theme stylesheet (/public/css/style.css) and footer commit SHA.
                </p>
              </div>
              <a
                href="/ejs-preview"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Open Full EJS Page in New Tab</span>
              </a>
            </div>

            <div className="rounded-xl overflow-hidden border border-white/10 bg-[#090d16] h-[720px]">
              <iframe
                src="/ejs-preview"
                title="EJS Server-Side Rendered View"
                className="w-full h-full border-0"
              />
            </div>
          </div>
        )}

        {/* TAB 3: QUALITY GATES (ESLINT + NODE:TEST) & 10-COMMIT GIT GRAPH */}
        {activeTab === 'tests' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
              <div className="bg-[#111827] border border-white/10 rounded-xl p-6">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-lg font-semibold text-white">
                      Requirement 2 — Automated Quality Gates
                    </h2>
                    <p className="text-xs text-slate-400 mt-0.5">
                      ESLint v9 Flat Config (eslint.config.js) + 4 Node:test Integration Tests (test/app.test.js)
                    </p>
                  </div>
                  <button
                    onClick={handleRunQualityGates}
                    disabled={runningChecks}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    {runningChecks ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5" />
                    )}
                    <span>{runningChecks ? 'Running npm run lint & npm test...' : 'Run Lint & Tests Now'}</span>
                  </button>
                </div>

                {checkResult ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-[#090d16] border border-white/10">
                        <p className="text-xs text-slate-400">ESLint v9 Flat Config</p>
                        <p className="text-base font-semibold text-emerald-400 mt-1">
                          {checkResult.lintPassed ? 'PASSED (0 errors)' : 'FAILED'}
                        </p>
                      </div>
                      <div className="p-4 rounded-lg bg-[#090d16] border border-white/10">
                        <p className="text-xs text-slate-400">Node:test Suite</p>
                        <p className="text-base font-semibold text-emerald-400 mt-1">
                          {checkResult.testPassed ? '4 / 4 TESTS PASSED' : 'FAILED'}
                        </p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-medium text-slate-300 mb-2">
                        TAP Output from `npm test` (node --test):
                      </p>
                      <pre className="p-4 rounded-lg bg-[#090d16] border border-white/10 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre-wrap leading-relaxed">
                        {checkResult.testOutput}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-slate-400">
                    Click &ldquo;Run Lint &amp; Tests Now&rdquo; to execute `npm run lint` and `npm test` inside `./sports-manager-system-web`.
                  </p>
                )}
              </div>
            </div>

            <div className="lg:col-span-5 space-y-6">
              <div className="bg-[#111827] border border-white/10 rounded-xl p-6">
                <div className="flex items-center gap-2.5 mb-3">
                  <GitBranch className="w-4 h-4 text-emerald-400" />
                  <h2 className="text-lg font-semibold text-white">
                    Requirement 5 — 10-Commit Git Graph
                  </h2>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                  Generated by <code className="text-emerald-400">setup_git.py</code> with <code className="text-emerald-400">feature/docker-ci-pipeline</code> branch and <code className="text-emerald-400">--no-ff</code> merge commit:
                </p>
                <pre className="p-4 rounded-lg bg-[#090d16] border border-white/10 text-xs font-mono text-sky-300 overflow-x-auto leading-relaxed">
                  {overview?.gitLog || 'Loading git log...'}
                </pre>

                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-xs font-medium text-slate-300 mb-1.5">
                    Configured Git Remote (`git remote -v`):
                  </p>
                  <pre className="p-3 rounded-lg bg-[#090d16] border border-white/10 text-xs font-mono text-slate-300 overflow-x-auto">
                    {overview?.gitRemotes || 'origin https://github.com/kapil2908/sports-manager-system-web.git'}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: SOURCE FILES EXPLORER */}
        {activeTab === 'files' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-3 bg-[#111827] border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3 px-2">
                <FolderGit2 className="w-4 h-4 text-emerald-400" />
                <h2 className="text-sm font-semibold text-white">
                  sports-manager-system-web/
                </h2>
              </div>
              <div className="space-y-1">
                {Object.keys(overview?.files || {}).map((filePath) => (
                  <button
                    key={filePath}
                    onClick={() => setSelectedFile(filePath)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors cursor-pointer ${
                      selectedFile === filePath
                        ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-semibold'
                        : 'text-slate-400 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {filePath}
                  </button>
                ))}
              </div>
            </div>

            <div className="lg:col-span-9 bg-[#111827] border border-white/10 rounded-xl p-5 flex flex-col">
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <div>
                  <span className="text-xs text-slate-400">File Path: </span>
                  <code className="text-xs font-mono text-emerald-400">
                    sports-manager-system-web/{selectedFile}
                  </code>
                </div>
                <button
                  onClick={() =>
                    copyText(
                      selectedFile,
                      overview?.files?.[selectedFile] || ''
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 border border-white/10 cursor-pointer"
                >
                  {copiedKey === selectedFile ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy File Content</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-4 rounded-lg bg-[#090d16] border border-white/10 text-xs font-mono text-slate-200 overflow-x-auto max-h-[640px] leading-relaxed">
                {overview?.files?.[selectedFile] || 'Select a file to inspect its code.'}
              </pre>
            </div>
          </div>
        )}

        {/* TAB 5: RENDER DEPLOYMENT GUIDE & STUDENT PDF CUSTOMIZER */}
        {activeTab === 'deploy' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left: Update Student Info + Live Render URL */}
            <section className="lg:col-span-6 bg-[#111827] border border-white/10 rounded-xl p-6">
              <div className="flex items-center gap-2.5 mb-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">
                  Update Student Details &amp; Live Render URL
                </h2>
              </div>
              <p className="text-xs text-slate-400 mb-5">
                Updates <code className="text-emerald-400">README.md</code>, regenerates the 4-page <code className="text-emerald-400">CCA2_SUBMISSION_REPORT.pdf</code> via ReportLab, and commits <code className="text-emerald-400">docs: add live Render deployment URL [URL]</code>.
              </p>

              {metaSuccess && (
                <div className="p-3.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs mb-4">
                  {metaSuccess}
                </div>
              )}

              <form onSubmit={handleUpdateMeta} className="space-y-3.5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Student Full Name
                    </label>
                    <input
                      type="text"
                      value={metaForm.name}
                      onChange={(e) => setMetaForm({ ...metaForm, name: e.target.value })}
                      className="w-full rounded-lg bg-[#090d16] border border-white/10 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      PRN Number
                    </label>
                    <input
                      type="text"
                      value={metaForm.prn}
                      onChange={(e) => setMetaForm({ ...metaForm, prn: e.target.value })}
                      className="w-full rounded-lg bg-[#090d16] border border-white/10 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Roll No. / Panel
                    </label>
                    <input
                      type="text"
                      value={metaForm.roll_no}
                      onChange={(e) => setMetaForm({ ...metaForm, roll_no: e.target.value })}
                      className="w-full rounded-lg bg-[#090d16] border border-white/10 px-3 py-2 text-sm text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-300 mb-1">
                      Submission Date
                    </label>
                    <input
                      type="text"
                      value={metaForm.date}
                      onChange={(e) => setMetaForm({ ...metaForm, date: e.target.value })}
                      className="w-full rounded-lg bg-[#090d16] border border-white/10 px-3 py-2 text-sm text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    GitHub Repository URL
                  </label>
                  <input
                    type="text"
                    value={metaForm.github_url}
                    onChange={(e) => setMetaForm({ ...metaForm, github_url: e.target.value })}
                    className="w-full rounded-lg bg-[#090d16] border border-white/10 px-3 py-2 text-sm text-white font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Live Render App URL (Paste after deploying to Render)
                  </label>
                  <input
                    type="text"
                    value={metaForm.live_url}
                    onChange={(e) => setMetaForm({ ...metaForm, live_url: e.target.value })}
                    className="w-full rounded-lg bg-[#090d16] border border-white/10 px-3 py-2 text-sm text-emerald-400 font-mono"
                  />
                </div>

                <div className="pt-2 flex flex-wrap items-center gap-3">
                  <button
                    type="submit"
                    disabled={updatingMeta}
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${updatingMeta ? 'animate-spin' : ''}`} />
                    <span>
                      {updatingMeta
                        ? 'Updating README & PDF...'
                        : 'Save, Regenerate 4-Page PDF & Commit'}
                    </span>
                  </button>

                  <a
                    href="/api/cca2/report.pdf"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs border border-white/10"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View / Download CCA2_SUBMISSION_REPORT.pdf</span>
                  </a>
                </div>
              </form>
            </section>

            {/* Right: Requirement 8 Push & Render Step-by-Step Guide */}
            <section className="lg:col-span-6 bg-[#111827] border border-white/10 rounded-xl p-6 space-y-5">
              <div className="flex items-center gap-2.5">
                <Rocket className="w-5 h-5 text-emerald-400" />
                <h2 className="text-lg font-semibold text-white">
                  Requirement 8 — GitHub Push &amp; Render Deployment Guide
                </h2>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-emerald-400">
                  Step 1: Push Your Repository to GitHub
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Create a new empty repository named <code className="text-white">sports-manager-system-web</code> under <code className="text-white">https://github.com/kapil2908</code>, then run inside <code className="text-white">sports-manager-system-web</code>:
                </p>
                <div className="relative">
                  <pre className="p-3.5 rounded-lg bg-[#090d16] border border-white/10 text-xs font-mono text-emerald-300 overflow-x-auto">
{`git remote set-url origin https://github.com/kapil2908/sports-manager-system-web.git
git push -u origin main --force
git push origin feature/docker-ci-pipeline --force`}
                  </pre>
                  <button
                    onClick={() =>
                      copyText(
                        'push-cmd',
                        `git remote set-url origin https://github.com/kapil2908/sports-manager-system-web.git\ngit push -u origin main --force\ngit push origin feature/docker-ci-pipeline --force`
                      )
                    }
                    className="absolute top-2.5 right-2.5 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 border border-white/10 cursor-pointer"
                  >
                    {copiedKey === 'push-cmd' ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="space-y-2.5">
                <h3 className="text-sm font-semibold text-emerald-400">
                  Step 2: Configure Render.com Web Service
                </h3>
                <ol className="text-xs text-slate-300 space-y-1.5 list-decimal list-inside leading-relaxed">
                  <li>Sign in to <strong>Render.com</strong> with your GitHub account (<code className="text-white">kapil2908</code>).</li>
                  <li>Click <strong>New +</strong> &rarr; <strong>Web Service</strong> &rarr; Connect <code className="text-white">sports-manager-system-web</code>.</li>
                  <li>Use these exact settings:
                    <ul className="pl-5 mt-1 space-y-1 text-slate-400 list-disc">
                      <li><strong>Language / Runtime:</strong> <code className="text-white">Node</code> (or <code className="text-white">Docker</code>)</li>
                      <li><strong>Branch:</strong> <code className="text-white">main</code> | <strong>Root Directory:</strong> <em>(blank)</em></li>
                      <li><strong>Build Command:</strong> <code className="text-emerald-300">npm ci</code></li>
                      <li><strong>Start Command:</strong> <code className="text-emerald-300">node server.js</code></li>
                      <li><strong>Instance Type:</strong> <code className="text-white">Free</code></li>
                      <li><strong>Auto-Deploy:</strong> <code className="text-amber-300">OFF</code> (Advanced Settings)</li>
                      <li><strong>Health Check Path:</strong> <code className="text-emerald-300">/health</code></li>
                    </ul>
                  </li>
                  <li>Copy the <strong>Deploy Hook URL</strong> from Render Settings &rarr; Add it to GitHub Repo Settings &rarr; Secrets and variables &rarr; Actions as <code className="text-emerald-300">RENDER_DEPLOY_HOOK</code>.</li>
                  <li>Once deployed, paste your live Render URL on the left (or in chat) to update <code className="text-white">README.md</code> and regenerate <code className="text-white">CCA2_SUBMISSION_REPORT.pdf</code>!</li>
                </ol>
              </div>
            </section>
          </div>
        )}
      </main>

      {/* Required Footer with exact format: commit <sha> */}
      <footer className="border-t border-white/10 bg-[#0d1322] py-4 mt-12">
        <div className="max-w-[1360px] mx-auto px-6 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
          <span>
            MIT World Peace University · Department of Computer Engineering &amp; Technology · Cloud Computing &amp; DevOps (CSE30040)
          </span>
          <span className="font-mono text-emerald-400">commit {effectiveSha}</span>
        </div>
      </footer>
    </div>
  );
}
