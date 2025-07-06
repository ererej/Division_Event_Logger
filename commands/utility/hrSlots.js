const { SlashCommandBuilder, EmbedBuilder, Colors, calculateUserDefaultAvatarIndex } = require('discord.js');
const noblox = require("noblox.js")
const config = require('../../config.json')
const getGoogleSheet = require('../../utils/getGoogleSheet.js')
const db = require('../../dbObjects.js')
const getRobloxUser = require('../../utils/getRobloxUser.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hrslots')
        .setDescription('lets you easily check the hr slots of a division or user!')
        .addUserOption(option => 
            option.setName('user')
            .setDescription('The user you want to check!')
            .setRequired(false))
        ,
//TODO make it so you can check the hr slots of a division

    async execute(interaction) {
        await interaction.deferReply()
        const officerTracker = await getGoogleSheet("1sQIT3aOs1dWB9-f8cbsYe7MnSRfCfLRgMDSuE5b3w1I", '[SEA] Division Tracker!A1:E2000')
        const officerTrackerData = officerTracker.data.values

        if (interaction.options.getUser('user')) {
            const user = interaction.options.getUser('user')
            const member = await interaction.guild.members.fetch(user.id).catch(() => null)
            const robloxUserResponce = await getRobloxUser({MEMBER: member, guildId: interaction.guild.id})
            const robloxUser = await robloxUserResponce.json().catch(() => null)
            
            if (robloxUser.error) {
                return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(robloxUser.error)] });
            }
            const usersRow = officerTrackerData.find(row => row[1] !== undefined && row[1].toLowerCase() === robloxUser.cachedUsername.toLowerCase())
            if (!usersRow) {
                return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`User ${user} not found in the officer tracker!`)] });
            }

            let slotProvider = ""          
            let currentRow = officerTrackerData.indexOf(usersRow);
            while (officerTrackerData[currentRow][0] !== undefined ) {
                if (officerTrackerData[currentRow][2]) {
                    slotProvider = officerTrackerData[currentRow][0]
                }
                currentRow--
            }

            const responceEmbed = new EmbedBuilder()
                .setColor(Colors.DarkGreen)
                .setTitle(`${user.username.toUpperCase()}'s HR Slot(s)`)
                .setDescription(`**Slot Provider:** ${slotProvider || "No HR slot found for this user!"}\n **Slot:** ${usersRow[0] || "No HR slot found for this user!"}`)
            interaction.editReply({ embeds: [responceEmbed] });
        } else {
            let division_name = interaction.options.getString('division_name')
            if (!division_name) {
                const division = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
                division_name = division.name
            }

            const divisionInfoRow = officerTrackerData.find(row => row[0] !== undefined && row[0].toLowerCase() === division_name.toLowerCase())
            if (!divisionInfoRow) {
                return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`Division "${division_name}" not found in the officer tracker!`)] });
            }

            const responceEmbed = new EmbedBuilder()
                .setColor(Colors.DarkGreen)  
                .setTitle(division_name + "'s HR Slots")

            let description = ""
            
            let currentRow = officerTrackerData.indexOf(divisionInfoRow) + 1; // Start checking from the next row
            while (officerTrackerData[currentRow][0] !== undefined) {
                description += `**${officerTrackerData[currentRow][0]}** - ${officerTrackerData[currentRow][1] || ""}\n` 
                currentRow++;
            }

            interaction.editReply({ 
                embeds: [responceEmbed.setDescription(description || "No HR slots found for this division!")]
            });
        }
    }   
}
