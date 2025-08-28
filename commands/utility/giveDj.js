const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, Client, Colors } = require('discord.js');
const db = require("../../dbObjects.js")
const noblox = require("noblox.js")


module.exports = {
	data: new SlashCommandBuilder()
        .setName('givedj')
        .setDescription('Gives DJ to a member!')
        .addUserOption(option => 
            option.setName("member")
            .setDescription("The user that you want to give DJ to!")
            .setRequired(true)
        )
        .addBooleanOption(option => 
            option.setName("remove_dj")
            .setDescription("Set this to true to remove the DJ role instead! linhau sucks")
        )
    ,

    guildLock: ["1073682080380243998"],

    async execute(interaction) {
        //interaction.client.emit('guildCreate', interaction.guild)
        await interaction.deferReply() 
        const embeded_error = new EmbedBuilder().setColor(Colors.Red)
        

        const officer = await db.Users.getUser({member: interaction.member, noblox: noblox})

        if (!officer.officer) {
            return interaction.editReply({embeds: [embeded_error.setDescription("You are not an officer!!!!!!!!!!!!!!!")]})
        } 
        
        const user = interaction.options.getUser("member")
        const member = await interaction.guild.members.fetch(user.id)
        if (interaction.options.getBoolean("remove_dj")) {
            await member.roles.remove("1105402999473455134").catch((err) => {
                return interaction.editReply({embeds: [embeded_error.setDescription("An error occured when giving the DJ role!")]})
            })
            return interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.DarkVividPink).setDescription(`Succesfully removed <@&1105402999473455134> from ${member}!`)]})    
        } 

        await member.roles.add("1105402999473455134").catch((err) => {
            return interaction.editReply({embeds: [embeded_error.setDescription("An error occured when giving the DJ role!")]})
        })
        interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.DarkVividPink).setDescription(`Succesfully gave ${member} the <@&1105402999473455134>`)]})
    }
}