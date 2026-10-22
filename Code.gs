/**
 * SKYM By Kirisan — anonymous customer feedback receiver
 * Writes feedback without collecting customer names or phone numbers.
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

    const visitDate = param_(e, 'visitDate').trim();
    const service = param_(e, 'service').trim();
    const rating = Number(param_(e, 'rating'));
    const feedback = param_(e, 'feedback').trim();

    if (!visitDate || !service || rating < 1 || rating > 5) {
      throw new Error('Required feedback fields are missing or invalid.');
    }

    // 31 columns: timestamp, legacy spacer, visit date, spacer, service,
    // overall rating, smart selection, additional feedback, completed topics,
    // followed by the 11 topic rating/comment pairs.
    const row = [
      new Date(),
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
    if (row.length !== 31) throw new Error('Unexpected response row width.');

    lock.waitLock(10000);
    lockAcquired = true;

    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(RESPONSE_SHEET_NAME);
    if (!sheet) throw new Error('Sheet tab "' + RESPONSE_SHEET_NAME + '" was not found.');

    const headers = sheet.getRange(1, 1, 1, 8).getDisplayValues()[0];
    const requiredHeaders = [
      [0, /submitted at/i],
      [2, /visit date/i],
      [4, /service/i],
      [5, /overall rating/i],
      [7, /additional feedback/i]
    ];
    for (const entry of requiredHeaders) {
      if (!entry[1].test(String(headers[entry[0]] || ''))) {
        throw new Error('Required Sheet header is missing at column ' + (entry[0] + 1) + '.');
      }
    }
    if (sheet.getMaxColumns() < 31) {
      sheet.insertColumnsAfter(sheet.getMaxColumns(), 31 - sheet.getMaxColumns());
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
