# Connect the feedback form to its Google Sheet

The matching Apps Script receiver is in [Code.gs](./Code.gs). It writes submissions to the existing **SKYM BY KIRISAN Customer Feedback** spreadsheet:

https://docs.google.com/spreadsheets/d/1tZkIoJOnBCQuGisoq0zSHEsxIqd3QrEPyJ7nFxkDf9w/edit

## Deploy once in Google Apps Script

1. Open [script.google.com](https://script.google.com/) and create a new project.
2. Replace the starter code with the contents of `Code.gs`.
3. Choose **Deploy → New deployment → Web app**.
4. Set **Execute as** to **Me** and access to **Anyone**, then deploy and authorize the requested Sheets access.
5. Copy the deployed web app URL ending in `/exec`.
6. Replace `YOUR_WEB_APP_URL_HERE` in `index.html` with that URL and commit the change.

The sheet already has the expected 33 headers. The receiver verifies them before appending so a mismatch will not silently write data into the wrong columns. This form currently sends the branch as **Vivean Ekreach**.
