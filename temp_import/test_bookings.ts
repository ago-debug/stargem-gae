import { storage } from './server/storage';

async function test() {
    try {
        const bookings = await storage.getStudioBookings();
        console.log('Bookings count:', bookings.length);
        if (bookings.length > 0) {
            console.log('First booking studioName:', bookings[0].studioName);
            console.log('First booking full data:', JSON.stringify(bookings[0], null, 2));
        }
    } catch (err) {
        console.error(err);
    } finally {
        process.exit(0);
    }
}

test();
