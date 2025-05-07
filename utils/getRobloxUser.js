const config = require('../config.json');
const makeRoverApiRequest = require('./makeRoverApiRequest.js');
module.exports = async function getRobloxUser({MEMBER, memberId, guildId}) {
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
            return {error: `RoVer api returned an error! Status: ${response.status}`};
            error.response = response;
            throw error;
        }
        
        if (!(response.status + "").startsWith("2")) {
            
            if (guildId == '1073682080380243998') {
                return response;
            }
            // test with fafs server
            guildId = '1073682080380243998'

            return await getRobloxUser({MEMBER: MEMBER, memberId: memberId, guildId: guildId }).catch(async (error) => {
                console.log("Error in utils/getRobloxUser:", error);
                return {error: `an error happend in /utils/getRobloxUser im sorry Status: ${response.status}`};
            });
        }

        return response;
    }).catch(async (error) => {
        console.log("Error in utils/getRobloxUser:", error);
        return {error: `an error happend in /utils/getRobloxUser im sorry Status: ${error.status}`};
    });
}