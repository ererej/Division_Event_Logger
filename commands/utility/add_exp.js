const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../dbObjects')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('add_exp')
		.setDescription('create the sea logging format only!')
        //.setDefaultMemberPermissions(PermissionFlagsBits.ManageServer || PermissionFlagsBits.Administrator)
        .addIntegerOption(option => 
            option.setName('exp_to_add')
                .setDescription('the exp that the division has earned!')
                .setRequired(true)
        ),

	async execute(interaction) {
        await interaction.deferReply()
		const embeded_error = new EmbedBuilder().setColor([255,0,0])
		if (!interaction.member.roles.cache.some(role => role.id === '1212084406282358846') && !interaction.member.permissions.has(PermissionFlagsBits.ManageServer || PermissionFlagsBits.Administrator)) {
            embeded_error.setDescription("Insuficent permissions!")
            await interaction.editReply({ embeds: [embeded_error]});
		} else {
            const server = await db.Servers.findOne({where: {guild_id: interaction.guild.id}})
            if (!server) {
                await interaction.editReply({ embeds: [embeded_error.setDescription("please run the /setup command so that the server gets added to the data base")]})
            } else {
                server.exp += interaction.options.getInteger('exp_to_add')
                server.save()
                const channel = await interaction.guild.channels.fetch('1092920883363991612')
                const message = await channel.messages.fetch('1219244532735152178')
                let level = 0
                let sum = 0
                let past_level_total_exp = 0
                while (sum<server.exp) {
                    level++
                    past_level_total_exp = sum
                    sum += (level**2)*500
                }
                const exp_needed = sum
                const time = new Date

                const procentage = Math.round(((server.exp-past_level_total_exp)/(exp_needed-past_level_total_exp))*100)

                let new_message = `# Level ${level}\n**Total exp:** ${server.exp} / ${exp_needed} (${Math.round((server.exp/exp_needed)*100)}%)\n**Exp needed to level up:** ${exp_needed-server.exp}\n`
                new_message += "```ansi\nLevel **4** [[2;32m"
                for (let i=0;i<procentage/5;i++) {
                    new_message += "▮"
                }
                new_message += "[0m[2;31m"
                for (let i=0;i<20-(procentage/5);i++) {
                    new_message += "▯"
                }
                new_message += "[0m[2;30m[0m"
                new_message += `] level **5** (${Math.round(((server.exp-past_level_total_exp)/(exp_needed-past_level_total_exp))*100)}%)`
                new_message += "\n```"
                new_message += `Last updated: ${time.getDate()}/${time.getMonth()+1}/${time.getFullYear()} ${time.getHours()}:${time.getMinutes()}`
                message.edit(new_message)
                interaction.editReply("Exp updated!")
            }
        }
    }
}