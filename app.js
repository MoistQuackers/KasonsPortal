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
  await loadData();
  populateRepFilter();
  bindEvents();
  render();
}

async function loadData() {
  const res = await fetch("/api/data");

  if (res.status === 401) {
    window.location.href = "/";
    return;
  }

  const data = await res.json();

  if (!res.ok || !data.ok) {
    alert("Unable to load portal data.");
    return;
  }

  allRows = Array.isArray(data.rows) ? data.rows.map(mapRow) : [];
}

function mapRow(row) {
  return {
    status: String(row["Status"] || "").trim(),
    firstName: String(row["First Name"] || "").trim(),
    lastName: String(row["Last Name"] || "").trim(),
    salesRep: String(row["Sales Rep"] || "").trim(),
    model: String(row["Model"] || "").trim(),
    docsSent: String(row["Docs Sent"] || "").trim(),
    docsSigned: String(row["Docs Signed"] || "").trim(),
    paymentReceived: String(row["Payment Received"] || "").trim(),
    startDate: normalizeDate(row["Start Date"] || "")
  };
}

function normalizeDate(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;

  const d = new Date(value);
  if (isNaN(d)) return "";

  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function populateRepFilter() {
  const reps = [...new Set(allRows.map(r => r.salesRep).filter(Boolean))].sort((a, b) => a.localeCompare(b));
  reps.forEach(rep => {
    const option = document.createElement("option");
    option.value = rep;
    option.textContent = rep;
    els.repFilter.appendChild(option);
  });
}

function bindEvents() {
  ["change", "input"].forEach(evt => {
    els.dateFrom?.addEventListener(evt, render);
    els.dateTo?.addEventListener(evt, render);
    els.repFilter?.addEventListener(evt, render);
    els.nameSearch?.addEventListener(evt, render);
  });

  els.clearFiltersBtn?.addEventListener("click", () => {
    els.dateFrom.value = "";
    els.dateTo.value = "";
    els.repFilter.value = "";
    els.nameSearch.value = "";
    render();
  });

  els.logoutBtn?.addEventListener("click", async () => {
    await fetch("/api/logout");
    window.location.href = "/";
  });
}

function getFilteredRows() {
  const from = els.dateFrom.value;
  const to = els.dateTo.value;
  const rep = els.repFilter.value.toLowerCase().trim();
  const search = els.nameSearch.value.toLowerCase().trim();

  return allRows.filter(row => {
    const rowDate = row.startDate || "";
    const matchesFrom = !from || (rowDate && rowDate >= from);
    const matchesTo = !to || (rowDate && rowDate <= to);
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
  updateCards(rows);
  updateTable(rows);
  els.resultsCount.textContent = `${rows.length} result${rows.length === 1 ? "" : "s"}`;
}

function updateCards(rows) {
  els.cardTotalSales.textContent = rows.length;
  els.cardMiniBox.textContent = rows.filter(r => normalizeModel(r.model) === "minibox").length;
  els.cardBungalow.textContent = rows.filter(r => normalizeModel(r.model) === "bungalow").length;
  els.cardDuplex.textContent = rows.filter(r => normalizeModel(r.model) === "duplex").length;
  els.cardWaitingSignature.textContent = rows.filter(r => normalizeStatus(r.status).includes("waiting signature")).length;
  els.cardWaitingPayment.textContent = rows.filter(r => normalizeStatus(r.status).includes("waiting payment")).length;
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
      <td>${escapeHtml(formatDisplayDate(row.startDate))}</td>
    `;
    els.tableBody.appendChild(tr);
  });
}

init();
