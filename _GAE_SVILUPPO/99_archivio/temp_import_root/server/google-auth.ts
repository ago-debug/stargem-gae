import { google } from 'googleapis';
import { storage } from './storage';

let connectionSettings: any;

export function getGoogleOAuth2Client() {
    return new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET,
        `${process.env.BASE_URL || 'https://corsi.abreve.it'}/api/auth/google/callback`
    );
}

export async function getGoogleAuthUrl() {
    const oauth2Client = getGoogleOAuth2Client();
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
            'https://www.googleapis.com/auth/spreadsheets',
            'https://www.googleapis.com/auth/userinfo.email',
            'https://www.googleapis.com/auth/userinfo.profile',
        ],
        prompt: 'consent'
    });
}

async function getConnectorAccessToken() {
    if (connectionSettings && connectionSettings.settings.expires_at && new Date(connectionSettings.settings.expires_at).getTime() > Date.now()) {
        return connectionSettings.settings.access_token;
    }

    const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
    if (!hostname) {
        throw new Error('REPLIT_CONNECTORS_HOSTNAME non configurato e nessun Refresh Token trovato.');
    }

    const xReplitToken = process.env.REPL_IDENTITY
        ? 'repl ' + process.env.REPL_IDENTITY
        : process.env.WEB_REPL_RENEWAL
            ? 'depl ' + process.env.WEB_REPL_RENEWAL
            : null;

    if (!xReplitToken) {
        throw new Error('X_REPLIT_TOKEN not found for repl/depl');
    }

    connectionSettings = await fetch(
        'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=google-sheet',
        {
            headers: {
                'Accept': 'application/json',
                'X_REPLIT_TOKEN': xReplitToken
            }
        }
    ).then(res => res.json()).then(data => data.items?.[0]);

    const accessToken = connectionSettings?.settings?.access_token || connectionSettings.settings?.oauth?.credentials?.access_token;

    if (!connectionSettings || !accessToken) {
        throw new Error('Google connection not found.');
    }
    return accessToken;
}

export async function getAuthenticatedClient() {
    // 1. Try standard OAuth with Refresh Token from DB
    const refreshToken = await storage.getSystemConfig('google_refresh_token');

    if (refreshToken?.value && process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
        const oauth2Client = getGoogleOAuth2Client();
        oauth2Client.setCredentials({
            refresh_token: refreshToken.value
        });
        return oauth2Client;
    }

    // 2. Fallback to Replit connector
    try {
        const accessToken = await getConnectorAccessToken();
        const oauth2Client = new google.auth.OAuth2();
        oauth2Client.setCredentials({ access_token: accessToken });
        return oauth2Client;
    } catch (e) {
        console.error("Auth error:", e);
        throw new Error("Autenticazione Google non configurata. Vai in Admin Panel per connettere un account.");
    }
}
