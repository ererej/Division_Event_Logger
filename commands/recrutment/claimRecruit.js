const { SlashCommandBuilder, EmbedBuilder, Colors, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js");
const config = require('../../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('claimrecruit')
        .setDescription('Claim a recruit')
        .addUserOption(option =>
            option.setName('recruit')
                .setDescription('Select your new recruit!')
                .setRequired(true)),

    /**
     * @param {import('discord.js').CommandInteraction} interaction
    */
    async execute(interaction) {
        const recruit = interaction.guild.members.cache.get(interaction.options.getUser('recruit').id)
        const recruiter = interaction.member;

        const embeded_error = new EmbedBuilder().setColor(Colors.Red)

        const server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } });
        if (!server) {
            return await interaction.reply({ embeds: [ embeded_error.setDescription("Server is not setup! Please have an admin run /setup!")] });
        }

        let updateRankResponce;

        let dbRecruit = await db.Users.findOne({ where: { user_id: recruit.id, guild_id: interaction.guild.id } });
        let notInGroup = false;
        if (!dbRecruit) {
            dbRecruit = await db.Users.create({
                user_id: recruit.id,
                guild_id: interaction.guild.id,
                join_date: new Date(),
            });
            const responce = await dbRecruit.updateRank(noblox, server.group_id, recruit)
            if (responce.error) {
                return await interaction.reply({ embeds: [ embeded_error.setDescription(`${recruit}: ` + responce.message)] });
            } else if (responce.message) {
                updateRankResponce = responce;
            }
            if (responce.notInGroup) {
                notInGroup = true;
            }
        }

        
        if (dbRecruit.recruted_by) {
            return await interaction.reply({ embeds: [ embeded_error.setDescription(`${recruit}: ` + "This user has already been claimed by <@" + dbRecruit.recruted_by + ">!")] });
        }
        const now = new Date()
        if (recruit.guild.joinedTimeStamp > now.now - 7*24*60*60*1000 ) {
            return await interaction.reply({ embeds: [ embeded_error.setDescription(`${recruit}: ` + "Its too late to claim this recruit")] });
        }

        if (notInGroup) {
            return await interaction.reply({ embeds: [ embeded_error.setDescription(`${recruit}: ` + "This user is not in the group have them join the group to be able to claim them!")] });
        }

        dbRecruit.recruted_by = recruiter.id;
        await dbRecruit.save()

        const dbRecruiter = await db.Users.findOne({ where: { user_id: recruiter.id, guild_id: interaction.guild.id } });

        let recruiterUpdateRankResponce;
        if (!dbRecruiter) {
            dbRecruiter = await db.Users.create({
                user_id: recruit.id,
                guild_id: interaction.guild.id,
                join_date: new Date(),
            });
            const responce = await dbRecruiter.updateRank(noblox, server.group_id, recruiter)
            if (responce.message.startsWith("Error")) {
                return await interaction.reply({ embeds: [ embeded_error.setDescription(`${recruiter}: ` + responce.message)] });
            } else if (responce.message) {
                recruiterUpdateRankResponce = responce;
            }
        }

        const promopointsPerRecruit = ((await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "promopoints_per_recruit" } })) ?? {config: 1}).config
        const addPromoPointsResponce = await dbRecruiter.addPromoPoints(noblox, server.group_id, recruiter, null, promopointsPerRecruit, recruiterUpdateRankResponce ? recruiterUpdateRankResponce.robloxUser : undefined)
        const nameOfPromoPoints = ((await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "promopoints_name" } })) ?? {config: "Promo Points"}).config

        if (addPromoPointsResponce.error) {
            return await interaction.reply({ embeds: [ embeded_error.setDescription(`Recruit claimed but an error ocurred when giving you ${promopointsPerRecruit} ${nameOfPromoPoints} as a reward. \n${recruiter}: ` + addPromoPointsResponce.message)] });
        }


        // TODO make this use the utility function for fetching linked channels
        const recruitmentLogs = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "recruitmentlogs" } });
        let logs = recruitmentLogs
        if (!logs) {
            const promoLogs = await db.Channels.findOne({ where: { guild_id: interaction.guild.id, type: "promologs" } });
            if (promoLogs) {
                logs = promoLogs
            }
        }

        if (logs) {
            const channel = interaction.guild.channels.cache.get(logs.channel_id)
            if (channel) {
                channel.send({ content: `<@${recruiter.id}> has claimed <@${recruit.id}> and got ${promopointsPerRecruit} ${nameOfPromoPoints} for it! \n ${updateRankResponce ?? ""} \n ${addPromoPointsResponce.message ?? ""}` })
            } else {
                console.log(`Unable to find channel with id ${promoLogs.channel_id} in guild ${interaction.guild.name} id: ${interaction.guild.id}`)
            }
        }

        interaction.editReply({ content: `Thanks for recruiting <@${recruit.id}> as a reward you have been given ${promopointsPerRecruit} ${nameOfPromoPoints}! \n ${updateRankResponce.message ?? ""} \n ${addPromoPointsResponce.message ?? ""}` })
        

        
    }
}