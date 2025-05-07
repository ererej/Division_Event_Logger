const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const noblox = require("noblox.js")
const config = require('../../config.json')
const isofficertrained = require('../../utils/isOfficerTrained.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('isofficertrained')
        .setDescription('Lets you check if a user is officer trained or not!')
        .addUserOption(option => option.setName('user').setDescription('The user you want to check!').setRequired(true)),


    async execute(interaction) {
        await interaction.deferReply()
        const user = interaction.options.getUser('user')

        const isOfficerTrained = await isofficertrained({userId: user.id, guildId: interaction.guild.id})
        if (isOfficerTrained.error) {
            return interaction.editReply({embeds: [new EmbedBuilder().setDescription(isOfficerTrained.error).setColor(Colors.Red)],})
        } else if (isOfficerTrained.trained) {
            return interaction.editReply({embeds: [new EmbedBuilder().setDescription(`${user} is officer trained!`).setColor(Colors.Green)],})
        } else if (isOfficerTrained.enrolled) {
            return interaction.editReply({embeds: [new EmbedBuilder().setDescription(`${user} is enrolled in OA but has not passed it!`).setColor(Colors.Orange)],})
        } else if (isOfficerTrained.exempt) {
            return interaction.editReply({embeds: [new EmbedBuilder().setDescription(`${user} is exempt from OA!`).setColor(Colors.Purple)],})
        } else if (isOfficerTrained.special) {
            return interaction.editReply({embeds: [new EmbedBuilder().setDescription(`${user} is something special in the OA group idk what go check yourself!`).setColor(Colors.Purple)],})
        } else {
            return interaction.editReply({embeds: [new EmbedBuilder().setDescription(`${user} is not officer trained!`).setColor(Colors.Red)],})
        }


        // const member = await interaction.guild.members.fetch(user.id)
        // let robloxUser = await fetch(`https://registry.rover.link/api/guilds/${member.guild.id}/discord-to-roblox/${user.id}`, {
		// 	headers: {
		// 	'Authorization': `Bearer ${config.roverkey}`
		// 	}
		// })
	
		// if (!(robloxUser.status + "").startsWith("2")) {
		// 	if (robloxUser.status === 404) {
		// 		return { error: `<@${this.user_id}> needs to verify using rover!`}
		// 	}
		// 	console.log(robloxUser)
		// 	return { Error: `Error: An error occured with the rover api! error code: ${robloxUser.status} ${robloxUser.statusText}`}
		// }
		// robloxUser = await robloxUser.json()

        // noblox.getRankInGroup(35403813, robloxUser.robloxId).then(async rank => {
        //     if (rank === 0) {
        //         return interaction.reply({embeds: [new EmbedBuilder().setDescription(`${user} is not officer trained!`).setColor(Colors.Red)],})
        //     } else if (rank === 50) {
        //         return interaction.reply({embeds: [new EmbedBuilder().setDescription(`${user}is officer trained!`).setColor(Colors.Green)],})
        //     } else if (rank === 20) {
        //         return interaction.reply({embeds: [new EmbedBuilder().setDescription(`${user} is enrolled in OA but has not passed it!`).setColor(Colors.Orange)],})
        //     } else if (rank === 255) {
        //         return interaction.reply({embeds: [new EmbedBuilder().setDescription(`${user} is exempt from OA!`).setColor(Colors.Purple)],})
        //     } else {
        //         return interaction.reply({embeds: [new EmbedBuilder().setDescription(`${user} is something special in the OA group idk what go check yourself!`).setColor(Colors.Purple)],})
        //     }
        // }).catch(err => {
        //     console.log(err)
        //     return interaction.reply({embeds: [new EmbedBuilder().setDescription(`An error occured while trying to get the rank of the user!`).setColor(Colors.Red)],})
        // })
    }
}
