/* ══════════════════════════════════════════════════
PERFORMANCE REVIEWS
Reuses the shared EMPLOYEES / loadData / avatarColor /
initials / stampClass / statusIcon / showToast helpers
defined in attendance-common.js.
══════════════════════════════════════════════════ */

let REVIEWS = [];
let selectedReviewId = null;
let reviewFilterStatus = "all";
let pendingScore = 0;

/* ── HTML escaping helper (prevents XSS from stored review data) ── */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str ?? "";
  return div.innerHTML;
}

async function loadReviewsFromApi() {
  try {
    const response = await fetch("/api/reviews");
    REVIEWS = await response.json();
    renderReviewHeader();
    renderReviewList();
  } catch (err) {
    console.error("Failed to load reviews:", err);
  }
}

function starsHtml(score, large = false) {
  if (score === null)
    return `<span style="font-size:11px;color:var(--muted);font-family:var(--font-mono)">Not scored</span>`;
  const full = Math.floor(score);
  const half = score - full >= 0.3;
  const sz = large ? "16px" : "13px";
  let h = "";
  for (let i = 1; i <= 5; i++) {
    const on = i <= full || (i === full + 1 && half);
    h += `<span class="s_star${on ? " s_on" : ""}" style="font-size:${sz}">★</span>`;
  }
  return h;
}

function populateReviewEmployeeDropdown() {
  const sel = document.getElementById("rv_employee");
  if (!sel) return;
  EMPLOYEES.forEach((e) => {
    const opt = document.createElement("option");
    opt.value = e.employeeId;
    opt.textContent = e.name;
    sel.appendChild(opt);
  });
}

function renderReviewHeader() {
  const scored = REVIEWS.filter((r) => r.score !== null);
  const avg = scored.length
  ? (scored.reduce((s, r) => s + r.score, 0) / scored.length).toFixed(1)
  : "—";
  document.getElementById("avgScore").textContent = avg;
  document.getElementById("reviewCount").textContent =
  `${REVIEWS.length} reviews`;
}

function renderReviewList() {
  const filtered =
  reviewFilterStatus === "all"
  ? REVIEWS
  : REVIEWS.filter(
    (r) =>
      r.status.toLowerCase().replace(/\s+/g, "-") === reviewFilterStatus,
  );
  
  const el = document.getElementById("reviewList");
  el.innerHTML = filtered
  .map((r) => {
    const emp = EMPLOYEES.find((e) => e.employeeId === r.employeeId) || {
      name: "Unknown",
    };
    const color = avatarColor(emp.name);
    const sel = r.id === selectedReviewId ? " s_selected" : "";
    return `
      <div class="s_review_card${sel}" data-id="${r.id}">
        <div class="s_avatar" style="background:${color}">${escapeHtml(initials(emp.name))}</div>
        <div class="s_review_card_body">
          <div class="s_review_card_name">${escapeHtml(emp.name)}</div>
          <div class="s_review_card_cycle">${escapeHtml(r.cycle)}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-top:6px">
            <div class="s_review_card_stars">${starsHtml(r.score)}</div>
            ${r.score !== null ? `<span class="s_review_card_score">${escapeHtml(String(r.score))}</span>` : ""}
          </div>
        </div>
        <span class="s_stamp s_notilt ${stampClass(r.status)}"><i class="${statusIcon(r.status)}"></i>${escapeHtml(r.status)}</span>
      </div>`;
  })
  .join("");
  
  el.querySelectorAll(".s_review_card").forEach((card) => {
    card.addEventListener("click", () => {
      selectedReviewId = Number(card.dataset.id);
      hideAddReviewForm();
      renderReviewList();
      renderReviewDetail();
    });
  });
}

function renderReviewDetail() {
  const rev = REVIEWS.find((r) => r.id === selectedReviewId);
  const empty = document.getElementById("detailEmpty");
  const content = document.getElementById("detailContent");
  if (!rev) {
    empty.classList.remove("s_hidden");
    content.classList.add("s_hidden");
    return;
  }
  empty.classList.add("s_hidden");
  content.classList.remove("s_hidden");
  
  const emp = EMPLOYEES.find((e) => e.employeeId === rev.employeeId) || {
    name: "Unknown",
  };
  const color = avatarColor(emp.name);
  const pct = rev.score ? ((rev.score / 5) * 100).toFixed(0) : 0;
  
  content.innerHTML = `
    <div class="s_detail_hd">
      <div style="display:flex;align-items:center;gap:12px">
        <div class="s_avatar s_avatar_lg" style="background:${color}">${escapeHtml(initials(emp.name))}</div>
        <div>
          <h3 class="s_detail_name">${escapeHtml(emp.name)}</h3>
          <div class="s_detail_manager">Manager: ${rev.manager ? escapeHtml(rev.manager) : "—"}</div>
        </div>
      </div>
      <span class="s_stamp s_notilt ${stampClass(rev.status)}"><i class="${statusIcon(rev.status)}"></i>${escapeHtml(rev.status)}</span>
    </div>
  
    <div class="s_detail_section">
      <p class="s_detail_section_label">Overall Score</p>
      <div class="s_score_row">
        <div class="s_score_stars">${starsHtml(rev.score, true)}</div>
        ${
  rev.score !== null
  ? `<span class="s_score_val">${escapeHtml(String(rev.score))}</span>
        <div class="s_score_bar_wrap"><div class="s_score_bar_fill" style="width:${pct}%"></div></div>`
  : ""
}
      </div>
    </div>

    ${
rev.comments
? `
    <div class="s_detail_section">
      <p class="s_detail_section_label">Manager Comments</p>
      <p class="s_detail_comments">"${escapeHtml(rev.comments)}"</p>
    </div>`
: ""
}

    ${
rev.strengths.length || rev.growth.length
? `
    <div class="s_detail_section">
      <div class="s_strengths_grid">
        <div>
          <p class="s_detail_section_label">Strengths</p>
          <ul class="s_bullet_list" style="--bullet-color:var(--present)">
            ${rev.strengths.map((s) => `<li>${escapeHtml(s)}</li>`).join("")}
          </ul>
        </div>
        <div>
          <p class="s_detail_section_label">Growth Areas</p>
          <ul class="s_bullet_list" style="--bullet-color:var(--ink)">
            ${rev.growth.map((g) => `<li>${escapeHtml(g)}</li>`).join("")}
          </ul>
        </div>
      </div>
    </div>`
: ""
}
  `;
}

