const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, PermissionsBitField, Colors } = require('discord.js');
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


    /**
     * @param {import('discord.js').CommandInteraction} interaction
    */

    async execute(interaction) {
        await interaction.deferReply()
        const embeded_error = new EmbedBuilder().setColor([255,0,0])
        
        if (config.host !== "server" && interaction.user.id != "386838167506124800") {
            embeded_error.setDescription("This command is currently disabled as the bot is running on Ererejs computer! Please try again later!")
            return await interaction.editReply({ embeds: [embeded_error]});
        }

        if (interaction.guild.id == "831851819457052692") {
            embeded_error.setDescription("You are not paying for premium in this server!!!!!!!")
            return await interaction.editReply({ embeds: [embeded_error]});
        }

        const server = await db.Servers.findOne({where: {guild_id: interaction.guild.id}})
        if (server == null) {
            embeded_error.setDescription("The server is not in the database! Please run the /setup command!")
            return await interaction.editReply({ embeds: [embeded_error]});
        }

        const botGroups = await noblox.getUserGroups(5860759846)
        const testingServer = interaction.client.guilds.cache.get("831851819457052692")

		if (botGroups.filter(group => group.group.id == server.group_id).length == 0) {// checks that the bot account is in the group.
            embeded_error.setDescription("Before you can activate premium you need to get a bot account in the roblox group and give it a high rank with the permissions to change peoples roles. Ererej has been notified and will add the bot account to the group soon(within 3 days) he will then contact you telling you that you can run the command again!")
            
            const groupJoinRequestChannel = testingServer.channels.cache.get("1327782299936489523")
            groupJoinRequestChannel.send(`The server with the id ${interaction.guild.name} has requested that the bot join the group with the id ${server.group_id} link: https://www.roblox.com/communities/${server.group_id} <@${386838167506124800}>`)

            return await interaction.editReply({ embeds: [embeded_error]});
		} 

        const ticketPrices = {"1298023132027944980": 0.99, "1384130405560615002": 2.99, "1383014678002667571": 4.99}
        
        let pricePerTicket = 0.99 
        const premiumRedeemLogsChannel = testingServer.channels.cache.get("1328990301565616250")
        if (interaction.options.getString('code') == null) {

            const entitelments = (await interaction.client.application.entitlements.fetch()).filter(e => e.userId === interaction.user.id && (e.skuId === '1298023132027944980' || e.skuId === "1383014678002667571" || e.skuId === "1384130405560615002") && e.consumed === false)
            console.log("Entitelments: ", entitelments)
            if (entitelments.size < 1) {
                const premiumButton1 = new ButtonBuilder() // Button linking to the store page for premium tickets
                    .setStyle(6)
                    .setSKUId('1298023132027944980')
                const premiumButton3 = new ButtonBuilder() // Button linking to the store page for premium tickets
                    .setStyle(6)
                    .setSKUId('1384130405560615002')
                const premiumButton5 = new ButtonBuilder() // Button linking to the store page for premium tickets
                    .setStyle(6)
                    .setSKUId('1383014678002667571')
                const row = new ActionRowBuilder().addComponents([premiumButton1, premiumButton3, premiumButton5])

                return await interaction.editReply({ embeds: [embeded_error.setDescription("You dont have any premium tickets. You can buy one here")], components: [row]}) 
            }


            let ticket = entitelments.first()
            let pricePerTicket = ticketPrices[ticket.skuId]

            if (entitelments.size > 1) {
                const ticketRow = new ActionRowBuilder()
                if (entitelments.find(e => e.skuId === "1298023132027944980")) {
                    const ticketButton1 = new ButtonBuilder()
                    .setStyle(1)
                    .setCustomId('ticketButton1')
                    .setLabel(`${ticketPrices["1298023132027944980"]}$`)
                    ticketRow.addComponents([ticketButton1])
                }
                if (entitelments.find(e => e.skuId === "1384130405560615002")) {
                    const ticketButton3 = new ButtonBuilder()
                    .setStyle(1)
                    .setCustomId('ticketButton3')
                    .setLabel(`${ticketPrices["1384130405560615002"]}$`)
                    ticketRow.addComponents([ticketButton3])
                }
                if (entitelments.find(e => e.skuId === "1383014678002667571")) {
                    const ticketButton5 = new ButtonBuilder()
                    .setStyle(1)
                    .setCustomId('ticketButton5')
                    .setLabel(`${ticketPrices["1383014678002667571"]}$`)
                    ticketRow.addComponents(ticketButton5)
                }
                const responce = await interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.DarkVividPink).setDescription(`You have ${entitelments.size} Tickets which one do you want to use?`)], components: [ticketRow]})
                const collectorFilter = i => i.customId.startsWith("ticketButton") && i.user.id === interaction.user.id
                try {
                    const confirmation = await responce.awaitMessageComponent({ Filter: collectorFilter, time: 300_000 })
                    confirmation.deferUpdate()
                    if (confirmation.customId === 'ticketButton1') {
                        pricePerTicket = ticketPrices["1298023132027944980"]
                        ticket = entitelments.find(e => e.skuId === "1298023132027944980")

                    } else if (confirmation.customId === 'ticketButton3') {
                        pricePerTicket = ticketPrices["1384130405560615002"]
                        ticket = entitelments.find(e => e.skuId === "1384130405560615002")

                    } else if (confirmation.customId === 'ticketButton5') {
                        pricePerTicket = ticketPrices["1383014678002667571"]
                        ticket = entitelments.find(e => e.skuId === "1383014678002667571")
                    }
                    
                } catch (error) {
                    if (error.message === "Collector received no interactions before ending with reason: time") {
                        return interaction.editReply({embeds: [embeded_error.setDescription("No responce was given in within 5 minutes, cancelling!")], components: []})
                    } else {
                            throw error
                    }
                }
            }

            const memberCount = interaction.guild.memberCount

            const pricePerMounth = 1.99 + Math.floor(memberCount / 250) * 0.1
            const daysToAdd = pricePerTicket/pricePerMounth * 30

            const currentTime = new Date()

            if (server.premium_end_date == null || server.premium_end_date < currentTime) {
                server.premium_end_date = new Date(currentTime.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
            } else {
                server.premium_end_date = new Date(server.premium_end_date.getTime() + daysToAdd * 24 * 60 * 60 * 1000);
            }


            await server.save()
            await ticket.consume() // Consumes the ticket so it can't be used again
            await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`You have activated premium for ${Math.round(daysToAdd)} days! It will end in ${Math.round((server.premium_end_date - currentTime.getTime())/ (24 * 60 * 60 * 1000))} days. Price per month for your div is ${pricePerMounth}$ the price increses with 0.2$ for every 500 members you get\nYou have ${entitelments.size - 1} tickets left!\nThanks for supporting me and my bot!`).setColor([255, 105, 180])], components: []})

            await premiumRedeemLogsChannel.send(`User: ${interaction.user} id: ${interaction.user.id} has used a ${pricePerTicket}$ ticket to activate premium for ${daysToAdd} days! \nPrice per month: ${pricePerMounth}$ \nGuild: ${interaction.guild.name} id: ${interaction.guild.id}!`)

        } else {
            const code = interaction.options.getString('code')

            const premiumCode = await db.PremiumCodes.findOne({where: {code: code}})
            if (premiumCode == null) {
                embeded_error.setDescription("The code you entered is not valid! If you are not 100% sure that you have a code then **you dont have one** so rerun this command without inputing a code! ")
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
                const pricePerMounth = 1.99 + Math.floor(memberCount / 250) * 0.1
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

                await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`You have a ${premiumCode.amount}$ code that activated premium for ${Math.round(daysToAdd)} days! It will end in ${Math.round((server.premium_end_date - currentTime.getTime())/ (24 * 60 * 60 * 1000))} days. Price per month for your div is ${pricePerMounth}$ the price increses with 0.2$ for every 500 members you get\nThanks for supporting me and my bot!`).setColor([255, 105, 180])]})

                await premiumRedeemLogsChannel.send(`User: ${interaction.user} id: ${interaction.user.id} has used the code **${code}** worth ${premiumCode.amount}$ to activate premium for ${Math.round(daysToAdd)} days! \nPrice per month: ${pricePerMounth}$ \nGuild: ${interaction.guild.name} id: ${interaction.guild.id}!`)

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