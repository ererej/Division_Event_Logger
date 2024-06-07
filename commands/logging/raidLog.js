const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField } = require('discord.js');

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
        .addBooleanOption(option =>
            option.setName('win')
                .setDescription('Did you win?')
                .setRequired(true)
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
		const embeded_error = new EmbedBuilder().setColor([255,0,0])
		if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)) {
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
        const win = interaction.options.getBoolean('win')
        const server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } })
        const division_name = server.name || interaction.guild.name   
        let allys_name = ""
        if (interaction.options.getString('allys_name')) {
            allys_name = ", " + interaction.options.getString('allys_name')
        }
        const raid_discutions = interaction.options.getAttachment('raid_discutions')
        const time = new Date()
        const date = `${time.getDate()}/${time.getMonth()+1}/${time.getFullYear()}`
        if (!allys_name) {
            allys_name = ""
        }
        let winner = ""
        if (win) {
            winner = division_name + " " + allys_name + " "
        } else {    
            winner = enemy_division
        }
        const dbChannel = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "sealogs" } })
        if (!dbChannel.id) {
            return await interaction.editReply({ content: 'There is no sealog channel linked in this server! Please ask an admin to link one using </linkchannel:1246002135204626454>', ephemeral: true });
        }
        const sea_format_channel = await interaction.guild.channels.fetch(dbChannel.id)
        
        sea_format_channel.send(`VVV <#980566115187048499> VVV`)
        if (raid_discutions === null) {
            await sea_format_channel.send({ content: `Division(s): ${division_name} ${allys_name}VS  ${enemy_division} \nVictory: ${winner}\nMap: ${map}\nDate: ${date}\nScreenshot: `, files: [{attachment: resoult.url}]});
        
        } else {
            await sea_format_channel.send({ content: ` <@186267447001612289> \nDivision(s): ${interaction.guild.name + " " + allys_name}\nEnemy Group: ${enemy_division} \nResoult: ${winner} \nMap: ${map}\nDate: ${date}\nProof: `, files: [{attachment: resoult.url}, {attachment: raid_discutions.url}]});
        }
        const embedReply = new EmbedBuilder()
        .setColor([0,255,0])
        .setDescription("format succesfully logged!")
        interaction.editReply({ embeds: [embedReply]})
        } catch (error) {
            const embededError = new EmbedBuilder()
            .setColor([255,0,0])
            .setDescription("logging failed!")
            await interaction.editReply({ embeds: [embededError]})
        }
}}}