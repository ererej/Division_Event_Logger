const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const db = require("../../dbObjects.js")
const noblox = require("noblox.js")
const config = require('../../config.json')
noblox.setCookie(config.sessionCookie)

module.exports = {
	data: new SlashCommandBuilder()
        .setName('ranks')
        .setDescription('lists all the linked ranks!'),

    async execute(interaction) {
        await interaction.deferReply()
        const rankList = new EmbedBuilder()
        .setTitle('Linked ranks:')
        .setColor('Green')
        const division_ranks = await db.Ranks.findAll({
            where: { guild_id: interaction.guild.id },
        })
        const reversedOrder = await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "orderoftheranksinranks"} })
        if (reversedOrder && reversedOrder.config === "reversed") {
            division_ranks.sort((a, b) => -1*(a.rank_index - b.rank_index))
        } else {
            division_ranks.sort((a, b) => a.rank_index - b.rank_index)
        }

        const server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
        const totalUsers = await db.Users.count({ where: { guild_id: interaction.guild.id } })

        let description = ""
        let oneEmbedSent = false
        for (const rank of division_ranks) {
            const discordRole = interaction.guild.roles.cache.get(rank.id)
            const robloxRank = await noblox.getRole(server.group_id, parseInt(rank.roblox_id)).catch(() => { return { name: "not found" } })
            const userCount = await db.Users.count({ where: { rank_id: rank.id } })
            const rankInfo = `# <@&${discordRole.id}> \n*Users with rank: ${userCount} (${Math.round(userCount/totalUsers*100)}%)* \npromo points required:  ${rank.promo_points} \nindex:  ${rank.rank_index}\nID: ${rank.id}\nLinked Roblox rank: ${robloxRank.name}\nRoblox ID: ${rank.roblox_id}\nTag: ${rank.tag ? rank.tag : "none"}\nOfficer: ${rank.is_officer}\nObtainable: ${rank.obtainable}\n\n`
            if (description.length + rankInfo.length > 4096) {
                rankList.setDescription(description)
                if (!oneEmbedSent) {
                    await interaction.editReply({embeds: [rankList]})
                } else {
                    await interaction.followUp({embeds: [rankList]})
                    console.log("follow up sent")
                }
                description = ""
                oneEmbedSent = true;
                
            }
            description += rankInfo
        }
        if (description === "") {
            description = "No ranks linked!"
        }
        
        rankList.setDescription(description)
        if (!oneEmbedSent) {
            return interaction.editReply({embeds: [rankList]})
        } else {
            return interaction.followUp({embeds: [rankList]})
        }
}};