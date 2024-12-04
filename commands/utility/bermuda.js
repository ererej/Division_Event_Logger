const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField  } = require('discord.js');
const noblox = require("noblox.js")
const config = require('../../config.json');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('bermuda')
        .setDescription('A test command'),

    testerLock: true,

    /**
     *  @param {import('discord.js').CommandInteraction} interaction
     */
    async execute(interaction) {
        await interaction.deferReply();

        interaction.member.roles.remove("404").catch(err => {
            console.log(err)
            if (err.message === "Unknown Role") {
                console.log("Role not found")
            }
        })



        /*
        let rateLimitRemaining = 99;
        let robloxUser;
        let i = 0;
        let rateLimitReset;
        while ((rateLimitReset == undefined || rateLimitReset == null ) && i < 30) {
        robloxUser = await fetch(`https://registry.rover.link/api/guilds/${interaction.guild.id}/discord-to-roblox/${interaction.user.id}`, {
            headers: {
            'Authorization': `Bearer ${config.roverkey}`
            }
        })
        rateLimitRemaining = robloxUser.headers.get('x-ratelimit-remaining');
        console.log("rateLimitRemaining: ", rateLimitRemaining + " i: " + i)
        rateLimitReset = robloxUser.headers.get('x-ratelimit-reset');
        i++;
        }
        console.log("AFTER LOOP")
        console.log(robloxUser)

        // Access the x-ratelimit-bucket header
        const rateLimitBucket = robloxUser.headers.get('x-ratelimit-bucket');
        console.log('x-ratelimit-bucket:', rateLimitBucket);
        // Access the x-ratelimit-remaining header
        console.log('x-ratelimit-remaining:', rateLimitRemaining);
        // Access the x-ratelimit-reset header
        console.log('x-ratelimit-reset:', rateLimitReset);

        
        console.log("\n\n\n\n\nAFTER JSON")
        robloxUser = await robloxUser.json()
        console.log(robloxUser)
        interaction.editReply({content: `Your roblox user is ${robloxUser.cachedUsername}`})
*/

        
        // const gameInstants = await noblox.getGameInstances(12983079028)
        // const placeInfo = await noblox.getPlaceInfo(12983079028)
        // const gameInfo = await noblox.getUniverseInfo(placeInfo[0].universeId)
        // const totalPlayers = gameInfo[0].playing
        // let playersInPublicGames = 0;
        // for (const game of gameInstants) {
        //     playersInPublicGames += game.playing
        // }
        
        //  interaction.editReply({content: "it looks like there are " + totalPlayers + " players in Bermuda Air Base, and " + playersInPublicGames + " of them are in public servers!"})
    }
};