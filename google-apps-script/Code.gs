/**
 * ITI Projects Gallery - Simple API
 * 
 * SETUP:
 * 1. Open your Google Sheet
 * 2. Extensions > Apps Script
 * 3. Paste this code
 * 4. Run 'setupDatabase' once to create the sheet
 * 5. Deploy as Web App (Execute as: Me, Access: Anyone)
 */

const SHEET_NAME = 'Projects';

// Simple configuration for column mapping (0-indexed)
const COL = {
  ID: 0, TITLE: 1, TEAM: 2, DESC: 3, LINK: 4, 
  STATUS: 5, EMAIL: 6, VISIBLE: 7, TIMESTAMP: 8
};

function doGet(e) {
  return response(getAllProjects());
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    
    if (data.action === 'create') return response(createProject(data));
    if (data.action === 'update') return response(updateProject(data));
    
    return response({error: 'Invalid action'});
  } catch (err) {
    return response({error: err.toString()});
  }
}

// --- Core Functions ---

function getAllProjects() {
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
  const projects = [];
  
  // Skip header row
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    projects.push({
      id: r[COL.ID],
      title: r[COL.TITLE],
      team: r[COL.TEAM],
      description: r[COL.DESC],
      link: r[COL.LINK],
      status: r[COL.STATUS],
      email: r[COL.EMAIL],
      visible: r[COL.VISIBLE]
    });
  }
  return projects;
}

function createProject(data) {
  const sheet = getSheet();
  const id = Date.now().toString().slice(-6); // Simple 6-digit ID
  
  sheet.appendRow([
    id,
    data.title,
    data.team,
    data.description,
    data.link,
    data.status || 'Not Started',
    data.email,
    true, // Visible by default
    new Date()
  ]);
  
  return { success: true, id: id };
}

function updateProject(data) {
  const sheet = getSheet();
  const rows = sheet.getDataRange().getValues();
  
  // Find project by ID
  for (let i = 1; i < rows.length; i++) {
    if (rows[i][COL.ID] == data.id) {
      // Update fields if provided
      const row = i + 1;
      
      if (data.title) sheet.getRange(row, COL.TITLE + 1).setValue(data.title);
      if (data.team) sheet.getRange(row, COL.TEAM + 1).setValue(data.team);
      if (data.description) sheet.getRange(row, COL.DESC + 1).setValue(data.description);
      if (data.link) sheet.getRange(row, COL.LINK + 1).setValue(data.link);
      if (data.status) sheet.getRange(row, COL.STATUS + 1).setValue(data.status);
      
      return { success: true, message: 'Updated' };
    }
  }
  
  return { error: 'Project not found' };
}

// --- Helpers ---

function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    setupDatabase();
  }
  return sheet;
}

function response(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// --- One-click Setup ---

/**
 * Manually run this function to set up or fix the sheet formatting
 */
function setupDatabase() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  
  // Create sheet if it doesn't exist
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  
  // 1. Define Headers
  const headers = [
    'ID', 'Title', 'Team Members', 'Description', 
    'Link', 'Status', 'Email', 'Visible', 'Date'
  ];
  
  // 2. Set Headers
  const headerRange = sheet.getRange(1, 1, 1, headers.length);
  headerRange.setValues([headers]);
  
  // 3. Styling - Headers
  headerRange
    .setFontWeight('bold')
    .setBackground('#202124') // Dark grey
    .setFontColor('#ffffff')  // White text
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');
  
  // 4. Set Column Widths
  sheet.setColumnWidth(COL.ID + 1, 80);
  sheet.setColumnWidth(COL.TITLE + 1, 200);
  sheet.setColumnWidth(COL.TEAM + 1, 200);
  sheet.setColumnWidth(COL.DESC + 1, 300);
  sheet.setColumnWidth(COL.LINK + 1, 150);
  sheet.setColumnWidth(COL.STATUS + 1, 120);
  sheet.setColumnWidth(COL.EMAIL + 1, 150);
  sheet.setColumnWidth(COL.VISIBLE + 1, 80);
  sheet.setColumnWidth(COL.TIMESTAMP + 1, 150);

  // 5. Freeze Header
  sheet.setFrozenRows(1);
  sheet.setFrozenColumns(2); // Freeze ID and Title

  // 6. Data Validation - Status Dropdown
  const statusRange = sheet.getRange(2, COL.STATUS + 1, 999, 1);
  const statusRule = SpreadsheetApp.newDataValidation()
    .requireValueInList(['Not Started', 'In Progress', 'Completed'], true)
    .setAllowInvalid(false)
    .build();
  statusRange.setDataValidation(statusRule);

  // 7. Data Validation - Visible Checkbox
  const lastRow = sheet.getMaxRows();
  const visibleRange = sheet.getRange(2, COL.VISIBLE + 1, lastRow - 1, 1);
  const visibleRule = SpreadsheetApp.newDataValidation()
    .requireCheckbox()
    .build();
  visibleRange.setDataValidation(visibleRule);

  // 8. Text Wrapping for Description
  sheet.getRange(2, COL.DESC + 1, 999, 1).setWrap(true);
  
  // 9. Vertical Alignment
  sheet.getRange(1, 1, 1000, headers.length).setVerticalAlignment('middle');
  
  // 10. Alternating Colors
  try {
    const range = sheet.getDataRange();
    range.removeMenuCheckbox(); 
    if (!sheet.getRange(1, 1).getBandings().length) {
       sheet.getRange(1, 1, 1000, headers.length).applyRowBanding(SpreadsheetApp.BandingTheme.LIGHT_GREY);
    }
  } catch (e) {
    // Ignore
  }

  Logger.log('Setup complete with full formatting');
}
