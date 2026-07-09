# 🧠 Study Buddy

Study Buddy is a premium, full-stack **spaced-repetition DSA revision manager** built to help students systematically prepare for software engineering interviews. Instead of randomly solving problems, Study Buddy organizes your revisions based on your recall confidence, highlights pattern weaknesses, and uses Google Gemini to auto-summarize key algorithmic insights.

---

## ✨ Features

- **🔒 Premium Login & Registration**: Secure authentication with JWT tokens, personal target company settings, and weekly preparation hour metrics.
- **📊 Interactive Analytics Dashboard**:
  - **Solved by Pattern**: Color-coded category distributions displaying your average confidence per topic.
  - **Recall Activity Heatmap**: A 12-week matrix charting your daily revision consistency.
  - **Daily Motivation Lines**: Dynamic quotes to keep you focused during long prep cycles.
- **📁 Detailed Problems Log**:
  - Slide-out details drawer showing AI-synthesized time/space complexity, key insights, and your approach code.
  - Granular searching, category filters, and sorting parameters.
- **⏱️ Flashcard Revision Queue**:
  - Double-sided rotating flashcards.
  - **Built-in Stopwatch Widget**: Track and log your speed while solving/recalling solutions.
  - SM-2 spaced repetition confidence ratings to dynamically recalculate next review windows.
- **🤖 Gemini AI Synthesis**:
  - Automatically analyzes problem statements/code to extract key tricks, pattern classification, and complexity bounds.
  - Client-side configuration support for personal API Keys.
- **💾 Workspace Portability**:
  - 100% self-contained database backup exports and imports.
  - Dual-operating mode: Syncs with Express backend when active, or switches to a client-side localStorage sandbox if offline.

---

## 🛠️ Technology Stack

- **Frontend**: React (Vite), Vanilla CSS, Lucide Icons.
- **Backend**: Node.js, Express.js.
- **Database**: Safe transactional JSON file storage (with SQLite routing options).
- **AI Engine**: Google Gemini API.

---

## 📂 Project Directory Structure

```text
study_buddy/
├── package.json          # Monorepo task runner configuration
├── start-dev.js          # Concurrently manages backend & frontend dev servers
├── README.md             # Project documentation (this file)
│
├── backend/
│   ├── package.json      # Backend configuration & server dependencies
│   ├── .env              # Server ports, JWT secret, Gemini key
│   ├── server.js         # REST endpoints (auth, problems CRUD, AI summary)
│   ├── db.js             # Data operations & SM-2 calculation engine
│   └── data/
│       └── db.json       # JSON-based relational database file
│
└── frontend/
    ├── package.json      # React dependencies (Vite, Lucide React)
    ├── index.html        # Main HTML layout
    ├── src/
    │   ├── main.jsx      # Bootstraps React + Auth Provider
    │   ├── App.jsx       # Workspace layout, routes, and CRUD sync
    │   ├── index.css     # CSS themes, micro-animations, flip card engines
    │   ├── context/
    │   │   └── AuthContext.jsx  # JWT handling & offline sandbox states
    │   └── components/
    │       ├── LoginPage.jsx    # Glowing signup page with motivation prompts
    │       ├── Dashboard.jsx    # Metric grids & CSS-based charts
    │       ├── ProblemList.jsx  # Logs table with slide-over detail panels
    │       ├── RevisionQueue.jsx# Timed flashcards and SM-2 feedback sliders
    │       ├── ProblemForm.jsx  # Add/Edit form with Sparkles AI summary button
    │       └── Settings.jsx     # Targets configuration & backup helpers
```

---

## 🚀 Getting Started

### Prerequisites

Make sure you have Node.js installed (v18.0.0 or higher is recommended).

### Quick Start

1. Clone or download the workspace directory.
2. Open your terminal in the project root:
   ```bash
   cd study_buddy
   ```
3. Boot the environment (this will automatically resolve and install dependencies for the root, backend, and frontend if run for the first time):
   ```bash
   npm run install:all
   ```
4. Start the application:
   ```bash
   npm run dev
   ```
5. Open your browser and navigate to **`http://localhost:5173`**.

---

## 🔁 Spaced Repetition (SM-2) Mechanics

The next revision interval is calculated using the following confidence mappings:

| Score | Label | Description / Interval Modifier |
|:---:|---|---|
| **1** | Blanked | Full reset. Scheduled for review in 1 day. |
| **2** | Shaky | Reset. Scheduled for review in 2 days. |
| **3** | Okay | Slight increase. Multiplies previous interval by `1.15` (min 4 days). |
| **4** | Solid | Comfortable. Multiplies previous interval by `1.70` (min 7 days). |
| **5** | Nailed it | Mastered. Multiplies previous interval by `1.70` (min 14 days). |
