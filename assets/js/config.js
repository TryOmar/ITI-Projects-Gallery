/**
 * ITI Projects Gallery - Configuration
 * 
 * This file contains all configuration settings for the application.
 * Optimized for production using Google Apps Script backend.
 */

const CONFIG = {
    // Environment
    ENV: 'PRODUCTION',

    // API Endpoints
    API: {
        PRODUCTION: 'https://script.google.com/macros/s/AKfycbzJ0lL3fN2XIZkoCSKRvyPkRkmZUZjnrg6NkMaik0CqEP3epeG2Z3mSsgSU6wQYkMY/exec'
    },

    // Project Status Options
    STATUS: {
        NOT_STARTED: 'Not Started',
        IN_PROGRESS: 'In Progress',
        COMPLETED: 'Completed'
    },

    // Validation Rules
    VALIDATION: {
        title: {
            required: true,
            minLength: 3,
            maxLength: 100,
            message: 'Project title must be between 3 and 100 characters'
        },
        team: {
            required: true,
            minLength: 2,
            maxLength: 200,
            message: 'Team members field must be between 2 and 200 characters'
        },
        email: {
            required: true,
            pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
            message: 'Please enter a valid email address'
        },
        description: {
            required: true,
            minLength: 10,
            maxLength: 1000,
            message: 'Description must be between 10 and 1000 characters'
        },
        link: {
            required: false,
            pattern: /^(https?:\/\/)?([a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}(\/.*)?$/,
            message: 'Please enter a valid URL'
        }
    },

    // Request timeout in milliseconds
    TIMEOUT: 30000,

    // Cache duration in milliseconds (5 minutes)
    CACHE_DURATION: 5 * 60 * 1000
};

/**
 * Gets the current API base URL
 * @returns {string} API base URL
 */
function getApiUrl() {
    return CONFIG.API.PRODUCTION;
}

/**
 * API Service - Handles all API requests
 */
const ApiService = {
    /**
     * Makes an API request with proper error handling
     * @param {string} endpoint - API endpoint path
     * @param {Object} options - Fetch options
     * @returns {Promise<Object>} API response
     */
    async request(endpoint, options = {}) {
        const url = `${getApiUrl()}${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'text/plain'
            }
        };

        const mergedOptions = { ...defaultOptions, ...options };

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), CONFIG.TIMEOUT);

            const response = await fetch(url, {
                ...mergedOptions,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const text = await response.text();

            try {
                return JSON.parse(text);
            } catch {
                if (response.ok) {
                    return { success: true, data: text };
                }
                throw new Error('Invalid response from server');
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            }
            if (error.message === 'Failed to fetch') {
                throw error;
            }
        }
    },
    /**
     * Helper to dispatch requests based on environment
     * @param {Object} config - Configuration object
     * @param {Object} config.local - Local environment config { endpoint, method, body }
     * @param {Object} config.prod - Production environment config { endpoint, method, body }
     * @returns {Promise<Object>} API Request
     */
    async _dispatch({ local, prod }) {
        const isLocal = CONFIG.ENV === 'LOCAL';
        const conf = isLocal ? local : prod;

        const endpoint = conf.endpoint !== undefined ? conf.endpoint : '';
        const options = {
            method: conf.method || 'POST'
        };

        if (conf.body) {
            options.body = JSON.stringify(conf.body);
        }

        return this.request(endpoint, options);
    },

    /**
     * Fetches all visible projects
     * @returns {Promise<Array>} Array of project objects
     */
    async getProjects() {
        return this._dispatch({
            local: { endpoint: '/projects', method: 'GET' },
            prod: { endpoint: '', method: 'GET' }
        });
    },

    /**
     * Fetches all projects (including hidden - for admin)
     * @param {string} password - Admin password
     * @returns {Promise<Array>} Array of all project objects
     */
    async getAllProjects(password) {
        return this._dispatch({
            local: { endpoint: '/projects/all', method: 'GET' },
            prod: { endpoint: `?action=all&password=${encodeURIComponent(password)}`, method: 'GET' }
        });
    },

    /**
     * Creates a new project
     * @param {Object} projectData - Project data
     * @returns {Promise<Object>} Created project response
     */
    async createProject(projectData) {
        return this._dispatch({
            local: { endpoint: '/projects', body: projectData },
            prod: { body: { action: 'create', ...projectData } }
        });
    },

    /**
     * Updates an existing project
     * @param {string} id - Project ID
     * @param {Object} projectData - Updated project data
     * @returns {Promise<Object>} Update response
     */
    async updateProject(id, projectData) {
        return this._dispatch({
            local: { endpoint: `/projects/${id}`, method: 'PUT', body: projectData },
            prod: { body: { action: 'update', id, ...projectData } }
        });
    },

    /**
     * Looks up projects by email
     * @param {string} email - User's email
     * @returns {Promise<Object>} Projects belonging to email
     */
    async lookupByEmail(email) {
        return this._dispatch({
            local: { endpoint: '/projects/lookup', body: { email } },
            prod: { body: { action: 'lookup', email } }
        });
    },

    /**
     * Toggles project visibility (admin)
     * @param {string} id - Project ID
     * @param {boolean} visible - Visibility status
     * @param {string} adminNotes - Admin notes
     * @param {string} password - Admin password
     * @returns {Promise<Object>} Update response
     */
    async toggleVisibility(id, visible, adminNotes = '', password) {
        return this._dispatch({
            local: { endpoint: `/projects/${id}/visibility`, method: 'PATCH', body: { visible, adminNotes } },
            prod: { body: { action: 'visibility', id, visible, adminNotes, password } }
        });
    },

    /**
     * Deletes a project (admin)
     * @param {string} id - Project ID
     * @param {string} password - Admin password
     * @returns {Promise<Object>} Delete response
     */
    async deleteProject(id, password) {
        return this._dispatch({
            local: { endpoint: `/projects/${id}`, method: 'DELETE' },
            prod: { body: { action: 'delete', id, password } }
        });
    },

    /**
     * Verifies admin password
     * @param {string} password - Admin password
     * @returns {Promise<Object>} Verification response
     */
    async verifyAdminPassword(password) {
        return this._dispatch({
            local: { endpoint: '/admin/verify', body: { password } },
            prod: { body: { action: 'verifyAdmin', password } }
        });
    }
};

/**
 * Utility Functions
 */
const Utils = {
    /**
     * Validates a field value against rules
     * @param {string} fieldName - Name of the field
     * @param {string} value - Value to validate
     * @returns {Object} { isValid: boolean, error: string }
     */
    validateField(fieldName, value) {
        const rules = CONFIG.VALIDATION[fieldName];

        if (!rules) {
            return { isValid: true, error: '' };
        }

        if (rules.required && !value.trim()) {
            return {
                isValid: false,
                error: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`
            };
        }

        if (!rules.required && !value.trim()) {
            return { isValid: true, error: '' };
        }

        if (rules.minLength && value.trim().length < rules.minLength) {
            return { isValid: false, error: rules.message };
        }

        if (rules.maxLength && value.trim().length > rules.maxLength) {
            return { isValid: false, error: rules.message };
        }

        if (rules.pattern && !rules.pattern.test(value.trim())) {
            return { isValid: false, error: rules.message };
        }

        return { isValid: true, error: '' };
    },

    /**
     * Formats a date string
     * @param {string} dateString - ISO date string
     * @returns {string} Formatted date
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    },

    /**
     * Truncates text to specified length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    truncate(text, maxLength = 150) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength).trim() + '...';
    },

    /**
     * Gets badge class for status
     * @param {string} status - Project status
     * @returns {string} CSS class name
     */
    getStatusBadgeClass(status) {
        switch (status) {
            case CONFIG.STATUS.COMPLETED:
                return 'badge-completed';
            case CONFIG.STATUS.IN_PROGRESS:
                return 'badge-in-progress';
            default:
                return 'badge-not-started';
        }
    },

    /**
     * Escapes HTML to prevent XSS
     * @param {string} text - Text to escape
     * @returns {string} Escaped text
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    },

    /**
     * Debounce function for search
     * @param {Function} func - Function to debounce
     * @param {number} wait - Wait time in ms
     * @returns {Function} Debounced function
     */
    debounce(func, wait = 300) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * Shows a feedback toast message
     * @param {string} message - Message text
     * @param {string} type - 'success', 'error', 'info'
     * @param {number} duration - Duration in ms
     */
    showToast(message, type = 'success', duration = 3000) {
        // Create container if not exists
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }

        // Create toast element
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;

        let iconHtml = '';
        if (type === 'success') iconHtml = '<svg class="toast-icon" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg>';
        else if (type === 'error') iconHtml = '<svg class="toast-icon" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/></svg>';
        else iconHtml = '<svg class="toast-icon" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/></svg>';

        toast.innerHTML = `
            ${iconHtml}
            <div class="toast-content">
                <div class="toast-title">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
                <div class="toast-message">${message}</div>
            </div>
        `;

        // Add to container
        container.appendChild(toast);

        // Remove after duration
        setTimeout(() => {
            toast.style.animation = 'slideOutRight 0.3s ease-in forwards';
            setTimeout(() => {
                toast.remove();
                if (container.children.length === 0) {
                    container.remove();
                }
            }, 300);
        }, duration);
    },

    /**
     * Toggles button loading state
     * @param {HTMLElement|string} button - Button element or selector
     * @param {boolean} isLoading - Loading state
     */
    setLoading(button, isLoading) {
        const btn = typeof button === 'string' ? document.querySelector(button) : button;
        if (!btn) return;

        if (isLoading) {
            btn.classList.add('loading');
            btn.disabled = true;
        } else {
            btn.classList.remove('loading');
            btn.disabled = false;
        }
    }
};

// Export for module usage (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, ApiService, Utils, getApiUrl };
}

// Expose to window for browser usage
if (typeof window !== 'undefined') {
    window.CONFIG = CONFIG;
    window.ApiService = ApiService;
    window.Utils = Utils;
    window.getApiUrl = getApiUrl;
}
