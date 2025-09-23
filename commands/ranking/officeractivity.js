const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const db = require("../../dbObjects.js")
const sequelize = require("sequelize");
const { premiumLock } = require('../fun/blackJack.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('officeractivity')
        .setDescription('Shows the last time an officer was active in the server')
        .addRoleOption(option => 
            option.setName('rank')
            .setDescription('Want to only check activity of a all officers with a specific rank? select it here!')
            .setRequired(false)),

    premiumLock: true,
        
    async execute(interaction) {
        await interaction.deferReply()

        let officers = await db.Officers.findAll({ where: { 
                guild_id: interaction.guild.id, 
                retired: null,        
            },
            include: [{
                model: db.Users,
                as: 'user',
                required: true,
                on: db.sequelize.literal('`officers`.`user_id` = `user`.`user_id` AND `officers`.`guild_id` = `user`.`guild_id`'),
            }],
         })
        
        officers.forEach(officer => {
            Object.setPrototypeOf(officer.user, db.Users.prototype);
        });

        if (interaction.options.getRole('rank')) {
            
            officers = officers.filter(officer => officer.user.rank_id === interaction.options.getRole('rank').id)
        } 
        
        if (new Set(officers.map(officer => officer.user.user_id)).size !== officers.length) {
            console.log("Duplicate officers found!")
            officers = officers.filter((officer, index, self) => 
                index === self.findIndex((o) => (
                    o.user.user_id === officer.user.user_id
                ))
            )
        }

        if (officers.length === 0) {
            return interaction.editReply("No officers found!")
        }
        const officerActivityEmbed = new EmbedBuilder()
            .setTitle('Officer Activity')
            .setColor(Colors.Purple)
        

        const events = await db.Events.findAll({ where: { guild_id: interaction.guild.id } })
        
        let description = interaction.options.getRole('rank') ? `**Officers with rank <@&${interaction.options.getRole('rank').id}>**\n` : "**All officers**\n"
        description += `Total officers: ${officers.length}\n\n`
        for (const officer of officers) {
            const officersEvents = events.filter(event => event.host === officer.user.user_id)
            const lastEventHosted = officersEvents.length == 0 ? null : officersEvents.reduce((latest, event) => {
                if (event.host === officer.user.id && event.createdAt > latest.createdAt) {
                    return event
                }
                return latest
            })
            const lastEventAttended = events.find(event => event.id == officer.user.events.split(",").pop())
            
            
            description += `**<@${officer.user.user_id}>**\n`
            description += `Last event hosted: ${lastEventHosted ? `ID: ${lastEventHosted.id} Timestamp: <t:${Math.round(lastEventHosted.createdAt.getTime()/1000)}:D>`  : "None"}\n`
            description += `Last event attended: ${lastEventAttended ? `ID: ${lastEventAttended.id} Timestamp: <t:${Math.round(lastEventAttended.createdAt.getTime()/1000)}:D>` : "None"}\n`
            description += "\n\n"
        }
        if (!description || description.trim().length === 0) {
            return interaction.editReply("No activity data available to display.");
        }

    
        const maxEmbedLength = 4096;
        const chunks = [];
        while (description.length > 0) {
            chunks.push(description.substring(0, maxEmbedLength));
            description = description.substring(maxEmbedLength);
        }


        if (chunks.length > 0) {
            await interaction.editReply({ embeds: [officerActivityEmbed.setDescription(chunks.shift())]});
        }

        for (const chunk of chunks) {
            if (chunk.trim().length === 0) {
                continue;
            }
            await interaction.followUp({ embeds: [new EmbedBuilder().setColor(Colors.Purple).setDescription(chunk)] }).catch(err => {
                console.log("Error sending follow-up: " + err);
            });
        }
    }
}