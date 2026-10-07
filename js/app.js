/* ==========================================================================
   Campus IT Help Desk - Core Application Logic
   ========================================================================== */

const STORAGE_KEY = "it_helpdesk_tickets";
const COUNTER_KEY = "it_helpdesk_counter";

// Pre-seeded technicians list
const TECHNICIANS = ["Alex Rivera", "Sarah Chen", "Marcus Vance"];

// State
let tickets = [];
let currentViewingTicketId = null;

// DOM Elements
const ticketForm = document.getElementById("ticket-form");
const ticketsTableBody = document.getElementById("tickets-table-body");
const alertBanner = document.getElementById("alert-banner");

// Filter & Sort Elements
const searchInput = document.getElementById("search-input");
const filterStatus = document.getElementById("filter-status");
const filterPriority = document.getElementById("filter-priority");
const filterCategory = document.getElementById("filter-category");
const filterTech = document.getElementById("filter-tech");
const sortOrder = document.getElementById("sort-order");

// Dashboard Elements
const metricTotal = document.getElementById("metric-total");
const metricUnassigned = document.getElementById("metric-unassigned");
const metricInProgress = document.getElementById("metric-inprogress");
const metricResolved = document.getElementById("metric-resolved");
const metricClosed = document.getElementById("metric-closed");

// Modal Elements
const ticketModal = document.getElementById("ticket-modal");
const modalCloseBtn = document.getElementById("modal-close-btn");
const modalTicketId = document.getElementById("modal-ticket-id");
const modalRequester = document.getElementById("modal-requester");
const modalCategory = document.getElementById("modal-category");
const modalPriority = document.getElementById("modal-priority");
const modalCreated = document.getElementById("modal-created");
const modalStatus = document.getElementById("modal-status");
const modalTurnaround = document.getElementById("modal-turnaround");
const modalDescription = document.getElementById("modal-description");
const modalTechAssign = document.getElementById("modal-tech-assign");
const modalNextStatus = document.getElementById("modal-next-status");
const btnUpdateStatus = document.getElementById("btn-update-status");
const modalStatusAlert = document.getElementById("modal-status-alert");
const noteForm = document.getElementById("note-form");
const noteAuthor = document.getElementById("note-author");
const noteText = document.getElementById("note-text");
const modalNotesFeed = document.getElementById("modal-notes-feed");

// Priority Sorting Rank
const PRIORITY_RANK = {
  "Critical": 4,
  "High": 3,
  "Medium": 2,
  "Low": 1
};

// Initialize Application
document.addEventListener("DOMContentLoaded", () => {
  loadTickets();
  renderApp();
  setupEventListeners();
});

// Load from LocalStorage
function loadTickets() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      tickets = JSON.parse(saved);
    } catch (e) {
      tickets = [];
    }
  } else {
    // Initial sample ticket
    tickets = [
      {
        id: "TKT-0001",
        requester: "Prof. Albus Dumbledore",
        category: "Network",
        priority: "High",
        status: "Open",
        technician: "",
        description: "Campus lab room 302 cannot reach the local subnet gateway.",
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
        resolvedAt: null,
        notes: [
          {
            author: "System Auto-Logger",
            text: "Ticket received via campus portal.",
            date: new Date(Date.now() - 86400000 * 2).toISOString()
          }
        ]
      }
    ];
    saveTickets();
  }
}

function saveTickets() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function getNextTicketNumber() {
  let counter = parseInt(localStorage.getItem(COUNTER_KEY) || "1", 10);
  if (tickets.length >= counter) {
    counter = tickets.length + 1;
  }
  const formatted = "TKT-" + String(counter).padStart(4, "0");
  localStorage.setItem(COUNTER_KEY, String(counter + 1));
  return formatted;
}

// Event Listeners
function setupEventListeners() {
  ticketForm.addEventListener("submit", handleCreateTicket);
  
  // Filtering & Sorting
  searchInput.addEventListener("input", renderApp);
  filterStatus.addEventListener("change", renderApp);
  filterPriority.addEventListener("change", renderApp);
  filterCategory.addEventListener("change", renderApp);
  filterTech.addEventListener("change", renderApp);
  sortOrder.addEventListener("change", renderApp);

  // Modal Handlers
  modalCloseBtn.addEventListener("click", closeModal);
  ticketModal.addEventListener("click", (e) => {
    if (e.target === ticketModal) closeModal();
  });

  btnUpdateStatus.addEventListener("click", handleStatusUpdate);
  noteForm.addEventListener("submit", handleAddNote);
}

