/**
 * ITI Projects Gallery - Edit Page Handler
 * Handles finding and editing user projects
 */

// ===========================
// DOM Elements
// ===========================
const findSection = document.getElementById('find-section');
const editSection = document.getElementById('edit-section');
const findForm = document.getElementById('find-form');
const editForm = document.getElementById('edit-form');
const lookupEmail = document.getElementById('lookup-email');
const findBtn = document.getElementById('find-btn');
const saveBtn = document.getElementById('save-btn');
const cancelBtn = document.getElementById('cancel-btn');
const projectsList = document.getElementById('projects-list');
const projectsContainer = document.getElementById('projects-container');
const successAlert = document.getElementById('success-alert');
const errorAlert = document.getElementById('error-alert');
const successMessage = document.getElementById('success-message');
const errorMessage = document.getElementById('error-message');
const navbar = document.getElementById('navbar');
const navbarToggle = document.getElementById('navbar-toggle');
const navbarNav = document.getElementById('navbar-nav');

// Edit form fields
const editFields = {
    title: document.getElementById('edit-title'),
    status: document.getElementById('edit-status'),
    description: document.getElementById('edit-description'),
    team: document.getElementById('edit-team'),
    github: document.getElementById('edit-github'),
    demo: document.getElementById('edit-demo'),
    projectId: document.getElementById('edit-project-id'),
    email: document.getElementById('edit-email')
};

// ===========================
// State
// ===========================
let userProjects = [];
let selectedProject = null;
let userEmail = '';

// ===========================
// UI Functions
// ===========================

/**
 * Sets loading state on a button
 * @param {HTMLElement} button - Button element
 * @param {boolean} loading - Loading state
 */
function setButtonLoading(button, loading) {
    if (loading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

/**
 * Shows an error message for a field
 * @param {string} fieldName - Field name
 * @param {string} message - Error message
 */
function showFieldError(fieldName, message) {
    const errorEl = document.getElementById(`${fieldName}-error`);
    const field = editFields[fieldName] || document.getElementById(`lookup-${fieldName}`);

    if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add('visible');
    }
    if (field) {
        field.classList.add('error');
    }
}

/**
 * Clears error message for a field
 * @param {string} fieldName - Field name
 */
function clearFieldError(fieldName) {
    const errorEl = document.getElementById(`${fieldName}-error`);
    const field = editFields[fieldName] || document.getElementById(`lookup-${fieldName}`);

    if (errorEl) {
        errorEl.textContent = '';
        errorEl.classList.remove('visible');
    }
    if (field) {
        field.classList.remove('error');
    }
}

/**
 * Clears all field errors
 */
function clearAllErrors() {
    document.querySelectorAll('.error-message').forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
    });
    document.querySelectorAll('.form-input.error').forEach(el => {
        el.classList.remove('error');
    });
}

/**
 * Shows success alert
 * @param {string} message - Success message
 */
