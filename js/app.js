/* ==========================================================================
   Campus IT Help Desk - Refactored Modular Application
   ========================================================================== */

// ---------------------------------------------------------------------------
// 1. CONSTANTS & CONFIGURATION
// ---------------------------------------------------------------------------
const CONFIG = {
  STORAGE_KEY: "it_helpdesk_tickets",
  COUNTER_KEY: "it_helpdesk_counter",
  PRIORITY_RANKS: {
    Critical: 4,
    High: 3,
    Medium: 2,
    Low: 1
  },
  VALID_STATUSES: ["Open", "In Progress", "Resolved", "Closed"]
};

// ---------------------------------------------------------------------------
// 2. STORAGE MODULE
// ---------------------------------------------------------------------------
const StorageService = {
  getTickets() {
    const raw = localStorage.getItem(CONFIG.STORAGE_KEY);
    if (!raw) {
      const initialSeed = [
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
              author: "Help Desk Admin",
              text: "Initial support ticket registered in queue.",
              date: new Date(Date.now() - 86400000 * 2).toISOString()
            }
          ]
        }
      ];
      this.saveTickets(initialSeed);
      return initialSeed;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return [];
    }
  },

  saveTickets(tickets) {
    localStorage.setItem(CONFIG.STORAGE_KEY, JSON.stringify(tickets));
  },

  getNextId(currentCount) {
    let counter = parseInt(localStorage.getItem(CONFIG.COUNTER_KEY) || "1", 10);
    if (currentCount >= counter) {
      counter = currentCount + 1;
    }
    const formattedId = `TKT-${String(counter).padStart(4, "0")}`;
    localStorage.setItem(CONFIG.COUNTER_KEY, String(counter + 1));
    return formattedId;
  }
};

// ---------------------------------------------------------------------------
// 3. UTILITIES & DATE FORMATTING MODULE
// ---------------------------------------------------------------------------
const FormatUtils = {
  escapeHtml(str) {
    const div = document.createElement("div");
    div.textContent = str || "";
    return div.innerHTML;
  },

  formatDate(isoString) {
    if (!isoString) return "--";
    return new Date(isoString).toLocaleDateString();
  },

  formatDateTime(isoString) {
    if (!isoString) return "--";
    return new Date(isoString).toLocaleString();
  },

  calculateTurnaround(createdIso, resolvedIso) {
    if (!resolvedIso) return "Not resolved yet";
    const start = new Date(createdIso);
    const end = new Date(resolvedIso);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return "Invalid date recorded";
    }

    const diffMs = Math.max(0, end.getTime() - start.getTime());
    const diffHours = diffMs / (1000 * 60 * 60);
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    return diffHours < 24 ? "< 1 day (Resolved same day)" : `${diffDays.toFixed(1)} day(s)`;
  }
};

// ---------------------------------------------------------------------------
// 4. STATUS WORKFLOW ENGINE
// ---------------------------------------------------------------------------
const WorkflowEngine = {
  validateTransition(currentStatus, targetStatus, assignedTech) {
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
        message: `Illegal Jump: Cannot transition from 'Open' directly to '${targetStatus}'. Must go to 'In Progress'.`
      };
    }

    if (currentStatus === "In Progress") {
      if (targetStatus === "Resolved") return { valid: true };
      return {
        valid: false,
        message: `Illegal Jump: Cannot transition from 'In Progress' to '${targetStatus}'. Next status is 'Resolved'.`
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
        message: "Ticket is Closed and permanently locked from further status updates."
      };
    }

    return { valid: false, message: "Invalid status transition requested." };
  }
};

// ---------------------------------------------------------------------------
// 5. APPLICATION STATE & CONTROLLER
// ---------------------------------------------------------------------------
class HelpDeskApp {
  constructor() {
    this.tickets = [];
    this.currentTicketId = null;
    this.initDOMElements();
  }

