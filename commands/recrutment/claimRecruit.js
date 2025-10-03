const { SlashCommandBuilder, EmbedBuilder, Colors, PermissionsBitField } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js");
const config = require('../../config.json');
const getNameOfPromoPoints = require('../../utils/getNameOfPromoPoints.js');
const checkMilestone = require('../../utils/checkMilestone.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('claimrecruit')
        .setDescription('Claim a recruit')
        .addUserOption(option =>
            option.setName('recruit')
                .setDescription('Select your new recruit!')
                .setRequired(true)),

    premiumLock: true,
    /**
     * @param {import('discord.js').CommandInteraction} interaction
    */
    async execute(interaction) {
        await interaction.deferReply();
        const recruit = interaction.guild.members.cache.get(interaction.options.getUser('recruit').id)
        const recruiter = interaction.member;

        const embeded_error = new EmbedBuilder().setColor(Colors.Red)

        const server = await db.Servers.findOne({ where: { guild_id: interaction.guild.id } });
        if (!server) {
            return await interaction.editReply({ embeds: [ embeded_error.setDescription("Server is not setup! Please have an admin run /setup!")] });
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
            const responce = await dbRecruit.updateRank(server.group_id, recruit)
            if (responce.error) {
                return await interaction.editReply({ embeds: [ embeded_error.setDescription(`${recruit}: ` + responce.message)] });
            } else if (responce.message) {
                updateRankResponce = responce;
            }
            if (responce.notInGroup) {
                notInGroup = true;
            }
        }

        
        if (dbRecruit.recruted_by) {
            return await interaction.editReply({ embeds: [ embeded_error.setDescription(`${recruit}: ` + "This user has already been claimed by <@" + dbRecruit.recruted_by + ">!")] });
        }
        const now = new Date()
        if (recruit.guild.joinedTimestamp * 1000 > now - 7 * 24 * 60 * 60 * 1000) {
            return await interaction.editReply({ embeds: [ embeded_error.setDescription(`${recruit}: ` + "This member has been in the server for too long to be claimed!")] });
        }

        if (notInGroup) {
            return await interaction.editReply({ embeds: [ embeded_error.setDescription(`${recruit}: ` + "This user is not in the group have them join the group to be able to claim them!")] });
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
            const responce = await dbRecruiter.updateRank(server.group_id, recruiter)
            if (responce.message.startsWith("Error")) {
                return await interaction.editReply({ embeds: [ embeded_error.setDescription(`${recruiter}: ` + responce.message)] });
            } else if (responce.message) {
                recruiterUpdateRankResponce = responce;
            }
        }

        dbRecruiter.recruits += 1;
        dbRecruiter.save()

        const promopointsPerRecruit = ((await db.Settings.findOne({ where: { guild_id: interaction.guild.id, type: "promopoints_per_recruit" } })) ?? {config: 0}).config
        const addPromoPointsResponce = await dbRecruiter.addPromoPoints(server.group_id, recruiter, null, promopointsPerRecruit, recruiterUpdateRankResponce ? recruiterUpdateRankResponce.robloxUser : undefined)
        const nameOfPromoPoints = await getNameOfPromoPoints(db, interaction.guild.id)

        if (addPromoPointsResponce.error) {
            return await interaction.editReply({ embeds: [ embeded_error.setDescription(`Recruit claimed but an error ocurred when giving you ${promopointsPerRecruit} ${nameOfPromoPoints} as a reward. \n${recruiter}: ` + addPromoPointsResponce.message)] });
        }

        const milestoneResponces = []

        const milestones = await db.Milestones.findAll({ where: { guild_id: interaction.guild.id } });
        const memberRecruitsRecruitedMilestoneResponce = await checkMilestone({db, type: "member_recruits_recruited", member: recruiter, dbUser: dbRecruiter, ranks: null, guildsMilestones: milestones, robloxUser: recruiterUpdateRankResponce ? recruiterUpdateRankResponce.robloxUser : undefined})
        milestoneResponces.push(...memberRecruitsRecruitedMilestoneResponce.milestones ?? [])
        const recruitRecruitsRecruitedMilestoneResponce = await checkMilestone({db, type: "recruit_recruits_recruited", member: recruiter, dbUser: dbRecruiter, ranks: null, guildsMilestones: milestones, robloxUser: recruiterUpdateRankResponce ? recruiterUpdateRankResponce.robloxUser : undefined})
        milestoneResponces.push(...recruitRecruitsRecruitedMilestoneResponce.milestones ?? [])

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
                channel.send({ embeds: [new EmbedBuilder().setColor([127, 0, 255]).setDescription(`<@${recruiter.id}> has claimed <@${recruit.id}>` + (promopointsPerRecruit > 0 ? ` and got ${promopointsPerRecruit} ${nameOfPromoPoints} for it! \n${updateRankResponce ?? ""} \n${addPromoPointsResponce.message ?? ""}` : "") + (milestoneResponces.length > 0 ? `\n\nMilestone(s) achieved:\n${milestoneResponces.milestones.filter(m => m.user_id === recruiter.id).map(m => m.message).join("\n")}` : "") )] })
            } else {
                console.log(`Unable to find channel with id ${promoLogs.channel_id} in guild ${interaction.guild.name} id: ${interaction.guild.id}`)
            }
        }

        interaction.editReply({ embeds: [new EmbedBuilder().setColor([211, 211, 211]).setDescription(`Thanks for recruiting <@${recruit.id}>` + (promopointsPerRecruit > 0 ?  ` as a reward you have been given ${promopointsPerRecruit} ${nameOfPromoPoints}! \n${updateRankResponce ?? ""} \n${addPromoPointsResponce.message ?? ""}` : "") + (milestoneResponces.length > 0 ? `\n\nMilestone(s) achieved:\n${milestoneResponces.milestones.filter(m => m.user_id === recruiter.id).map(m => m.message).join("\n")}` : "") )] })
        

    }
}