function showSuccess(message) {
    hideAlerts();
    successMessage.textContent = message;
    successAlert.classList.remove('hidden');
    successAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Shows error alert
 * @param {string} message - Error message
 */
function showError(message) {
    hideAlerts();
    errorMessage.textContent = message;
    errorAlert.classList.remove('hidden');
    errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Hides all alerts
 */
function hideAlerts() {
    successAlert.classList.add('hidden');
    errorAlert.classList.add('hidden');
}

/**
 * Shows the edit section
 */
function showEditSection() {
    editSection.classList.remove('hidden');
    editSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Hides the edit section
 */
function hideEditSection() {
    editSection.classList.add('hidden');
}

/**
 * Resets the page to initial state
 */
function resetPage() {
    hideEditSection();
    projectsList.classList.add('hidden');
    projectsContainer.innerHTML = '';
    userProjects = [];
    selectedProject = null;
    hideAlerts();
    clearAllErrors();
}

// ===========================
// Project Lookup
// ===========================

/**
 * Renders the projects list for selection
 * @param {Array} projects - User's projects
 */
function renderProjectsList(projects) {
    if (projects.length === 0) {
        projectsContainer.innerHTML = `
            <div class="empty-state">
                <p>No projects found with this email address.</p>
            </div>
        `;
        return;
    }

    const html = projects.map((project, index) => {
        const statusClass = Utils.getStatusBadgeClass(project.status);
        return `
            <label class="project-item" for="project-${index}">
                <input type="radio" 
                    id="project-${index}" 
                    name="project-selection" 
                    class="project-item-radio"
                    value="${project.id}"
                    ${index === 0 ? 'checked' : ''}>
                <div class="project-item-content">
                    <div class="project-item-title">${Utils.escapeHtml(project.title)}</div>
                    <div class="project-item-meta">
                        <span class="badge ${statusClass}">${project.status}</span>
                        <span>ID: ${project.id}</span>
                    </div>
                </div>
            </label>
        `;
    }).join('');

    projectsContainer.innerHTML = html + `
        <button type="button" class="btn btn-primary" id="select-project-btn" style="margin-top: var(--spacing-lg); width: 100%;">
            Edit Selected Project
        </button>
    `;

    // Add event listener to the select button
    document.getElementById('select-project-btn').addEventListener('click', handleProjectSelection);
}

/**
 * Handles the find form submission
 * @param {Event} event - Submit event
 */
async function handleFindSubmit(event) {
    event.preventDefault();

    clearAllErrors();
    hideAlerts();

    const email = lookupEmail.value.trim();

    // Validate email
    const validation = Utils.validateField('email', email);
    if (!validation.isValid) {
        showFieldError('email', validation.error);
        return;
    }

    userEmail = email;
    setButtonLoading(findBtn, true);

    try {
        const response = await ApiService.lookupByEmail(email);

        if (response.error) {
            throw new Error(response.error);
        }

        if (response.projects && response.projects.length > 0) {
            userProjects = response.projects;
            renderProjectsList(userProjects);
            projectsList.classList.remove('hidden');
        } else {
            showError('No projects found with this email address. Please check the email and try again.');
        }

    } catch (error) {
        console.error('Lookup error:', error);
        showError(error.message || 'Failed to find projects. Please try again.');
    } finally {
        setButtonLoading(findBtn, false);
    }
}

/**
 * Handles project selection
 */
function handleProjectSelection() {
    const selected = document.querySelector('input[name="project-selection"]:checked');

    if (!selected) {
        showError('Please select a project to edit.');
        return;
    }

    const projectId = selected.value;
    selectedProject = userProjects.find(p => p.id === projectId);

    if (!selectedProject) {
        showError('Selected project not found.');
        return;
    }

    // Populate edit form
    populateEditForm(selectedProject);
    showEditSection();
}

/**
 * Populates the edit form with project data
 * @param {Object} project - Project data
 */
function populateEditForm(project) {
    editFields.title.value = project.title || '';
    editFields.status.value = project.status || 'Not Started';
    editFields.description.value = project.description || '';
    editFields.team.value = project.team || '';
    editFields.github.value = project.github || '';
    editFields.demo.value = project.demo || '';
    editFields.projectId.value = project.id;
    editFields.email.value = userEmail;
}

// ===========================
// Project Update
// ===========================

/**
 * Validates the edit form
 * @returns {boolean} Is form valid
 */
function validateEditForm() {
    let isValid = true;
    clearAllErrors();

    // Title
    const titleValidation = Utils.validateField('title', editFields.title.value);
    if (!titleValidation.isValid) {
        showFieldError('title', titleValidation.error);
        isValid = false;
    }

    // Description
    const descValidation = Utils.validateField('description', editFields.description.value);
    if (!descValidation.isValid) {
        showFieldError('description', descValidation.error);
        isValid = false;
    }

    // Team
    const teamValidation = Utils.validateField('team', editFields.team.value);
    if (!teamValidation.isValid) {
        showFieldError('team', teamValidation.error);
        isValid = false;
    }

    // GitHub (optional)
    if (editFields.github.value.trim()) {
        const githubValidation = Utils.validateField('link', editFields.github.value);
        if (!githubValidation.isValid) {
            showFieldError('github', 'Please enter a valid GitHub URL');
            isValid = false;
        }
    }

    // Demo (optional)
    if (editFields.demo.value.trim()) {
        const demoValidation = Utils.validateField('link', editFields.demo.value);
        if (!demoValidation.isValid) {
            showFieldError('demo', 'Please enter a valid URL');
            isValid = false;
        }
    }

    return isValid;
}

/**
 * Handles the edit form submission
 * @param {Event} event - Submit event
 */
async function handleEditSubmit(event) {
    event.preventDefault();

    hideAlerts();

    if (!validateEditForm()) {
        const firstError = document.querySelector('.form-input.error');
        if (firstError) {
            firstError.focus();
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    setButtonLoading(saveBtn, true);

    const updateData = {
        title: editFields.title.value.trim(),
        status: editFields.status.value,
        description: editFields.description.value.trim(),
        team: editFields.team.value.trim(),
        github: editFields.github.value.trim(),
        demo: editFields.demo.value.trim(),
        email: userEmail // Required for authorization
    };

    try {
        const response = await ApiService.updateProject(editFields.projectId.value, updateData);

        if (response.error) {
            throw new Error(response.error);
        }

        showSuccess('Your project has been updated successfully! The changes will appear in the gallery shortly.');

        // Update the selected project in our local state
        if (selectedProject) {
            Object.assign(selectedProject, updateData);
        }

    } catch (error) {
        console.error('Update error:', error);
        showError(error.message || 'Failed to update project. Please try again.');
    } finally {
        setButtonLoading(saveBtn, false);
    }
}

/**
 * Handles cancel button click
 */
function handleCancel() {
    hideEditSection();
    hideAlerts();

    // Scroll back to project selection
    projectsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ===========================
// Navigation
// ===========================

/**
 * Handles navbar scroll effect
 */
function handleScroll() {
    if (window.scrollY > 20) {
        navbar.classList.add('scrolled');
    } else {
        navbar.classList.remove('scrolled');
    }
}

/**
 * Toggles mobile navigation
 */
function toggleMobileNav() {
    navbarNav.classList.toggle('active');
}

// ===========================
// Event Listeners
// ===========================

function initEventListeners() {
    // Find form
    findForm.addEventListener('submit', handleFindSubmit);

    // Edit form
    editForm.addEventListener('submit', handleEditSubmit);

    // Cancel button
    cancelBtn.addEventListener('click', handleCancel);

    // Clear errors on input
    Object.values(editFields).forEach(field => {
        if (field && field.addEventListener) {
            field.addEventListener('input', () => {
                if (field.classList.contains('error')) {
                    const fieldName = field.id.replace('edit-', '');
                    clearFieldError(fieldName);
                }
            });
        }
    });

    lookupEmail.addEventListener('input', () => {
        if (lookupEmail.classList.contains('error')) {
            clearFieldError('email');
        }
    });

    // Navigation
    window.addEventListener('scroll', handleScroll);
    navbarToggle.addEventListener('click', toggleMobileNav);

    // Close mobile nav on link click
    navbarNav.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navbarNav.classList.remove('active');
        });
    });
}

// ===========================
// Initialization
// ===========================

function init() {
    initEventListeners();
    handleScroll();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
