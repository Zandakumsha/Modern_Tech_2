// Modern Tech - Employees Data backed by Express/MySQL
(() => {
  "use strict";
  const table = document.getElementById("employeeTable");
  if (!table) return;
  const API = "/api/employees";
  let allEmployees = [];

  async function api(url, options = {}) {
    const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
    const token = localStorage.getItem("authToken");
    if (token) headers.Authorization = `Bearer ${token}`;
    const response = await fetch(url, { ...options, headers });
    const type = response.headers.get("content-type") || "";
    const data = type.includes("application/json") ? await response.json() : null;
    if (response.status === 401) {
      sessionStorage.clear(); localStorage.removeItem("authToken"); window.location.href = "login.html"; throw new Error("Session expired");
    }
    if (!response.ok) throw new Error(data?.message || `Request failed (${response.status})`);
    return data;
  }

  function toast(message, type = "success") {
    const el = document.getElementById("toast"); const msg = document.getElementById("toast-message");
    if (!el || !msg) return alert(message);
    msg.textContent = message; el.className = type; el.style.display = "block";
    setTimeout(() => { el.style.display = "none"; }, 2500);
  }

  function render(list) {
    table.innerHTML = list.length ? list.map(e => `<tr>
      <td>${escapeHtml(e.name)}</td><td>${escapeHtml(e.position)}</td><td>${escapeHtml(e.department)}</td>
      <td>R${Number(e.salary || 0).toLocaleString()}</td><td>${escapeHtml(e.contact)}</td>
      <td><button data-id="${e.employeeId}">View</button></td></tr>`).join("") : `<tr><td colspan="6">No employees found</td></tr>`;
    const count = document.getElementById("n-resultsCount"); if (count) count.textContent = `Showing ${list.length} of ${allEmployees.length} employees`;
  }

  function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }

  function filter() {
    const search = (document.getElementById("searchName")?.value || "").toLowerCase();
    const department = document.getElementById("n-departmentFilter")?.value || "All Departments";
    render(allEmployees.filter(e => e.name.toLowerCase().includes(search) && (department === "All Departments" || e.department === department)));
  }

  function fillModal(e) {
    document.getElementById("n-modalName").textContent = e.name;
    document.getElementById("n-modalId").textContent = `Employee ID: ${e.employeeId}`;
    document.getElementById("n-modalContact").textContent = `Email: ${e.contact}`;
    document.getElementById("n-modalPosition").textContent = `Position: ${e.position}`;
    document.getElementById("n-modalDepartment").textContent = `Department: ${e.department}`;
    document.getElementById("n-modalHistory").textContent = `History: ${e.employmentHistory || "Not recorded"}`;
    document.getElementById("n-modalSalary").textContent = `Salary: R${Number(e.salary || 0).toLocaleString()}`;
    document.getElementById("deleteEmployee").dataset.id = e.employeeId;
    document.getElementById("n-viewModal").classList.add("active");
  }

  async function saveEmployee() {
    const id = document.getElementById("deleteEmployee").dataset.id;
    const body = {
      name: document.getElementById("edit-name").value.trim(),
      contact: document.getElementById("edit-contact").value.trim(),
      position: document.getElementById("edit-position").value.trim(),
      department: document.getElementById("edit-department").value.trim(),
      employmentHistory: document.getElementById("edit-history").value.trim(),
      salary: Number(document.getElementById("edit-salary").value),
    };
    if (!body.name || !body.contact || !body.position || !body.department || !Number.isFinite(body.salary) || body.salary <= 0) return alert("Please complete all required fields with a valid salary.");
    try {
      const data = await api(id === "new" ? API : `${API}/${id}`, { method: id === "new" ? "POST" : "PUT", body: JSON.stringify(body) });
      const employee = data.employee;
      if (id === "new") allEmployees.push(employee); else allEmployees = allEmployees.map(e => String(e.employeeId) === String(id) ? employee : e);
      filter(); document.getElementById("n-viewModal").classList.remove("active"); toast("Employee saved successfully.");
    } catch (error) { toast(error.message, "error"); }
  }

  document.getElementById("searchName")?.addEventListener("input", filter);
  document.getElementById("n-departmentFilter")?.addEventListener("change", filter);
  document.getElementById("n-closeModal")?.addEventListener("click", () => document.getElementById("n-viewModal").classList.remove("active"));
  table.addEventListener("click", event => { const button = event.target.closest("button[data-id]"); if (!button) return; const e = allEmployees.find(x => String(x.employeeId) === button.dataset.id); if (e) fillModal(e); });

  document.getElementById("deleteEmployee")?.addEventListener("click", async function () {
    const id = this.dataset.id; if (!id || id === "new" || !confirm("Are you sure you want to delete this employee?")) return;
    try { await api(`${API}/${id}`, { method: "DELETE" }); allEmployees = allEmployees.filter(e => String(e.employeeId) !== String(id)); filter(); document.getElementById("n-viewModal").classList.remove("active"); toast("Employee deleted successfully."); }
    catch (error) { toast(error.message, "error"); }
  });

  document.getElementById("editEmployee")?.addEventListener("click", function () {
    const e = allEmployees.find(x => String(x.employeeId) === String(document.getElementById("deleteEmployee").dataset.id)); if (!e) return;
    ["name","contact","position","department","history","salary"].forEach(k => { const el = document.getElementById(`edit-${k}`); if (el) el.value = k === "salary" ? e.salary : (k === "history" ? e.employmentHistory || "" : e[k] || ""); });
    document.querySelector("#n-editForm h3").textContent = "Edit Employee"; document.getElementById("n-viewDetails").style.display = "none"; document.getElementById("n-editForm").style.display = "block";
  });

  document.getElementById("cancelEdit")?.addEventListener("click", () => { document.getElementById("n-editForm").style.display = "none"; document.getElementById("n-viewDetails").style.display = "block"; if (document.getElementById("deleteEmployee").dataset.id === "new") document.getElementById("n-viewModal").classList.remove("active"); });
  document.getElementById("saveEmployee")?.addEventListener("click", saveEmployee);
  document.getElementById("n-addEmployee")?.addEventListener("click", () => {
    ["name","contact","position","history","salary"].forEach(k => { const el = document.getElementById(`edit-${k}`); if (el) el.value = ""; });
    document.getElementById("edit-department").selectedIndex = 0; document.getElementById("deleteEmployee").dataset.id = "new";
    document.querySelector("#n-editForm h3").textContent = "Add Employee"; document.getElementById("n-viewDetails").style.display = "none"; document.getElementById("n-editForm").style.display = "block"; document.getElementById("n-viewModal").classList.add("active");
  });

  async function load() {
    try { const data = await api(API, { cache: "no-store" }); allEmployees = data.employees || []; render(allEmployees); }
    catch (error) { console.error(error); toast(error.message, "error"); }
  }
  load();
})();
