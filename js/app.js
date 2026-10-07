/* ==========================================================================
   Campus IT Help Desk - Core Application Logic (Stage 5 Patched)
   ========================================================================== */

const STORAGE_KEY = "it_helpdesk_tickets";
const COUNTER_KEY = "it_helpdesk_counter";

const TECHNICIANS = ["Alex Rivera", "Sarah Chen", "Marcus Vance"];

// State
let tickets = [];
let currentViewingTicketId = null;

// Form DOM Elements
const ticketForm = document.getElementById("ticket-form");
const inputRequester = document.getElementById("requester-name");
const selectCategory = document.getElementById("category");
const selectPriority = document.getElementById("priority");
const selectTech = document.getElementById("assigned-tech");
const inputDescription = document.getElementById("description");

// Error Label Elements
const errorName = document.getElementById("error-name");
const errorCategory = document.getElementById("error-category");
const errorPriority = document.getElementById("error-priority");
const errorDesc = document.getElementById("error-desc");

// Table & Alert Elements
const ticketsTableBody = document.getElementById("tickets-table-body");
const alertBanner = document.getElementById("alert-banner");

// Filter & Sort Controls
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

// Priority Ranking
const PRIORITY_RANK = {
  "Critical": 4,
  "High": 3,
  "Medium": 2,
  "Low": 1
};

// Bootstrap
document.addEventListener("DOMContentLoaded", () => {
  loadTickets();
  renderApp();
  setupEventListeners();
});

