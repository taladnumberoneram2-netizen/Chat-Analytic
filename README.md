# Number One Chat Analytics Dashboard — GitHub

GitHub Pages frontend for the uploaded Google Apps Script Chat Analytics Dashboard.

## What was converted

The original dashboard is an Apps Script HTML application. It uses Alpine.js + Chart.js and calls `google.script.run.getSheetData()` to read the `Test2` sheet.

This GitHub version separates the frontend from the Google Apps Script backend:

- `index.html` — static GitHub Pages entry point.
- `app.js` — extracted dashboard application logic.
- `config.js` — API URL configuration.
- `gas/Code.gs` — Google Apps Script JSON API backend.
- `gas/Index.html` — original Apps Script UI retained for fallback/reference.

The existing dashboard logic is retained, including:
- 5 tabs: Dashboard, Chat, Customer Data, Keywords, Report
- Year / Month / Date / Channel filters
- Customer/Admin keyword search with OR / AND
- Multiple Page-4 Keyword Lists
- Keyword ranking and percentages
- Report Channel / Status / Process filters
- Status Frequency Distribution
- Time Analysis by Date and Time
- AI Customer / AI Admin reports
- Page-4 keyword groups feeding Report keyword charts
- CSV export
- Chat history parsing

## Setup

### 1. Deploy the Google Apps Script API

Open the Apps Script project attached to the spreadsheet containing the `Test2` sheet.

Use:

`gas/Code.gs`

Deploy as **Web app**. Copy the Web App URL.

The API endpoint is:

`YOUR_WEB_APP_URL?action=getSheetData`

### 2. Configure GitHub

Edit:

`config.js`

and replace the placeholder:

```js
window.DASHBOARD_CONFIG = {
  API_URL: "YOUR_WEB_APP_URL?action=getSheetData"
};
```

Then push the files to GitHub and enable GitHub Pages.

## Existing sheet column mapping

The uploaded Apps Script maps `Test2` as follows:

| Column | Field |
|---|---|
| A | conversation_id |
| B | customer_name |
| C | first_message_time |
| D | latest_message_time |
| E | message_text |
| F | channel_type |
| G | ad_id |
| H | ad_title |
| I | Timestamp |
| J | Year |
| K | Monyh |
| L | DATE |
| M | Time |
| N | search_Customer |
| O | search_Admin |
| P | ai_Customer |
| Q | ai_Admin |
| R | ai_Process |

## Security

Do not commit spreadsheet credentials, API keys, service-account files, or other secrets to GitHub.

The frontend contains only the public Web App endpoint. Control access to the underlying data through the Google Apps Script deployment and your Google account/security configuration.
