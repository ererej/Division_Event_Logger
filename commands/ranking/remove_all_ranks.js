const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js")
const testers = require("../../tester_servers.json");


module.exports = {
	data: new SlashCommandBuilder()
        .setName('remove_ranks')
        .setDescription('removes all the ranks!')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator),


    async execute(interaction) {
        await interaction.deferReply()
        const embeded_error = new EmbedBuilder().setColor([255,0,0])
        let tester = false
        testers.servers.forEach(server => {
            if ( !tester && server.id === interaction.guild.id) {
                tester = true
            }
        });
        if (!tester) {
            return await interaction.editReply({ embeds: [embeded_error.setDescription('This command is **only enabled** for testers!')] });
        }  

        const removeCount = await db.Ranks.destroy({where: { guild_id: interaction.guild.id}})
        const embededReply = new EmbedBuilder().setColor([255, 255, 0]).setDescription(`successfuly removed all ${removeCount} ranks`)
        interaction.editReply({embeds: [embededReply]})
    }
}