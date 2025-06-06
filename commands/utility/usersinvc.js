const { SlashCommandBuilder, EmbedBuilder, Client, Colors } = require('discord.js');
const db = require("../../dbObjects.js")

module.exports = {
	data: new SlashCommandBuilder()
        .setName('usersinvc')
        .setDescription('lists all the people in your Voice Channel!'),

    async execute(interaction) {
        //interaction.client.emit('guildCreate', interaction.guild)
        await interaction.deferReply() 
        const voiceChannel = await interaction.member.voice.channel;
        if (!voiceChannel) {
            return interaction.editReply({content: "You need to be in a voice channel to use this command!"})
        }
        const members = voiceChannel.members;
        const vcList = new EmbedBuilder()
        .setTitle(`${members?.size} People in your Voice Channel:`)
        .setColor(Colors.Blurple)
        let string = "";
        let oneEmbedSent = false;
        members.forEach(async member => {
            if (string.length + member.id.length + 5 > 4096) {
                vcList.setDescription(string)
                if (!oneEmbedSent) {
                    await interaction.editReply({embeds: [vcList]})
                } else {
                    await interaction.followUp({embeds: [vcList]})
                }
                string = ""
                oneEmbedSent = true;
                
            }
            string += "<@" + member.id + ">\n"
        });
        vcList.setDescription(string)
        if (!oneEmbedSent) {
            return interaction.editReply({embeds: [vcList]})
        } else {
            return interaction.followUp({embeds: [vcList]})
        }
    }
}