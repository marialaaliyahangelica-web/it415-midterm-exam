# Requirements Analysis: IT Help Desk Ticketing System
**Scenario:** Scenario 2 - IT Help Desk Ticketing System  
**Course:** IT 415 - Application Development and Emerging Technologies  
**Student:** Aaliyah Angelica Marial  

---

### 1. Problem
Campus IT service requests (hardware failures, Wi-Fi connectivity problems, software installations, account permissions) are currently reported via unorganized paper slips and informal messages[cite: 6]. This leads to lost requests, no visibility on issue urgency, lack of technician accountability, and delayed response times[cite: 6].

### 2. Target Users
* **Requesters:** Campus staff, faculty members, and students submitting IT support tickets[cite: 6].
* **IT Personnel:** IT Help Desk technicians and administrators responsible for ticket assignment, troubleshooting, status tracking, and resolution[cite: 6].

### 3. Functional Requirements
* **Ticket Submission:** Auto-generate sequential ticket numbers (`TKT-0001`, `TKT-0002`, etc.) and automatically initialize status as `Open`[cite: 6].
* **Categorization & Prioritization:** Support categories (`Hardware`, `Network`, `Software`, `Account`) and priority levels (`Low`, `Medium`, `High`, `Critical`)[cite: 6].
* **Technician Assignment:** Assign tickets to designated technicians from an active personnel list (at least 3 technicians)[cite: 6].
* **Strict Workflow Validation:** Enforce status progression (`Open` -> `In Progress` -> `Resolved` -> `Closed`)[cite: 6]. Prevent illegal status jumps (e.g., `Open` directly to `Closed`) and permit reopening only from `Resolved` back to `In Progress`[cite: 6].
* **Assignment Guard:** Prevent moving a ticket to `In Progress` unless an IT technician is assigned[cite: 6].
* **Resolution Metrics:** Record the resolution date upon reaching `Resolved` and calculate duration in days from creation[cite: 6].
* **Timestamped Audit Notes:** Allow adding updates and notes, presented in reverse chronological order (newest first)[cite: 6].
* **Search, Filter & Sort:** Filter by status, priority, category, technician; search description keywords; sort by priority (Critical first) or submission date[cite: 6].
* **Metrics Dashboard:** Display real-time counts for tickets per status and highlight unassigned open tickets requiring immediate triage[cite: 6].

### 4. Required Inputs
* **Requester Name:** Full name of the individual requesting assistance[cite: 6].
* **Category:** Selected IT category (`Hardware`, `Network`, `Software`, `Account`)[cite: 6].
* **Priority:** Urgency indicator (`Low`, `Medium`, `High`, `Critical`)[cite: 6].
* **Technician:** Assigned staff member (`Alex Rivera`, `Sarah Chen`, `Marcus Vance`, or unassigned)[cite: 6].
* **Description:** Detailed explanation of the technical problem[cite: 6].
* **Note Details:** Note text content and author name[cite: 6].
* **Search & Filter Controls:** Keyword query, category/priority/status filters, sort criteria[cite: 6].

### 5. Expected Outputs
* **Live Dashboard:** Metric cards showing total, Open, In Progress, Resolved, Closed, and Open Unassigned counts[cite: 6].
* **Dynamic Ticket List:** Filterable data table displaying Ticket ID, Requester, Category, Priority badge, Assigned Technician, Status badge, and Created Date[cite: 6].
* **Ticket Detail View:** Modal dialog with full issue description, resolution turnaround metric, status transition controls, and ordered notes history[cite: 6].
* **Feedback Banners:** Apple-style alerts validating inputs, confirming status changes, and rejecting illegal status jumps.

### 6. Proposed Features
* Auto-increment ID generator backed by `localStorage`[cite: 1, 6].
* Finite-state status transition validator with descriptive error messaging[cite: 1, 6].
* Reverse-chronological note logging system with author attribution[cite: 6].
* Multi-parameter search, filtering, and priority-weighted sorting engine[cite: 6].
* Apple Human Interface Guidelines-inspired responsive UI with Live Dashboard[cite: 1, 6].

### 7. Tools and Technologies
* **Front-End:** Semantic HTML5, Modern CSS3 (Apple Design System, SF Pro typography), Vanilla JavaScript (ES6+).
* **Client-side Storage:** Browser Web Storage API (`localStorage`).
* **Version Control:** Git, GitHub (branching, pull requests, automated commit workflow)[cite: 1].
* **AI Tool:** ChatGPT / Claude Code[cite: 1].