// ---------------------------------------------------------------------------
// FEATURE: The Status Rules Implementation
// ---------------------------------------------------------------------------
function validateStatusTransition(currentStatus, targetStatus, assignedTech) {
  if (currentStatus === targetStatus) {
    return { valid: true };
  }

  // Rule: Cannot move to 'In Progress' without an assigned technician
  if (targetStatus === "In Progress" && (!assignedTech || assignedTech.trim() === "")) {
    return {
      valid: false,
      message: "Validation Error: A ticket can only become 'In Progress' if an IT technician is assigned."
    };
  }

  // Rule: Progression Open -> In Progress -> Resolved -> Closed
  if (currentStatus === "Open") {
    if (targetStatus === "In Progress") return { valid: true };
    return {
      valid: false,
      message: `Invalid Transition: Cannot jump from 'Open' to '${targetStatus}'. Must move to 'In Progress' first.`
    };
  }

  if (currentStatus === "In Progress") {
    if (targetStatus === "Resolved") return { valid: true };
    return {
      valid: false,
      message: `Invalid Transition: Cannot jump from 'In Progress' to '${targetStatus}'. Valid next step is 'Resolved'.`
    };
  }

  if (currentStatus === "Resolved") {
    // Rule: A Resolved ticket can go back to In Progress if the fix didn't work
    if (targetStatus === "In Progress" || targetStatus === "Closed") return { valid: true };
    return {
      valid: false,
      message: `Invalid Transition: From 'Resolved', you can only proceed to 'Closed' or return to 'In Progress'.`
    };
  }

  if (currentStatus === "Closed") {
    return {
      valid: false,
      message: "Ticket is Closed and finalized. Status cannot be modified further."
    };
  }

  return { valid: false, message: "Invalid status transition requested." };
}

// Form Submission: Create Ticket
function handleCreateTicket(e) {
  e.preventDefault();

  const requester = document.getElementById("requester-name").value.trim();
  const category = document.getElementById("category").value;
  const priority = document.getElementById("priority").value;
  const technician = document.getElementById("assigned-tech").value;
  const description = document.getElementById("description").value.trim();

  if (!requester || !category || !priority || !description) {
    showAlert("Please fill in all required fields.", "alert-danger");
    return;
  }

  const newTicket = {
    id: getNextTicketNumber(),
    requester,
    category,
    priority,
    status: "Open",
    technician: technician || "",
    description,
    createdAt: new Date().toISOString(),
    resolvedAt: null,
    notes: [
      {
        author: "Help Desk",
        text: "Ticket created and logged in queue.",
        date: new Date().toISOString()
      }
    ]
  };

  tickets.unshift(newTicket);
  saveTickets();
  ticketForm.reset();

  showAlert(`Ticket ${newTicket.id} created successfully!`, "alert-success");
  renderApp();
}

// Status & Tech Update from Modal
function handleStatusUpdate() {
  const ticket = tickets.find(t => t.id === currentViewingTicketId);
  if (!ticket) return;

  const targetStatus = modalNextStatus.value;
  const selectedTech = modalTechAssign.value;

  const validation = validateStatusTransition(ticket.status, targetStatus, selectedTech);
  if (!validation.valid) {
    showModalAlert(validation.message, "alert-danger");
    return;
  }

  const oldStatus = ticket.status;
  ticket.status = targetStatus;
  ticket.technician = selectedTech;

  // Track resolution date and turnaround
  if (targetStatus === "Resolved" && !ticket.resolvedAt) {
    ticket.resolvedAt = new Date().toISOString();
  } else if (targetStatus === "In Progress" && oldStatus === "Resolved") {
    ticket.resolvedAt = null;
  }

  // Audit note
  ticket.notes.unshift({
    author: selectedTech || "IT Admin",
    text: `Status changed from '${oldStatus}' to '${targetStatus}'. Assigned: ${selectedTech || "None"}.`,
    date: new Date().toISOString()
  });

  saveTickets();
  showModalAlert(`Status successfully updated to '${targetStatus}'.`, "alert-success");
  
  populateModalData(ticket);
  renderApp();
}

// Add Note Handler
function handleAddNote(e) {
  e.preventDefault();
  const ticket = tickets.find(t => t.id === currentViewingTicketId);
  if (!ticket) return;

  const author = noteAuthor.value.trim();
  const text = noteText.value.trim();

  if (!author || !text) return;

  // Newest first
  ticket.notes.unshift({
    author,
    text,
    date: new Date().toISOString()
  });

  saveTickets();
  noteText.value = "";
  renderNotesFeed(ticket.notes);
}

// Calculate Turnaround Days
function calculateTurnaround(createdIso, resolvedIso) {
  if (!resolvedIso) return "Not resolved yet";
  const start = new Date(createdIso);
  const end = new Date(resolvedIso);
  const diffTime = Math.abs(end - start);
  const diffDays = (diffTime / (1000 * 60 * 60 * 24)).toFixed(1);
  return `${diffDays} day(s)`;
}

