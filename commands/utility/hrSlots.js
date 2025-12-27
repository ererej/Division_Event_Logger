        const { SlashCommandBuilder, EmbedBuilder, Colors, calculateUserDefaultAvatarIndex } = require('discord.js');
    const noblox = require("noblox.js")
    const config = require('../../config.json')
    const getGoogleSheet = require('../../utils/getGoogleSheet.js')
    const db = require('../../dbObjects.js')
    const getRobloxUser = require('../../utils/getRobloxUser.js');


    module.exports = {
        data: new SlashCommandBuilder()
            .setName('hrslots')
            .setDescription('lets you easily check the hr slots of a division or user!')
            .addUserOption(option => 
                option.setName('user')
                .setDescription('The user you want to check!')
                .setRequired(false))
            .addStringOption(option => 
                option.setName('division_name')
                .setDescription('The division you want to check the hr slots of!')
                .setRequired(false)
                .setAutocomplete(true)
            ),
                

            async autocomplete(interaction) {
                const focusedValue = interaction.options.getFocused();
                const officerTracker = await getGoogleSheet("1sQIT3aOs1dWB9-f8cbsYe7MnSRfCfLRgMDSuE5b3w1I", '[SEA] Division Tracker!A2:E2000')
                const officerTrackerData = officerTracker.data.values
                const divisionNames = officerTrackerData.filter(row => row[3]).map(row => row[0]);
                const filtered = divisionNames.filter(name => name.toLowerCase().replace("[sea]", "").replace("[pirate]", "").trim().includes(focusedValue.toLowerCase().replace("[sea]", "").replace("[pirate]", "").trim()));
                await interaction.respond(
                    filtered.slice(0, 24).map(name => ({ name: name, value: name })),
                );
            },
    //TODO make it so you can check the hr slots of a division

        async execute(interaction) {
            await interaction.deferReply()
            const officerTracker = await getGoogleSheet("1sQIT3aOs1dWB9-f8cbsYe7MnSRfCfLRgMDSuE5b3w1I", '[SEA] Division Tracker!A1:E2000')
            const officerTrackerData = officerTracker.data.values

            if (interaction.options.getUser('user')) {
                const user = interaction.options.getUser('user')
                const member = await interaction.guild.members.fetch(user.id).catch(() => null)
                const robloxUserResponce = await getRobloxUser({MEMBER: member, guildId: interaction.guild.id})
                if (robloxUserResponce.error) {
                    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(robloxUserResponce.error)] });
                }
                const robloxUser = await robloxUserResponce.json().catch(() => null)
                
                if (robloxUser.error) {
                    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(robloxUser.error)] });
                }

                let usersRow = officerTrackerData.find(row => row[1] !== undefined && row[1].trim().toLowerCase() === robloxUser.cachedUsername.trim().toLowerCase())


                let divisionSlotProvider;       
                let currentRow = officerTrackerData.indexOf(usersRow);
                // if in officer tracker
                if (usersRow) {

                    
                    while (officerTrackerData[currentRow][0] !== undefined ) {
                        if (officerTrackerData[currentRow][2]) {
                            divisionSlotProvider = officerTrackerData[currentRow][0]
                        }
                        currentRow--
                    }
                }


                // department side

                const departmentTracker = await getGoogleSheet("1sQIT3aOs1dWB9-f8cbsYe7MnSRfCfLRgMDSuE5b3w1I", '[SEA] Department Tracker!A1:F2000')
                const departmentTrackerData = departmentTracker.data.values
                
                let departmentJob = ""
                let departmentSlot = ""
                let department = ""
                let departmentUsersRow;
                let usersColumn = 0
                while (usersColumn <= 8) {
                    usersColumn++;
                    departmentUsersRow = departmentTrackerData.find(row => row[usersColumn] !== undefined && row[usersColumn].trim().toLowerCase() === robloxUser.cachedUsername.trim().toLowerCase())
                    if (departmentUsersRow) {
                        break;
                    }
                }

                if (departmentUsersRow) {  
                    if (departmentUsersRow[usersColumn-1] !== undefined) {
                        if (departmentUsersRow[usersColumn-1].includes(" - ")) {
                            departmentJob = departmentUsersRow[usersColumn-1].split(" - ")[0].trim();
                            departmentSlot = departmentUsersRow[usersColumn-1].split(" - ")[1].trim();
                        } else {
                            departmentJob = departmentUsersRow[usersColumn-1].trim();
                        }
                    }
                    
                    currentRow = departmentTrackerData.indexOf(departmentUsersRow);
                    while (departmentTrackerData[currentRow][0] !== undefined && currentRow >= 0) {
                        if (!departmentSlot) {
                            if (departmentTrackerData[currentRow][usersColumn] && ["hr1", "hr2", "hr3", "hc1", "hc2", "hc3", "hc3+"].includes(departmentTrackerData[currentRow][usersColumn].toLowerCase()) ) {
                                departmentSlot = departmentTrackerData[currentRow][usersColumn].trim();
                            }
                        }
                        if (!departmentJob) {
                            if (departmentTrackerData[currentRow][usersColumn].includes(" - ")) {
                                departmentJob = departmentTrackerData[currentRow][usersColumn].split(" - ")[1].trim()
                            }
                        }
                        if ((departmentTrackerData[currentRow][0].includes("Department") || departmentTrackerData[currentRow][0] === "Division Administration")  && departmentTrackerData[currentRow][1] === "" && departmentTrackerData[currentRow][3] === "" ) {
                            department = departmentTrackerData[currentRow][usersColumn -1].trim();
                        }
                        if (department && departmentJob && departmentSlot) {
                            break;
                        }
                        currentRow--;
                    }
                    
                }          
                
                if (!departmentSlot && !divisionSlotProvider) {
                    return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`No HR slot found for ${robloxUser.cachedUsername}!`)] });
                }

                const responceEmbed = new EmbedBuilder()
                    .setColor(Colors.DarkGreen)
                    .setTitle(`${robloxUser.cachedUsername.toUpperCase()}'s HR Slot(s)`)
                    .setDescription(`**Division:** ${divisionSlotProvider || "No HR slot found for this user!"}\n **Slot:** ${usersRow ? usersRow[0] : "No HR slot found for this user!"} \n\n**Department:** ${department || "No department found for this user!"}\n**Job:** ${departmentJob || "No job found for this user!"}\n**Slot:** ${departmentSlot || "No slot found for this user!"}`)
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
                    description += `${officerTrackerData[currentRow][0]} - ${officerTrackerData[currentRow][1] || ""}\n` 
                    currentRow++;
                }

                interaction.editReply({ 
                    embeds: [responceEmbed.setDescription(description || "No HR slots found for this division!")]
                });
            }
        }   
    }
