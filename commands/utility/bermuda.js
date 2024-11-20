const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField  } = require('discord.js');
const noblox = require("noblox.js")
const config = require('../../config.json');
noblox.setCookie(config.sessionCookie)

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
        

        const gameInstants = await noblox.getGameInstances(12983079028)
        const placeInfo = await noblox.getPlaceInfo(12983079028)
        const gameInfo = await noblox.getUniverseInfo(placeInfo[0].universeId)
        const totalPlayers = gameInfo[0].playing
        let playersInPublicGames = 0;
        for (const game of gameInstants) {
            playersInPublicGames += game.playing
        }
        
         interaction.editReply({content: "it looks like there are " + totalPlayers + " players in Bermuda Air Base, and " + playersInPublicGames + " of them are in public servers!"})
    }
};