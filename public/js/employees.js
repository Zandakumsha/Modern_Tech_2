// ==== Nonhlanhla's Employee Data functionality====
// Guarded so this Employees Data page code doesn't run (and crash) on other
// pages like calendar.html, which don't have an #employeeTable element.
if (document.getElementById("employeeTable")) {
  let allEmployees = [];
  // Loads employee data — checks localStorage first, falls back to the JSON file
  function loadEmployeeData() {
    let savedData = localStorage.getItem("employees");

    if (savedData) {
      // We have data saved from before — use that instead of fetching
      allEmployees = JSON.parse(savedData);
      showTable(allEmployees);
      return;
    }

    // No saved data yet — this must be the first time, so fetch the starting data
    fetch("employee_info.json")
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        allEmployees = data.employeeInformation;
        saveToLocalStorage();
        showTable(allEmployees);
      });
  }

  // Saves the current employee list to the browser's storage
  function saveToLocalStorage() {
    localStorage.setItem("employees", JSON.stringify(allEmployees));
  }

  loadEmployeeData();

  // Renders the employee table from an array of employees
  function showTable(employees) {
    let table = document.getElementById("employeeTable");
    table.innerHTML = "";

    for (let i = 0; i < employees.length; i++) {
      let tableRow = document.createElement("tr");
      tableRow.innerHTML = `
      <td>${employees[i].name}</td>
      <td>${employees[i].position}</td>
      <td>${employees[i].department}</td>
      <td>R${employees[i].salary.toLocaleString()}</td>
      <td>${employees[i].contact}</td>
      <td><button data-id="${employees[i].employeeId}">View</button></td>`;
      table.appendChild(tableRow);
    }

    if (employees.length === 0) {
      let emptyRow = document.createElement("tr");
      emptyRow.innerHTML = `<td colspan="6">No employees found</td>`;
      table.appendChild(emptyRow);
    }

    updateResultsCount(employees);
  }

  // Updates the results count text when HR staff searches or filters
  function updateResultsCount(employees) {
    document.getElementById("n-resultsCount").textContent =
      "Showing " +
      employees.length +
      " of " +
      allEmployees.length +
      " employees";
  }

  // Filters employees based on both search and department inputs
  function filterEmployees() {
    let searchValue = document.getElementById("searchName").value.toLowerCase();
    let selectedDepartment =
      document.getElementById("n-departmentFilter").value;

    let filtered = allEmployees.filter(function (employee) {
      let matchesName = employee.name.toLowerCase().includes(searchValue);
      let matchesDepartment =
        selectedDepartment === "All Departments" ||
        employee.department === selectedDepartment;
      return matchesName && matchesDepartment;
    });

    showTable(filtered);
  }

  // Search event listener
  document.getElementById("searchName").addEventListener("input", function () {
    filterEmployees();
  });

  // Department filter event listener
  document
    .getElementById("n-departmentFilter")
    .addEventListener("change", function () {
      filterEmployees();
    });

  // Modal JavaScript — listen for clicks inside the tbody
  document
    .getElementById("employeeTable")
    .addEventListener("click", function (event) {
      if (event.target.tagName === "BUTTON") {
        let employeeId = parseInt(event.target.getAttribute("data-id"));

        let employee = allEmployees.find(function (emp) {
          return emp.employeeId === employeeId;
        });

        // Safety check — stop if employee not found
        if (!employee) return;

        document.getElementById("n-modalName").textContent = employee.name;
        document.getElementById("n-modalId").textContent =
          "Employee ID: " + employee.employeeId;
        document.getElementById("n-modalContact").textContent =
          "Email: " + employee.contact;
        document.getElementById("n-modalPosition").textContent =
          "Position: " + employee.position;
        document.getElementById("n-modalDepartment").textContent =
          "Department: " + employee.department;
        document.getElementById("n-modalHistory").textContent =
          "History: " + employee.employmentHistory;
        document.getElementById("n-modalSalary").textContent =
          "Salary: R" + employee.salary.toLocaleString();

        document
          .getElementById("deleteEmployee")
          .setAttribute("data-id", employee.employeeId);

        document.getElementById("n-viewModal").classList.add("active");
      }
    });

  // Close modal
  document
    .getElementById("n-closeModal")
    .addEventListener("click", function () {
      document.getElementById("n-editForm").style.display = "none";
      document.getElementById("n-viewDetails").style.display = "block";
      document.getElementById("n-viewModal").classList.remove("active");
    });

  // Delete employee
  document
    .getElementById("deleteEmployee")
    .addEventListener("click", function () {
      let employeeId = parseInt(this.getAttribute("data-id"));

      if (confirm("Are you sure you want to delete this employee?")) {
        allEmployees = allEmployees.filter(function (emp) {
          return emp.employeeId !== employeeId;
        });

        saveToLocalStorage();
        filterEmployees();
        document.getElementById("n-viewModal").classList.remove("active");
        showToast("Employee deleted successfully.", "success");
      }
    });

  // Edit button — switch to edit mode
  document
    .getElementById("editEmployee")
    .addEventListener("click", function () {
      let employeeId = parseInt(
        document.getElementById("deleteEmployee").getAttribute("data-id"),
      );

      let employee = allEmployees.find(function (emp) {
        return emp.employeeId === employeeId;
      });

      // Pre-fill the form with current data
      document.getElementById("edit-name").value = employee.name;
      document.getElementById("edit-contact").value = employee.contact;
      document.getElementById("edit-position").value = employee.position;
      document.getElementById("edit-department").value = employee.department;
      document.getElementById("edit-history").value =
        employee.employmentHistory;
      document.getElementById("edit-salary").value = employee.salary;

      // Hide details, show form
      document.getElementById("n-viewDetails").style.display = "none";
      document.getElementById("n-editForm").style.display = "block";
    });

  // Cancel edit — behaviour depends on whether adding or editing
  document.getElementById("cancelEdit").addEventListener("click", function () {
    let employeeId = document
      .getElementById("deleteEmployee")
      .getAttribute("data-id");

    if (employeeId === "new") {
      // If adding, just close the modal entirely
      document.getElementById("n-editForm").style.display = "none";
      document.getElementById("n-viewDetails").style.display = "block";
      document.getElementById("n-viewModal").classList.remove("active");
    } else {
      // If editing, go back to view details
      document.getElementById("n-editForm").style.display = "none";
      document.getElementById("n-viewDetails").style.display = "block";
    }
  });

  // Save employee — handles both adding and editing
  document
    .getElementById("saveEmployee")
    .addEventListener("click", function () {
      // Validation — check required fields
      let name = document.getElementById("edit-name").value.trim();
      let contact = document.getElementById("edit-contact").value.trim();
      let position = document.getElementById("edit-position").value.trim();
      let department = document.getElementById("edit-department").value.trim();
      let salary = parseFloat(document.getElementById("edit-salary").value);
      let history = document.getElementById("edit-history").value.trim();

      if (
        name === "" ||
        contact === "" ||
        position === "" ||
        department === ""
      ) {
        alert("Please fill in all required fields.");
        return;
      }

      if (!contact.includes("@")) {
        alert("Please enter a valid email address.");
        return;
      }

      if (isNaN(salary) || salary <= 0) {
        alert("Please enter a valid salary greater than 0.");
        return;
      }

      let employeeId = document
        .getElementById("deleteEmployee")
        .getAttribute("data-id");

      if (employeeId === "new") {
        // Generate a unique ID — finds the highest existing ID and adds 1
        let highestId = 0;
        if (allEmployees.length > 0) {
          highestId = Math.max(
            ...allEmployees.map(function (emp) {
              return emp.employeeId;
            }),
          );
        }

        let newEmployee = {
          employeeId: highestId + 1,
          name,
          contact,
          position,
          department,
          employmentHistory: history,
          salary,
        };
        allEmployees.push(newEmployee);
      } else {
        // Update existing employee — reuse validated variables
        employeeId = parseInt(employeeId);
        allEmployees = allEmployees.map(function (emp) {
          if (emp.employeeId === employeeId) {
            return {
              employeeId: emp.employeeId,
              name,
              contact,
              position,
              department,
              employmentHistory: history,
              salary,
            };
          }
          return emp;
        });
      }

      saveToLocalStorage();

      // Re-render while keeping active search/filter
      filterEmployees();

      showToast("Employee saved successfully.", "success");

      // Reset form title and close modal
      document.querySelector("#n-editForm h3").textContent = "Edit Employee";
      document.getElementById("n-editForm").style.display = "none";
      document.getElementById("n-viewDetails").style.display = "block";
      document.getElementById("n-viewModal").classList.remove("active");
    });

  // Add employee button

  document
    .getElementById("n-addEmployee")
    .addEventListener("click", function () {
      // Clear all form fields
      document.getElementById("edit-name").value = "";
      document.getElementById("edit-contact").value = "";
      document.getElementById("edit-position").value = "";
      document.getElementById("edit-department").value = "";
      document.getElementById("edit-history").value = "";
      document.getElementById("edit-salary").value = "";

      // Change form title to Add Employee
      document.querySelector("#n-editForm h3").textContent = "Add Employee";

      // Hide view details, show edit form
      document.getElementById("n-viewDetails").style.display = "none";
      document.getElementById("n-editForm").style.display = "block";

      // Show the modal
      document.getElementById("n-viewModal").classList.add("active");

      // Mark as add mode
      document.getElementById("deleteEmployee").setAttribute("data-id", "new");

      document.getElementById("n-modalName").textContent = "";
    });

  // Shows a small popup message in the corner, then hides it after 3 seconds
  function showToast(message, type) {
    let toast = document.getElementById("toast");
    let toastMessage = document.getElementById("toast-message");

    toastMessage.textContent = message;
    toast.className = type;
    toast.style.display = "block";

    setTimeout(function () {
      toast.style.display = "none";
    }, 3000);
  }
} // end Employees Data page guard
