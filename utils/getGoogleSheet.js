const { google } = require('googleapis');
const { readFile } = require('fs').promises;

module.exports = async (spreadsheetId, range) => {
    async function authenticate() {
        const auth = new google.auth.GoogleAuth({
            keyFile: 'google-api.json',
            scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
        });
        return auth.getClient();
    }
    
    async function readSheetData(auth) {
        const sheets = google.sheets({ version: 'v4', auth });
    
        const response = await sheets.spreadsheets.values.get({
            spreadsheetId,
            range,
        });
        return response
    }

    const auth = await authenticate()
    return await readSheetData(auth).catch(console.error);
}