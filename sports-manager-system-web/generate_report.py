#!/usr/bin/env python3
"""
Generates the 4-Page CCA2_SUBMISSION_REPORT.pdf using ReportLab for
MIT World Peace University (CSE30040 - Cloud Computing and DevOps).
"""

import json
from pathlib import Path
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    HRFlowable,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

BASE_DIR = Path(__file__).resolve().parent
OUTPUT_PDF = BASE_DIR / "CCA2_SUBMISSION_REPORT.pdf"
META_FILE = BASE_DIR / "student_meta.json"

DEFAULT_META = {
    "name": "Kapil (Student — B.Tech CSE)",
    "prn": "103223XXXX",
    "roll_no": "Panel A / Roll No. XX",
    "project_title": "ArenaOps — Sports Management System & Automated CI/CD Pipeline",
    "github_url": "https://github.com/kapil2908/sports-manager-system-web.git",
    "live_url": "https://sports-manager-system-web.onrender.com",
    "date": "September 28, 2026",
    "faculty": "Prof. Pranati Waghodekar",
}


def load_meta():
    meta = DEFAULT_META.copy()
    if META_FILE.exists():
        try:
            data = json.loads(META_FILE.read_text(encoding="utf-8"))
            for k, v in data.items():
                if v and str(v).strip():
                    meta[k] = str(v).strip()
        except Exception:
            pass
    return meta


def add_page_number(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8.5)
    canvas.setFillColor(colors.HexColor("#475569"))
    canvas.drawString(
        18 * mm,
        10 * mm,
        "MIT-WPU | CSE30040 Cloud Computing & DevOps | CCA 2 Submission Report",
    )
    canvas.drawRightString(
        A4[0] - 18 * mm,
        10 * mm,
        f"Page {doc.page} of 4",
    )
    canvas.restoreState()


