let allRows = [];

const els = {
  dateFrom: document.getElementById("dateFrom"),
  dateTo: document.getElementById("dateTo"),
  repFilter: document.getElementById("repFilter"),
  nameSearch: document.getElementById("nameSearch"),
  clearFiltersBtn: document.getElementById("clearFiltersBtn"),
  logoutBtn: document.getElementById("logoutBtn"),
  tableBody: document.getElementById("tableBody"),
  resultsCount: document.getElementById("resultsCount"),
  cardTotalSales: document.getElementById("cardTotalSales"),
  cardMiniBox: document.getElementById("cardMiniBox"),
  cardBungalow: document.getElementById("cardBungalow"),
  cardDuplex: document.getElementById("cardDuplex"),
  cardWaitingSignature: document.getElementById("cardWaitingSignature"),
  cardWaitingPayment: document.getElementById("cardWaitingPayment")
};

async function init() {
  try {
    await loadData();
    populateRepFilter();
    bindEvents();
    render();
  } catch (error) {
    console.error("INIT ERROR:", error);
    alert("Dashboard failed to load. Open browser console for details.");
  }
}

async function loadData() {
  const res = await fetch("/api/data");
  const data = await res.json();

  console.log("RAW /api/data RESPONSE:", data);

  if (!res.ok) {
    throw new Error(data.message || "Failed to load /api/data");
  }

  const rows = Array.isArray(data.rows) ? data.rows : Array.isArray(data) ? data : [];
  console.log("ROWS BEFORE MAPPING:", rows);

  allRows = rows.map(mapRow);
  console.log("ROWS AFTER MAPPING:", allRows);
}

function mapRow(row) {
  return {
    status: getValue(row, ["Status", "status"]),
    firstName: getValue(row, ["First Name", "firstName", "First"]),
    lastName: getValue(row, ["Last Name", "lastName", "Last"]),
    salesRep: getValue(row, ["Sales Rep", "salesRep", "Rep"]),
    model: getValue(row, ["Model", "model"]),
    docsSent: getValue(row, ["Docs Sent", "docsSent"]),
    docsSigned: getValue(row, ["Docs Signed", "docsSigned"]),
    paymentReceived: getValue(row, ["Payment Received", "paymentReceived"]),

    // DATE FILTER NOW USES DOCS SENT
    filterDate: normalizeDate(getValue(row, ["Docs Sent", "docsSent"]))
  };
}

function getValue(obj, keys) {
  for (const key of keys) {
    if (obj && obj[key] != null) return String(obj[key]).trim();
  }
  return "";
}

function normalizeDate(value) {
  if (!value) return "";

  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const d = new Date(value);
  if (isNaN(d)) return "";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function populateRepFilter() {
  if (!els.repFilter) return;

  els.repFilter.innerHTML = `<option value="">All Reps</option>`;

  const reps = [...new Set(allRows.map(r => r.salesRep).filter(Boolean))].sort((a, b) => a.localeCompare(b));

  reps.forEach(rep => {
    const option = document.createElement("option");
    option.value = rep;
    option.textContent = rep;
    els.repFilter.appendChild(option);
  });
}

function bindEvents() {
  ["input", "change"].forEach(evt => {
    els.dateFrom?.addEventListener(evt, render);
    els.dateTo?.addEventListener(evt, render);
    els.repFilter?.addEventListener(evt, render);
    els.nameSearch?.addEventListener(evt, render);
  });

  els.clearFiltersBtn?.addEventListener("click", () => {
    if (els.dateFrom) els.dateFrom.value = "";
    if (els.dateTo) els.dateTo.value = "";
    if (els.repFilter) els.repFilter.value = "";
    if (els.nameSearch) els.nameSearch.value = "";
    render();
  });

  els.logoutBtn?.addEventListener("click", async () => {
    try {
      await fetch("/api/logout");
    } catch (e) {
      console.warn("Logout endpoint failed:", e);
    }
    window.location.href = "/";
  });
}

function getFilteredRows() {
  const from = els.dateFrom?.value || "";
  const to = els.dateTo?.value || "";
  const rep = (els.repFilter?.value || "").toLowerCase().trim();
  const search = (els.nameSearch?.value || "").toLowerCase().trim();

  return allRows.filter(row => {
    const rowDate = row.filterDate || "";
    const matchesFrom = !from || !rowDate || rowDate >= from;
    const matchesTo = !to || !rowDate || rowDate <= to;
    const matchesRep = !rep || row.salesRep.toLowerCase() === rep;
    const matchesSearch =
      !search ||
      row.firstName.toLowerCase().includes(search) ||
      row.lastName.toLowerCase().includes(search);

    return matchesFrom && matchesTo && matchesRep && matchesSearch;
  });
}

function render() {
  const rows = getFilteredRows();
  console.log("FILTERED ROWS:", rows);

  updateCards(rows);
  updateTable(rows);

  if (els.resultsCount) {
    els.resultsCount.textContent = `${rows.length} result${rows.length === 1 ? "" : "s"}`;
  }
}

function updateCards(rows) {
  if (els.cardTotalSales) els.cardTotalSales.textContent = rows.length;
  if (els.cardMiniBox) els.cardMiniBox.textContent = rows.filter(r => normalizeModel(r.model) === "minibox").length;
  if (els.cardBungalow) els.cardBungalow.textContent = rows.filter(r => normalizeModel(r.model) === "bungalow").length;
  if (els.cardDuplex) els.cardDuplex.textContent = rows.filter(r => normalizeModel(r.model) === "duplex").length;
  if (els.cardWaitingSignature) els.cardWaitingSignature.textContent = rows.filter(r => normalizeStatus(r.status).includes("waiting signature")).length;
  if (els.cardWaitingPayment) els.cardWaitingPayment.textContent = rows.filter(r => normalizeStatus(r.status).includes("waiting payment")).length;
}

function normalizeModel(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, "");
}

function normalizeStatus(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function statusClass(status) {
  const s = normalizeStatus(status);
  if (s.includes("waiting signature")) return "status-pill status-waiting-signature";
  if (s.includes("waiting payment")) return "status-pill status-waiting-payment";
  if (s.includes("completed")) return "status-pill status-completed";
  return "status-pill status-default";
}

function formatDisplayDate(value) {
  if (!value) return "";
  const d = new Date(value + "T00:00:00");
  if (isNaN(d)) return value;
  return `${d.getMonth() + 1}/${d.getDate()}/${String(d.getFullYear()).slice(-2)}`;
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function updateTable(rows) {
  if (!els.tableBody) return;

  els.tableBody.innerHTML = "";

  if (!rows.length) {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td colspan="9">No matching records found.</td>`;
    els.tableBody.appendChild(tr);
    return;
  }

  rows.forEach(row => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><span class="${statusClass(row.status)}">${escapeHtml(row.status)}</span></td>
      <td>${escapeHtml(row.firstName)}</td>
      <td>${escapeHtml(row.lastName)}</td>
      <td>${escapeHtml(row.salesRep)}</td>
      <td>${escapeHtml(row.model)}</td>
      <td>${escapeHtml(row.docsSent)}</td>
      <td>${escapeHtml(row.docsSigned)}</td>
      <td>${escapeHtml(row.paymentReceived)}</td>
      <td>${escapeHtml(formatDisplayDate(row.filterDate))}</td>
    `;
    els.tableBody.appendChild(tr);
  });
}

init();