// Open Detail Modal
function openTicketModal(ticketId) {
  const ticket = tickets.find(t => t.id === ticketId);
  if (!ticket) return;

  currentViewingTicketId = ticketId;
  populateModalData(ticket);
  modalStatusAlert.classList.add("hidden");
  ticketModal.classList.remove("hidden");
}

function populateModalData(ticket) {
  modalTicketId.textContent = ticket.id;
  modalTicketId.className = `badge badge-${ticket.priority.toLowerCase()}`;
  modalRequester.textContent = ticket.requester;
  modalCategory.textContent = ticket.category;
  modalPriority.textContent = ticket.priority;
  modalCreated.textContent = new Date(ticket.createdAt).toLocaleDateString();
  modalStatus.innerHTML = `<span class="badge badge-${ticket.status.toLowerCase().replace(' ', '-')}">${ticket.status}</span>`;
  modalTurnaround.textContent = calculateTurnaround(ticket.createdAt, ticket.resolvedAt);
  modalDescription.textContent = ticket.description;

  modalTechAssign.value = ticket.technician || "";
  modalNextStatus.value = ticket.status;

  renderNotesFeed(ticket.notes);
}

function renderNotesFeed(notes) {
  if (!notes || notes.length === 0) {
    modalNotesFeed.innerHTML = `<p class="empty-state">No notes added yet.</p>`;
    return;
  }

  modalNotesFeed.innerHTML = notes.map(note => `
    <div class="note-bubble">
      <div class="note-meta">
        <strong>${escapeHtml(note.author)}</strong>
        <span>${new Date(note.date).toLocaleString()}</span>
      </div>
      <div class="note-text">${escapeHtml(note.text)}</div>
    </div>
  `).join("");
}

function closeModal() {
  ticketModal.classList.add("hidden");
  currentViewingTicketId = null;
}

// Render Dashboard and Table
function renderApp() {
  updateDashboard();
  renderTable();
}

function updateDashboard() {
  metricTotal.textContent = tickets.length;
  metricUnassigned.textContent = tickets.filter(t => t.status === "Open" && (!t.technician || t.technician === "")).length;
  metricInProgress.textContent = tickets.filter(t => t.status === "In Progress").length;
  metricResolved.textContent = tickets.filter(t => t.status === "Resolved").length;
  metricClosed.textContent = tickets.filter(t => t.status === "Closed").length;
}

function renderTable() {
  const query = searchInput.value.toLowerCase().trim();
  const statusVal = filterStatus.value;
  const priorityVal = filterPriority.value;
  const categoryVal = filterCategory.value;
  const techVal = filterTech.value;
  const sort = sortOrder.value;

  let filtered = tickets.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(query) || t.id.toLowerCase().includes(query);
    const matchesStatus = statusVal === "ALL" || t.status === statusVal;
    const matchesPriority = priorityVal === "ALL" || t.priority === priorityVal;
    const matchesCategory = categoryVal === "ALL" || t.category === categoryVal;
    
    let matchesTech = true;
    if (techVal === "UNASSIGNED") {
      matchesTech = !t.technician || t.technician === "";
    } else if (techVal !== "ALL") {
      matchesTech = t.technician === techVal;
    }

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesTech;
  });

  // Sorting
  filtered.sort((a, b) => {
    if (sort === "priority-desc") {
      return PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority];
    }
    if (sort === "date-desc") {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    if (sort === "date-asc") {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return 0;
  });

  if (filtered.length === 0) {
    ticketsTableBody.innerHTML = `<tr><td colspan="8" class="text-center empty-state">No matching tickets found.</td></tr>`;
    return;
  }

  ticketsTableBody.innerHTML = filtered.map(t => `
    <tr>
      <td><strong>${t.id}</strong></td>
      <td>${escapeHtml(t.requester)}</td>
      <td>${t.category}</td>
      <td><span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span></td>
      <td><span class="badge badge-${t.status.toLowerCase().replace(' ', '-')}">${t.status}</span></td>
      <td>${t.technician ? escapeHtml(t.technician) : '<span style="color:var(--text-tertiary)">Unassigned</span>'}</td>
      <td>${new Date(t.createdAt).toLocaleDateString()}</td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="openTicketModal('${t.id}')">Manage</button>
      </td>
    </tr>
  `).join("");
}

// Alerts and Utilities
function showAlert(message, type) {
  alertBanner.className = `alert-banner ${type}`;
  alertBanner.textContent = message;
  alertBanner.classList.remove("hidden");
  setTimeout(() => alertBanner.classList.add("hidden"), 4000);
}

function showModalAlert(message, type) {
  modalStatusAlert.className = `alert-banner ${type}`;
  modalStatusAlert.textContent = message;
  modalStatusAlert.classList.remove("hidden");
  setTimeout(() => modalStatusAlert.classList.add("hidden"), 5000);
}

function escapeHtml(string) {
  const div = document.createElement("div");
  div.textContent = string;
  return div.innerHTML;
}