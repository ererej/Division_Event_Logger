const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js")
const noblox = require("noblox.js") 
const config = require("../../config.json")

module.exports = {
	data: new SlashCommandBuilder()
        .setName('useticket')
        .setDescription('deletes all the users from the database!')
        .addStringOption(option =>
            option.setName('code')
                .setDescription('Have you gotten a premium code from Ererej? congrats you can use it here!')
                .setRequired(false)),

    testerLock: true,

    /**
     * @param {import('discord.js').CommandInteraction} interaction
    */

    async execute(interaction) {
        await interaction.deferReply()
        const embeded_error = new EmbedBuilder().setColor([255,0,0])
        
        if (config.host == "host" && interaction.user.id != "386838167506124800") {
            embeded_error.setDescription("This command is currently disabled as the bot is running on Ererejs computer! Please try again later!")
            return await interaction.editReply({ embeds: [embeded_error]});
        }

        const server = await db.Servers.findOne({where: {guild_id: interaction.guild.id}})
        if (server == null) {
            embeded_error.setDescription("The server is not in the database! Please run the setup command!")
            return await interaction.editReply({ embeds: [embeded_error]});
        }

        const botGroups = await noblox.getGroups(5860759846)
        const testingServer = interaction.client.guilds.cache.get("831851819457052692")

		if (botGroups.filter(group => group.Id == server.group_id).length == 0) {// add a check that the bot account is in the group.
            embeded_error.setDescription("Before you can activate premium you need to get a bot account in the roblox group and give it a high rank with the permissions to change peoples roles. Ererej has been notified and will add the bot account to the group soon(within 3 days) he will then contact you telling you that you can run the command again!")
            
            const groupJoinRequestChannel = testingServer.channels.cache.get("1327782299936489523")
            groupJoinRequestChannel.send(`The server with the id ${interaction.guild.name} has requested that the bot join the group with the id ${server.group_id} link: https://www.roblox.com/communities/${server.group_id} <@${386838167506124800}>`)

            return await interaction.editReply({ embeds: [embeded_error]});
		} 


        const pricePerTicket = 0.99
        const premiumRedeemLogsChannel = testingServer.channels.cache.get("1328990301565616250")
        if (interaction.options.getString('code') == null) {

            const entitelments = (await interaction.client.application.entitlements.fetch()).filter(e => e.userId === interaction.user.id && e.skuId === '1298023132027944980' && e.consumed === false)
            if (entitelments.size < 1) {
                const premiumButton = new ButtonBuilder()
                    .setStyle(6)
                    .setSKUId('1298023132027944980')
                const row = new ActionRowBuilder().addComponents(premiumButton)

                embeded_error.setDescription({ embeds: [embeded_error.setDescription("You dont have any premium tickets. You can buy one here")], components: [row]}) //add a link to the store to buy tickets
                return await interaction.editReply({ embeds: [embeded_error]});
            }
            

            const memberCount = interaction.guild.memberCount

            const pricePerMounth = 0.99 + Math.floor(memberCount / 500) * 0.2
            const daysToAdd = pricePerTicket/pricePerMounth * 30

            const currentTime = new Date()

            if (server.premium_end_date == null || server.premium_end_date < currentTime) {
                server.premium_end_date = new Date(currentTime.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
            } else {
                server.premium_end_date = new Date(server.premium_end_date.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
            }


            await server.save()
            await entitelments.first().consume()
            await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`You have activated premium for ${Math.round(daysToAdd)} days! It will end in ${Math.round((server.premium_end_date - currentTime.getTime())/ (24 * 60 * 60 * 1000))} days. Price per mounth for your div is ${pricePerMounth}$ the price increses with 0.2$ for every 500 members you get\nYou have ${entitelments.size - 1} tickets left!\nThanks for supporting me and my bot!`).setColor([255, 105, 180])]})

            await premiumRedeemLogsChannel.send(`User: ${interaction.user} id: ${interaction.user.id} has used a ticket to activate premium for ${daysToAdd} days! \nPrice per mounth: ${pricePerMounth}$ \nGuild: ${interaction.guild.name} id: ${interaction.guild.id}!`)

        } else {
            const code = interaction.options.getString('code')

            const premiumCode = await db.PremiumCodes.findOne({where: {code: code}})
            if (premiumCode == null) {
                embeded_error.setDescription("The code you entered is not valid!")
                return await interaction.editReply({ embeds: [embeded_error]});
            }

            if (premiumCode.uses == 0) {
                embeded_error.setDescription("The code you entered has no uses left!")
                return await interaction.editReply({ embeds: [embeded_error]});
            }
            
            if (premiumCode.expires < new Date()) {
                embeded_error.setDescription("The code you entered has expired!")
                return await interaction.editReply({ embeds: [embeded_error]});
            }

            if (premiumCode.type == "money") {
                const memberCount = interaction.guild.memberCount
                const pricePerMounth = 1 + Math.floor(memberCount / 500) * 0.2
                const daysToAdd = premiumCode.amount/pricePerMounth * 30

                const currentTime = new Date()

                if (server.premium_end_date == null || server.premium_end_date < currentTime) {
                    server.premium_end_date = new Date(currentTime.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
                } else {
                    server.premium_end_date = new Date(server.premium_end_date.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
                }

                await server.save()
                premiumCode.uses -= 1
                await premiumCode.save()

                await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`You have a ${premiumCode.amount}$ code that activated premium for ${Math.round(daysToAdd)} days! It will end in ${Math.round((server.premium_end_date - currentTime.getTime())/ (24 * 60 * 60 * 1000))} days. Price per mounth for your div is ${pricePerMounth}$ the price increses with 0.2$ for every 500 members you get\nThanks for supporting me and my bot!`).setColor([255, 105, 180])]})

                await premiumRedeemLogsChannel.send(`User: ${interaction.user} id: ${interaction.user.id} has used the code **${code}** worth ${premiumCode.amount}$ to activate premium for ${Math.round(daysToAdd)} days! \nPrice per mounth: ${pricePerMounth}$ \nGuild: ${interaction.guild.name} id: ${interaction.guild.id}!`)

            } else {
                const currentTime = new Date()
                const daysToAdd = premiumCode.amount

                if (server.premium_end_date == null || server.premium_end_date < currentTime) {
                    server.premium_end_date = new Date(currentTime.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
                } else {
                    server.premium_end_date = new Date(server.premium_end_date.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
                }

                await server.save()
                premiumCode.uses -= 1
                await premiumCode.save()

                await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`You have a ${premiumCode.amount} day code that activated premium for ${premiumCode.amount} days! It will end in ${Math.round((server.premium_end_date - currentTime.getTime())/ (24 * 60 * 60 * 1000))} days\nThanks for supporting me and my bot!`).setColor([255, 105, 180])]})
                
                await premiumRedeemLogsChannel.send(`User: ${interaction.user} id: ${interaction.user.id} has used the code **${code}** worth ${premiumCode.amount} days to activate premium \nGuild: ${interaction.guild.name} id: ${interaction.guild.id}!`)
            }

        }
    }
}