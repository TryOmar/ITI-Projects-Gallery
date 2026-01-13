/**
 * ITI Projects Gallery - Google Apps Script API
 * 
 * SETUP:
 * 1. Open your Google Sheet
 * 2. Extensions > Apps Script
 * 3. Paste this code
 * 4. Run 'setupDatabase' once to create the sheet
 * 5. Deploy as Web App (Execute as: Me, Access: Anyone)
 * 
 * IMPORTANT: After deployment, you'll get a URL that should be used in config.js
 */

const SHEET_NAME = 'Projects';

// Admin password (change this to your secure password)
const ADMIN_PASSWORD = 'iti2026';

// Column mapping (0-indexed)
const COL = {
    ID: 0,
    TITLE: 1,
    TEAM: 2,
    DESC: 3,
    GITHUB: 4,
    DEMO: 5,
    STATUS: 6,
    EMAIL: 7,
    VISIBLE: 8,
    ADMIN_NOTES: 9,
    CREATED_AT: 10,
    UPDATED_AT: 11
};

// ===========================
// HTTP Handlers
// ===========================

/**
 * Handles GET requests - Returns visible projects
 */
function doGet(e) {
    try {
        const action = e.parameter.action || 'list';
        
        if (action === 'all') {
            // Return all projects (for admin)
            return response(getAllProjects(false));
        }
        
        // Default: Return only visible projects (for public gallery)
        return response(getAllProjects(true));
    } catch (error) {
        return response({ error: error.toString() });
    }
}

/**
 * Handles POST requests - Create, Update, Lookup, Visibility, Delete
 */
function doPost(e) {
    try {
        let data;
        
        // Parse request body
        if (e.postData && e.postData.contents) {
            data = JSON.parse(e.postData.contents);
        } else {
            return response({ error: 'No data provided' });
        }
        
        const action = data.action || 'create';
        
        switch (action) {
            case 'create':
                return response(createProject(data));
            case 'update':
                return response(updateProject(data));
            case 'lookup':
                return response(lookupByEmail(data.email));
            case 'visibility':
                return response(updateVisibility(data.id, data.visible, data.adminNotes));
            case 'delete':
                return response(deleteProject(data.id));
            case 'verifyAdmin':
                return response(verifyAdminPassword(data.password));
            default:
                return response({ error: 'Invalid action' });
        }
    } catch (error) {
        return response({ error: error.toString() });
    }
}

// ===========================
// Core Functions
// ===========================

/**
 * Gets all projects from the sheet
 * @param {boolean} visibleOnly - If true, only return visible projects
 * @returns {Array} Array of project objects
 */
function getAllProjects(visibleOnly = true) {
    const sheet = getSheet();
    const rows = sheet.getDataRange().getValues();
    const projects = [];
    
    // Skip header row
    for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        
        // Skip empty rows
        if (!r[COL.ID]) continue;
        
        // Filter by visibility if needed
        if (visibleOnly && r[COL.VISIBLE] !== true) continue;
        
        const project = {
            id: String(r[COL.ID]),
            title: r[COL.TITLE],
            team: r[COL.TEAM],
            description: r[COL.DESC],
            github: r[COL.GITHUB],
            demo: r[COL.DEMO],
            status: r[COL.STATUS],
            visible: r[COL.VISIBLE] === true,
            createdAt: r[COL.CREATED_AT],
            updatedAt: r[COL.UPDATED_AT]
        };
        
        // Only include email for non-public requests
        if (!visibleOnly) {
            project.email = r[COL.EMAIL];
            project.adminNotes = r[COL.ADMIN_NOTES];
        }
        
        projects.push(project);
    }
    
    return projects;
}

/**
 * Creates a new project
 * @param {Object} data - Project data
 * @returns {Object} Success response with project ID
 */
function createProject(data) {
    const sheet = getSheet();
    const id = generateProjectId();
    const now = new Date();
    
    sheet.appendRow([
        id,
        data.title || '',
        data.team || '',
        data.description || '',
        data.github || '',
        data.demo || '',
        data.status || 'Not Started',
        data.email || '',
        true, // Visible by default
        '', // Admin notes
        now, // Created at
        now  // Updated at
    ]);
    
    return { success: true, id: id };
}