  initDOMElements() {
    // Forms
    this.form = document.getElementById("ticket-form");
    this.inputRequester = document.getElementById("requester-name");
    this.selectCategory = document.getElementById("category");
    this.selectPriority = document.getElementById("priority");
    this.selectTech = document.getElementById("assigned-tech");
    this.inputDescription = document.getElementById("description");

    // Validation Errors
    this.errorName = document.getElementById("error-name");
    this.errorCategory = document.getElementById("error-category");
    this.errorPriority = document.getElementById("error-priority");
    this.errorDesc = document.getElementById("error-desc");

    // Feed & Alerts
    this.tableBody = document.getElementById("tickets-table-body");
    this.alertBanner = document.getElementById("alert-banner");

    // Filters
    this.searchInput = document.getElementById("search-input");
    this.filterStatus = document.getElementById("filter-status");
    this.filterPriority = document.getElementById("filter-priority");
    this.filterCategory = document.getElementById("filter-category");
    this.filterTech = document.getElementById("filter-tech");
    this.sortOrder = document.getElementById("sort-order");

    // Metrics
    this.metricTotal = document.getElementById("metric-total");
    this.metricUnassigned = document.getElementById("metric-unassigned");
    this.metricInProgress = document.getElementById("metric-inprogress");
    this.metricResolved = document.getElementById("metric-resolved");
    this.metricClosed = document.getElementById("metric-closed");

    // Modal
    this.modal = document.getElementById("ticket-modal");
    this.modalCloseBtn = document.getElementById("modal-close-btn");
    this.modalTicketId = document.getElementById("modal-ticket-id");
    this.modalRequester = document.getElementById("modal-requester");
    this.modalCategory = document.getElementById("modal-category");
    this.modalPriority = document.getElementById("modal-priority");
    this.modalCreated = document.getElementById("modal-created");
    this.modalStatus = document.getElementById("modal-status");
    this.modalTurnaround = document.getElementById("modal-turnaround");
    this.modalDescription = document.getElementById("modal-description");
    this.modalTechAssign = document.getElementById("modal-tech-assign");
    this.modalNextStatus = document.getElementById("modal-next-status");
    this.btnUpdateStatus = document.getElementById("btn-update-status");
    this.modalStatusAlert = document.getElementById("modal-status-alert");

    // Notes
    this.noteForm = document.getElementById("note-form");
    this.noteAuthor = document.getElementById("note-author");
    this.noteText = document.getElementById("note-text");
    this.modalNotesFeed = document.getElementById("modal-notes-feed");
  }

  start() {
    this.tickets = StorageService.getTickets();
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    this.form.addEventListener("submit", (e) => this.handleTicketSubmit(e));

    // Clear inline errors on input
    this.inputRequester.addEventListener("input", () => this.clearError(this.inputRequester, this.errorName));
    this.selectCategory.addEventListener("change", () => this.clearError(this.selectCategory, this.errorCategory));
    this.selectPriority.addEventListener("change", () => this.clearError(this.selectPriority, this.errorPriority));
    this.inputDescription.addEventListener("input", () => this.clearError(this.inputDescription, this.errorDesc));

    // Filter controls
    const filterTriggers = [this.searchInput, this.filterStatus, this.filterPriority, this.filterCategory, this.filterTech, this.sortOrder];
    filterTriggers.forEach(el => el.addEventListener(el.tagName === "INPUT" ? "input" : "change", () => this.render()));

    // Modal triggers
    this.modalCloseBtn.addEventListener("click", () => this.closeModal());
    this.modal.addEventListener("click", (e) => {
      if (e.target === this.modal) this.closeModal();
    });

    this.btnUpdateStatus.addEventListener("click", () => this.handleStatusUpdate());
    this.noteForm.addEventListener("submit", (e) => this.handleNoteSubmit(e));
  }

  setError(input, label, message) {
    input.classList.add("is-invalid");
    label.textContent = message;
  }

  clearError(input, label) {
    input.classList.remove("is-invalid");
    label.textContent = "";
  }

  validateTicketInputs(requester, category, priority, description) {
    let valid = true;

    if (!requester || requester.length < 3) {
      this.setError(this.inputRequester, this.errorName, "Requester name must be at least 3 characters.");
      valid = false;
    } else {
      this.clearError(this.inputRequester, this.errorName);
    }

    if (!category) {
      this.setError(this.selectCategory, this.errorCategory, "Please select an IT category.");
      valid = false;
    } else {
      this.clearError(this.selectCategory, this.errorCategory);
    }

    if (!priority) {
      this.setError(this.selectPriority, this.errorPriority, "Please select a priority level.");
      valid = false;
    } else {
      this.clearError(this.selectPriority, this.errorPriority);
    }

    if (!description || description.length < 10) {
      this.setError(this.inputDescription, this.errorDesc, "Description must be at least 10 characters.");
      valid = false;
    } else {
      this.clearError(this.inputDescription, this.errorDesc);
    }

    return valid;
  }