/* ── Add review form ── */
function showAddReviewForm() {
  document.getElementById("addReviewForm").classList.remove("s_hidden");
  document.getElementById("detailContent").classList.add("s_hidden");
  document.getElementById("detailEmpty").classList.add("s_hidden");
  pendingScore = 0;
  updateReviewStarButtons();
}
function hideAddReviewForm() {
  document.getElementById("addReviewForm").classList.add("s_hidden");
  document.getElementById("rv_employee").value = "";
  document.getElementById("rv_cycle").value = "";
  document.getElementById("rv_status").value = "Pending";
  document.getElementById("rv_manager").value = "";
  document.getElementById("rv_comments").value = "";
  document.getElementById("rv_strengths").value = "";
  document.getElementById("rv_growth").value = "";
  document.getElementById("rv_error").style.display = "none";
  pendingScore = 0;
  updateReviewStarButtons();
}
function updateReviewStarButtons() {
  document.querySelectorAll("#starInput .s_star_btn").forEach((btn) => {
    btn.classList.toggle("s_on", Number(btn.dataset.val) <= pendingScore);
  });
}

async function submitReviewForm() {
  const empId = Number(document.getElementById("rv_employee").value);
  const cycle = document.getElementById("rv_cycle").value.trim();
  const status = document.getElementById("rv_status").value;
  const manager = document.getElementById("rv_manager").value.trim();
  const comments = document.getElementById("rv_comments").value.trim();
  const strengths = document.getElementById("rv_strengths").value.split(",").map((s) => s.trim()).filter(Boolean);
  const growth = document.getElementById("rv_growth").value.split(",").map((s) => s.trim()).filter(Boolean);
  
  const errEl = document.getElementById("rv_error");
  
  if (!empId) {
    errEl.textContent = "Please select an employee.";
    errEl.style.display = "block";
    return;
  }
  if (!cycle) {
    errEl.textContent = "Please enter a review cycle.";
    errEl.style.display = "block";
    return;
  }
  errEl.style.display = "none";
  
  const reviewPayload = {
    employeeId: empId,
    cycle,
    status,
    score: pendingScore > 0 ? pendingScore : null,
    manager,
    comments,
    strengths,
    growth,
  };
  
  try {
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(reviewPayload),
    });
    
    if (res.ok) {
      hideAddReviewForm();
      await loadReviewsFromApi();
      showToast("Review added successfully");
    } else {
      errEl.textContent = "Couldn't save the review. Please try again.";
      errEl.style.display = "block";
    }
  } catch (err) {
    console.error("Error submitting review:", err);
    errEl.textContent = "Network error — please check your connection and try again.";
    errEl.style.display = "block";
  }
}



/* ── Filter chips ── */
function wireReviewFilterChips() {
  document
  .getElementById("reviewFilterChips")
  .querySelectorAll(".s_filter_chip")
  .forEach((btn) => {
    btn.addEventListener("click", () => {
      reviewFilterStatus = btn.dataset.filter;
      document
      .querySelectorAll("#reviewFilterChips .s_filter_chip")
      .forEach((b) => b.classList.remove("s_active"));
      btn.classList.add("s_active");
      renderReviewList();
    });
  });
}

/* ── Star input ── */
function wireReviewStarInput() {
  document
  .getElementById("starInput")
  .querySelectorAll(".s_star_btn")
  .forEach((btn) => {
    btn.addEventListener("mouseover", () => {
      document
      .querySelectorAll("#starInput .s_star_btn")
      .forEach((b) =>
        b.classList.toggle(
        "s_on",
        Number(b.dataset.val) <= Number(btn.dataset.val),
      ),
    );
  });
  btn.addEventListener("mouseleave", updateReviewStarButtons);
  btn.addEventListener("click", () => {
    pendingScore = Number(btn.dataset.val);
    updateReviewStarButtons();
  });
});
}

/* ── Boot (Reviews page) ── */
(async function initReviewsPage() {
  if (!document.getElementById("reviewList")) return; // not the reviews page
  
  document.documentElement.style.setProperty(
    "--noise-uri",
    buildNoiseDataUri(),
  );
  
  wireReviewFilterChips();
  wireReviewStarInput();
  const openAddBtn = document.getElementById("openAddBtn");
  if (openAddBtn) openAddBtn.addEventListener("click", showAddReviewForm);
  const rvSubmit = document.getElementById("rv_submit");
  if (rvSubmit) rvSubmit.addEventListener("click", submitReviewForm);
  const rvCancel = document.getElementById("rv_cancel");
  if (rvCancel)
    rvCancel.addEventListener("click", () => {
    hideAddReviewForm();
    renderReviewDetail();
  });
  
  try {
    await loadData();
    
    populateReviewEmployeeDropdown();
    await loadReviewsFromApi();
  } catch (err) {
    console.error(err);
    showLoadError(err);
  }
  
})();