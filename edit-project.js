

const API_ENDPOINT =
    "https://script.google.com/macros/s/AKfycbx-EpYEKrF5rZcE-GUMr_MXEMkzpK6XhG57WMve2KXfqPUaJ2DjBiTmcjpHRzZVo44/exec";

const VALIDATION_RULES = {
    title: {
        required: true,
        minLength: 3,
        maxLength: 100,
        message: "Project title must be between 3 and 100 characters",
    },
    team: {
        required: true,
        minLength: 2,
        maxLength: 200,
        message: "Team members field must be between 2 and 200 characters",
    },
    email: {
        required: true,
        pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        message: "Please enter a valid email address",
    },
    description: {
        required: true,
        minLength: 10,
        maxLength: 1000,
        message: "Description must be between 10 and 1000 characters",
    },
    link: {
        required: false,
        pattern: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([\/\w .-]*)*\/?$/,
        message: "Please enter a valid URL",
    },
};

// ===========================
// DOM Elements
// ===========================

// Search Section
const searchForm = document.getElementById("search-form");
const searchIdInput = document.getElementById("search-id");
const searchBtn = document.getElementById("search-btn");
const searchErrorAlert = document.getElementById("search-error");
const searchErrorMessage = document.getElementById("search-error-message");
const editFormContainer = document.getElementById("edit-form-container");

// Edit Form Section
const form = document.getElementById("project-form");
const projectIdHidden = document.getElementById("project-id");
const submitBtn = document.getElementById("submit-btn");
const successAlert = document.getElementById("success-alert");
const errorAlert = document.getElementById("error-alert");
const successMessage = document.getElementById("success-message");
const errorMessage = document.getElementById("error-message");

const teamMembersContainer = document.getElementById("team-members-container");
const addMemberBtn = document.getElementById("add-member-btn");

const formFields = {
    title: document.getElementById("title"),
    team: document.getElementById("team"),
    email: document.getElementById("email"),
    description: document.getElementById("description"),
    link: document.getElementById("link"),
    status: document.getElementById("status"),
};

let memberCount = 0;

// ===========================
// Fetching Data Logic
// ===========================

function showSearchError(msg) {
    searchErrorMessage.textContent = msg;
    searchErrorAlert.classList.add("visible");
    editFormContainer.style.display = "none";
}

function hideSearchError() {
    searchErrorAlert.classList.remove("visible");
}

function setSearchLoading(isLoading) {
    searchBtn.disabled = isLoading;
    searchIdInput.disabled = isLoading;

    if (isLoading) searchBtn.classList.add("loading");
    else searchBtn.classList.remove("loading");
}

async function fetchProjectData(id) {
    hideSearchError();
    setSearchLoading(true);

    try {
        const url = `${API_ENDPOINT}?id=${encodeURIComponent(id)}`;
        const response = await fetch(url);

        if (!response.ok) throw new Error("Failed to fetch project.");

        const result = await response.json();

        if (result && result.error) {
            showSearchError(result.error);
            return;
        }

        if (result && result.id) {
            populateForm(result);
            editFormContainer.style.display = "block";
            editFormContainer.scrollIntoView({ behavior: "smooth" });
        } else {
            showSearchError(`Project with ID "${id}" not found.`);
        }
    } catch (err) {
        console.error(err);
        showSearchError("Error fetching data. Please check your internet connection.");
    } finally {
        setSearchLoading(false);
    }
}

function populateForm(project) {
    // 1) Set simple fields
    projectIdHidden.value = project.id ?? "";
    formFields.title.value = project.title || "";
    formFields.email.value = project.email || "";
    formFields.description.value = project.description || "";
    formFields.link.value = project.link || "";
    formFields.status.value = project.status || "Not Started";

    // 2) Team members UI
    teamMembersContainer.innerHTML = "";
    memberCount = 0;

    const members = (project.team || "")
        .split(",")
        .map((m) => m.trim())
        .filter((m) => m);

    if (members.length === 0) addTeamMember("");
    else members.forEach((m) => addTeamMember(m));

    updateTeamField();
}

// ===========================
// Team Members Management
// ===========================

function updateTeamField() {
    const memberInputs = document.querySelectorAll(".team-member-input");
    const members = Array.from(memberInputs)
        .map((input) => input.value.trim())
        .filter((value) => value !== "");

    formFields.team.value = members.join(", ");
    updateRemoveButtons();
}

function updateRemoveButtons() {
    const removeButtons = document.querySelectorAll(".btn-remove-member");
    const shouldDisable = removeButtons.length <= 1;
    removeButtons.forEach((btn) => (btn.disabled = shouldDisable));
}

function addTeamMember(value = "") {
    const newMemberGroup = document.createElement("div");
    newMemberGroup.className = "team-member-input-group";

    newMemberGroup.innerHTML = `
    <input
      type="text"
      class="form-input team-member-input"
      placeholder="e.g., Fatima"
      value="${escapeHtml(value)}"
      data-member-index="${memberCount}"
    />
    <button type="button" class="btn-remove-member" aria-label="Remove member">
      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
        <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
      </svg>
    </button>
  `;

    teamMembersContainer.appendChild(newMemberGroup);
    memberCount++;

    const newInput = newMemberGroup.querySelector(".team-member-input");
    const newRemoveBtn = newMemberGroup.querySelector(".btn-remove-member");

    newInput.addEventListener("input", updateTeamField);
    newRemoveBtn.addEventListener("click", () => removeTeamMember(newMemberGroup));

    updateRemoveButtons();
}

