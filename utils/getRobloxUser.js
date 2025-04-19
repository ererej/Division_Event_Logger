const config = require('../config.json');
const makeRoverApiRequest = require('./makeRoverApiRequest.js');
module.exports = async ({MEMBER, memberId, guildId}) => {
    if (!MEMBER && !memberId && !guildId) {
        throw new Error('Either MEMBER or memberId and guildId must be provided');
    }
    if (MEMBER && !MEMBER.guild) {
        throw new Error('MEMBER must be a GuildMember object with a guild property');
    }

    const bucketKey = `user-${memberId || MEMBER.user.id}`;
    
    // Check if we need to wait for this bucket
    const rateLimitInfo = global.roverRateLimits?.get(bucketKey);
    if (rateLimitInfo && rateLimitInfo.remaining === 0) {
        const waitTime = rateLimitInfo.resetTime - Date.now();
        if (waitTime > 0) {
            console.log(`Waiting ${waitTime/1000}s for rate limit reset`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
    }
    
    return makeRoverApiRequest(async () => {
        // Your fetch call here - example:
        const response = await fetch(`https://registry.rover.link/api/guilds/${MEMBER ? MEMBER.guild.id : guildId}/discord-to-roblox/${MEMBER ? MEMBER.user.id : memberId}`, {
            headers: { 'Authorization': 'Bearer ' + config.roverkey }
        });
        
        if (!response.ok) {
            const error = new Error(`HTTP error! Status: ${response.status}`);
            error.response = response;
            throw error;
        }
        
        return response;
    });
}