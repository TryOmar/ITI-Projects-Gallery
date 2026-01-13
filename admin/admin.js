/**
 * ITI Projects Gallery - Admin Page Handler
 * Handles project moderation and visibility management
 */

// ===========================
// Login Elements
// ===========================
const loginOverlay = document.getElementById('login-overlay');
const loginForm = document.getElementById('login-form');
const loginPassword = document.getElementById('admin-password');
const loginError = document.getElementById('login-error');

// Session key for admin access (stored in sessionStorage)
const ADMIN_SESSION_KEY = 'iti_admin_authenticated';
const ADMIN_PASSWORD_KEY = 'iti_admin_password';

// ===========================
// DOM Elements
// ===========================
const loadingContainer = document.getElementById('loading-container');
const errorContainer = document.getElementById('error-container');
const tableContainer = document.getElementById('table-container');
const projectsTbody = document.getElementById('projects-tbody');
const refreshBtn = document.getElementById('refresh-btn');
const retryBtn = document.getElementById('retry-btn');
const successAlert = document.getElementById('success-alert');
const errorAlert = document.getElementById('error-alert');
const successMessage = document.getElementById('success-message');
const alertErrorMessage = document.getElementById('alert-error-message');

// Stats elements
const statTotal = document.getElementById('stat-total');
const statVisible = document.getElementById('stat-visible');
const statHidden = document.getElementById('stat-hidden');

// Modal elements
const deleteModal = document.getElementById('delete-modal');
const modalProjectTitle = document.getElementById('modal-project-title');
const modalCloseBtn = document.getElementById('modal-close-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');

// Edit modal elements
const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editModalCloseBtn = document.getElementById('edit-modal-close-btn');
const editModalCancelBtn = document.getElementById('edit-modal-cancel-btn');
const editModalSaveBtn = document.getElementById('edit-modal-save-btn');

// Edit form fields
const editTitle = document.getElementById('edit-title');
const editDescription = document.getElementById('edit-description');
const editStatus = document.getElementById('edit-status');
const editEmail = document.getElementById('edit-email');
const editTeam = document.getElementById('edit-team');
const editGithub = document.getElementById('edit-github');
const editDemo = document.getElementById('edit-demo');
const editVisible = document.getElementById('edit-visible');

// ===========================
// State
// ===========================
let allProjects = [];
let projectToDelete = null;
let projectToEdit = null;

// ===========================
// UI Functions
// ===========================

/**
 * Shows loading state
 */
function showLoading() {
    loadingContainer.classList.remove('hidden');
    errorContainer.classList.add('hidden');
    tableContainer.classList.add('hidden');
}

/**
 * Shows error state
 * @param {string} message - Error message
 */
function showError(message) {
    loadingContainer.classList.add('hidden');
    errorContainer.classList.remove('hidden');
    tableContainer.classList.add('hidden');
    document.getElementById('error-message').textContent = message;
}

/**
 * Shows table
 */
function showTable() {
    loadingContainer.classList.add('hidden');
    errorContainer.classList.add('hidden');
    tableContainer.classList.remove('hidden');
}

/**
 * Shows success toast
 * @param {string} message - Success message
 */
function showSuccessToast(message) {
    successMessage.textContent = message;
    successAlert.classList.remove('hidden');

    setTimeout(() => {
        successAlert.classList.add('hidden');
    }, 3000);
}

/**
 * Shows error toast
 * @param {string} message - Error message
 */
function showErrorToast(message) {
    alertErrorMessage.textContent = message;
    errorAlert.classList.remove('hidden');

    setTimeout(() => {
        errorAlert.classList.add('hidden');
    }, 5000);
}

/**
 * Updates stats display
 * @param {Array} projects - All projects
 */
function updateStats(projects) {
    const total = projects.length;
    const visible = projects.filter(p => p.visible === true).length;
    const hidden = total - visible;

    statTotal.textContent = total;
    statVisible.textContent = visible;
    statHidden.textContent = hidden;
}

