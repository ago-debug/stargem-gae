import { google } from 'googleapis';
import { getAuthenticatedClient } from './google-auth';

export async function getGoogleSheetClient() {
  const auth = await getAuthenticatedClient();
  return google.sheets({ version: 'v4', auth });
}

export async function readSpreadsheet(spreadsheetId: string, range: string) {
  const sheets = await getGoogleSheetClient();
  const response = await sheets.spreadsheets.values.get({
    spreadsheetId,
    range,
  });
  return response.data.values || [];
}

export async function writeSpreadsheet(spreadsheetId: string, range: string, values: any[][]) {
  const sheets = await getGoogleSheetClient();
  await sheets.spreadsheets.values.update({
    spreadsheetId,
    range,
    valueInputOption: 'RAW',
    requestBody: {
      values,
    },
  });
}
