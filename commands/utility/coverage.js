const { SlashCommandBuilder, UserEntitlements, EmbedBuilder, PermissionsBitField, Client, User  } = require('discord.js');
const config = require('../../config.json');
const db = require('../../dbObjects');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('coverage')
        .setDescription('show the bots coverage of SEA divisions!'),
    /**
     *  @param {import('discord.js').CommandInteraction} interaction
     */
    async execute(interaction) {
        await interaction.deferReply();
       
        const groupId = 2648601
        const allysFetch = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/relationships/${"Allies"}?` + new URLSearchParams({MaxRows: 1000, StartRowIndex: 0}), {
            method: 'GET',
            

        })
        const allysJson = await allysFetch.json()
        
        const enemysFetch = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/relationships/${"enemies"}?` + new URLSearchParams({MaxRows: 1000, StartRowIndex: 0}), {
            method: 'GET',
        })
        const enemysJson = await enemysFetch.json()
        const enemys = enemysJson.relatedGroups
        const allys = allysJson.relatedGroups

        const servers = await db.Servers.findAll()
        
        const allysIds = allys.map(ally => ally.id)
        const enemysIds = enemys.map(enemy => enemy.id)


        const coverage = {
            allys: [],
            enemys: []
        }
        const others = [] 
        
        servers.forEach(server => {
            const serverId = server.group_id
            if (allysIds.includes(serverId)) {
                coverage.allys.push(serverId)
            } else if (enemysIds.includes(serverId)) {
                coverage.enemys.push(serverId)
            } else {
                others.push(server.id)
            }
        })
        let replyString = `**SEA Coverage**\n\n`
        replyString += `**Official Divisions:** ${coverage.allys.length + coverage.enemys.length}\n`
        replyString += `**SEA Divisions:** ${coverage.allys.length}\n`
        replyString += `**Pirate Divisions:** ${coverage.enemys.length}\n`
        replyString += `\n**Coverage:** ${Math.round((coverage.allys.length + coverage.enemys.length)*1000/(enemysIds.length + allysIds.length))/10}%\n`
        replyString += `\n**Total offical Divisions in SEA:** ${enemysIds.length + allysIds.length}\n`
        replyString += `**Total unoffical divisions(and divs that has not ran /setup) using the bot:** ${servers.length - coverage.allys.length + coverage.enemys.length}\n`

        interaction.editReply({content: replyString})

        otherGuilds = interaction.client.guilds.cache.filter(guild => {
            const server = servers.find(server => server.guild_id == guild.id)
            return server == undefined
        })
        console.log(console.log(otherGuilds.map(guild => guild.name).join("\n")))
        
    }
}