function loadTickets() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) {
    try {
      tickets = JSON.parse(saved);
    } catch (e) {
      tickets = [];
    }
  } else {
    tickets = [
      {
        id: "TKT-0001",
        requester: "Campus Faculty",
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
            text: "Report received via campus web interface.",
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

function setupEventListeners() {
  ticketForm.addEventListener("submit", handleCreateTicket);

  inputRequester.addEventListener("input", () => clearInputError(inputRequester, errorName));
  selectCategory.addEventListener("change", () => clearInputError(selectCategory, errorCategory));
  selectPriority.addEventListener("change", () => clearInputError(selectPriority, errorPriority));
  inputDescription.addEventListener("input", () => clearInputError(inputDescription, errorDesc));

  searchInput.addEventListener("input", renderApp);
  filterStatus.addEventListener("change", renderApp);
  filterPriority.addEventListener("change", renderApp);
  filterCategory.addEventListener("change", renderApp);
  filterTech.addEventListener("change", renderApp);
  sortOrder.addEventListener("change", renderApp);

  modalCloseBtn.addEventListener("click", closeModal);
  ticketModal.addEventListener("click", (e) => {
    if (e.target === ticketModal) closeModal();
  });

  btnUpdateStatus.addEventListener("click", handleStatusUpdate);
  noteForm.addEventListener("submit", handleAddNote);
}

function validateTicketForm(requester, category, priority, description) {
  let isValid = true;

  if (!requester || requester.trim().length === 0) {
    setInputError(inputRequester, errorName, "Requester name is required.");
    isValid = false;
  } else if (requester.trim().length < 3) {
    setInputError(inputRequester, errorName, "Requester name must be at least 3 characters.");
    isValid = false;
  } else {
    clearInputError(inputRequester, errorName);
  }

  const validCategories = ["Hardware", "Network", "Software", "Account"];
  if (!category || !validCategories.includes(category)) {
    setInputError(selectCategory, errorCategory, "Please choose a valid category.");
    isValid = false;
  } else {
    clearInputError(selectCategory, errorCategory);
  }

  const validPriorities = ["Low", "Medium", "High", "Critical"];
  if (!priority || !validPriorities.includes(priority)) {
    setInputError(selectPriority, errorPriority, "Please select an issue priority level.");
    isValid = false;
  } else {
    clearInputError(selectPriority, errorPriority);
  }

  if (!description || description.trim().length === 0) {
    setInputError(inputDescription, errorDesc, "Issue description is required.");
    isValid = false;
  } else if (description.trim().length < 10) {
    setInputError(inputDescription, errorDesc, "Please provide more detail (minimum 10 characters).");
    isValid = false;
  } else {
    clearInputError(inputDescription, errorDesc);
  }

  return isValid;
}

function setInputError(inputElement, errorElement, message) {
  inputElement.classList.add("is-invalid");
  errorElement.textContent = message;
}

function clearInputError(inputElement, errorElement) {
  inputElement.classList.remove("is-invalid");
  errorElement.textContent = "";
}

function validateStatusTransition(currentStatus, targetStatus, assignedTech) {
  if (currentStatus === targetStatus) {
    return { valid: true };
  }

  if (targetStatus === "In Progress" && (!assignedTech || assignedTech.trim() === "")) {
    return {
      valid: false,
      message: "Rule Violation: A ticket cannot enter 'In Progress' without an assigned IT technician."
    };
  }

  if (currentStatus === "Open") {
    if (targetStatus === "In Progress") return { valid: true };
    return {
      valid: false,
      message: `Illegal Jump: Cannot transition from 'Open' directly to '${targetStatus}'. Next step must be 'In Progress'.`
    };
  }

  if (currentStatus === "In Progress") {
    if (targetStatus === "Resolved") return { valid: true };
    return {
      valid: false,
      message: `Illegal Jump: Cannot transition from 'In Progress' to '${targetStatus}'. Next step must be 'Resolved'.`
    };
  }

  if (currentStatus === "Resolved") {
    if (targetStatus === "In Progress" || targetStatus === "Closed") return { valid: true };
    return {
      valid: false,
      message: "Illegal Jump: From 'Resolved', you may only finalize to 'Closed' or return to 'In Progress'."
    };
  }

  if (currentStatus === "Closed") {
    return {
      valid: false,
      message: "Ticket is Closed and permanently locked from status changes."
    };
  }

  return { valid: false, message: "Invalid status transition requested." };
}

function handleCreateTicket(e) {
  e.preventDefault();

  const requester = inputRequester.value.trim();
  const category = selectCategory.value;
  const priority = selectPriority.value;
  const technician = selectTech.value;
  const description = inputDescription.value.trim();

  const isValid = validateTicketForm(requester, category, priority, description);
  if (!isValid) {
    showAlert("Please correct the highlighted errors before submitting.", "alert-danger");
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
        text: "Ticket received and queued for triage.",
        date: new Date().toISOString()
      }
    ]
  };

  tickets.unshift(newTicket);
  saveTickets();
  ticketForm.reset();

  showAlert(`Ticket ${newTicket.id} created successfully.`, "alert-success");
  renderApp();
}

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

  // BUG FIX 1: Correctly sync resolved timestamp and handle reopen reset
  if (targetStatus === "Resolved" && !ticket.resolvedAt) {
    ticket.resolvedAt = new Date().toISOString();
  } else if (targetStatus === "In Progress" && oldStatus === "Resolved") {
    ticket.resolvedAt = null; // Reset timestamp if reopened
  }

  ticket.notes.unshift({
    author: selectedTech || "IT Admin",
    text: `Status updated from '${oldStatus}' to '${targetStatus}'. Technician: ${selectedTech || "Unassigned"}.`,
    date: new Date().toISOString()
  });

  saveTickets();
  showModalAlert(`Status successfully set to '${targetStatus}'.`, "alert-success");
  
  // Re-populate modal view immediately so turnaround refreshes dynamically
  populateModalData(ticket);
  renderApp();
}

function handleAddNote(e) {
  e.preventDefault();
  const ticket = tickets.find(t => t.id === currentViewingTicketId);
  if (!ticket) return;

  const author = noteAuthor.value.trim();
  const text = noteText.value.trim();

  if (!author || author.length < 2) {
    showModalAlert("Please enter a valid note author name (at least 2 letters).", "alert-danger");
    return;
  }

  if (!text || text.length < 3) {
    showModalAlert("Note text cannot be empty or shorter than 3 characters.", "alert-danger");
    return;
  }

  ticket.notes.unshift({
    author,
    text,
    date: new Date().toISOString()
  });

  saveTickets();
  noteText.value = "";
  renderNotesFeed(ticket.notes);
}

// BUG FIX 2: Fixed turnaround calculation for same-day resolutions and invalid dates
function calculateTurnaround(createdIso, resolvedIso) {
  if (!resolvedIso) return "Not resolved yet";
  
  const start = new Date(createdIso);
  const end = new Date(resolvedIso);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return "Invalid date recorded";
  }

  const diffMs = Math.max(0, end.getTime() - start.getTime());
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffHours < 24) {
    return "< 1 day (Resolved same day)";
  }
  return `${diffDays.toFixed(1)} day(s)`;
}

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