  handleTicketSubmit(e) {
    e.preventDefault();

    const requester = this.inputRequester.value.trim();
    const category = this.selectCategory.value;
    const priority = this.selectPriority.value;
    const technician = this.selectTech.value;
    const description = this.inputDescription.value.trim();

    if (!this.validateTicketInputs(requester, category, priority, description)) {
      this.notify("Please fix highlighted form errors.", "alert-danger");
      return;
    }

    const newTicket = {
      id: StorageService.getNextId(this.tickets.length),
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
          author: "Help Desk Portal",
          text: "Ticket initialized and queued for triage.",
          date: new Date().toISOString()
        }
      ]
    };

    this.tickets.unshift(newTicket);
    StorageService.saveTickets(this.tickets);
    this.form.reset();

    this.notify(`Ticket ${newTicket.id} created successfully!`, "alert-success");
    this.render();
  }

  handleStatusUpdate() {
    const ticket = this.tickets.find(t => t.id === this.currentTicketId);
    if (!ticket) return;

    const targetStatus = this.modalNextStatus.value;
    const selectedTech = this.modalTechAssign.value;

    const check = WorkflowEngine.validateTransition(ticket.status, targetStatus, selectedTech);
    if (!check.valid) {
      this.modalNotify(check.message, "alert-danger");
      return;
    }

    const prevStatus = ticket.status;
    ticket.status = targetStatus;
    ticket.technician = selectedTech;

    if (targetStatus === "Resolved" && !ticket.resolvedAt) {
      ticket.resolvedAt = new Date().toISOString();
    } else if (targetStatus === "In Progress" && prevStatus === "Resolved") {
      ticket.resolvedAt = null;
    }

    ticket.notes.unshift({
      author: selectedTech || "IT Admin",
      text: `Status changed from '${prevStatus}' to '${targetStatus}'. Assigned: ${selectedTech || "Unassigned"}.`,
      date: new Date().toISOString()
    });

    StorageService.saveTickets(this.tickets);
    this.modalNotify(`Status successfully updated to '${targetStatus}'.`, "alert-success");
    this.populateModal(ticket);
    this.render();
  }

  handleNoteSubmit(e) {
    e.preventDefault();
    const ticket = this.tickets.find(t => t.id === this.currentTicketId);
    if (!ticket) return;

    const author = this.noteAuthor.value.trim();
    const text = this.noteText.value.trim();

    if (author.length < 2 || text.length < 3) {
      this.modalNotify("Author (>=2 chars) and Note (>=3 chars) are required.", "alert-danger");
      return;
    }

    ticket.notes.unshift({
      author,
      text,
      date: new Date().toISOString()
    });

    StorageService.saveTickets(this.tickets);
    this.noteText.value = "";
    this.renderNotes(ticket.notes);
  }

  openModal(id) {
    const ticket = this.tickets.find(t => t.id === id);
    if (!ticket) return;

    this.currentTicketId = id;
    this.populateModal(ticket);
    this.modalStatusAlert.classList.add("hidden");
    this.modal.classList.remove("hidden");
  }

  closeModal() {
    this.modal.classList.add("hidden");
    this.currentTicketId = null;
  }

  populateModal(ticket) {
    this.modalTicketId.textContent = ticket.id;
    this.modalTicketId.className = `badge badge-${ticket.priority.toLowerCase()}`;
    this.modalRequester.textContent = ticket.requester;
    this.modalCategory.textContent = ticket.category;
    this.modalPriority.textContent = ticket.priority;
    this.modalCreated.textContent = FormatUtils.formatDate(ticket.createdAt);
    this.modalStatus.innerHTML = `<span class="badge badge-${ticket.status.toLowerCase().replace(' ', '-')}">${ticket.status}</span>`;
    this.modalTurnaround.textContent = FormatUtils.calculateTurnaround(ticket.createdAt, ticket.resolvedAt);
    this.modalDescription.textContent = ticket.description;

    this.modalTechAssign.value = ticket.technician || "";
    this.modalNextStatus.value = ticket.status;

    this.renderNotes(ticket.notes);
  }

  renderNotes(notes) {
    if (!notes || notes.length === 0) {
      this.modalNotesFeed.innerHTML = `<p class="empty-state">No notes added yet.</p>`;
      return;
    }

    this.modalNotesFeed.innerHTML = notes.map(n => `
      <div class="note-bubble">
        <div class="note-meta">
          <strong>${FormatUtils.escapeHtml(n.author)}</strong>
          <span>${FormatUtils.formatDateTime(n.date)}</span>
        </div>
        <div class="note-text">${FormatUtils.escapeHtml(n.text)}</div>
      </div>
    `).join("");
  }

  render() {
    this.renderDashboard();
    this.renderTable();
  }

  renderDashboard() {
    this.metricTotal.textContent = this.tickets.length;
    this.metricUnassigned.textContent = this.tickets.filter(t => t.status === "Open" && (!t.technician || t.technician === "")).length;
    this.metricInProgress.textContent = this.tickets.filter(t => t.status === "In Progress").length;
    this.metricResolved.textContent = this.tickets.filter(t => t.status === "Resolved").length;
    this.metricClosed.textContent = this.tickets.filter(t => t.status === "Closed").length;
  }

  renderTable() {
    const query = this.searchInput.value.toLowerCase().trim();
    const statusVal = this.filterStatus.value;
    const priorityVal = this.filterPriority.value;
    const categoryVal = this.filterCategory.value;
    const techVal = this.filterTech.value;
    const sort = this.sortOrder.value;

    let list = this.tickets.filter(t => {
      const matchSearch = t.description.toLowerCase().includes(query) || t.id.toLowerCase().includes(query);
      const matchStatus = statusVal === "ALL" || t.status === statusVal;
      const matchPriority = priorityVal === "ALL" || t.priority === priorityVal;
      const matchCategory = categoryVal === "ALL" || t.category === categoryVal;
      
      let matchTech = true;
      if (techVal === "UNASSIGNED") {
        matchTech = !t.technician || t.technician === "";
      } else if (techVal !== "ALL") {
        matchTech = t.technician === techVal;
      }

      return matchSearch && matchStatus && matchPriority && matchCategory && matchTech;
    });

    list.sort((a, b) => {
      if (sort === "priority-desc") {
        return CONFIG.PRIORITY_RANKS[b.priority] - CONFIG.PRIORITY_RANKS[a.priority];
      }
      if (sort === "date-desc") {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      if (sort === "date-asc") {
        return new Date(a.createdAt) - new Date(b.createdAt);
      }
      return 0;
    });

    if (list.length === 0) {
      this.tableBody.innerHTML = `<tr><td colspan="8" class="text-center empty-state">No matching tickets found.</td></tr>`;
      return;
    }

    this.tableBody.innerHTML = list.map(t => `
      <tr>
        <td><strong>${t.id}</strong></td>
        <td>${FormatUtils.escapeHtml(t.requester)}</td>
        <td>${t.category}</td>
        <td><span class="badge badge-${t.priority.toLowerCase()}">${t.priority}</span></td>
        <td><span class="badge badge-${t.status.toLowerCase().replace(' ', '-')}">${t.status}</span></td>
        <td>${t.technician ? FormatUtils.escapeHtml(t.technician) : '<span style="color:var(--text-tertiary)">Unassigned</span>'}</td>
        <td>${FormatUtils.formatDate(t.createdAt)}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="app.openModal('${t.id}')">Manage</button>
        </td>
      </tr>
    `).join("");
  }

  notify(msg, type) {
    this.alertBanner.className = `alert-banner ${type}`;
    this.alertBanner.textContent = msg;
    this.alertBanner.classList.remove("hidden");
    setTimeout(() => this.alertBanner.classList.add("hidden"), 4000);
  }

  modalNotify(msg, type) {
    this.modalStatusAlert.className = `alert-banner ${type}`;
    this.modalStatusAlert.textContent = msg;
    this.modalStatusAlert.classList.remove("hidden");
    setTimeout(() => this.modalStatusAlert.classList.add("hidden"), 5000);
  }
}

// Global instance for inline button trigger
let app;
document.addEventListener("DOMContentLoaded", () => {
  app = new HelpDeskApp();
  app.start();
});