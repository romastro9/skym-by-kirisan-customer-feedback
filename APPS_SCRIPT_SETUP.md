# Connect the feedback form to its Google Sheet

The feedback form sends these fields: full name, phone, visit date, service, overall rating, and additional feedback. The receiver is in [Code.gs](./Code.gs) and writes to the existing **SKYM BY KIRISAN Customer Feedback** spreadsheet:

https://docs.google.com/spreadsheets/d/1tZkIoJOnBCQuGisoq0zSHEsxIqd3QrEPyJ7nFxkDf9w/edit

## Repair the current Web App

The receiver was rejecting submissions because it expected an old English-only 33-column header row. The live sheet has bilingual headers and blank spacer columns. The updated `Code.gs` accepts the current headers and preserves the existing column layout.

1. Open the Apps Script project that created the current Web App URL.
2. Replace the contents of `Code.gs` with the updated file from this repository and save.
3. Choose **Deploy → Manage deployments**, click the edit pencil on the current Web App deployment, select **New version**, then click **Deploy**.
4. Keep **Execute as: Me** and **Who has access: Anyone**. Approve the Sheets permission prompt if shown.
5. Keep the same `/exec` URL. The website already points to it.

The web page now checks the JSON result before showing the success message, so an Apps Script error will be visible instead of appearing as a successful submission.

If the original Apps Script project is unavailable, create a new project, paste in `Code.gs`, deploy as a Web App with the settings above, then replace the `scriptURL` in `index.html` with the new `/exec` URL.
