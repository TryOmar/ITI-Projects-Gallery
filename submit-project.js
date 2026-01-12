/**
 * Project Submission Form Handler
 * Handles form validation, submission, and user feedback
 */

// ===========================
// Constants & Configuration
// ===========================
const API_ENDPOINT = 'https://script.google.com/macros/s/AKfycby2zHkVnimyonJi0rF2AKtqHwfJFPfDLDQ2pgRN7vYaBy5dDojJyvTbMT-WycEFZm8/exec';

const VALIDATION_RULES = {
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
        pattern: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
        message: 'Please enter a valid URL'
    }
};


// ===========================
// DOM Elements
// ===========================
const form = document.getElementById('project-form');
const submitBtn = document.getElementById('submit-btn');
const successAlert = document.getElementById('success-alert');
const errorAlert = document.getElementById('error-alert');
const successMessage = document.getElementById('success-message');
const errorMessage = document.getElementById('error-message');
const teamMembersContainer = document.getElementById('team-members-container');
const addMemberBtn = document.getElementById('add-member-btn');

const formFields = {
    title: document.getElementById('title'),
    team: document.getElementById('team'),
    email: document.getElementById('email'),
    description: document.getElementById('description'),
    link: document.getElementById('link'),
    status: document.getElementById('status')
};

let memberCount = 1;


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

    formFields.team.value = members.join(', ');

    // Update remove button states
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
 */
