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
const teamMembersContainer = document.getElementById('team-members-container');
const addMemberBtn = document.getElementById('add-member-btn');

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
let memberCount = 0;

// ===========================
// UI Functions
// ===========================



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
    userProjects = [];
    selectedProject = null;
    clearAllErrors();

    // Reset team members
    if (teamMembersContainer) {
        teamMembersContainer.innerHTML = '';
        memberCount = 0;
    }
}

// ===========================
// Team Members Management
// ===========================

/**
 * Updates the hidden team field with comma-separated member names
 */
function updateTeamField() {
    const memberInputs = document.querySelectorAll('.team-member-input');
    const members = Array.from(memberInputs)
        .map(input => input.value.trim())
        .filter(value => value !== '');

    editFields.team.value = members.join(', ');
    updateRemoveButtons();
}

/**
 * Updates the state of remove buttons (disable if only one member)
 */
function updateRemoveButtons() {
    const removeButtons = document.querySelectorAll('.btn-remove-member');
    const shouldDisable = removeButtons.length <= 1;

    removeButtons.forEach(btn => {
        btn.disabled = shouldDisable;
    });
}

/**
 * Adds a new team member input field
 * @param {string} value - Initial value (optional)
 */
function addTeamMember(value = '') {
    const newMemberGroup = document.createElement('div');
    newMemberGroup.className = 'team-member-input-group';
    newMemberGroup.innerHTML = `
        <input 
            type="text" 
            class="form-input team-member-input"
            placeholder="e.g., Ahmed" 
            value="${Utils.escapeHtml(value)}"
            data-member-index="${memberCount}">
        <button type="button" class="btn-remove-member" aria-label="Remove member">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                <path d="M2.146 2.854a.5.5 0 1 1 .708-.708L8 7.293l5.146-5.147a.5.5 0 0 1 .708.708L8.707 8l5.147 5.146a.5.5 0 0 1-.708.708L8 8.707l-5.146 5.147a.5.5 0 0 1-.708-.708L7.293 8z"/>
            </svg>
        </button>
    `;

    teamMembersContainer.appendChild(newMemberGroup);
    memberCount++;

    // Add event listeners to the new input and button
    const newInput = newMemberGroup.querySelector('.team-member-input');
    const newRemoveBtn = newMemberGroup.querySelector('.btn-remove-member');

    newInput.addEventListener('input', updateTeamField);
    newRemoveBtn.addEventListener('click', () => removeTeamMember(newMemberGroup));

    // Only focus if adding manually (no value passed)
    if (!value) {
        newInput.focus();
    }

    updateRemoveButtons();
}

/**
 * Removes a team member input field
 * @param {HTMLElement} memberGroup - The member group element to remove
 */
function removeTeamMember(memberGroup) {
    if (teamMembersContainer.children.length > 1) {
        memberGroup.remove();
        updateTeamField();
        updateRemoveButtons();
    }
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
    clearAllErrors();

    const email = lookupEmail.value.trim();

    // Validate email
    const validation = Utils.validateField('email', email);
    if (!validation.isValid) {
        showFieldError('email', validation.error);
        return;
    }

    userEmail = email;
    Utils.setLoading(findBtn, true);

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
            Utils.showToast('No projects found with this email address.', 'info');
        }

    } catch (error) {
        console.error('Lookup error:', error);
        Utils.showToast(error.message || 'Failed to find projects. Please try again.', 'error');
    } finally {
        Utils.setLoading(findBtn, false);
    }
}

/**
 * Handles project selection
 */
function handleProjectSelection() {
    const selected = document.querySelector('input[name="project-selection"]:checked');

    if (!selected) {
        Utils.showToast('Please select a project to edit.', 'error');
        return;
    }

    const projectId = selected.value;
    selectedProject = userProjects.find(p => p.id === projectId);

    if (!selectedProject) {
        Utils.showToast('Selected project not found.', 'error');
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
    editFields.team.value = project.team || ''; // Hidden field
    editFields.github.value = project.github || '';
    editFields.demo.value = project.demo || '';
    editFields.projectId.value = project.id;
    editFields.email.value = userEmail;

    // Populate team members
    teamMembersContainer.innerHTML = '';
    memberCount = 0;

    if (project.team) {
        const members = project.team.split(',').map(m => m.trim()).filter(m => m);
        if (members.length > 0) {
            members.forEach(member => {
                addTeamMember(member);
            });
        } else {
            addTeamMember();
        }
    } else {
        addTeamMember();
    }
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

    if (!validateEditForm()) {
        const firstError = document.querySelector('.form-input.error');
        if (firstError) {
            firstError.focus();
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    Utils.setLoading(saveBtn, true);

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

        Utils.showToast('Your project has been updated successfully!', 'success');

        // Update the selected project in our local state
        if (selectedProject) {
            Object.assign(selectedProject, updateData);
        }

    } catch (error) {
        console.error('Update error:', error);
        Utils.showToast(error.message || 'Failed to update project. Please try again.', 'error');
    } finally {
        Utils.setLoading(saveBtn, false);
    }
}

/**
 * Handles cancel button click
 */
function handleCancel() {
    hideEditSection();

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

    // Add member button
    if (addMemberBtn) {
        addMemberBtn.addEventListener('click', () => addTeamMember());
    }

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
