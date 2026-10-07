# Requirements Analysis: IT Help Desk Ticketing System
**Scenario:** Scenario 2 - IT Help Desk Ticketing System  
**Course:** IT 415 - Application Development and Emerging Technologies  
**Student:** Aaliyah Angelica Marial  

---

### 1. Problem
Campus IT service requests (hardware failures, Wi-Fi connectivity problems, software installations, account permissions) are currently reported via unorganized paper slips and informal messages. This leads to lost requests, no visibility on issue urgency, lack of technician accountability, and delayed response times.

### 2. Target Users
* **Requesters:** Campus staff, faculty members, and students submitting IT support tickets.
* **IT Personnel:** IT Help Desk technicians and administrators responsible for ticket assignment, troubleshooting, status tracking, and resolution.

### 3. Functional Requirements
* **Ticket Submission:** Auto-generate sequential ticket numbers (`TKT-0001`, `TKT-0002`, etc.) and automatically initialize status as `Open`.
* **Categorization & Prioritization:** Support categories (`Hardware`, `Network`, `Software`, `Account`) and priority levels (`Low`, `Medium`, `High`, `Critical`).
* **Technician Assignment:** Assign tickets to designated technicians from an active personnel list (at least 3 technicians).
* **Strict Workflow Validation:** Enforce status progression (`Open` -> `In Progress` -> `Resolved` -> `Closed`). Prevent illegal status jumps (e.g., `Open` directly to `Closed`) and permit reopening only from `Resolved` back to `In Progress`.
* **Assignment Guard:** Prevent moving a ticket to `In Progress` unless an IT technician is assigned.
* **Resolution Metrics:** Record the resolution date upon reaching `Resolved` and calculate duration in days from creation.
* **Timestamped Audit Notes:** Allow adding updates and notes, presented in reverse chronological order (newest first).
* **Search, Filter & Sort:** Filter by status, priority, category, technician; search description keywords; sort by priority (Critical first) or submission date.
* **Metrics Dashboard:** Display real-time counts for tickets per status and highlight unassigned open tickets requiring immediate triage.

### 4. Required Inputs
* **Requester Name:** Full name of the individual requesting assistance.
* **Category:** Selected IT category (`Hardware`, `Network`, `Software`, `Account`).
* **Priority:** Urgency indicator (`Low`, `Medium`, `High`, `Critical`).
* **Technician:** Assigned staff member (`Damon Salvatore`, `Dakota Johnson`, `Alaric Saltzman`, or unassigned).
* **Description:** Detailed explanation of the technical problem.
* **Note Details:** Note text content and author name.
* **Search & Filter Controls:** Keyword query, category/priority/status filters, sort criteria.

### 5. Expected Outputs
* **Live Dashboard:** Metric cards showing total, Open, In Progress, Resolved, Closed, and Open Unassigned counts.
* **Dynamic Ticket List:** Filterable data table displaying Ticket ID, Requester, Category, Priority badge, Assigned Technician, Status badge, and Created Date.
* **Ticket Detail View:** Modal dialog with full issue description, resolution turnaround metric, status transition controls, and ordered notes history.
* **Feedback Banners:** Apple-style alerts validating inputs, confirming status changes, and rejecting illegal status jumps.

### 6. Proposed Features
* Auto-increment ID generator backed by `localStorage`.
* Finite-state status transition validator with descriptive error messaging.
* Reverse-chronological note logging system with author attribution.
* Multi-parameter search, filtering, and priority-weighted sorting engine.
* Apple Human Interface Guidelines-inspired responsive UI with Live Dashboard.

### 7. Tools and Technologies
* **Front-End:** Semantic HTML5, Modern CSS3 (Apple Design System, SF Pro typography), Vanilla JavaScript (ES6+).
* **Client-side Storage:** Browser Web Storage API (`localStorage`).
* **Version Control:** Git, GitHub (branching, pull requests, automated commit workflow).
* **AI Tool:** Gemini.