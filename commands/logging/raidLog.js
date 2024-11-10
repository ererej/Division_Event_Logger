const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const log = require('./log.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('raidlog')
		.setDescription('create the format for logging raids!')
        .addStringOption(option => 
            option.setName('enemy_division')
                .setDescription('Give the name of the enemy division(s) here!')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('map')
                .setDescription('Give the name of the map the raid was played on!')
                .setRequired(true)
        )
        .addAttachmentOption(option => 
            option.setName('resoult')
                .setDescription('Paste in the picture of the resoult!')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('win')
                .setDescription('Did you win?')
                .setRequired(true)
                .addChoices(
                    { name: 'win', value: 'win'},
                    { name: 'loss', value: 'loss'}
                )
        )
        .addStringOption(option =>
            option.setName('allys_name')
                .setDescription('Give the name of the ally divisions here!')
                .setRequired(false)
        )
        .addAttachmentOption(option => 
            option.setName('raid_discutions')
                .setDescription('The raid will be logged as an outside raid if you fill out this feild!')
                .setRequired(false)
        ),

	async execute(interaction) {
        await interaction.deferReply()
        let dbLogger = await db.Users.findOne({ where: { guild_id: interaction.guild.id } })
        const updateResponce = await dbHost.updateRank(noblox, server.group_id, host) ?? ""
        if (dbHost.rank_id === null) {
            dbHost.destroy()
            return interaction.editReply({embeds: [embeded_error.setDescription("Couldn't verify your permissions due to not being able to verify your rank!")]})
        }
        
        if (updateResponce) {
            interaction.followUp({embeds: [new EmbedBuilder().setColor(Colors.Blue).setDescription("Your rank was updated: " + updateResponce)]})
        }

		const embeded_error = new EmbedBuilder().setColor([255,0,0])
		if (!(await dbLogger.getRank()).is_officer && !interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)) {
            embeded_error.setDescription("Insuficent permissions!")
            await interaction.editReply({ embeds: [embeded_error]});
		} else {
        try {
        const enemy_division = interaction.options.getString('enemy_division')
        let map = interaction.options.getString('map')
        switch (map.toLowerCase()) {
            case "tb3":
                map = "Trident Battlegrounds III"
                break;
            case "tb2":
                map = "Trident Battlegrounds 2"
                break;
            case "bermuda":
                map = "Bermuda Air Base"
                break;
        }
        const resoult = interaction.options.getAttachment('resoult')
        const win = interaction.options.getString('win')
        const server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
        const division_name = server ? server.name : interaction.guild.name
        let allys_name = ""
        if (interaction.options.getString('allys_name')) {
            allys_name = ", " + interaction.options.getString('allys_name')
        }
        const raid_discutions = interaction.options.getAttachment('raid_discutions')
        const time = new Date()
        const date = `${time.getDate()}/${time.getMonth()+1}/${time.getFullYear()}`
        if (!allys_name) {
            allys_name = " "
        }
        let winner = ""
        if (win === "win") {
            winner = division_name + allys_name
        } else {    
            winner = enemy_division
        }
        const dbChannel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "raidlogs" } })

        const sea_format_channel = dbChannel ? await interaction.guild.channels.fetch(dbChannel.channel_id) : interaction.channel
        
        sea_format_channel.send(`VVV <#980566115187048499> VVV`)
        let logMessage;
        if (raid_discutions === null) {
            logMessage = await sea_format_channel.send({ content: `Division(s): ${division_name}${allys_name} VS  ${enemy_division} \nVictory: ${winner}\nMap: ${map}\nDate: ${date}\nScreenshot: `, files: [{attachment: resoult.url}]});
        
        } else {
            logMessage = await sea_format_channel.send({ content: ` <@624633098583408661> \nDivision(s): ${division_name + allys_name}\nEnemy Group: ${enemy_division} \nResoult: ${winner} \nMap: ${map}\nDate: ${date}\nProof: `, files: [{attachment: resoult.url}, {attachment: raid_discutions.url}]});
        }
        if (!dbChannel) {
            return await interaction.editReply({ content: 'If you want the raidlogs to always go to a spesific channel then use this command </linkchannel:1246002135204626454>', ephemeral: true });
        }
        const embedReply = new EmbedBuilder()
        .setColor([0,255,0])
        .setDescription(`format succesfully logged! https://discord.com/channels/${logMessage.guild.id}/${logMessage.channel.id}/${logMessage.id}`)
        interaction.editReply({ embeds: [embedReply]})
        } catch (error) {
            const embededError = new EmbedBuilder()
            .setColor([255,0,0])
            .setDescription("logging failed!")
            await interaction.editReply({ embeds: [embededError]})
        }
}}}