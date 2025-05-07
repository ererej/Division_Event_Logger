const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, Colors, MessageFlags,  } = require('discord.js');
const db = require("../../dbObjects.js");
const getGoogleSheet = require('../../utils/getGoogleSheet.js')
const config = require('../../config.json')
const isOfficerTrained = require('../../utils/isOfficerTrained.js')

module.exports = {
	data: new SlashCommandBuilder()
        .setName('validatepromorequest')
        .setDescription('Validates a promo request!')
        ,


    /**
     * @param {import('discord.js').CommandInteraction} interaction
    */

    async execute(interaction) {
		await interaction.deferReply()

		const embeded_error = new EmbedBuilder().setColor(Colors.Red)
        // const promoRequest = interaction.options.getString('promo_request').replaceAll("*", "").toLowerCase()

        await interaction.editReply({embeds: [new EmbedBuilder().setDescription("Please send your promo request Below!").setColor(Colors.Purple)]})
        const collectorFilter = m => m.author.id === interaction.user.id && m.channel.id === interaction.channel.id

        let promoRequest;
        try {
            const collected = await interaction.channel.awaitMessages({ filter: collectorFilter, max: 1, time: 300_000, errors: ['time'] });
            promoRequest = collected.first().content.replaceAll("*", "").toLowerCase();
        } catch (error) {
            return interaction.editReply({embeds: [embeded_error.setDescription("You took too long to send the promo request! Please try again!")]})
        }
        

        if (!promoRequest.includes("division name:") || !promoRequest.includes("list any officers that need to be removed (demoted to wo):") || !promoRequest.includes("list all your division's officer slots and who should be filling them:")) {
            return interaction.editReply({embeds: [embeded_error.setDescription("Invalid promo request! Please make sure it follows the format of a promo request!")]})
        }
        const divisionName = promoRequest.split("division name:")[1].split("list any officers that need to be removed (demoted to wo):")[0].trim()



        const officerTracker = await getGoogleSheet("1sQIT3aOs1dWB9-f8cbsYe7MnSRfCfLRgMDSuE5b3w1I", '[SEA] Division Tracker!A1:B1000')
        if (officerTracker.error) {
            return interaction.editReply({embeds: [embeded_error.setDescription("Couldn't fetch the officer tracker! Error: " + officerTracker.error)]} )
        }
        const officerTrackerRows = officerTracker.data.values

        // Check the people getting demoted to WO
        const demotions = promoRequest.split("list any officers that need to be removed (demoted to wo):")[1].split("list all your division's officer slots and who should be filling them:")[0].trim().split("\n")
        let demoteList = []
        demotions.forEach(demote => {
            if (demote.trim() != "" && demote.trim() != "none") {
                demoteList.push(demote.trim().replaceAll("*", ""))
            }
        })

        let demotionResponses = []
        for (const demote of demoteList) {
            interaction.editReply({embeds: [embeded_error.setDescription(`Validating **${demote}** for demotion`)]})
            const officerRow = officerTrackerRows.find(row => row[1] && row[1].trim().toLowerCase() === demote.trim().toLowerCase())
            if (!officerRow) {
                demotionResponses.push(`❌ **${demote} is not an officer in the division!**`)
            } else {
                let officerRowIndex = officerTrackerRows.indexOf(officerRow)
                while (officerRowIndex > 0) {
                    const previousRow = officerTrackerRows[officerRowIndex - 1]
                    if (!previousRow) {
                        console.log("No previous row found!")
                        break
                    }
                    if (!previousRow[1]) {
                        officerRowIndex--
                        continue
                    }
                    if (previousRow[1].includes("Level")) {
                        if (previousRow[0].toLowerCase().replaceAll("[sea]", "").replaceAll("[pirate]", "").trim() != divisionName.toLowerCase().replaceAll("[sea]", "").replaceAll("[pirate]", "").trim()) {
                            demotionResponses.push(`❌ **${demote} is an officer in ${previousRow[0]} not ${divisionName}!**`)
                        } else {
                            demotionResponses.push(`:arrow_down: **${demote} is an officer in ${divisionName} and can be demoted!**`)
                        }
                        break
                    }
                    officerRowIndex--
                }
            }
        }


        // Check the people getting promoted to officer
        const promotions = promoRequest.split("list all your division's officer slots and who should be filling them:")[1].trim().split("\n")
        
        let promoteList = []
        for (const promote of promotions) {
            if (promote.trim() != "" && promote.trim() != "none") {
                const rowValues = promote.includes("-") ? promote.trim().replaceAll("*", "").split("-") : promote.trim().replaceAll("*", "").split(":")
                if (rowValues.length < 2) {
                    continue
                }
                if (rowValues[0].trim() == "" || rowValues[1].trim() == "") {
                    continue
                }

                promoteList.push({rank: rowValues[0].trim(), name: rowValues[1].trim().split(" ")[0]})
            }
        }

        const rankWorth = {"HR1": 1, "HR2": 2, "HR3": 3, "HC1": 4, "HC2": 5, "HC3": 6}


        let promotionResponses = []
        for (const promote of promoteList) {
            interaction.editReply({embeds: [embeded_error.setDescription(`Validating **${promote.name}** for promotion to **${promote.rank}**`)]})
            const officerRow = officerTrackerRows.find(row => row[1] && row[1].trim().toLowerCase() === promote.name.trim().toLowerCase())
            if (!officerRow) { // is not an officer yet
                // TODO possibly have it check if they are a higher rank in a department then the current rank they are being promoted to
                const isTrained = await isOfficerTrained({userId: promote.name, guildId: interaction.guild.id})
                if (isTrained.error) {
                    promotionResponses.push(`:warning: **${promote.name}** an error occured while checking if they are officer trained! Error: ${isTrained.error}`)
                } else if (isTrained.trained) {
                    promotionResponses.push(`:arrow_up: **${promote.name}** is officer trained and can be promoted to **${promote.rank}**!`)
                } else if (isTrained.enrolled) {
                    promotionResponses.push(`:warning: **${promote.name}** is enrolled in OA but has not passed it yet!`)
                } else if (isTrained.exempt) {
                    promotionResponses.push(`:arrow_up: **${promote.name}** is exempt from OA and can be  to **${promote.rank}**!`)
                } else if (isTrained.special) {
                    promotionResponses.push(`:man_teacher: **${promote.name}** is something special in the OA group idk what go check yourself! (not listed as officer trained or exempt)`)
                } else {
                    promotionResponses.push(`❌ **${promote.name} is not officer trained!**`)
                }

            } else {
                let officerRowIndex = officerTrackerRows.indexOf(officerRow)
                while (officerRowIndex > 0) {
                    const previousRow = officerTrackerRows[officerRowIndex - 1]
                    if (!previousRow) {
                        console.log("No previous row found!")
                        break
                    }
                    if (!previousRow[1]) {
                        officerRowIndex--
                        continue
                    }
                    if (previousRow[1].includes("Level")) {
                        // officer from another division
                        if (previousRow[0].toLowerCase().replaceAll("[sea]", "").replaceAll("[pirate]", "").trim() != divisionName.toLowerCase().replaceAll("[sea]", "").replaceAll("[pirate]", "").trim()) { 
                            if (rankWorth[promote.rank.trim().toLowerCase()] < rankWorth[officerRow[0].trim().toLowerCase()]) {
                                promotionResponses.push(`❌ **${promote.name}** gets an **higher rank** in ${previousRow[0]} than the requested rank in ${divisionName}!`)
                            } else if (rankWorth[promote.rank.trim().toLowerCase()] > rankWorth[officerRow[0].trim().toLowerCase()]) {
                                promotionResponses.push(`:cowboy: **${promote.name}** has **${officerRow[0]}** from ${previousRow[0]} but has been requested **${promote.rank}**!`)
                            } else {
                                promotionResponses.push(`❌ **${promote.name}** has the same rank in **${previousRow[0]}** as the requested one !`)
                            }
                        } else { 
                            // promted / demoted in the same division
                            
                            if (rankWorth[promote.rank.trim().toLowerCase()] < rankWorth[officerRow[0].trim().toLowerCase()]) {
                                promotionResponses.push(`:arrow_down: **${promote.name}** demoted from **${officerRow[0]}** to **${promote.rank}**!`)
                            } else if (rankWorth[promote.rank.trim().toLowerCase()] > rankWorth[officerRow[0].trim().toLowerCase()]) {
                                promotionResponses.push(`:arrow_up: **${promote.name}** promoted from **${officerRow[0]}** to **${promote.rank}**!`)
                            } else {
                                promotionResponses.push(`✅ **${promote.name}** already has the same rank as the requested one!`)
                            }
                        }

                        break
                    }
                    officerRowIndex--
                }
            }
        }

        let finalResponse = `**Division Name:** ${divisionName}\n\n`
        finalResponse += `**Demotions:**\n`
        finalResponse += demotionResponses.join("\n") + "\n\n"
        finalResponse += `**Promotions:**\n`
        finalResponse += promotionResponses.join("\n") + "\n\n"

        const responceEmbed = new EmbedBuilder().setColor(Colors.Green).setTitle("Validated Promo Request!").setDescription(finalResponse)

        return interaction.editReply({embeds: [responceEmbed]})




        /* example of a promo request:
        <@&1096825139804512326>

**Division Name:** Orion's Sentinels

**List any officers that need to be removed (demoted to WO):**
**Ja03252011**
**utebug13**



**List ALL your division's officer slots and who should be filling them:**
HC3 - Jobertry
HC2 - **SnickersAllDay**
HC1 -  AlfieBowzer
HR3 -DIAMONDWHITERR
HR3-
HR3 - 
HR3 -TOKARASK_70
HR2 -
HR2 - 
HR2 - 
HR2 -
HR1-
HR1 - 
HR1 - 
HR1 - 
HR1 - 
HR1 -
HR1 -
HR1 -**jeffyourfa**
HR1 -Normal_do
HR1 -WinterTheboneless


        */

    }
}