const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('findnoob')
        .setDescription('A command for finding what servers akant is in'),


    /**
     *  @param {import('discord.js').CommandInteraction} interaction
     */
    async execute(interaction) {
        await interaction.deferReply();
        if (!["831851819457052692", "1073682080380243998"].includes(interaction.guild.id)) {
            return interaction.editReply({content: "This command can only be used in ererejs testing server."})
        }

        let foundIn = []
        let serversBannedIn = []
        let foundCounter = 0

        for  ( const guild of  interaction.client.guilds.cache.values()) {
            if (await guild.bans.fetch("1059872684881747978").catch(e => {return false})) {
                serversBannedIn.push(guild.name)
                continue
            }
            // const member = await guild.members.get("1059872684881747978")
            const members = await guild.members.fetch()
            if (members.has("1059872684881747978")) {
                console.log("Found in: ", guild.name)
                foundIn.push(`\nFound in ${guild.name} (${guild.id}) leader: <@${guild.ownerId}>`)
                foundCounter++
            }
        }
        interaction.editReply({embeds: [new EmbedBuilder().setDescription("Akant was found in " + foundCounter + " servsers\n" + foundIn.join("") + "\n\nBanned in: " + serversBannedIn.join(", "))]})

    }
}