/**
 * Updates an existing project
 * @param {Object} data - Project data with id and email for verification
 * @returns {Object} Success or error response
 */
function updateProject(data) {
    const sheet = getSheet();
    const rows = sheet.getDataRange().getValues();
    
    // Find project by ID
    for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][COL.ID]) === String(data.id)) {
            // Verify email ownership
            if (data.email && rows[i][COL.EMAIL].toLowerCase() !== data.email.toLowerCase()) {
                return { error: 'Email verification failed. You can only edit your own projects.' };
            }
            
            const row = i + 1;
            
            // Update fields if provided
            if (data.title !== undefined) sheet.getRange(row, COL.TITLE + 1).setValue(data.title);
            if (data.team !== undefined) sheet.getRange(row, COL.TEAM + 1).setValue(data.team);
            if (data.description !== undefined) sheet.getRange(row, COL.DESC + 1).setValue(data.description);
            if (data.github !== undefined) sheet.getRange(row, COL.GITHUB + 1).setValue(data.github);
            if (data.demo !== undefined) sheet.getRange(row, COL.DEMO + 1).setValue(data.demo);
            if (data.status !== undefined) sheet.getRange(row, COL.STATUS + 1).setValue(data.status);
            
            // Update timestamp
            sheet.getRange(row, COL.UPDATED_AT + 1).setValue(new Date());
            
            return { success: true, message: 'Project updated successfully' };
        }
    }
    
    return { error: 'Project not found' };
}

/**
 * Looks up projects by email
 * @param {string} email - User's email
 * @returns {Object} Projects belonging to email
 */
function lookupByEmail(email) {
    if (!email) {
        return { error: 'Email is required' };
    }
    
    const sheet = getSheet();
    const rows = sheet.getDataRange().getValues();
    const projects = [];
    
    for (let i = 1; i < rows.length; i++) {
        const r = rows[i];
        
        if (r[COL.EMAIL] && r[COL.EMAIL].toLowerCase() === email.toLowerCase()) {
            projects.push({
                id: String(r[COL.ID]),
                title: r[COL.TITLE],
                team: r[COL.TEAM],
                description: r[COL.DESC],
                github: r[COL.GITHUB],
                demo: r[COL.DEMO],
                status: r[COL.STATUS],
                visible: r[COL.VISIBLE] === true
            });
        }
    }
    
    if (projects.length === 0) {
        return { error: 'No projects found for this email' };
    }
    
    return { success: true, projects: projects };
}

/**
 * Updates project visibility (admin function)
 * @param {string} id - Project ID
 * @param {boolean} visible - New visibility state
 * @param {string} adminNotes - Optional admin notes
 * @returns {Object} Success or error response
 */
function updateVisibility(id, visible, adminNotes) {
    const sheet = getSheet();
    const rows = sheet.getDataRange().getValues();
    
    for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][COL.ID]) === String(id)) {
            const row = i + 1;
            
            sheet.getRange(row, COL.VISIBLE + 1).setValue(visible);
            if (adminNotes !== undefined) {
                sheet.getRange(row, COL.ADMIN_NOTES + 1).setValue(adminNotes);
            }
            sheet.getRange(row, COL.UPDATED_AT + 1).setValue(new Date());
            
            return { success: true, message: 'Visibility updated' };
        }
    }
    
    return { error: 'Project not found' };
}

/**
 * Deletes a project (admin function)
 * @param {string} id - Project ID
 * @returns {Object} Success or error response
 */
function deleteProject(id) {
    const sheet = getSheet();
    const rows = sheet.getDataRange().getValues();
    
    for (let i = 1; i < rows.length; i++) {
        if (String(rows[i][COL.ID]) === String(id)) {
            sheet.deleteRow(i + 1);
            return { success: true, message: 'Project deleted' };
        }
    }
    
    return { error: 'Project not found' };
}

