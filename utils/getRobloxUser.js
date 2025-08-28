const config = require('../config.json');
const makeRoverApiRequest = require('./makeRoverApiRequest.js');
module.exports = async function getRobloxUser({MEMBER, memberId, guildId}) {
    if (!MEMBER && !memberId && !guildId) {
        throw new Error('Either MEMBER or memberId and guildId must be provided');
    }
    if (MEMBER && !MEMBER.guild) {
        throw new Error('MEMBER must be a GuildMember object with a guild property');
    }
    
    return makeRoverApiRequest(async () => {
        // Your fetch call here - example:
        const response = await fetch(`https://registry.rover.link/api/guilds/${MEMBER ? MEMBER.guild.id : guildId}/discord-to-roblox/${MEMBER ? MEMBER.user.id : memberId}`, {
            headers: { 'Authorization': 'Bearer ' + config.roverkey }
        });
        
        if (!response.ok) {
            // For 429 rate limit errors, create a proper error object with response property
            if (response.status === 429) {
                const error = new Error(`Rate limited: ${response.status}`);
                error.response = response;
                throw error;
            }
            
            // For non-429 errors, try fallback to test server if not already using it
            if (guildId !== '1073682080380243998') {
                return await getRobloxUser({MEMBER: MEMBER, memberId: memberId, guildId: '1073682080380243998' }).catch(async (error) => {
                    console.log("Error in utils/getRobloxUser:", error);
                    return {error: `an error happend in /utils/getRobloxUser im sorry Status: ${response.status}`};
                });
            }
            
            // If we're already using the test server or fallback failed, throw the response
            throw response;
        }

        return response;
    }).catch(async (error) => {
        if (error.status === 404) {
            return {error: `User not found in the group or has not verified using rover!`};
        }
        console.log("Error in utils/getRobloxUser:", error);
        return {error: `an error happend in /utils/getRobloxUser im sorry Status: ${error.status}`};
    });
}