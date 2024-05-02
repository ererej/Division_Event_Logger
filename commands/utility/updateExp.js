const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const PublicGoogleSheetsParser = require('public-google-sheets-parser')
const spreadsheetId = '1sQIT3aOs1dWB9-f8cbsYe7MnSRfCfLRgMDSuE5b3w1I'
const options = { useFormat: true }
const parser = new PublicGoogleSheetsParser(spreadsheetId, options)

module.exports = {
    data: new SlashCommandBuilder()
        .setName('updateexp')
        .setDescription('Updates the Exp display!')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageServer || PermissionsBitField.Flags.Administrator),

    async execute(interaction) {
        try {
            await interaction.deferReply()

            const sheetData = await parser.parse()
            const exp = sheetData.find(row => row.Divisions === interaction.guild.name).EXP.slice(10).trim()

            
            //const server = await Server.findOne({ where: { server_id: interaction.guild.id } })
            //server.exp =   the exp from officer tracker  
            //server.save()
            const server = {
                exp: exp
            }

            let channel;
            let message;
            switch (interaction.guild.id) {
                case "1073682080380243998":
                    channel = await interaction.guild.channels.fetch('1092920883363991612')
                    message = await channel.messages.fetch('1219244532735152178')
                    break;
                case "1104945580142231673":
                    channel = await interaction.guild.channels.fetch('1231983666998018048')
                    message = await channel.messages.fetch('1231986359598845983')
                    break;
            }
            if (!message) {
                await channel.send("hi")
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