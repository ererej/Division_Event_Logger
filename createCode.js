process.env.DATABASE = 'productiondb';

const db = require('./dbObjects.js');

async function createPremiumCode() {
    try {
        const newCode = await db.PremiumCodes.create({
            code: 'testingServer',
            uses: 1,
            expires: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
            type: 'money',
            amount: 999
        });
        console.log('New premium code created:', newCode);
    } catch (error) {
        console.error('Error creating premium code:', error);
    }
}

createPremiumCode();