// ===========================
// Table Rendering
// ===========================

/**
 * Creates a table row for a project
 * @param {Object} project - Project data
 * @returns {string} HTML string
 */
function createTableRow(project) {
    const statusClass = Utils.getStatusBadgeClass(project.status);
    const isVisible = project.visible === true;

    return `
        <tr data-id="${project.id}">
            <td class="project-title-cell">
                <span class="project-title-text">${Utils.escapeHtml(project.title)}</span>
                <span class="project-id-text">ID: ${project.id}</span>
            </td>
            <td>
                <span class="badge ${statusClass}">${Utils.escapeHtml(project.status)}</span>
            </td>
            <td class="team-cell" title="${Utils.escapeHtml(project.team || '')}">
                ${Utils.escapeHtml(Utils.truncate(project.team || 'N/A', 30))}
            </td>
            <td class="email-cell">
                ${Utils.escapeHtml(project.email || 'N/A')}
            </td>
            <td class="visibility-cell">
                <label class="visibility-toggle">
                    <input type="checkbox" 
                        ${isVisible ? 'checked' : ''} 
                        onchange="handleVisibilityToggle('${project.id}', this.checked)">
                    <span class="toggle-slider"></span>
                    <span class="visibility-status ${isVisible ? 'visible' : 'hidden'}">${isVisible ? 'Visible' : 'Hidden'}</span>
                </label>
            </td>
            <td>
                <div class="action-buttons">
                    <button class="btn-icon-action btn-edit" 
                        onclick="openEditModal('${project.id}')"
                        title="Edit project">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"/>
                        </svg>
                    </button>
                    <button class="btn-icon-action btn-delete" 
                        onclick="openDeleteModal('${project.id}')"
                        title="Delete project">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5m3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0z"/>
                            <path d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4zM2.5 3h11V2h-11z"/>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Renders all projects to the table
 * @param {Array} projects - Projects to render
 */
function renderProjects(projects) {
    if (projects.length === 0) {
        projectsTbody.innerHTML = `
            <tr>
                <td colspan="6" style="text-align: center; padding: var(--spacing-2xl); color: var(--text-secondary);">
                    No projects found
                </td>
            </tr>
        `;
        return;
    }

    const html = projects.map(createTableRow).join('');
    projectsTbody.innerHTML = html;
}

// ===========================
// Data Operations
// ===========================

/**
 * Fetches all projects from API
 */
async function fetchProjects() {
    showLoading();

    try {
        const password = sessionStorage.getItem(ADMIN_PASSWORD_KEY);
        const response = await ApiService.getAllProjects(password);

        if (Array.isArray(response)) {
            allProjects = response;
        } else if (response.projects) {
            allProjects = response.projects;
        } else if (response.success && response.data) {
            allProjects = response.data;
        } else {
            throw new Error('Invalid response format');
        }

        updateStats(allProjects);
        renderProjects(allProjects);
        showTable();

    } catch (error) {
        console.error('Error fetching projects:', error);
        showError(error.message || 'Failed to load projects');
    }
}

/**
 * Handles visibility toggle
 * @param {string} projectId - Project ID
 * @param {boolean} visible - New visibility state
 */
async function handleVisibilityToggle(projectId, visible) {
    try {
        const password = sessionStorage.getItem(ADMIN_PASSWORD_KEY);
        const response = await ApiService.toggleVisibility(projectId, visible, '', password);

        if (response.error) {
            throw new Error(response.error);
        }

        // Update local state
        const project = allProjects.find(p => p.id === projectId);
        if (project) {
            project.visible = visible;
            updateStats(allProjects);
        }

        // Update the status label in UI
        const statusLabel = document.querySelector(`tr[data-id="${projectId}"] .visibility-status`);
        if (statusLabel) {
            statusLabel.textContent = visible ? 'Visible' : 'Hidden';
            statusLabel.className = `visibility-status ${visible ? 'visible' : 'hidden'}`;
        }

        showSuccessToast(`Project ${visible ? 'shown' : 'hidden'} successfully`);

    } catch (error) {
        console.error('Error updating visibility:', error);
        showErrorToast(error.message || 'Failed to update visibility');

        // Revert toggle state
        const checkbox = document.querySelector(`tr[data-id="${projectId}"] input[type="checkbox"]`);
        if (checkbox) {
            checkbox.checked = !visible;
        }
    }
}

// Make function globally available for inline onclick
window.handleVisibilityToggle = handleVisibilityToggle;

// ===========================
// Delete Modal
// ===========================

/**
 * Opens the delete confirmation modal
 * @param {string} projectId - Project ID to delete
 */
function openDeleteModal(projectId) {
    projectToDelete = allProjects.find(p => p.id === projectId);

    if (!projectToDelete) {
        showErrorToast('Project not found');
        return;
    }

    modalProjectTitle.textContent = projectToDelete.title;
    deleteModal.classList.remove('hidden');
}

// Make function globally available for inline onclick
window.openDeleteModal = openDeleteModal;

/**
 * Closes the delete modal
 */
function closeDeleteModal() {
    deleteModal.classList.add('hidden');
    projectToDelete = null;
}

/**
 * Confirms project deletion
 */
async function confirmDelete() {
    if (!projectToDelete) return;

    const projectId = projectToDelete.id;

    // Disable buttons during operation
    modalConfirmBtn.disabled = true;
    modalCancelBtn.disabled = true;

    try {
        const password = sessionStorage.getItem(ADMIN_PASSWORD_KEY);
        const response = await ApiService.deleteProject(projectId, password);

        if (response.error) {
            throw new Error(response.error);
        }

        // Remove from local state
        allProjects = allProjects.filter(p => p.id !== projectId);
        updateStats(allProjects);
        renderProjects(allProjects);

        closeDeleteModal();
        showSuccessToast('Project deleted successfully');

    } catch (error) {
        console.error('Error deleting project:', error);
        showErrorToast(error.message || 'Failed to delete project');
    } finally {
        modalConfirmBtn.disabled = false;
        modalCancelBtn.disabled = false;
    }
}

// ===========================
// Edit Modal
// ===========================

/**
 * Opens the edit modal with project data
 * @param {string} projectId - Project ID to edit
 */
function openEditModal(projectId) {
    projectToEdit = allProjects.find(p => p.id === projectId);

    if (!projectToEdit) {
        showErrorToast('Project not found');
        return;
    }

    // Populate form fields
    editTitle.value = projectToEdit.title || '';
    editDescription.value = projectToEdit.description || '';
    editStatus.value = projectToEdit.status || 'Not Started';
    editEmail.value = projectToEdit.email || '';
    editTeam.value = projectToEdit.team || '';
    editGithub.value = projectToEdit.github || '';
    editDemo.value = projectToEdit.demo || '';
    editVisible.checked = projectToEdit.visible === true;

    editModal.classList.remove('hidden');
}

// Make function globally available for inline onclick
window.openEditModal = openEditModal;

/**
 * Closes the edit modal
 */
function closeEditModal() {
    editModal.classList.add('hidden');
    projectToEdit = null;
    editForm.reset();
}

/**
 * Saves project edits
 * @param {Event} e - Form submit event
 */
async function saveProjectEdit(e) {
    e.preventDefault();

    if (!projectToEdit) return;

    const projectId = projectToEdit.id;

    // Disable buttons during operation
    editModalSaveBtn.disabled = true;
    editModalCancelBtn.disabled = true;

    try {
        const updatedData = {
            title: editTitle.value.trim(),
            description: editDescription.value.trim(),
            status: editStatus.value,
            email: editEmail.value.trim(),
            team: editTeam.value.trim(),
            github: editGithub.value.trim(),
            demo: editDemo.value.trim(),
            visible: editVisible.checked
        };

        const response = await ApiService.updateProject(projectId, updatedData);

        if (response.error) {
            throw new Error(response.error);
        }

        // Update local state
        const index = allProjects.findIndex(p => p.id === projectId);
        if (index !== -1) {
            allProjects[index] = { ...allProjects[index], ...updatedData };
            updateStats(allProjects);
            renderProjects(allProjects);
        }

        closeEditModal();
        showSuccessToast('Project updated successfully');

    } catch (error) {
        console.error('Error updating project:', error);
        showErrorToast(error.message || 'Failed to update project');
    } finally {
        editModalSaveBtn.disabled = false;
        editModalCancelBtn.disabled = false;
    }
}

// ===========================
// Event Listeners
// ===========================

function initEventListeners() {
    // Refresh button
    refreshBtn.addEventListener('click', fetchProjects);

    // Retry button
    if (retryBtn) {
        retryBtn.addEventListener('click', fetchProjects);
    }

    // Delete Modal events
    modalCloseBtn.addEventListener('click', closeDeleteModal);
    modalCancelBtn.addEventListener('click', closeDeleteModal);
    modalConfirmBtn.addEventListener('click', confirmDelete);

    // Close delete modal on overlay click
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });

    // Edit Modal events
    editModalCloseBtn.addEventListener('click', closeEditModal);
    editModalCancelBtn.addEventListener('click', closeEditModal);
    editForm.addEventListener('submit', saveProjectEdit);

    // Close edit modal on overlay click
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) {
            closeEditModal();
        }
    });

    // Close modals on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            if (!deleteModal.classList.contains('hidden')) {
                closeDeleteModal();
            }
            if (!editModal.classList.contains('hidden')) {
                closeEditModal();
            }
        }
    });
}

// ===========================
// Initialization
// ===========================

/**
 * Checks if user is authenticated
 * @returns {boolean} True if authenticated
 */
function isAuthenticated() {
    return sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

/**
 * Sets authentication status
 * @param {boolean} authenticated - Authentication status
 * @param {string} [password] - Admin password (required if authenticated is true)
 */
function setAuthenticated(authenticated, password) {
    if (authenticated) {
        sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
        if (password) {
            sessionStorage.setItem(ADMIN_PASSWORD_KEY, password);
        }
    } else {
        sessionStorage.removeItem(ADMIN_SESSION_KEY);
        sessionStorage.removeItem(ADMIN_PASSWORD_KEY);
    }
}

/**
 * Shows the admin panel (hides login overlay)
 */
function showAdminPanel() {
    loginOverlay.classList.add('hidden');
    initEventListeners();
    fetchProjects();
}

/**
 * Handles login form submission
 * @param {Event} event - Submit event
 */
async function handleLogin(event) {
    event.preventDefault();

    const password = loginPassword.value.trim();

    if (!password) {
        loginError.classList.remove('hidden');
        return;
    }

    // Show loading state
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    submitBtn.classList.add('loading');
    submitBtn.disabled = true;
    loginError.classList.add('hidden');

    try {
        const response = await ApiService.verifyAdminPassword(password);

        if (response.success) {
            setAuthenticated(true, password);
            showAdminPanel();
        } else {
            loginError.classList.remove('hidden');
            loginPassword.value = '';
            loginPassword.focus();
        }
    } catch (error) {
        console.error('Login error:', error);
        loginError.classList.remove('hidden');
        loginPassword.value = '';
        loginPassword.focus();
    } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
    }
}

/**
 * Initializes the admin page
 */
function init() {
    // Check if already authenticated
    if (isAuthenticated()) {
        showAdminPanel();
    } else {
        // Set up login form
        loginForm.addEventListener('submit', handleLogin);
        loginPassword.focus();
    }
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
