const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const noblox = require("noblox.js")
const config = require('../../config.json');
const { type } = require('os');
noblox.setCookie(config.sessionCookie)
const fs = require('fs')

module.exports = {
	data: new SlashCommandBuilder()
        .setName('bermuda')
        .setDescription('A test command'),

    testerLock: true,

    async execute(interaction) {
        await interaction.deferReply()
        const gameInstants = await noblox.getGameInstances(12983079028)
        const placeInfo = await noblox.getPlaceInfo(12983079028)
        const gameInfo = await noblox.getUniverseInfo(placeInfo[0].universeId)
        const totalPlayers = gameInfo[0].playing
        let playersInPublicGames = 0;
        for (const game of gameInstants) {
            playersInPublicGames += game.playing
        }
        
        interaction.editReply({content: "it looks like there are " + totalPlayers + " players in Bermuda Air Base, and " + playersInPublicGames + " of them are in public servers!"})

        //graphing test



    const createGraph = require('../../functions/generateGraph.js')
    const data1 = {labels: ['January', 'February', 'March', "test", "test"], values: [10, 20, 30, 10, 50]}
    const data2 = {labels: ['January', 'February', 'March', "test", "test"], values: [20, 50, 3, 10, 30]}

    const graph1 = await createGraph(data1)
    const graph2 = await createGraph(data2)

    interaction.channel.send({files: [graph1.attachment, graph2.attachment]})

    fs.unlinkSync(graph1.filePath)
    fs.unlinkSync(graph2.filePath)

    }
};