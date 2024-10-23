const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js")
const config = require('../../config.json');
noblox.setCookie(config.sessionCookie)

module.exports = {
	data: new SlashCommandBuilder()
        .setName('quota')
        .setDescription('quota test')
        // .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)
        ,
    
    testerLock: true,

    async execute(interaction) {
        await interaction.deferReply()
        const embeded_error = new EmbedBuilder().setColor([255,0,0]) 

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)) {
            embeded_error.setDescription("Insuficent permissions!")
            return interaction.editReply({ embeds: [embeded_error]});
        }

        let description = "# Officers: \n"

        const officerRanks = (await db.Ranks.findAll({ where: { guild_id: interaction.guild.id, is_officer: true }})).sort((a, b) => a.rank_index - b.rank_index)
        let officers = await db.Users.findAll({ where: { guild_id: interaction.guild.id, rank_id: officerRanks.map(r => r.id) }})

        for (let i = 0; i < officers.length; i++) {
            const officer = officers[i]
            const events = await db.Events.findAll({ where: { host: officer.user_id, createdAt: { $gt: new Date(new Date() - 7 * 24 * 60 * 60 * 1000) } } } )
            const trainings = events.filter(e => e.type === "training")
            const patrols = events.filter(e => e.type === "patrol")

            description += `**<@${officer.user_id}>** - ${events.length} events hosted\n`
            description += `   - ${trainings.length} trainings\n`
            description += `   - ${patrols.length} patrols\n\n`

        };
        return interaction.editReply({ content: description });
    }
}