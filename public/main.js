(() => {
  "use strict";
  const sharedButtons=document.createElement("link");sharedButtons.rel="stylesheet";sharedButtons.href="css/button-visibility.css";document.head.appendChild(sharedButtons);
  const sidebar = document.getElementById("sidebar");
  const header = document.getElementById("header");
  const main = document.getElementById("main");
  const toggle = document.getElementById("header-toggle");
  const themeButton = document.getElementById("theme-button");
  toggle?.addEventListener("click", () => { sidebar?.classList.toggle("show-sidebar"); header?.classList.toggle("left-pd"); main?.classList.toggle("left-pd"); });
  document.querySelectorAll("#sidebar .sidebar__list a").forEach(link => { link.addEventListener("click", () => { document.querySelectorAll("#sidebar .sidebar__list a").forEach(item => item.classList.remove("active-link")); link.classList.add("active-link"); if (window.innerWidth <= 1024) { sidebar?.classList.remove("show-sidebar"); header?.classList.remove("left-pd"); main?.classList.remove("left-pd"); } }); });
  const darkTheme = "dark-theme";
  const savedTheme = localStorage.getItem("selected-theme");
  if (savedTheme === "dark") document.body.classList.add(darkTheme);
  const syncThemeButton=()=>{if(!themeButton)return;const dark=document.body.classList.contains(darkTheme);const icon=themeButton.querySelector("i");if(icon)icon.className=dark?"ri-sun-fill":"ri-moon-clear-fill";const label=themeButton.querySelector("span");if(label)label.textContent=dark?"Light Mode":"Dark Mode"};
  syncThemeButton();
  themeButton?.addEventListener("click", event => { event.preventDefault(); document.body.classList.toggle(darkTheme); localStorage.setItem("selected-theme", document.body.classList.contains(darkTheme) ? "dark" : "light"); syncThemeButton(); });
  document.getElementById("logout-btn")?.addEventListener("keydown", event => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); event.currentTarget.click(); } });

  // Employee profile: restore the Send Message complaint flow without changing the existing API.
  const messageTriggers=["emp-header-message-btn","emp-send-message-btn","emp-send-message-link"]
    .map(id=>document.getElementById(id)).filter(Boolean);
  if(messageTriggers.length){
    const token=localStorage.getItem("authToken");
    const getProfileValue=(index)=>document.querySelectorAll(".emp-profile-right .emp-info-item > div")[index]?.textContent?.trim()||"";
    const modal=document.createElement("div");
    modal.id="employee-message-modal";
    modal.innerHTML=`
      <div class="employee-message-backdrop">
        <section class="employee-message-box" role="dialog" aria-modal="true" aria-labelledby="employee-message-title">
          <div class="employee-message-head">
            <div><h2 id="employee-message-title">Message HR</h2><p>Submit a workplace complaint directly to HR.</p></div>
            <button type="button" class="employee-message-close" aria-label="Close">&times;</button>
          </div>
          <form id="employee-message-form">
            <div class="employee-message-grid">
              <label>Employee Name<input id="employee-message-name" name="employeeName" readonly></label>
              <label>Department<input id="employee-message-department" name="department" readonly></label>
              <label>Job Title<input id="employee-message-title-field" name="jobTitle" readonly></label>
              <label>Supervisor<input id="employee-message-supervisor" name="supervisor" readonly></label>
            </div>
            <label>Complaint Details<span>*</span><textarea name="complaintDetails" rows="5" required placeholder="Please explain your concern in as much detail as possible."></textarea></label>
            <label>How has this affected your ability to perform your job?<textarea name="jobImpact" rows="3"></textarea></label>
            <label>Possible solutions<textarea name="solutions" rows="3"></textarea></label>
            <label>Additional comments<textarea name="additionalComments" rows="3"></textarea></label>
            <label>Signature<input id="employee-message-signature" name="signature" readonly></label>
            <div class="employee-message-actions">
              <button type="button" class="employee-message-cancel">Cancel</button>
              <button type="submit" class="employee-message-submit">Send to HR</button>
            </div>
          </form>
        </section>
      </div>`;
    const style=document.createElement("style");
    style.textContent=`
      #employee-message-modal{position:fixed;inset:0;z-index:10000;display:none}
      #employee-message-modal.is-open{display:flex}
      .employee-message-backdrop{position:absolute;inset:0;background:rgba(15,20,30,.58);display:flex;align-items:center;justify-content:center;padding:18px}
      .employee-message-box{width:min(760px,100%);max-height:92vh;overflow:auto;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.22)}
      .employee-message-head{display:flex;justify-content:space-between;gap:18px;align-items:flex-start;padding:20px;border-bottom:1px solid #e4e7ed}
      .employee-message-head h2{margin:0 0 5px;font-size:1.25rem}.employee-message-head p{margin:0;color:#687482;font-size:.9rem}
      .employee-message-close{border:0;background:transparent;font-size:28px;line-height:1;cursor:pointer;color:#555}
      #employee-message-form{padding:20px;display:grid;gap:14px}#employee-message-form label{display:grid;gap:6px;font-weight:600;font-size:.9rem;color:#333}#employee-message-form label span{color:#b42318}
      .employee-message-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.employee-message-grid input,#employee-message-form input,#employee-message-form textarea{width:100%;box-sizing:border-box;border:1px solid #d7dce4;border-radius:8px;padding:10px;font:inherit;background:#fff}
      .employee-message-grid input{background:#f7f8fa}.employee-message-grid input:focus,#employee-message-form input:focus,#employee-message-form textarea:focus{outline:2px solid rgba(0,103,79,.18);border-color:#00674f}
      #employee-message-form textarea{resize:vertical;min-height:72px}.employee-message-actions{display:flex;justify-content:flex-end;gap:10px;padding-top:6px}
      .employee-message-cancel,.employee-message-submit{border:1px solid #d7dce4;border-radius:8px;padding:10px 16px;cursor:pointer;font-weight:700}.employee-message-cancel{background:#fff}.employee-message-submit{background:#00674f;color:#fff;border-color:#00674f}
      @media(max-width:700px){.employee-message-grid{grid-template-columns:1fr}.employee-message-backdrop{padding:10px}.employee-message-box{max-height:95vh}}
    `;
    document.head.appendChild(style);document.body.appendChild(modal);
    const form=modal.querySelector("#employee-message-form");
    const close=()=>modal.classList.remove("is-open");
    const open=(event)=>{
      event.preventDefault();event.stopImmediatePropagation();
      modal.querySelector("#employee-message-name").value=document.getElementById("emp-profile-name")?.textContent?.trim()||"";
      modal.querySelector("#employee-message-department").value=getProfileValue(3);
      modal.querySelector("#employee-message-title-field").value=getProfileValue(4);
      modal.querySelector("#employee-message-supervisor").value=getProfileValue(6);
      modal.querySelector("#employee-message-signature").value=modal.querySelector("#employee-message-name").value;
      modal.classList.add("is-open");
    };
    messageTriggers.forEach(button=>button.addEventListener("click",open));
    modal.querySelector(".employee-message-close")?.addEventListener("click",close);
    modal.querySelector(".employee-message-cancel")?.addEventListener("click",close);
    modal.querySelector(".employee-message-backdrop")?.addEventListener("click",event=>{if(event.target===event.currentTarget)close()});
    form?.addEventListener("submit",async event=>{
      event.preventDefault();
      if(!token){alert("Your session has expired. Please log in again.");return}
      if(!form.reportValidity())return;
      const data=Object.fromEntries(new FormData(form).entries());
      const submit=form.querySelector(".employee-message-submit");
      submit.disabled=true;submit.textContent="Sending...";
      try{
        const response=await fetch("/api/notifications",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${token}`},body:JSON.stringify({type:"complaint",title:`Complaint from ${data.employeeName||"Employee"}`,message:data.complaintDetails,payload:data})});
        const result=await response.json().catch(()=>({}));
        if(!response.ok)throw new Error(result.message||"Unable to send your message to HR");
        form.reset();close();alert("Your complaint has been sent to HR.");
      }catch(error){alert(error.message)}finally{submit.disabled=false;submit.textContent="Send to HR"}
    });
  }
})();
