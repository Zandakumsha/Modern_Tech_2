(() => {
  "use strict";

  const getText = id => document.getElementById(id)?.textContent?.trim() || "—";
  const escapeHtml = value => String(value ?? "—").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));

  function moneyNumber(value) {
    const number = Number(String(value).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(number) ? number : 0;
  }

  function money(value) {
    return new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(moneyNumber(value));
  }

  function salaryData() {
    const baseRaw = getText("salary-value");
    const deductionsRaw = getText("deductions-value");
    const netRaw = getText("net-pay-value");
    const base = moneyNumber(baseRaw);
    const deductions = moneyNumber(deductionsRaw);
    const net = moneyNumber(netRaw);
    const earnings = base || (net ? net + deductions : 0);

    return {
      name: getText("emp-profile-name"),
      employeeId: getText("emp-info-id"),
      title: getText("emp-info-title"),
      department: getText("emp-info-department"),
      baseSalary: baseRaw === "—" ? "—" : money(baseRaw),
      hours: getText("hours-value"),
      deductions: deductionsRaw === "—" ? "—" : money(deductionsRaw),
      totalEarnings: earnings ? money(earnings) : "—",
      totalDeductions: deductionsRaw === "—" ? "—" : money(deductions),
      netPay: netRaw === "—" ? "—" : money(netRaw),
      period: new Date().toLocaleString("en-ZA", { month: "long", year: "numeric" }),
      generated: new Date().toLocaleDateString("en-ZA", { day: "2-digit", month: "long", year: "numeric" })
    };
  }

  function payslipMarkup(data) {
    const d = Object.fromEntries(Object.entries(data).map(([key, value]) => [key, escapeHtml(value)]));
    return `
      <section class="emp-payslip" id="employee-payslip">
        <div class="emp-payslip-top">
          <div class="emp-payslip-brand">MODERN TECH</div>
          <div class="emp-payslip-title"><h2>SALARY SLIP</h2><span>${d.period}</span></div>
          <div class="emp-payslip-confidential">CONFIDENTIAL</div>
        </div>
        <div class="emp-payslip-personal">
          <div class="emp-payslip-personal-col">
            <div><span>Name</span><b>${d.name}</b></div>
            <div><span>Employee ID</span><b>${d.employeeId}</b></div>
          </div>
          <div class="emp-payslip-personal-col">
            <div><span>Title</span><b>${d.title}</b></div>
            <div><span>Department</span><b>${d.department}</b></div>
          </div>
        </div>
        <div class="emp-payslip-table">
          <div class="emp-payslip-head"><b>Description</b><b>Earnings</b><b>Deductions</b></div>
          <div class="emp-payslip-row"><span>Basic Salary</span><span>${d.baseSalary}</span><span>—</span></div>
          <div class="emp-payslip-row"><span>Hours Worked</span><span>${d.hours}</span><span>—</span></div>
          <div class="emp-payslip-row emp-payslip-spacer"><span></span><span></span><span></span></div>
          <div class="emp-payslip-row"><span>Leave Deductions</span><span>—</span><span>${d.deductions}</span></div>
          <div class="emp-payslip-total"><b>Total</b><b>${d.totalEarnings}</b><b>${d.totalDeductions}</b></div>
        </div>
        <div class="emp-payslip-bottom">
          <div><span>Generated Date</span><b>${d.generated}</b></div>
          <div class="emp-payslip-net"><span>NET PAY</span><strong>${d.netPay}</strong></div>
        </div>
        <div class="emp-payslip-footer">Modern Tech • Employee Salary Information</div>
      </section>`;
  }

  function createSalaryPanel() {
    const card = [...document.querySelectorAll(".emp-files-col .emp-card")]
      .find(item => item.querySelector("h3")?.textContent.includes("Salary & Latest Payroll"));
    if (!card || document.getElementById("salary-info-actions")) return;

    const header = card.querySelector(".emp-card-hd");
    const actions = document.createElement("div");
    actions.id = "salary-info-actions";
    actions.className = "emp-salary-actions";
    actions.innerHTML = `
      <button type="button" class="emp-salary-btn emp-salary-view" id="view-salary-info-btn"><i class="ri-eye-line"></i> View Salary Info</button>
      <button type="button" class="emp-salary-btn emp-salary-download" id="download-salary-info-btn"><i class="ri-download-2-line"></i> Download</button>`;
    header?.append(actions);

    const modal = document.createElement("div");
    modal.className = "emp-modal";
    modal.id = "salary-info-modal";
    modal.style.display = "none";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.innerHTML = `
      <div class="emp-modal-box emp-salary-modal-box">
        <div class="emp-modal-head emp-salary-modal-head">
          <div><p class="emp-eyebrow"><i class="ri-money-rand-circle-line"></i> Salary Information</p><h2>Modern Tech Salary Slip</h2></div>
          <button type="button" class="emp-modal-close" id="close-salary-info-modal" aria-label="Close"><i class="ri-close-line"></i></button>
        </div>
        <div id="salary-slip-preview"></div>
        <div class="emp-salary-modal-actions"><button type="button" class="emp-salary-btn emp-salary-download" id="modal-download-salary-info-btn"><i class="ri-download-2-line"></i> Download Salary Slip</button></div>
      </div>`;
    document.body.append(modal);

    const renderPayslip = () => {
      const preview = document.getElementById("salary-slip-preview");
      if (preview) preview.innerHTML = payslipMarkup(salaryData());
    };

    document.getElementById("view-salary-info-btn")?.addEventListener("click", () => {
      renderPayslip();
      modal.style.display = "grid";
    });
    document.getElementById("close-salary-info-modal")?.addEventListener("click", () => modal.style.display = "none");
    modal.addEventListener("click", event => { if (event.target === modal) modal.style.display = "none"; });
    document.getElementById("download-salary-info-btn")?.addEventListener("click", downloadSalarySlip);
    document.getElementById("modal-download-salary-info-btn")?.addEventListener("click", downloadSalarySlip);
  }

  function downloadSalarySlip() {
    const data = salaryData();
    const safeName = String(data.name || "employee").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "employee";
    const html = `<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Modern Tech Salary Slip</title><style>
      body{margin:0;padding:24px;background:#f1f3f5;font-family:Arial,sans-serif;color:#1d252b}.emp-payslip{max-width:760px;margin:auto;background:#fff;border:2px solid #777;box-shadow:0 8px 24px rgba(0,0,0,.12)}.emp-payslip-top{display:grid;grid-template-columns:1fr 1.8fr 1.1fr;border-bottom:1px solid #555}.emp-payslip-brand,.emp-payslip-confidential{display:grid;place-items:center;padding:20px 10px;background:#52642a;color:#fff;font-weight:800;letter-spacing:.08em}.emp-payslip-confidential{background:#e9ecd9;color:#263116}.emp-payslip-title{text-align:center;padding:10px;border-left:1px solid #555;border-right:1px solid #555}.emp-payslip-title h2{margin:0;font-size:24px;letter-spacing:.06em}.emp-payslip-title span{display:block;margin-top:7px;font-weight:700}.emp-payslip-personal{display:grid;grid-template-columns:1fr 1fr}.emp-payslip-personal-col{padding:14px;border-bottom:1px solid #555}.emp-payslip-personal-col+div{border-left:1px solid #555}.emp-payslip-personal-col div{display:grid;grid-template-columns:120px 1fr;padding:5px 0}.emp-payslip-personal-col span:after{content:':';float:right;margin-right:10px}.emp-payslip-table{border-bottom:1px solid #555}.emp-payslip-head,.emp-payslip-row,.emp-payslip-total{display:grid;grid-template-columns:1.6fr .8fr .8fr}.emp-payslip-head>*{padding:7px 10px;background:#52642a;color:#fff;text-align:center;border-right:1px solid #444}.emp-payslip-row>*{padding:8px 10px;border-right:1px solid #aaa}.emp-payslip-row span:nth-child(2),.emp-payslip-row span:nth-child(3),.emp-payslip-total b:not(:first-child){text-align:right}.emp-payslip-spacer{min-height:90px}.emp-payslip-total>*{padding:7px 10px;border-top:1px solid #555;border-right:1px solid #555}.emp-payslip-total b:not(:first-child){font-size:17px}.emp-payslip-bottom{display:grid;grid-template-columns:1.5fr 1fr}.emp-payslip-bottom>div{padding:10px;border-right:1px solid #555}.emp-payslip-bottom span,.emp-payslip-bottom b{display:block}.emp-payslip-net{background:#52642a;color:#fff;text-align:center}.emp-payslip-net strong{display:block;margin-top:4px;padding:4px;background:#eef0dc;color:#273317;font-size:20px}.emp-payslip-footer{padding:9px;text-align:center;font-size:12px;color:#666}@media(max-width:600px){.emp-payslip-top,.emp-payslip-personal,.emp-payslip-bottom{grid-template-columns:1fr}.emp-payslip-title,.emp-payslip-personal-col+div{border-left:0}.emp-payslip-head,.emp-payslip-row,.emp-payslip-total{grid-template-columns:1.25fr .9fr .9fr}}
    </style></head><body>${payslipMarkup(data)}<script>window.onload=()=>window.print()<\/script></body></html>`;
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Modern-Tech-Salary-Slip-${safeName}.html`;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  document.addEventListener("DOMContentLoaded", createSalaryPanel);
})();
