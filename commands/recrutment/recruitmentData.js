const { SlashCommandBuilder, EmbedBuilder, Colors, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('recruitmentdata')
        .setDescription('Shows the recruitment data for the selected users!')
        .addRoleOption(option =>
            option.setName('recruiter_role')
                .setDescription('select the role to show the recruitment data for')
                .setRequired(false)
            )
        .addUserOption(option =>
            option.setName('recruiter')
                .setDescription('select the user to show the recruitment data for')
                .setRequired(false)
            )
        .addStringOption(option => 
            option.setName('timerange')
                .setDescription('The time range to check the recruitment data for')
                .addChoices(
                    { name: 'week', value: JSON.stringify([0, 7 * 24 * 60 * 60 * 1000]) },
                    { name: 'month', value: JSON.stringify([0, 30 * 24 * 60 * 60 * 1000]) },
                    { name: 'last whole week', value: JSON.stringify(["last whole week", 7 * 24 * 60 * 60 * 1000]) },
                    { name: 'last whole month', value: JSON.stringify(["last whole month", 30 * 24 * 60 * 60 * 1000]) },
                    { name: 'current week', value: JSON.stringify(["current week", 0]) },
                    { name: 'current month', value: JSON.stringify(["current month", 0]) },
                    { name: 'last week', value: JSON.stringify([7 * 24 * 60 * 60 * 1000, 2 * 7 * 24 * 60 * 60 * 1000]) },
                    { name: 'last month', value: JSON.stringify([30 * 24 * 60 * 60 * 1000, 2 * 30 * 24 * 60 * 60 * 1000]) },
                    { name: 'previous whole week', value: JSON.stringify(["previous whole week", 7 * 24 * 60 * 60 * 1000]) },
                    { name: 'previous whole month', value: JSON.stringify(["previous whole month", 30 * 24 * 60 * 60 * 1000]) },
                    
                )
        ),
    premiumLock: true,

    /**
     * @param {import('discord.js').CommandInteraction} interaction
    */
    
    async execute(interaction) {
        await interaction.reply("fetching data")
        const embeded_error = new EmbedBuilder().setColor(Colors.Red)

        const recruiterRole = interaction.options.getRole('recruiter_role')
        const selectedRecruiter = interaction.options.getUser('recruiter')
        if (!selectedRecruiter && !recruiterRole) {
            return interaction.editReply({ embeds: [embeded_error.setDescription("You must select either a user or a role to get recruitment data for!")] });
        }
        
        if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator || PermissionsBitField.Flags.ManageRoles) && (recruiterRole || selectedRecruiter.id !== interaction.user.id)) {
            return interaction.editReply({ embeds: [embeded_error.setDescription("You do not have permission to use this command on other people then youself!")] });
        }

        if (recruiterRole && selectedRecruiter) {
            return interaction.editReply({ embeds: [embeded_error.setDescription("You can only select either a user or a role not both at the same time!")] });
        }




        const timerange = interaction.options.getString('timerange')
        let [start, end] = [0, 7 * 24 * 60 * 60 * 1000]
        let startTime;
        let endTime;
        if (timerange ) {
            
            start = JSON.parse(timerange)[0]
            end = JSON.parse(timerange)[1]
            const today = new Date()
            if (start === "last whole week") {
                startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1 - 7)
                endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1)
            }
            if (start === "last whole month") {
                startTime = new Date(today.getFullYear(), today.getMonth() - 1)
                endTime = new Date(today.getFullYear(), today.getMonth(), 0)
                end = 30 * 24 * 60 * 60 * 1000
            }
            if (start === "current week") {
                startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1)
                endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1 + 7)
            }
            if (start === "current month") {
                startTime = new Date(today.getFullYear(), today.getMonth())
                endTime = new Date(today.getFullYear(), today.getMonth() + 1, 0)
            }
            if (start === "previous whole week") {
                startTime = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1 - 14)
                endTime = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 1 - 7)
            }
            if (start === "previous whole month") {
                startTime = new Date(today.getFullYear(), today.getMonth() - 2)
                endTime = new Date(today.getFullYear(), today.getMonth() - 1, 0)
            }
        }
        
        
        

        if (!startTime) {
            startTime =  new Date(new Date() - end)
        }
        if (!endTime) {
            endTime = new Date(new Date() - start)
        }




        let recruiters = [interaction.member]

        
        if (recruiterRole) {
            const members = await interaction.guild.members.fetch()
            recruiters = members.filter(member => member.roles.cache.has(recruiterRole.id))
            if (recruiters.size === 0) {
                return interaction.editReply({ embeds: [embeded_error.setDescription("No users found with the selected role!")] });
            }
            if (recruiters.size > 100) {
                return interaction.editReply({ embeds: [embeded_error.setDescription("Too many users found with the selected role! Please select a user or a smaller role!")] });
            }
        }

        if (selectedRecruiter) {
            recruiters = [interaction.guild.members.cache.get(selectedRecruiter.id)]
        }


        let recruiterFeilds = []
        let totalRecruits = 0


        for (const recruiter of recruiters.values()) {
            if (!recruiter) continue
            if (!recruiter.user) continue
            if (!recruiter.user.id) continue
            const lifeTimeRecruits = await db.Users.findAll({ where: { guild_id: interaction.guild.id, recruted_by: recruiter.id } })
            const recruits = lifeTimeRecruits.filter(recruit => recruit.join_date > startTime && recruit.join_date < endTime)
            totalRecruits += recruits.length
            const dbRecruiter = await db.Users.findOne({ where: { user_id: recruiter.id, guild_id: interaction.guild.id } });

            const title = '\u200b'
            let description = `<@${recruiter.id}>\n${dbRecruiter ? "<@&" + dbRecruiter.rank_id + ">" : "Recruiter not in the database?!?!?"}\n`
                + `**Recruits:** ${recruits.length} \n`
                + `**Life time recruits:** ${lifeTimeRecruits.length} \n`

            

            recruiterFeilds.push({ name: title, value: description, inline: true })
        }

        interaction.editReply({ embeds: [new EmbedBuilder().setColor(Colors.Purple).setDescription("sending the data in a moment!")] })

        let description = `*<t:${Math.round(startTime.getTime()/1000)}:D> - <t:${Math.round(endTime.getTime()/1000)}:D>*\n\n`
            + `**Total recruits:** ${totalRecruits} \n`
        let graphs = []

        let embed = new EmbedBuilder()
                    .setTitle("Recruitment data")
                    .setDescription(description)
                    .setColor([0, 255, 0])
                    
        let length = embed.data.title.length + embed.data.description.length

        let amountOfFields = 0
        for (let field of recruiterFeilds) {
            amountOfFields += 1
            if (length + field.name.length + field.value.length > 6000 || amountOfFields === 25) { 
                await interaction.followUp({ embeds: [embed], files: graphs.map(g => g.attachment) })
                for (let graph of graphs) {
                    fs.unlinkSync(graph.filePath)
                }
                graphs = []
                embed = new EmbedBuilder()
                .setColor([0, 255, 0])
                length = 0
                amountOfFields = 0
            }
            length += field.name.length + field.value.length
            embed.addFields(field)
        };


        await interaction.followUp({ embeds: [embed], files: graphs.map(g => g.attachment) })

        //remove the graph files
        for (let graph of graphs) {
            fs.unlinkSync(graph.filePath)
        }

    }
}