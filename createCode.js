const db = require('./dbObjects.js');

async function createPremiumCode() {
    try {
        const newCode = await db.PremiumCodes.create({
            code: 'pondering_is_cool',
            uses: 1,
            expires: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000),
            type: 'days',
            amount: 70
        });
        console.log('New premium code created:', newCode);
    } catch (error) {
        console.error('Error creating premium code:', error);
    }
}

createPremiumCode();