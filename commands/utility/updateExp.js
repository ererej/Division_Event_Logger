const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const PublicGoogleSheetsParser = require('public-google-sheets-parser')
const spreadsheetId = '1sQIT3aOs1dWB9-f8cbsYe7MnSRfCfLRgMDSuE5b3w1I'
const options = { useFormat: true }
const parser = new PublicGoogleSheetsParser(spreadsheetId, options)
const db = require("../../dbObjects.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updateexp')
        .setDescription('Updates the Exp display!')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageServer || PermissionsBitField.Flags.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply()
            const server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
            const division_name = server ? server.name : interaction.guild.name
            const sheetData = await parser.parse()
            const exp = sheetData.find(row => row.Divisions === division_name).EXP.slice(10).trim()
            if (!exp) return await interaction.editReply({ content: 'There was an error while fetching the exp! This is mostlikely due to your divisions name not being the same as your discord servers name. But it can also be due to your division needing to be in the officer tracker for this to work.', ephemeral: true })

            
            if (!server) return await interaction.editReply({ content: 'This server is not registered in the database! Please ask an admin to register it using </setup:1217778156300275772>', ephemeral: true });
            server.exp = exp
            server.save()
            const dbChannel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "expdisplay" } })
            if (!dbChannel.channel_id) {
                return await interaction.editReply({ content: 'There is no expdisplay channel linked in this server! Please ask an admin to link one using </linkchannel:1246002135204626454>', ephemeral: true });
            }
            const channel = await interaction.guild.channels.fetch(dbChannel.channel_id)
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
        }catch(error) {
            console.error(error)
            await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
        }
    },
};