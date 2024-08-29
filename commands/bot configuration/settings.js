const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js")

module.exports = {
    data: new SlashCommandBuilder()
        .setName('settings')
        .setDescription("Used to configure the bot's settings")
        .addSubcommand(subcommand =>
            subcommand
                .setName('dateformat')
                .setDescription('determines the date format the bot will display dates in!')
                .addStringOption(option =>
                    option.setName('format')
                        .setDescription('Please input the format you would like the bot to display dates in!')
                        .setRequired(true)
                        .addChoices(
                            { Name: 'DD/MM/YYYY', Value: 'DD/MM/YYYY' },
                            { Name: 'MM/DD/YYYY', Value: 'MM/DD/YYYY' },
                            { Name: 'YYYY/MM/DD', Value: 'YYYY/MM/DD' },
                        )
                )
        )
        .addSubcommand(subcommand =>
            subcommand
                .setName('timezone')
                .setDescription('determines the timezone the bot will display dates in!')
                .addIntergerOption(option =>
                    option.setName('hours')
                        .setDescription('Please input the hours diffirence between GMT and your timezone!')
                        .setRequired(true)
                )
        ),

        async execute(interaction) {
            interaction.deferReply()
            let setting
            switch (interaction.options.getSubcommand()) {
                case 'dateformat':
                    const format = interaction.options.getString('format')
                    setting = await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "dateformat" } })
                    if (setting) {
                        setting.update({ config: format })
                    } else {
                        db.Settings.create({ guild_id: interaction.guild.id, type: "dateformat", config: format })
                    }
                    await interaction.editReply({ content: `Successfully set the date format to ${format}` })
                    break;
                case 'timezone':
                    const hours = interaction.options.getInteger('hours')
                    setting = await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "timezone" } })
                    if (setting) {
                        setting.update({ config: hours })
                    } else {
                        db.Settings.create({ guild_id: interaction.guild.id, type: "timezone", config: hours })
                    }
                    if (hours > 0) {
                        await interaction.editReply({ content: `Successfully set the timezone to GMT+${hours}` })
                    } else if (hours < 0) {
                        await interaction.editReply({ content: `Successfully set the timezone to GMT${hours}` })
                    } else {
                        await interaction.editReply({ content: `Successfully set the timezone to GMT` })
                    }
                    break;
            }
        }

}