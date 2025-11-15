const getRobloxUser = require("./getRobloxUser");
const getGoogleSheet = require('./getGoogleSheet.js')
const { EmbedBuilder, Colors } = require('discord.js');

module.exports = async (userId, robloxUser) => {
    const member = await interaction.guild.members.fetch(userId).catch(() => null)
    if (!robloxUser) {
        const robloxUserResponce = await getRobloxUser({MEMBER: member, guildId: interaction.guild.id})
        if (robloxUserResponce.error) {
            return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(robloxUserResponce.error)] });
        }
        const robloxUser = await robloxUserResponce.json().catch(() => null)
        
        if (robloxUser.error) {
            return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(robloxUser.error)] });
        }
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
        return interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`No HR slot found for this user!`)] });
    }

    const responceEmbed = new EmbedBuilder()
        .setColor(Colors.DarkGreen)
        .setTitle(`${robloxUser.cachedUsername.toUpperCase()}'s HR Slot(s)`)
        .setDescription(`**Division:** ${divisionSlotProvider || "No HR slot found for this user!"}\n **Slot:** ${usersRow ? usersRow[0] : "No HR slot found for this user!"} \n\n**Department:** ${department || "No department found for this user!"}\n**Job:** ${departmentJob || "No job found for this user!"}\n**Slot:** ${departmentSlot || "No slot found for this user!"}`)
    interaction.editReply({ embeds: [responceEmbed] });
}