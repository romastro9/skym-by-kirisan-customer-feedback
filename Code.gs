/**
 * SKYM By Kirisan — Customer Feedback receiver
 * Writes the current customer-facing form fields to Sheet1.
 */
const SPREADSHEET_ID = '1tZkIoJOnBCQuGisoq0zSHEsxIqd3QrEPyJ7nFxkDf9w';
const RESPONSE_SHEET_NAME = 'Sheet1';
const TOPICS = [
  'welcome', 'staff', 'consultation', 'waiting', 'cleanliness',
  'comfort', 'treatment', 'results', 'price', 'aftercare', 'other'
];

function doGet() {
  return json_({ ok: true, service: 'SKYM By Kirisan Customer Feedback' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  let lockAcquired = false;
  try {
    if (!e || !e.parameter) throw new Error('No form data was received.');

    const fullName = param_(e, 'fullName').trim();
    const phone = param_(e, 'phone').trim();
    const visitDate = param_(e, 'visitDate').trim();
    const service = param_(e, 'service').trim();
    const rating = Number(param_(e, 'rating'));
    const feedback = param_(e, 'feedback').trim();

    if (!fullName || !phone || !visitDate || !service || rating < 1 || rating > 5) {
      throw new Error('Required form fields are missing or invalid.');
    }

    // Keep the existing 33-column layout stable for the live Sheet.
    // Position, branch, smart selection, and topic-specific fields are no longer
    // shown on the web form, so their cells remain blank.
    const row = [
      new Date(),
      fullName,
      phone,
      '',
      visitDate,
      '',
      service,
      rating,
      '',
      feedback,
      ''
    ];
    for (const topic of TOPICS) row.push('', '');
    if (row.length !== 33) throw new Error('Unexpected response row width.');

    lock.waitLock(10000);
    lockAcquired = true;

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(RESPONSE_SHEET_NAME);
    if (!sheet) throw new Error('Sheet tab "' + RESPONSE_SHEET_NAME + '" was not found.');

    const headers = sheet.getRange(1, 1, 1, 10).getDisplayValues()[0];
    const requiredHeaders = [
      [0, /submitted at/i],
      [1, /full name/i],
      [2, /phone number/i],
      [4, /visit date/i],
      [6, /service/i],
      [7, /overall rating/i],
      [9, /additional feedback/i]
    ];
    for (const entry of requiredHeaders) {
      if (!entry[1].test(String(headers[entry[0]] || ''))) {
        throw new Error('Required Sheet header is missing at column ' + (entry[0] + 1) + '.');
      }
    }
    if (sheet.getMaxColumns() < 33) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), 33 - sheet.getMaxColumns());
    }

    sheet.appendRow(row);
    return json_({ ok: true });
  } catch (error) {
    console.error(error && error.stack ? error.stack : error);
    return json_({
      ok: false,
      message: String(error && error.message || error)
    });
  } finally {
    if (lockAcquired) lock.releaseLock();
  }
}

function param_(e, name) {
  const value = e.parameter && e.parameter[name];
  return value == null ? '' : String(value);
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