def build_pdf():
    meta = load_meta()
    doc = SimpleDocTemplate(
        str(OUTPUT_PDF),
        pagesize=A4,
        leftMargin=18 * mm,
        rightMargin=18 * mm,
        topMargin=16 * mm,
        bottomMargin=18 * mm,
        title="CCA 2 Individual Assessment Submission Report",
        author=meta["name"],
    )

    styles = getSampleStyleSheet()
    dark_navy = colors.HexColor("#0f172a")
    slate_header = colors.HexColor("#1e293b")
    emerald_accent = colors.HexColor("#059669")
    row_alt = colors.HexColor("#f8fafc")
    border_gray = colors.HexColor("#cbd5e1")

    uni_style = ParagraphStyle(
        "UniHeader",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=12,
        leading=15,
        alignment=1,
        textColor=dark_navy,
    )
    dept_style = ParagraphStyle(
        "DeptHeader",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.5,
        leading=13,
        alignment=1,
        textColor=colors.HexColor("#334155"),
    )
    title_style = ParagraphStyle(
        "ReportTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=15,
        leading=19,
        alignment=1,
        spaceBefore=6,
        spaceAfter=3,
        textColor=dark_navy,
    )
    subtitle_style = ParagraphStyle(
        "ReportSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13,
        alignment=1,
        spaceAfter=10,
        textColor=emerald_accent,
    )
    h2_style = ParagraphStyle(
        "SectionH2",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11.5,
        leading=15,
        spaceBefore=8,
        spaceAfter=5,
        textColor=dark_navy,
    )
    h3_style = ParagraphStyle(
        "SectionH3",
        parent=styles["Heading3"],
        fontName="Helvetica-Bold",
        fontSize=10,
        leading=13.5,
        spaceBefore=6,
        spaceAfter=3,
        textColor=slate_header,
    )
    body_style = ParagraphStyle(
        "BodyTextCustom",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9.2,
        leading=13.2,
        spaceAfter=5,
        textColor=colors.HexColor("#1e293b"),
    )
    bullet_style = ParagraphStyle(
        "BulletCustom",
        parent=body_style,
        leftIndent=12,
        firstLineIndent=-8,
        spaceAfter=3.5,
    )
    cell_style = ParagraphStyle(
        "TableCell",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=8.6,
        leading=11.8,
        textColor=colors.HexColor("#0f172a"),
    )
    cell_bold = ParagraphStyle(
        "TableCellBold",
        parent=cell_style,
        fontName="Helvetica-Bold",
    )
    cell_header = ParagraphStyle(
        "TableCellHeader",
        parent=cell_style,
        fontName="Helvetica-Bold",
        textColor=colors.white,
    )

    story = []

    # ==================== PAGE 1 ====================
    story.append(
        Paragraph(
            "DR. VISHWANATH KARAD MIT WORLD PEACE UNIVERSITY, PUNE",
            uni_style,
        )
    )
    story.append(
        Paragraph(
            "Department of Computer Engineering and Technology | School of Engineering & Technology",
            dept_style,
        )
    )
    story.append(
        Paragraph(
            "Course: Cloud Computing and DevOps (CSE30040) | Faculty: Prof. Pranati Waghodekar",
            dept_style,
        )
    )
    story.append(Spacer(1, 6))
    story.append(HRFlowable(width="100%", thickness=1.5, color=dark_navy))
    story.append(Spacer(1, 6))

    story.append(
        Paragraph("CCA 2 INDIVIDUAL ASSESSMENT SUBMISSION REPORT", title_style)
    )
    story.append(
        Paragraph(
            "Dynamic Sports Management Web Application & Automated CI/CD Pipeline",
            subtitle_style,
        )
    )

    student_rows = [
        [
            Paragraph("Field", cell_header),
            Paragraph("Submission Details", cell_header),
        ],
        [Paragraph("Student Name", cell_bold), Paragraph(meta["name"], cell_style)],
        [Paragraph("PRN Number", cell_bold), Paragraph(meta["prn"], cell_style)],
        [Paragraph("Roll No. / Panel", cell_bold), Paragraph(meta["roll_no"], cell_style)],
        [
            Paragraph("Project Title", cell_bold),
            Paragraph(meta["project_title"], cell_style),
        ],
        [
            Paragraph("GitHub Repository URL", cell_bold),
            Paragraph(meta["github_url"], cell_style),
        ],
        [
            Paragraph("Live Render App URL", cell_bold),
            Paragraph(meta["live_url"], cell_style),
        ],
        [Paragraph("Submission Date", cell_bold), Paragraph(meta["date"], cell_style)],
        [
            Paragraph("Subject Faculty", cell_bold),
            Paragraph(meta["faculty"], cell_style),
        ],
    ]

    student_table = Table(student_rows, colWidths=[50 * mm, 124 * mm])
    student_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), dark_navy),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, row_alt]),
                ("GRID", (0, 0), (-1, -1), 0.6, border_gray),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ]
        )
    )
    story.append(student_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("1. Problem Statement & Project Overview", h2_style))
    story.append(
        Paragraph(
            "University sports departments manage dozens of concurrent inter-college fixtures across Football, "
            "Cricket, Basketball, Badminton, Athletics, and Esports. Manual spreadsheet tracking leads to scheduling "
            "conflicts, unvalidated data entry, and zero visibility into live tournament completion rates. Furthermore, "
            "traditional manual software deployment introduces configuration drift, untested code regressions, and downtime.",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "To solve both operational and software delivery challenges, <b>ArenaOps (Sports Management System)</b> was "
            "built from scratch using <b>Node.js, Express, and EJS</b> with a dark responsive UI, paired with a strict "
            "three-stage <b>GitHub Actions CI/CD pipeline</b>, <b>Docker (node:22-alpine)</b> containerization, and "
            "automated webhook deployment to <b>Render</b>.",
            body_style,
        )
    )

    story.append(Paragraph("Key Technical Capabilities Implemented:", h3_style))
    story.append(
        Paragraph(
            "• <b>Server-Side Rendered Dashboard (GET /):</b> Displays real-time tournament metrics (total fixtures, "
            "completion percentage, live match counter, average intensity rating 1–5, and active 7-char Git SHA).",
            bullet_style,
        )
    )
    story.append(
        Paragraph(
            "• <b>Validated & XSS-Sanitized Fixture Creation (POST /matches):</b> Enforces required fields, category/status "
            "allowlists, numeric rating bounds (1–5), and HTML entity escaping (&amp;, &lt;, &gt;, &quot;, &#39;).",
            bullet_style,
        )
    )
    story.append(
        Paragraph(
            "• <b>Observability & Telemetry Endpoints:</b> Exposes <b>GET /health</b> (status, commit SHA, uptime, ISO "
            "timestamp) for container readiness probes and <b>GET /api/matches</b> for JSON telemetry.",
            bullet_style,
        )
    )

    story.append(PageBreak())

    # ==================== PAGE 2 ====================
    story.append(Paragraph("2. CI/CD Pipeline Architecture & Stage Breakdown", h2_style))
    story.append(
        Paragraph(
            "The Continuous Integration and Continuous Deployment workflow (<b>.github/workflows/ci-cd.yml</b>) is "
            "triggered automatically on every <b>push</b> and <b>pull_request</b> targeting the <b>main</b> branch. "
            "It enforces sequential quality gates using the <b>needs:</b> directive.",
            body_style,
        )
    )

    pipeline_rows = [
        [
            Paragraph("Pipeline Stage", cell_header),
            Paragraph("Tools & Commands Executed", cell_header),
            Paragraph("Trigger & Safety Gate", cell_header),
        ],
        [
            Paragraph("Stage 1: Lint & Unit/Integration Tests (test)", cell_bold),
            Paragraph(
                "Node.js 22, npm ci, ESLint v9 Flat Config (npm run lint), Node:test Runner (npm test)",
                cell_style,
            ),
            Paragraph(
                "Runs on push & PR to main. Fails immediately on any syntax/lint error or failed assertion.",
                cell_style,
            ),
        ],
        [
            Paragraph("Stage 2: Docker Container Build & Smoke Test (build)", cell_bold),
            Paragraph(
                "docker build --build-arg GIT_SHA=${{ github.sha }}, docker run -d -p 3000:3000, curl -f /health",
                cell_style,
            ),
            Paragraph(
                "needs: test. Verifies production Alpine image builds cleanly and serves HTTP 200 on /health.",
                cell_style,
            ),
        ],
        [
            Paragraph("Stage 3: Continuous Deployment to Render (deploy)", cell_bold),
            Paragraph(
                'curl -fsS -X POST "${{ secrets.RENDER_DEPLOY_HOOK }}&ref=${{ github.sha }}"',
                cell_style,
            ),
            Paragraph(
                "needs: build. Restricted to push events on refs/heads/main. Keeps Render Auto-Deploy OFF.",
                cell_style,
            ),
        ],
    ]

    pipeline_table = Table(pipeline_rows, colWidths=[45 * mm, 68 * mm, 61 * mm])
    pipeline_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), dark_navy),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, row_alt]),
                ("GRID", (0, 0), (-1, -1), 0.6, border_gray),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.append(pipeline_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("Stage 1: Automated Linting & Node:test Suite (Job: test)", h3_style))
    story.append(
        Paragraph(
            "Static analysis is executed via ESLint v9 flat configuration (<b>eslint.config.js</b>) configured for CommonJS "
            "with readonly <b>fetch</b> and <b>URLSearchParams</b> globals. Next, <b>test/app.test.js</b> spins up an isolated "
            "Express server on ephemeral port 0 before each test and resets the store via <b>app.resetStore()</b>:",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "• <b>Test 1:</b> GET /health returns HTTP 200 and { status: 'ok', commit, timestamp }.",
            bullet_style,
        )
    )
    story.append(
        Paragraph(
            "• <b>Test 2:</b> POST /matches with valid input returns HTTP 201 and creates a new entry (verified via GET /api/matches).",
            bullet_style,
        )
    )
    story.append(
        Paragraph(
            "• <b>Test 3:</b> POST /matches with missing required field returns HTTP 400 AND with invalid numeric value returns HTTP 400.",
            bullet_style,
        )
    )
    story.append(
        Paragraph(
            "• <b>Test 4:</b> GET /api/matches returns valid JSON with contracts/matches array and stats object with numeric fields.",
            bullet_style,
        )
    )

    story.append(Paragraph("Stage 2: Docker Image Build, GIT_SHA Injection & Smoke Test (Job: build)", h3_style))
    story.append(
        Paragraph(
            "Using <b>node:22-alpine</b>, the Dockerfile installs production-only dependencies (<b>npm ci --omit=dev</b>), "
            "accepts <b>ARG GIT_SHA=local</b>, and exposes <b>ENV GIT_SHA=$GIT_SHA</b> so the running app displays the exact "
            "7-character commit hash in the UI footer and <b>/health</b> JSON. The container runs under non-root <b>USER node</b> "
            "and is smoke-tested inside GitHub Actions via <b>curl -f http://localhost:3000/health</b> before teardown.",
            body_style,
        )
    )

    story.append(Paragraph("Stage 3: Zero-Downtime Render Webhook Trigger (Job: deploy)", h3_style))
    story.append(
        Paragraph(
            "Only when both <b>test</b> and <b>build</b> succeed on a push to <b>main</b> does the pipeline invoke the "
            "encrypted <b>RENDER_DEPLOY_HOOK</b> secret with the exact commit SHA, ensuring unverified code never deploys.",
            body_style,
        )
    )

    story.append(PageBreak())

    # ==================== PAGE 3 ====================
    story.append(Paragraph("3. Pipeline Gate Verification: Failure Demo & Recovery", h2_style))
    story.append(
        Paragraph(
            "To validate that the CI/CD pipeline actively protects production from defective code, a controlled failure "
            "simulation was executed and verified against the pipeline dependency graph:",
            body_style,
        )
    )
    story.append(
        Paragraph(
            "• <b>Step 1 (Intentional Fault Injection):</b> An assertion in <b>test/app.test.js</b> for <b>GET /health</b> was "
            "temporarily modified to expect <b>status: 'broken'</b> instead of <b>'ok'</b>.",
            bullet_style,
        )
    )
    story.append(
        Paragraph(
            "• <b>Step 2 (CI Quality Gate Rejection):</b> On pushing the commit, Job 1 (<b>🧪 Lint &amp; Unit/Integration Tests</b>) "
            "executed <b>npm test</b>, detected the <b>AssertionError [ERR_ASSERTION]</b>, and exited with code 1.",
            bullet_style,
        )
    )
    story.append(
        Paragraph(
            "• <b>Step 3 (Downstream Jobs Skipped):</b> Because Job 2 (<b>build</b>) specifies <b>needs: test</b> and Job 3 "
            "(<b>deploy</b>) specifies <b>needs: build</b>, GitHub Actions automatically skipped both the Docker build and "
            "the Render deployment webhook.",
            bullet_style,
        )
    )
    story.append(
        Paragraph(
            "• <b>Step 4 (Production Stability Preserved):</b> The live Render service remained online serving the previous "
            "healthy commit without interruption. Restoring the assertion returned all 3 pipeline jobs to green.",
            bullet_style,
        )
    )

    story.append(Paragraph("4. Verification Summary & Quality Metrics", h2_style))
    verify_rows = [
        [
            Paragraph("Verification Check", cell_header),
            Paragraph("Command / Endpoint", cell_header),
            Paragraph("Observed Output", cell_header),
        ],
        [
            Paragraph("ESLint v9 Static Analysis", cell_bold),
            Paragraph("npm run lint", cell_style),
            Paragraph("0 errors, 0 warnings across server.js, app.js, test/app.test.js", cell_style),
        ],
        [
            Paragraph("Node:test Automated Suite", cell_bold),
            Paragraph("npm test", cell_style),
            Paragraph("4 / 4 tests passing (health, valid POST 201, invalid POST 400, API JSON stats)", cell_style),
        ],
        [
            Paragraph("Docker Container Smoke Test", cell_bold),
            Paragraph("curl -f http://localhost:3000/health", cell_style),
            Paragraph('HTTP 200 OK — {"status":"ok","commit":"...","uptime":5,"timestamp":"..."}', cell_style),
        ],
        [
            Paragraph("Git History & Branch Topology", cell_bold),
            Paragraph("git log --oneline --graph --all", cell_style),
            Paragraph("10 structured commits + feature/docker-ci-pipeline --no-ff merge commit", cell_style),
        ],
    ]
    verify_table = Table(verify_rows, colWidths=[46 * mm, 52 * mm, 76 * mm])
    verify_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), dark_navy),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, row_alt]),
                ("GRID", (0, 0), (-1, -1), 0.6, border_gray),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 5.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5.5),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.append(verify_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("5. Engineering Challenges & Key Learnings", h2_style))
    story.append(
        Paragraph(
            "• <b>Ephemeral Port Allocation in Tests:</b> Binding to a fixed port during automated tests causes EADDRINUSE "
            "conflicts. Using <b>app.listen(0)</b> in <b>beforeEach</b> dynamically assigns an available OS port for every test.",
            bullet_style,
        )
    )
    story.append(
        Paragraph(
            "• <b>In-Memory State Isolation:</b> Exporting <b>app.resetStore()</b> ensured mutations in POST tests never "
            "polluted subsequent GET assertions.",
            bullet_style,
        )
    )
    story.append(
        Paragraph(
            "• <b>Traceable Builds via GIT_SHA:</b> Passing <b>--build-arg GIT_SHA=${{ github.sha }}</b> into Docker bridges "
            "CI metadata with runtime observability in the footer and <b>/health</b> endpoint.",
            bullet_style,
        )
    )

    story.append(PageBreak())

    # ==================== PAGE 4 ====================
    story.append(Paragraph("6. Project Artifacts & Submission Links", h2_style))
    repo_base = meta["github_url"][:-4] if meta["github_url"].endswith(".git") else meta["github_url"]
    links_rows = [
        [
            Paragraph("Resource / Artifact", cell_header),
            Paragraph("Direct URL / Repository Path", cell_header),
        ],
        [
            Paragraph("GitHub Source Repository", cell_bold),
            Paragraph(meta["github_url"], cell_style),
        ],
        [
            Paragraph("Live Render Cloud Deployment", cell_bold),
            Paragraph(meta["live_url"], cell_style),
        ],
        [
            Paragraph("GitHub Actions CI/CD Runs", cell_bold),
            Paragraph(f"{repo_base}/actions", cell_style),
        ],
        [
            Paragraph("CI/CD Workflow Definition", cell_bold),
            Paragraph(".github/workflows/ci-cd.yml", cell_style),
        ],
    ]
    links_table = Table(links_rows, colWidths=[54 * mm, 120 * mm])
    links_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), dark_navy),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, row_alt]),
                ("GRID", (0, 0), (-1, -1), 0.6, border_gray),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("TOPPADDING", (0, 0), (-1, -1), 5.5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5.5),
                ("LEFTPADDING", (0, 0), (-1, -1), 7),
                ("RIGHTPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )
    story.append(links_table)
    story.append(Spacer(1, 8))

    story.append(Paragraph("7. Comprehensive Viva Voce Questions & Answers", h2_style))

    story.append(
        Paragraph(
            "<b>Q1: What is the difference between Continuous Integration (CI) and Continuous Deployment (CD)?</b>",
            h3_style,
        )
    )
    story.append(
        Paragraph(
            "<b>Answer:</b> Continuous Integration (CI) automatically lints, builds, and tests every code change merged into "
            "a shared repository branch to catch integration bugs early. Continuous Deployment (CD) extends CI by "
            "automatically containerizing, smoke-testing, and deploying every build that passes all automated tests "
            "directly to production without manual intervention.",
            body_style,
        )
    )

    story.append(
        Paragraph(
            "<b>Q2: How does the 'needs:' keyword enforce pipeline safety in GitHub Actions?</b>",
            h3_style,
        )
    )
    story.append(
        Paragraph(
            "<b>Answer:</b> GitHub Actions runs jobs in parallel by default. Declaring <b>needs: test</b> on the <b>build</b> "
            "job and <b>needs: build</b> on the <b>deploy</b> job creates a strict directed acyclic graph (DAG). If ESLint "
            "or any unit test fails, downstream Docker build and Render deployment jobs are automatically skipped.",
            body_style,
        )
    )

    story.append(
        Paragraph(
            "<b>Q3: Why do we store the Render Deploy Hook URL in GitHub Secrets instead of hardcoding it?</b>",
            h3_style,
        )
    )
    story.append(
        Paragraph(
            "<b>Answer:</b> A deploy hook URL embeds a sensitive token capable of triggering production deployments at will. "
            "Storing it in <b>secrets.RENDER_DEPLOY_HOOK</b> keeps the credential encrypted at rest, prevents leaks in public "
            "git history, and masks the value in CI runner logs.",
            body_style,
        )
    )

    story.append(
        Paragraph(
            "<b>Q4: Why containerize the Node.js application using Docker (node:22-alpine)?</b>",
            h3_style,
        )
    )
    story.append(
        Paragraph(
            "<b>Answer:</b> Docker packages the application code, exact Node 22 runtime, and locked production dependencies "
            "into an immutable image. Running a detached container smoke test against <b>/health</b> as non-root user "
            "<b>node</b> guarantees identical behavior between CI runners and cloud production.",
            body_style,
        )
    )

    story.append(Spacer(1, 8))
    story.append(HRFlowable(width="100%", thickness=1.2, color=dark_navy))
    story.append(Spacer(1, 4))
    story.append(
        Paragraph(
            "End of CCA 2 Submission Report — Verified by Automated CI/CD Suite (MIT-WPU CSE30040)",
            dept_style,
        )
    )

    doc.build(story, onFirstPage=add_page_number, onLaterPages=add_page_number)
    print(f"Successfully generated 4-page PDF report at: {OUTPUT_PDF}")


if __name__ == "__main__":
    build_pdf()