function addTeamMember() {
    const newMemberGroup = document.createElement('div');
    newMemberGroup.className = 'team-member-input-group';
    newMemberGroup.innerHTML = `
        <input 
            type="text" 
            class="form-input team-member-input"
            placeholder="e.g., Fatima" 
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

    // Focus the new input
    newInput.focus();

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
// Validation Functions
// ===========================

/**
 * Validates a single field based on its validation rules
 * @param {string} fieldName - Name of the field to validate
 * @param {string} value - Value to validate
 * @returns {Object} - { isValid: boolean, error: string }
 */
function validateField(fieldName, value) {
    const rules = VALIDATION_RULES[fieldName];

    if (!rules) {
        return { isValid: true, error: '' };
    }

    // Check if field is required
    if (rules.required && !value.trim()) {
        return {
            isValid: false,
            error: `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`
        };
    }

    // If field is optional and empty, skip other validations
    if (!rules.required && !value.trim()) {
        return { isValid: true, error: '' };
    }

    // Check minimum length
    if (rules.minLength && value.trim().length < rules.minLength) {
        return { isValid: false, error: rules.message };
    }

    // Check maximum length
    if (rules.maxLength && value.trim().length > rules.maxLength) {
        return { isValid: false, error: rules.message };
    }

    // Check pattern (regex)
    if (rules.pattern && !rules.pattern.test(value.trim())) {
        return { isValid: false, error: rules.message };
    }

    return { isValid: true, error: '' };
}

/**
 * Displays error message for a field
 * @param {string} fieldName - Name of the field
 * @param {string} errorMsg - Error message to display
 */
function showFieldError(fieldName, errorMsg) {
    const field = formFields[fieldName];
    const errorElement = document.getElementById(`${fieldName}-error`);

    if (field && errorElement) {
        field.classList.add('error');
        errorElement.textContent = errorMsg;
        errorElement.classList.add('visible');
    }
}

/**
 * Clears error message for a field
 * @param {string} fieldName - Name of the field
 */
function clearFieldError(fieldName) {
    const field = formFields[fieldName];
    const errorElement = document.getElementById(`${fieldName}-error`);

    if (field && errorElement) {
        field.classList.remove('error');
        errorElement.textContent = '';
        errorElement.classList.remove('visible');
    }
}

/**
 * Validates all form fields
 * @returns {boolean} - True if all fields are valid
 */
function validateForm() {
    let isFormValid = true;

    // Clear all previous errors
    Object.keys(formFields).forEach(fieldName => {
        clearFieldError(fieldName);
    });

    // Validate each field
    Object.keys(VALIDATION_RULES).forEach(fieldName => {
        const field = formFields[fieldName];
        if (field) {
            const validation = validateField(fieldName, field.value);

            if (!validation.isValid) {
                showFieldError(fieldName, validation.error);
                isFormValid = false;
            }
        }
    });

    return isFormValid;
}


// ===========================
// UI State Management
// ===========================

/**
 * Sets the form to loading state
 */
function setLoadingState() {
    submitBtn.disabled = true;
    submitBtn.classList.add('loading');

    // Disable all form inputs
    Object.values(formFields).forEach(field => {
        field.disabled = true;
    });
}

/**
 * Removes loading state from form
 */
function removeLoadingState() {
    submitBtn.disabled = false;
    submitBtn.classList.remove('loading');

    // Re-enable all form inputs
    Object.values(formFields).forEach(field => {
        field.disabled = false;
    });
}

/**
 * Shows success alert with message
 * @param {string} projectId - The ID of the created project
 */
function showSuccess(projectId) {
    hideAlerts();
    successMessage.innerHTML = `
        Your project has been successfully submitted!<br><br>
        <strong style="font-size: 1.2em; color: #2563eb;">Project ID: ${projectId}</strong><br><br>
        <strong>⚠️ IMPORTANT: Save this Project ID!</strong><br>
        You will need this ID if you want to edit or update your project in the future.<br>
        Please copy and store it in a safe place.
    `;
    successAlert.classList.add('visible');

    // Scroll to success message
    successAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Shows error alert with message
 * @param {string} message - Error message to display
 */
function showError(message) {
    hideAlerts();
    errorMessage.textContent = message;
    errorAlert.classList.add('visible');

    // Scroll to error message
    errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

/**
 * Hides all alert messages
 */
function hideAlerts() {
    successAlert.classList.remove('visible');
    errorAlert.classList.remove('visible');
}

/**
 * Resets the form to initial state
 */
function resetForm() {
    form.reset();

    // Reset team members to single input
    const memberInputs = teamMembersContainer.querySelectorAll('.team-member-input-group');
    memberInputs.forEach((group, index) => {
        if (index > 0) {
            group.remove();
        } else {
            group.querySelector('.team-member-input').value = '';
        }
    });

    memberCount = 1;
    updateTeamField();
    updateRemoveButtons();

    Object.keys(formFields).forEach(fieldName => {
        clearFieldError(fieldName);
    });
}


// ===========================
// Form Submission
// ===========================

/**
 * Submits the form data to the API using POST with text/plain to avoid CORS preflight
 * @param {Object} formData - Form data to submit
 * @returns {Promise<Object>} - API response
 */
async function submitFormData(formData) {
    try {
        // Send as POST with text/plain to avoid CORS preflight
        const response = await fetch(API_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain'
            },
            body: JSON.stringify(formData)
        });

        // Parse response
        const textResponse = await response.text();

        // Try to parse as JSON
        try {
            const result = JSON.parse(textResponse);
            return result;
        } catch (e) {
            // If not JSON, check if it's a success indicator
            if (textResponse.includes('success') || response.ok) {
                const idMatch = textResponse.match(/\d{6,}/);
                return {
                    success: true,
                    id: idMatch ? idMatch[0] : 'unknown'
                };
            }
            throw new Error('Unable to process server response. Please contact support.');
        }
    } catch (error) {
        // Handle network errors
        if (error.name === 'TypeError' && error.message === 'Failed to fetch') {
            throw new Error('Network error. Please check your internet connection and try again.');
        }
        throw error;
    }
}

/**
 * Handles form submission
 * @param {Event} event - Form submit event
 */
async function handleSubmit(event) {
    event.preventDefault();

    // Hide any previous alerts
    hideAlerts();

    // Validate form
    if (!validateForm()) {
        // Scroll to first error
        const firstError = document.querySelector('.form-input.error');
        if (firstError) {
            firstError.focus();
            firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
        return;
    }

    // Prepare form data
    const formData = {
        action: 'create',
        title: formFields.title.value.trim(),
        team: formFields.team.value.trim(),
        description: formFields.description.value.trim(),
        email: formFields.email.value.trim(),
        status: formFields.status.value,
        link: formFields.link.value.trim() || undefined
    };

    // Set loading state
    setLoadingState();

    try {
        // Submit form
        const result = await submitFormData(formData);

        // Check if submission was successful
        if (result.success) {
            showSuccess(result.id);
            resetForm();
        } else {
            // Handle API-level failure
            const errorMsg = result.message || 'Submission failed. Please try again.';
            showError(errorMsg);
        }
    } catch (error) {
        // Handle errors
        console.error('Submission error:', error);
        showError(error.message || 'An unexpected error occurred. Please try again later.');
    } finally {
        // Remove loading state
        removeLoadingState();
    }
}


// ===========================
// Event Listeners
// ===========================

/**
 * Initialize form event listeners
 */
function initializeEventListeners() {
    // Form submission
    form.addEventListener('submit', handleSubmit);

    // Add member button
    addMemberBtn.addEventListener('click', addTeamMember);

    // Initial team member input listener
    const initialMemberInput = document.querySelector('.team-member-input');
    if (initialMemberInput) {
        initialMemberInput.addEventListener('input', updateTeamField);
    }

    // Initial remove button listener
    const initialRemoveBtn = document.querySelector('.btn-remove-member');
    if (initialRemoveBtn) {
        initialRemoveBtn.addEventListener('click', function () {
            removeTeamMember(this.parentElement);
        });
    }

    // Real-time field validation on blur
    Object.keys(formFields).forEach(fieldName => {
        const field = formFields[fieldName];
        if (field && fieldName !== 'team') { // Skip team as it's auto-updated
            field.addEventListener('blur', () => {
                const validation = validateField(fieldName, field.value);
                if (!validation.isValid && field.value.trim()) {
                    showFieldError(fieldName, validation.error);
                } else {
                    clearFieldError(fieldName);
                }
            });

            // Clear error on input
            field.addEventListener('input', () => {
                if (field.classList.contains('error')) {
                    clearFieldError(fieldName);
                }
            });
        }
    });
}


// ===========================
// Initialization
// ===========================

/**
 * Initialize the application
 */
function init() {
    // Check if all required DOM elements exist
    if (!form || !submitBtn) {
        console.error('Required DOM elements not found');
        return;
    }

    // Initialize event listeners
    initializeEventListeners();

    // Log initialization
    console.log('Project submission form initialized');
}

// Initialize when DOM is fully loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