function removeTeamMember(memberGroup) {
    if (teamMembersContainer.children.length > 1) {
        memberGroup.remove();
        updateTeamField();
        updateRemoveButtons();
    }
}

function escapeHtml(str) {
    return String(str)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ===========================
// Validation
// ===========================

function validateField(fieldName, value) {
    const rules = VALIDATION_RULES[fieldName];
    if (!rules) return { isValid: true, error: "" };

    const v = (value || "").trim();

    if (rules.required && !v) {
        return {
            isValid: false,
            error: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`,
        };
    }

    if (!rules.required && !v) return { isValid: true, error: "" };

    if (rules.minLength && v.length < rules.minLength)
        return { isValid: false, error: rules.message };

    if (rules.maxLength && v.length > rules.maxLength)
        return { isValid: false, error: rules.message };

    if (rules.pattern && !rules.pattern.test(v))
        return { isValid: false, error: rules.message };

    return { isValid: true, error: "" };
}

function showFieldError(fieldName, errorMsg) {
    const field = formFields[fieldName];
    const errorElement = document.getElementById(`${fieldName}-error`);
    if (!field || !errorElement) return;

    field.classList.add("error");
    errorElement.textContent = errorMsg;
    errorElement.classList.add("visible");
}

function clearFieldError(fieldName) {
    const field = formFields[fieldName];
    const errorElement = document.getElementById(`${fieldName}-error`);
    if (!field || !errorElement) return;

    field.classList.remove("error");
    errorElement.textContent = "";
    errorElement.classList.remove("visible");
}

function validateForm() {
    let isFormValid = true;

    Object.keys(formFields).forEach((fieldName) => clearFieldError(fieldName));

    Object.keys(VALIDATION_RULES).forEach((fieldName) => {
        const field = formFields[fieldName];
        if (!field) return;

        const validation = validateField(fieldName, field.value);
        if (!validation.isValid) {
            showFieldError(fieldName, validation.error);
            isFormValid = false;
        }
    });

    return isFormValid;
}

// ===========================
// Submission & State
// ===========================

async function submitUpdate(formData) {
    const response = await fetch(API_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(formData),
    });

    const text = await response.text();

    try {
        return JSON.parse(text);
    } catch {
        if (text.includes("success") || response.ok) return { success: true };
        throw new Error("Invalid server response");
    }
}

function setLoadingState() {
    submitBtn.disabled = true;
    submitBtn.classList.add("loading");
    Object.values(formFields).forEach((f) => (f.disabled = true));
}

function removeLoadingState() {
    submitBtn.disabled = false;
    submitBtn.classList.remove("loading");
    Object.values(formFields).forEach((f) => (f.disabled = false));
}

function hideAlerts() {
    successAlert.classList.remove("visible");
    errorAlert.classList.remove("visible");
}

function showSuccess() {
    hideAlerts();
    successMessage.textContent = "Project details have been updated.";
    successAlert.classList.add("visible");
    successAlert.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

function showError(msg) {
    hideAlerts();
    errorMessage.textContent = msg;
    errorAlert.classList.add("visible");
    errorAlert.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

async function handleUpdate(event) {
    event.preventDefault();
    hideAlerts();

    if (!validateForm()) {
        const firstError = document.querySelector(".form-input.error");
        if (firstError) firstError.scrollIntoView({ behavior: "smooth", block: "center" });
        return;
    }

    const formData = {
        action: "update",
        id: projectIdHidden.value,
        title: formFields.title.value.trim(),
        team: formFields.team.value.trim(),
        description: formFields.description.value.trim(),
        email: formFields.email.value.trim(),
        status: formFields.status.value,
        link: formFields.link.value.trim() || undefined,
    };

    setLoadingState();

    try {
        const result = await submitUpdate(formData);
        if (result.success) showSuccess();
        else showError(result.error || result.message || "Update failed.");
    } catch (err) {
        showError(err.message || "An unexpected error occurred.");
    } finally {
        removeLoadingState();
    }
}

// ===========================
// Initialization
// ===========================

function init() {
    // Search Form Listener
    searchForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const id = searchIdInput.value.trim();
        if (id) fetchProjectData(id);
    });

    // Main Update Form Listener
    form.addEventListener("submit", handleUpdate);

    // Add Member Button
    addMemberBtn.addEventListener("click", () => addTeamMember());

    // Blur Validation
    Object.keys(formFields).forEach((fieldName) => {
        const field = formFields[fieldName];
        if (field && fieldName !== "team") {
            field.addEventListener("blur", () => {
                const v = validateField(fieldName, field.value);
                if (!v.isValid && field.value.trim()) showFieldError(fieldName, v.error);
                else clearFieldError(fieldName);
            });

            field.addEventListener("input", () => {
                if (field.classList.contains("error")) clearFieldError(fieldName);
            });
        }
    });
}

document.addEventListener("DOMContentLoaded", init);
