/**
 * SKYM By Kirisan — Customer Feedback receiver
 * Deploy as a Web app, then set the deployed /exec URL in index.html.
 */
const SPREADSHEET_ID = '1tZkIoJOnBCQuGisoq0zSHEsxIqd3QrEPyJ7nFxkDf9w';
const RESPONSE_SHEET_NAME = 'Sheet1';
const DEFAULT_BRANCH = 'Vivean Ekreach';
const TOPICS = [
  'welcome', 'staff', 'consultation', 'waiting', 'cleanliness',
  'comfort', 'treatment', 'results', 'price', 'aftercare', 'other'
];
const HEADERS = [
  'Timestamp', 'Full Name', 'Phone Number', 'Position', 'Visit Date',
  'Branch', 'Service', 'Overall Rating', 'Selected Feedback Topic',
  'Overall Feedback', 'Completed Topics',
  ...TOPICS.flatMap(topic => [`topicRating_${topic}`, `topicFeedback_${topic}`])
];

function doGet() {
  return json_({ ok: true, service: 'SKYM By Kirisan Customer Feedback' });
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  try {
    if (!e || !e.parameter) throw new Error('No form data was received.');

    const fullName = param_(e, 'fullName').trim();
    const phone = param_(e, 'phone').trim();
    const service = param_(e, 'service').trim();
    const rating = Number(param_(e, 'rating'));
    if (!fullName || !phone || !service || rating < 1 || rating > 5) {
      throw new Error('Required form fields are missing or invalid.');
    }

    const selectedTopics = multiParam_(e, 'feedbackTopics');
    const row = [
      new Date(),
      fullName,
      phone,
      param_(e, 'position'),
      param_(e, 'visitDate'),
      DEFAULT_BRANCH,
      service,
      rating,
      selectedTopics.join(', '),
      param_(e, 'feedback'),
      param_(e, 'completedTopics')
    ];
    for (const topic of TOPICS) {
      row.push(param_(e, `topicRating_${topic}`), param_(e, `topicFeedback_${topic}`));
    }

    lock.waitLock(10000);
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const sheet = spreadsheet.getSheetByName(RESPONSE_SHEET_NAME);
    if (!sheet) throw new Error(`Sheet tab "${RESPONSE_SHEET_NAME}" was not found.`);

    const actualHeaders = sheet.getRange(1, 1, 1, HEADERS.length).getDisplayValues()[0];
    if (HEADERS.some((header, index) => actualHeaders[index] !== header)) {
      throw new Error('The response sheet headers do not match the expected 33-column layout.');
    }

    sheet.appendRow(row);
    return json_({ ok: true });
  } catch (error) {
    console.error(error);
    return json_({ ok: false, error: String(error && error.message || error) });
  } finally {
    if (lock.hasLock()) lock.releaseLock();
  }
}

function param_(e, name) {
  const value = e.parameter && e.parameter[name];
  return value == null ? '' : String(value);
}

function multiParam_(e, name) {
  const values = e.parameters && e.parameters[name];
  if (Array.isArray(values)) return values.map(String);
  const value = param_(e, name);
  return value ? value.split(',').map(item => item.trim()).filter(Boolean) : [];
}

function json_(value) {
  return ContentService.createTextOutput(JSON.stringify(value))
    .setMimeType(ContentService.MimeType.JSON);
}
