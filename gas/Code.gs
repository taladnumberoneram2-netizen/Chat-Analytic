/**
 * Number One Chat Analytics Dashboard
 * Google Apps Script backend / JSON API.
 *
 * Data source: spreadsheet sheet "Test2"
 *
 * API:
 *   GET <WEB_APP_URL>?action=getSheetData
 */

function doGet(e) {
  var action = e && e.parameter ? e.parameter.action : '';

  if (action === 'getSheetData') {
    return ContentService
      .createTextOutput(JSON.stringify(getSheetData()))
      .setMimeType(ContentService.MimeType.JSON);
  }

  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('Chat Analytics Dashboard')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function getSheetData() {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Test2");

  if (!sheet) {
    throw new Error('Sheet "Test2" was not found.');
  }

  var data = sheet.getDataRange().getValues();
  var rows = data.slice(1);

  return rows.map(function(row) {
    return {
      conversation_id: String(row[0] || '').trim(),
      customer_name: String(row[1] || '').trim(),
      first_message_time: String(row[2] || '').trim(),
      latest_message_time: String(row[3] || '').trim(),
      message_text: String(row[4] || '').trim(),
      channel_type: String(row[5] || '').trim(),
      ad_id: String(row[6] || '').trim(),
      ad_title: String(row[7] || '').trim(),
      Timestamp: String(row[8] || '').trim(),
      Year: String(row[9] || '').trim(),
      Monyh: String(row[10] || '').trim(),
      DATE: String(row[11] || '').trim(),
      Time: String(row[12] || '').trim(),

      // Main analysis fields
      ai_Customer: String(row[15] || '').trim(),
      ai_Admin: String(row[16] || '').trim(),
      ai_Process: String(row[17] || '').trim(),

      // Raw search fields
      search_Customer: String(row[13] || '').trim(),
      search_Admin: String(row[14] || '').trim()
    };
  });
}
