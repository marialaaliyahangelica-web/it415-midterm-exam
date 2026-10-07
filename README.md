# Campus IT Help Desk Ticketing System

**Course:** IT 415 - Application Development and Emerging Technologies  
**Examination:** Midterm Examination (Performance-Based)  
**Student Name:** Aaliyah Angelica Marial  
**Scenario Assigned:** Scenario 2 – IT Help Desk Ticketing System  

---

## 1. Project Overview
The Campus IT Help Desk Ticketing System is a responsive client-side web application designed to replace inefficient paper slips and unmonitored chat messages in school IT operations[cite: 9, 11]. It provides a streamlined interface for students and staff to submit support requests, while equipping IT personnel with real-time status dashboards, technician assignments, strict workflow rules, and timestamped audit logs[cite: 11].

---

## 2. Key Features
* **Automatic Ticket ID Generation:** Auto-assigns sequential IDs starting from `TKT-0001` with default status `Open`[cite: 11].
* **Categorization & Urgency:** Organizes issues into 4 categories (`Hardware`, `Network`, `Software`, `Account`) and 4 priorities (`Low`, `Medium`, `High`, `Critical`)[cite: 11].
* **Technician Allocation:** Assigns issues among at least 3 campus IT specialists (`Alex Rivera`, `Sarah Chen`, `Marcus Vance`)[cite: 11].
* **Enforced Status Progression:** 
  * Strict flow: `Open` &rarr; `In Progress` &rarr; `Resolved` &rarr; `Closed`[cite: 11].
  * Tickets can only enter `In Progress` if an IT technician is assigned[cite: 11].
  * If a fix fails, `Resolved` tickets can revert to `In Progress`[cite: 11].
  * All illegal state jumps (such as `Open` directly to `Closed`) are blocked with alerts[cite: 11].
* **Turnaround Metric:** Automatically computes resolution duration in days upon reaching `Resolved`[cite: 11].
* **Reverse-Chronological Notes:** Maintains an activity feed displaying the newest troubleshooting notes first[cite: 11].
* **Multi-Filter & Priority Sorting:** Search by keyword/ID, filter by status, priority, category, or technician, and sort with `Critical` tickets prioritized[cite: 11].
* **Live Dashboard:** Displays real-time counts per status and flags unassigned open tickets[cite: 11].
* **Apple Human Interface Design:** Styled with Apple system typography, frosted glass headers, and card layouts.
* **Persistent Browser Storage:** Backed by `localStorage` to preserve tickets and counter states across browser refreshes.

---

## 3. Technology Stack
* **Front-End:** HTML5 (Semantic Structure), CSS3 (Apple Design System), Vanilla JavaScript (ES6+ Modular Architecture)
* **Persistence:** Browser Web Storage API (`localStorage`)
* **Version Control:** Git, GitHub (Feature Branching, Pull Requests, Multi-Commit History)
* **AI Tool Assisted:** Claude Code / ChatGPT

---

## 4. Directory Structure
```text
it415-midterm-exam/
├── README.md                          # Application documentation
├── index.html                         # Primary single-page interface
├── css/
│   └── style.css                      # Apple Design System stylesheet
├── js/
│   └── app.js                         # Modular application logic
└── docs/
    ├── requirements-analysis.md       # 7-point requirements document
    └── screenshots/                   # Verification evidence
        ├── 01-Dashboard (2).png
        ├── 02-Ticket Details.png
        ├── 03-pull-request.png
        └── 04-running-app.png