/**
 * ITI Projects Gallery - Gallery Page Handler
 * Displays projects with filtering and search functionality
 */

// ===========================
// DOM Elements
// ===========================
const projectsGrid = document.getElementById('projects-grid');
const loadingContainer = document.getElementById('loading-container');
const errorContainer = document.getElementById('error-container');
const emptyContainer = document.getElementById('empty-container');
const searchInput = document.getElementById('search-input');
const searchClear = document.getElementById('search-clear');
const filterChips = document.querySelectorAll('.filter-chip');
const resultsCount = document.getElementById('results-count');
const retryBtn = document.getElementById('retry-btn');
const clearFiltersBtn = document.getElementById('clear-filters-btn');
const navbar = document.getElementById('navbar');
const navbarToggle = document.getElementById('navbar-toggle');
const navbarNav = document.getElementById('navbar-nav');

// Stats elements
const totalProjectsEl = document.getElementById('total-projects');
const completedProjectsEl = document.getElementById('completed-projects');
const inProgressProjectsEl = document.getElementById('in-progress-projects');

// ===========================
// State
// ===========================
let allProjects = [];
let filteredProjects = [];
let currentFilter = 'all';
let searchQuery = '';

// ===========================
// Project Card Template
// ===========================

/**
 * Creates HTML for a project card
 * @param {Object} project - Project data
 * @returns {string} HTML string
 */
function createProjectCard(project) {
    const statusClass = Utils.getStatusBadgeClass(project.status);
    const description = Utils.truncate(project.description || '', 120);
    const team = Utils.escapeHtml(project.team || 'Team not specified');
    const title = Utils.escapeHtml(project.title);
    const date = project.createdAt ? Utils.formatDate(project.createdAt) : '';
    const hasLink = project.link && project.link.trim() !== '';

    return `
        <article class="project-card">
            <div class="project-card-header">
                <h3 class="project-title">${title}</h3>
                <span class="badge ${statusClass}">${Utils.escapeHtml(project.status)}</span>
            </div>
            
            <div class="project-card-body">
                <p class="project-description">${Utils.escapeHtml(description)}</p>
                
                <div class="project-team">
                    <svg class="project-team-icon" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M15 14s1 0 1-1-1-4-5-4-5 3-5 4 1 1 1 1zm-7.978-1L7 12.996c.001-.264.167-1.03.76-1.72C8.312 10.629 9.282 10 11 10c1.717 0 2.687.63 3.24 1.276.593.69.758 1.457.76 1.72l-.008.002-.014.002zM11 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4m3-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0M6.936 9.28a6 6 0 0 0-1.23-.247A7 7 0 0 0 5 9c-4 0-5 3-5 4q0 1 1 1h4.216A2.24 2.24 0 0 1 5 13c0-1.01.377-2.042 1.09-2.904.243-.294.526-.569.846-.816M4.92 10A5.5 5.5 0 0 0 4 13H1c0-.26.164-1.03.76-1.724.545-.636 1.492-1.256 3.16-1.275ZM1.5 5.5a3 3 0 1 1 6 0 3 3 0 0 1-6 0m3-2a2 2 0 1 0 0 4 2 2 0 0 0 0-4"/>
                    </svg>
                    <span class="project-team-members">${team}</span>
                </div>
            </div>
            
            <div class="project-card-footer">
                ${date ? `<span class="project-date">${date}</span>` : '<span></span>'}
                ${hasLink ? `
                    <a href="${Utils.escapeHtml(project.link)}" class="project-link" target="_blank" rel="noopener noreferrer">
                        View Project
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" viewBox="0 0 16 16">
                            <path fill-rule="evenodd" d="M8.636 3.5a.5.5 0 0 0-.5-.5H1.5A1.5 1.5 0 0 0 0 4.5v10A1.5 1.5 0 0 0 1.5 16h10a1.5 1.5 0 0 0 1.5-1.5V7.864a.5.5 0 0 0-1 0V14.5a.5.5 0 0 1-.5.5h-10a.5.5 0 0 1-.5-.5v-10a.5.5 0 0 1 .5-.5h6.636a.5.5 0 0 0 .5-.5"/>
                            <path fill-rule="evenodd" d="M16 .5a.5.5 0 0 0-.5-.5h-5a.5.5 0 0 0 0 1h3.793L6.146 9.146a.5.5 0 1 0 .708.708L15 1.707V5.5a.5.5 0 0 0 1 0z"/>
                        </svg>
                    </a>
                ` : ''}
            </div>
        </article>
    `;
}

/**
 * Creates skeleton loading cards
 * @param {number} count - Number of skeleton cards
 * @returns {string} HTML string
 */
function createSkeletonCards(count = 6) {
    let html = '';
    for (let i = 0; i < count; i++) {
        html += `
            <div class="skeleton-card">
                <div class="skeleton-header">
                    <div class="skeleton-title"></div>
                    <div class="skeleton-badge"></div>
                </div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-text"></div>
            </div>
        `;
    }
    return html;
}

// ===========================
// UI State Management
// ===========================

/**
 * Shows loading state
 */
function showLoading() {
    loadingContainer.classList.remove('hidden');
    errorContainer.classList.add('hidden');
    emptyContainer.classList.add('hidden');
    projectsGrid.innerHTML = createSkeletonCards(6);
}

/**
 * Shows error state
 * @param {string} message - Error message
 */
