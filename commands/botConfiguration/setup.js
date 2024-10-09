const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js")
const config = require('../../config.json')
noblox.setCookie(config.sessionCookie)


module.exports = {
	data: new SlashCommandBuilder()
                .setName('setup')
                .setDescription('links the server to the roblox group and configures the divisions exp!')
                .addIntegerOption(option =>
                        option.setName('roblox_group_id')
                                .setDescription('Please input the roblox group id of your roblox group')
                                .setRequired(true)
                )
                .addStringOption(option =>
                        option.setName('division_name')
                                .setDescription('This is a manual overwrite if the DAs has misstyped the division name in the officer tracker!')
                                .setRequired(false)
                )
                .addIntegerOption(option => 
                        option.setName('current_exp')
                                .setDescription('please input the current total exp of your division!')
                                .setRequired(false)
                ),

        async execute(interaction) {
                await interaction.deferReply()
                const embeded_error = new EmbedBuilder().setColor([255,0,0])
                if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) && !interaction.member.user.id === "386838167506124800") {
                        embeded_error.setDescription("Insuficent permissions!")
                        return await interaction.editReply({ embeds: [embeded_error]});
                } 
                const response = await fetch(`https://registry.rover.link/api/guilds/${interaction.guild.id}/discord-to-roblox/${interaction.member.user.id}`, {
                        headers: {
                        'Authorization': `Bearer ${config.roverkey}`
                        }
                })
                if (!(response.status + "").startsWith("2") && interaction.member.user.id !== "386838167506124800") {
                        console.log(response.status)
                        return interaction.editReply( `You need to verify using rover! So that we can verify that you have the correct permissions in the provided group!`);
                }
                 
                const robloxUser = await response.json()
                const group = await noblox.getGroup(interaction.options.getInteger("roblox_group_id")).catch((err) => {
                        embeded_error.setDescription("The group id is invalid!")
                        return interaction.editReply({ embeds: [embeded_error]});
                }) 

                //athenticate the user
                if (group.owner.userId !== robloxUser.robloxId && !interaction.member.user.id === "386838167506124800") {//by pass the check if the user is the owner of the bot. only so that Ererej can help divisions setup their server.
                        embeded_error.setDescription("You are not the owner of the group! please have the owner run this command!")
                        return interaction.editReply({ embeds: [embeded_error]});
                }
                

                
                let server = await db.Servers.findOne({ where: {guild_id: interaction.guild.id}})
                const groupName = interaction.options.getString("division_name") ?? (await noblox.getGroup(interaction.options.getInteger("roblox_group_id"))).name
                if (server) {
                        server.group_id = interaction.options.getInteger("roblox_group_id")
                        server.exp = interaction.options.getInteger("current_exp") ?? server.exp
                        server.name = groupName
                        server.save();
                        const embeded_reply = new EmbedBuilder().setDescription(`Successfully updated the server in the database! \nThe server is linked to the roblox group **${groupName}** \n The divisions name is set to **${server.name}**\nThe division has **${server.exp}**EXP`).setColor([0,255,0])
                        await interaction.editReply({ embeds: [embeded_reply]});
                } else {
                        await db.Servers.create({ guild_id: interaction.guild.id, group_id: interaction.options.getInteger("roblox_group_id"), name: groupName, exp: interaction.options.getInteger("current_exp") ?? 0})
                        const embeded_reply = new EmbedBuilder().setDescription(`Server successfully saved to the database and linked to the roblox group **${groupName}**.`).setColor([0,255,0])
                        await interaction.editReply({ embeds: [embeded_reply]});
                }
        }

}