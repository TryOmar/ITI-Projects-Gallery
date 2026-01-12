/**
 * ITI Projects Gallery - Admin Page Handler
 * Handles project moderation and visibility management
 */

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

// ===========================
// State
// ===========================
let allProjects = [];
let projectToDelete = null;

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
            <td>
                <label class="visibility-toggle">
                    <input type="checkbox" 
                        ${isVisible ? 'checked' : ''} 
                        onchange="handleVisibilityToggle('${project.id}', this.checked)">
                    <span class="toggle-slider"></span>
                </label>
            </td>
            <td>
                <div class="action-buttons">
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
        const response = await ApiService.getAllProjects();

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
        const response = await ApiService.toggleVisibility(projectId, visible);

        if (response.error) {
            throw new Error(response.error);
        }

        // Update local state
        const project = allProjects.find(p => p.id === projectId);
        if (project) {
            project.visible = visible;
            updateStats(allProjects);
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
        const response = await ApiService.deleteProject(projectId);

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
// Event Listeners
// ===========================

function initEventListeners() {
    // Refresh button
    refreshBtn.addEventListener('click', fetchProjects);

    // Retry button
    if (retryBtn) {
        retryBtn.addEventListener('click', fetchProjects);
    }

    // Modal events
    modalCloseBtn.addEventListener('click', closeDeleteModal);
    modalCancelBtn.addEventListener('click', closeDeleteModal);
    modalConfirmBtn.addEventListener('click', confirmDelete);

    // Close modal on overlay click
    deleteModal.addEventListener('click', (e) => {
        if (e.target === deleteModal) {
            closeDeleteModal();
        }
    });

    // Close modal on Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !deleteModal.classList.contains('hidden')) {
            closeDeleteModal();
        }
    });
}

// ===========================
// Initialization
// ===========================

function init() {
    initEventListeners();
    fetchProjects();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