function showError(message) {
    loadingContainer.classList.add('hidden');
    errorContainer.classList.remove('hidden');
    emptyContainer.classList.add('hidden');
    projectsGrid.innerHTML = '';
    document.getElementById('error-message').textContent = message;
}

/**
 * Shows empty state
 */
function showEmpty() {
    loadingContainer.classList.add('hidden');
    errorContainer.classList.add('hidden');
    emptyContainer.classList.remove('hidden');
    projectsGrid.innerHTML = '';
}

/**
 * Shows projects
 */
function showProjects() {
    loadingContainer.classList.add('hidden');
    errorContainer.classList.add('hidden');
    emptyContainer.classList.add('hidden');
}

/**
 * Updates the stats in hero section
 * @param {Array} projects - All projects
 */
function updateStats(projects) {
    const total = projects.length;
    const completed = projects.filter(p => p.status === 'Completed').length;
    const inProgress = projects.filter(p => p.status === 'In Progress').length;

    // Animate counter
    animateCounter(totalProjectsEl, total);
    animateCounter(completedProjectsEl, completed);
    animateCounter(inProgressProjectsEl, inProgress);
}

/**
 * Animates a counter from 0 to target
 * @param {HTMLElement} element - Target element
 * @param {number} target - Target number
 */
function animateCounter(element, target) {
    let current = 0;
    const duration = 1000;
    const increment = target / (duration / 16);

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        element.textContent = Math.floor(current);
    }, 16);
}

/**
 * Updates results count text
 * @param {number} count - Number of visible projects
 */
function updateResultsCount(count) {
    const filterText = currentFilter === 'all' ? 'all' : currentFilter.toLowerCase();
    const searchText = searchQuery ? ` matching "${searchQuery}"` : '';

    if (count === 0) {
        resultsCount.textContent = `No projects found`;
    } else if (count === 1) {
        resultsCount.textContent = `Showing 1 project`;
    } else {
        resultsCount.textContent = `Showing ${count} projects`;
    }

    if (currentFilter !== 'all' || searchQuery) {
        resultsCount.textContent += searchText;
    }
}

// ===========================
// Filtering & Search
// ===========================

/**
 * Filters and searches projects
 */
function filterProjects() {
    filteredProjects = allProjects.filter(project => {
        // Status filter
        if (currentFilter !== 'all' && project.status !== currentFilter) {
            return false;
        }

        // Search filter
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            const searchableText = [
                project.title,
                project.team,
                project.description,
                project.status
            ].join(' ').toLowerCase();

            if (!searchableText.includes(query)) {
                return false;
            }
        }

        return true;
    });

    renderProjects();
}

/**
 * Renders projects to the grid
 */
function renderProjects() {
    if (filteredProjects.length === 0) {
        showEmpty();
        updateResultsCount(0);
        return;
    }

    showProjects();

    const html = filteredProjects.map(createProjectCard).join('');
    projectsGrid.innerHTML = html;

    // Re-add stagger animation class for new content
    projectsGrid.classList.remove('stagger-animation');
    void projectsGrid.offsetWidth; // Force reflow
    projectsGrid.classList.add('stagger-animation');

    updateResultsCount(filteredProjects.length);
}

/**
 * Handles filter chip click
 * @param {Event} event - Click event
 */
function handleFilterClick(event) {
    const chip = event.target.closest('.filter-chip');
    if (!chip) return;

    // Update active state
    filterChips.forEach(c => c.classList.remove('active'));
    chip.classList.add('active');

    // Update filter
    currentFilter = chip.dataset.filter;
    filterProjects();
}

/**
 * Handles search input
 */
function handleSearch() {
    searchQuery = searchInput.value.trim();

    // Toggle clear button
    if (searchQuery) {
        searchClear.classList.remove('hidden');
    } else {
        searchClear.classList.add('hidden');
    }

    filterProjects();
}

/**
 * Clears search
 */
function clearSearch() {
    searchInput.value = '';
    searchQuery = '';
    searchClear.classList.add('hidden');
    filterProjects();
}

/**
 * Clears all filters
 */
function clearAllFilters() {
    // Reset filter chips
    filterChips.forEach(c => c.classList.remove('active'));
    document.querySelector('[data-filter="all"]').classList.add('active');
    currentFilter = 'all';

    // Reset search
    clearSearch();
}

// ===========================
// Data Fetching
// ===========================

/**
 * Fetches projects from API
 */
async function fetchProjects() {
    showLoading();

    try {
        const response = await ApiService.getProjects();

        // Handle response format
        if (Array.isArray(response)) {
            allProjects = response;
        } else if (response.projects) {
            allProjects = response.projects;
        } else if (response.success && response.data) {
            allProjects = response.data;
        } else {
            throw new Error('Invalid response format');
        }

        // Update UI
        updateStats(allProjects);
        filteredProjects = [...allProjects];
        renderProjects();

    } catch (error) {
        console.error('Error fetching projects:', error);
        showError(error.message || 'Failed to load projects. Please try again.');
    }
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
    // Search
    searchInput.addEventListener('input', Utils.debounce(handleSearch, 300));
    searchClear.addEventListener('click', clearSearch);

    // Filters
    filterChips.forEach(chip => {
        chip.addEventListener('click', handleFilterClick);
    });

    // Clear filters button
    if (clearFiltersBtn) {
        clearFiltersBtn.addEventListener('click', clearAllFilters);
    }

    // Retry button
    if (retryBtn) {
        retryBtn.addEventListener('click', fetchProjects);
    }

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
    handleScroll(); // Check initial scroll position
    fetchProjects();
}

// Start when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