/**
 * Verifies admin password
 * @param {string} password - Password to verify
 * @returns {Object} Success or error response
 */
function verifyAdminPassword(password) {
    if (password === ADMIN_PASSWORD) {
        return { success: true };
    }
    return { error: 'Invalid password' };
}

// ===========================
// Helpers
// ===========================

/**
 * Gets or creates the projects sheet
 * @returns {Sheet} The projects sheet
 */
function getSheet() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
        setupDatabase();
    }
    return sheet;
}

/**
 * Creates a JSON response
 * @param {Object} data - Response data
 * @returns {TextOutput} JSON response
 */
function response(data) {
    return ContentService.createTextOutput(JSON.stringify(data))
        .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Generates a unique 6-digit project ID
 * @returns {string} 6-digit ID
 */
function generateProjectId() {
    return Date.now().toString().slice(-6);
}

// ===========================
// Database Setup
// ===========================

/**
 * One-time setup function - Run this manually to create the sheet
 */
function setupDatabase() {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);
    
    if (!sheet) {
        sheet = ss.insertSheet(SHEET_NAME);
    }
    
    // Define Headers
    const headers = [
        'ID', 'Title', 'Team Members', 'Description', 
        'GitHub', 'Demo', 'Status', 'Email', 'Visible', 'Admin Notes',
        'Created At', 'Updated At'
    ];
    
    // Set Headers
    const headerRange = sheet.getRange(1, 1, 1, headers.length);
    headerRange.setValues([headers]);
    
    // Style Headers
    headerRange
        .setFontWeight('bold')
        .setBackground('#202124')
        .setFontColor('#ffffff')
        .setHorizontalAlignment('center')
        .setVerticalAlignment('middle');
    
    // Set Column Widths
    sheet.setColumnWidth(COL.ID + 1, 80);
    sheet.setColumnWidth(COL.TITLE + 1, 200);
    sheet.setColumnWidth(COL.TEAM + 1, 200);
    sheet.setColumnWidth(COL.DESC + 1, 300);
    sheet.setColumnWidth(COL.GITHUB + 1, 200);
    sheet.setColumnWidth(COL.DEMO + 1, 200);
    sheet.setColumnWidth(COL.STATUS + 1, 120);
    sheet.setColumnWidth(COL.EMAIL + 1, 200);
    sheet.setColumnWidth(COL.VISIBLE + 1, 80);
    sheet.setColumnWidth(COL.ADMIN_NOTES + 1, 200);
    sheet.setColumnWidth(COL.CREATED_AT + 1, 150);
    sheet.setColumnWidth(COL.UPDATED_AT + 1, 150);
    
    // Freeze Header
    sheet.setFrozenRows(1);
    sheet.setFrozenColumns(2);
    
    // Status Dropdown Validation
    const statusRange = sheet.getRange(2, COL.STATUS + 1, 999, 1);
    const statusRule = SpreadsheetApp.newDataValidation()
        .requireValueInList(['Not Started', 'In Progress', 'Completed'], true)
        .setAllowInvalid(false)
        .build();
    statusRange.setDataValidation(statusRule);
    
    // Visible Checkbox Validation
    const visibleRange = sheet.getRange(2, COL.VISIBLE + 1, 999, 1);
    const visibleRule = SpreadsheetApp.newDataValidation()
        .requireCheckbox()
        .build();
    visibleRange.setDataValidation(visibleRule);
    
    // Text Wrapping for Description and Admin Notes
    sheet.getRange(2, COL.DESC + 1, 999, 1).setWrap(true);
    sheet.getRange(2, COL.ADMIN_NOTES + 1, 999, 1).setWrap(true);
    
    // Vertical Alignment
    sheet.getRange(1, 1, 1000, headers.length).setVerticalAlignment('middle');
    
    // Alternating Row Colors
    try {
        const range = sheet.getRange(1, 1, 1000, headers.length);
        if (!range.getBandings || range.getBandings().length === 0) {
            range.applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
        }
    } catch (e) {
        // Ignore banding errors
    }
    
    Logger.log('Database setup complete!');
}
