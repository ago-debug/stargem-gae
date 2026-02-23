import { google } from 'googleapis';
import { getAuthenticatedClient, getGoogleAuthUrl, getGoogleOAuth2Client } from './google-auth';

export { getGoogleAuthUrl, getGoogleOAuth2Client };

export async function getGoogleCalendarClient() {
    const auth = await getAuthenticatedClient();
    return google.calendar({ version: 'v3', auth });
}

export interface GoogleCalendarEvent {
    summary: string;
    description?: string;
    start: {
        dateTime: string;
        timeZone: string;
    };
    end: {
        dateTime: string;
        timeZone: string;
    };
    colorId?: string;
}

export async function createCalendarEvent(event: GoogleCalendarEvent, calendarId: string = 'primary') {
    try {
        const calendar = await getGoogleCalendarClient();
        const response = await calendar.events.insert({
            calendarId,
            requestBody: event,
        });
        return response.data;
    } catch (error: any) {
        console.error('Error creating Google Calendar event:', error);
        throw error;
    }
}

export async function updateCalendarEvent(eventId: string, event: Partial<GoogleCalendarEvent>, calendarId: string = 'primary') {
    try {
        const calendar = await getGoogleCalendarClient();
        const response = await calendar.events.patch({
            calendarId,
            eventId,
            requestBody: event,
        });
        return response.data;
    } catch (error: any) {
        console.error('Error updating Google Calendar event:', error);
        throw error;
    }
}

export async function deleteCalendarEvent(eventId: string, calendarId: string = 'primary') {
    try {
        const calendar = await getGoogleCalendarClient();
        await calendar.events.delete({
            calendarId,
            eventId,
        });
    } catch (error: any) {
        console.error('Error deleting Google Calendar event:', error);
        // If it's already deleted (410), don't throw
        if (error.code !== 410 && error.code !== 404) {
            throw error;
        }
    }
}
