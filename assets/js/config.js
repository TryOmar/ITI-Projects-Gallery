/**
 * ITI Projects Gallery - Configuration
 * 
 * This file contains all configuration settings for the application.
 * Switch between LOCAL and PRODUCTION modes for development/deployment.
 * 
 * LOCAL MODE: Uses the local testing server in /server folder
 *             Run: cd server && node server.js
 * 
 * PRODUCTION MODE: Uses Google Apps Script backend
 */

const CONFIG = {
    // Environment: 'LOCAL' for development, 'PRODUCTION' for Google Apps Script
    ENV: 'LOCAL',

    // API Endpoints
    API: {
        // Local testing server (run from /server folder)
        LOCAL: 'http://localhost:3000/api',
        PRODUCTION: 'https://script.google.com/macros/s/AKfycby2zHkVnimyonJi0rF2AKtqHwfJFPfDLDQ2pgRN7vYaBy5dDojJyvTbMT-WycEFZm8/exec'
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
 * Gets the current API base URL based on environment
 * @returns {string} API base URL
 */
function getApiUrl() {
    return CONFIG.ENV === 'LOCAL' ? CONFIG.API.LOCAL : CONFIG.API.PRODUCTION;
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
        const baseUrl = getApiUrl();
        const url = CONFIG.ENV === 'LOCAL' ? `${baseUrl}${endpoint}` : baseUrl;

        const defaultOptions = {
            headers: {
                'Content-Type': CONFIG.ENV === 'LOCAL' ? 'application/json' : 'text/plain'
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
                throw new Error('Network error. Please check your connection.');
            }
            throw error;
        }
    },

    /**
     * Fetches all visible projects
     * @returns {Promise<Array>} Array of project objects
     */
    async getProjects() {
        if (CONFIG.ENV === 'LOCAL') {
            return this.request('/projects');
        }
        // Google Apps Script uses GET for fetching
        return this.request('', { method: 'GET' });
    },

    /**
     * Fetches all projects (including hidden - for admin)
     * @returns {Promise<Array>} Array of all project objects
     */
    async getAllProjects() {
        if (CONFIG.ENV === 'LOCAL') {
            return this.request('/projects/all');
        }
        // For Google Apps Script, would need to add action parameter
        return this.request('', { method: 'GET' });
    },

    /**
     * Creates a new project
     * @param {Object} projectData - Project data
     * @returns {Promise<Object>} Created project response
     */
    async createProject(projectData) {
        const data = CONFIG.ENV === 'LOCAL'
            ? projectData
            : { action: 'create', ...projectData };

        return this.request('/projects', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    /**
     * Updates an existing project
     * @param {string} id - Project ID
     * @param {Object} projectData - Updated project data
     * @returns {Promise<Object>} Update response
     */
    async updateProject(id, projectData) {
        if (CONFIG.ENV === 'LOCAL') {
            return this.request(`/projects/${id}`, {
                method: 'PUT',
                body: JSON.stringify(projectData)
            });
        }
        // Google Apps Script uses POST with action
        return this.request('', {
            method: 'POST',
            body: JSON.stringify({ action: 'update', id, ...projectData })
        });
    },

    /**
     * Looks up projects by email
     * @param {string} email - User's email
     * @returns {Promise<Object>} Projects belonging to email
     */
    async lookupByEmail(email) {
        if (CONFIG.ENV === 'LOCAL') {
            return this.request('/projects/lookup', {
                method: 'POST',
                body: JSON.stringify({ email })
            });
        }
        return this.request('', {
            method: 'POST',
            body: JSON.stringify({ action: 'lookup', email })
        });
    },

    /**
     * Toggles project visibility (admin)
     * @param {string} id - Project ID
     * @param {boolean} visible - Visibility status
     * @param {string} adminNotes - Optional admin notes
     * @returns {Promise<Object>} Update response
     */
    async toggleVisibility(id, visible, adminNotes = '') {
        if (CONFIG.ENV === 'LOCAL') {
            return this.request(`/projects/${id}/visibility`, {
                method: 'PATCH',
                body: JSON.stringify({ visible, adminNotes })
            });
        }
        return this.request('', {
            method: 'POST',
            body: JSON.stringify({ action: 'visibility', id, visible, adminNotes })
        });
    },

    /**
     * Deletes a project (admin)
     * @param {string} id - Project ID
     * @returns {Promise<Object>} Delete response
     */
    async deleteProject(id) {
        if (CONFIG.ENV === 'LOCAL') {
            return this.request(`/projects/${id}`, {
                method: 'DELETE'
            });
        }
        return this.request('', {
            method: 'POST',
            body: JSON.stringify({ action: 'delete', id })
        });
    },

    /**
     * Verifies admin password
     * @param {string} password - Admin password
     * @returns {Promise<Object>} Verification response
     */
    async verifyAdminPassword(password) {
        if (CONFIG.ENV === 'LOCAL') {
            return this.request('/admin/verify', {
                method: 'POST',
                body: JSON.stringify({ password })
            });
        }
        // For production, use a different approach (e.g., hashed comparison)
        return this.request('', {
            method: 'POST',
            body: JSON.stringify({ action: 'verifyAdmin', password })
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
    }
};

// Export for module usage (if using modules)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { CONFIG, ApiService, Utils, getApiUrl };
}
