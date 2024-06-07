const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const db = require('../../dbObjects')

module.exports = {
	data: new SlashCommandBuilder()
		.setName('addexp')
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
		if (!interaction.member.permissions.has(PermissionFlagsBits.ManageServer || PermissionFlagsBits.Administrator)) {
            embeded_error.setDescription("Insuficent permissions!")
            await interaction.editReply({ embeds: [embeded_error]});
		} else {
            const server = await db.Servers.findOne({where: {guild_id: interaction.guild.id}})
            const division_name = server.name || interaction.guild.name
            if (!server) {
                await interaction.editReply({ embeds: [embeded_error.setDescription("please run the /setup command so that the server gets added to the data base")]})
            } else {
                server.exp += interaction.options.getInteger('exp_to_add')
                server.save()
                const dbChannel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "expdisplay" } })
                if (!dbChannel.id) {
                    return await interaction.editReply({ content: 'There is no expdisplay channel linked in this server! Please ask an admin to link one using </linkchannel:1246002135204626454>', ephemeral: true });
                }
                const channel = await interaction.guild.channels.fetch(dbChannel.id)
                const messages = await channel.messages.fetch({ limit: 10, })
                let message = messages.find(m => m.author.id === interaction.client.user.id && m.embeds.length === 0)
                if (!message) {
                    message = await channel.send("setting up exp display...")
                }
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

                let new_message = `# __Level ${level}__\n**Total exp:** ${server.exp} / ${exp_needed} (${Math.round((server.exp/exp_needed)*100)}%)\n**Exp needed to level up:** ${exp_needed-server.exp}\n`
                new_message += "```ansi\nLevel [2;36m" + level + "[0m [[2;36m"
                for (let i=0;i<procentage/5;i++) {
                    new_message += "▮"
                }
                new_message += "[0m[2;31m"
                for (let i=0;i<20-(procentage/5);i++) {
                    new_message += "▯"
                }
                new_message += "[0m[2;30m[0m"
                new_message += `] level [2;31m${level + 1}[0m (${Math.round(((server.exp-past_level_total_exp)/(exp_needed-past_level_total_exp))*100)}%)`
                new_message += "\n```"
                new_message += `*Last updated: ${time.getDate()}/${time.getMonth()+1}/${time.getFullYear()} ${time.getHours()}:${time.getMinutes()}*`
                message.edit(new_message)
                interaction.editReply("Exp updated!")
            }
        }
    }
}