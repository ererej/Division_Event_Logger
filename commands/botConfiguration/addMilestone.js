const { SlashCommandBuilder, EmbedBuilder, Colors, PermissionsBitField, ButtonBuilder, ActionRowBuilder, RoleSelectMenuBuilder, StringSelectMenuBuilder } = require('discord.js');
const db = require("../../dbObjects.js")
const getNameOfPromoPoints = require('../../utils/getNameOfPromoPoints.js');



module.exports = {
    data: new SlashCommandBuilder()
        .setName('addmilestone')
        .setDescription("Adds reward milestones")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageRoles || PermissionsBitField.Flags.Administrator)
        
    ,
    async execute(interaction) {
        await interaction.deferReply();
        const nameOfPromoPoints = await getNameOfPromoPoints(db, interaction.guild.id);


        const memberMilestone = new ButtonBuilder()
            .setCustomId('member_milestones')
            .setLabel('Member Milestone')
            .setStyle('Primary');
        const recruiterMilestone = new ButtonBuilder()
            .setCustomId('recruiter_milestones')
            .setLabel('Recruiter Milestone')
            .setStyle('Primary');

        const row = new ActionRowBuilder()
            .addComponents(memberMilestone, recruiterMilestone);

        let responce = await interaction.editReply({ embeds: [new EmbedBuilder().setDescription('# Welcome to the Milestone builder! \nThe milestone builder allows you to automatically reward your members for reaching certain milestones. \n\nLet\'s dive in! \nWe first need to choose the milestone category. There are two categories: \nthe *Member* category is for when the user has done something, and the \n*Recruiter* category is for when a recruiter has recruited someone and then the recruit does something. \n\n')] , components: [row] });

        let catagory_name;
        const filter = i => i.user.id === interaction.user.id;
        try {
            const collector = await responce.awaitMessageComponent({ filter, time: 300_000, max: 1  });
            await collector.update({ content: 'You selected a milestone category!' });
            catagory_name = collector.customId;
        } catch (error) {
            if (error.message === "Collector received no interactions before ending with reason: time") {
                interaction.followUp({ content: 'You did not select a milestone category in time!' });
                return;
            }
            console.error(error);
            return
        }

        const member_milestones = [
            ["member_rank_reached", 'user reaches specific rank', "none-repeatable"],
            ["member_recruits_recruited", 'user reaches specific amount of recruits', "repeatable"],
            ["member_events_attended", 'user attends specific amount of events', "repeatable"],
            ["member_events_hosted", 'user hosts specific amount of events', "repeatable"],
            ["member_cohosts", 'user cohosts specific amount of events', "repeatable"],
            /*["member_specific_events", 'user participates in specific amount of one event type', "repeatable"]*/ //! imploment some day!!
        ];
        const recruiter_milestones = [
            ["recruit_rank_reached", 'recruit reaches specific rank', "none-repeatable"],
            ["recruit_recruits_recruited", 'recruit reaches specific amount of recruits', "repeatable"],
            ["recruit_events_attended", 'recruit attends specific amount of events', "repeatable"]
        ];

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('milestone_select')
            .setPlaceholder('Select the milestone type you want to add')
            .setMaxValues(1);

        let catagory;
        if (catagory_name === 'member_milestones') {
            catagory = member_milestones
        } else if (catagory_name === 'recruiter_milestones') {
            catagory = recruiter_milestones
        }

        catagory.forEach(milestone => {
            selectMenu.addOptions([{label: milestone[1], value: milestone[0]}])
        })

        const selectMilestoneRow = new ActionRowBuilder().addComponents(selectMenu)

        responce = await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`You selected the ${catagory_name} category! now lets select a milestone type`)], components: [selectMilestoneRow] });
        let selectedMilestone;
        try {
            const collector = await responce.awaitMessageComponent({ filter, time: 300_000, max: 1 });
            await collector.update({ content: 'You selected a milestone type!' });
            selectedMilestone = catagory.find(milestone => milestone[0] == collector.values[0]);
        } catch (error) {
            if (error.message === "Collector received no interactions before ending with reason: time") {
                interaction.followUp({ content: 'You did not select a milestone type in time!' });
                return;
            }
            console.error(error);
            return;
        }


        let condition_type;

        switch (selectedMilestone[0]) {
            case "member_rank_reached":
            case "recruit_rank_reached":
                condition_type = "rank_id";
                break;
            default:
                condition_type = "integer";
                break;
        }

        const condition = {
            type: condition_type,
            value: 0
        };

        if (condition.type === "integer") {
            const collectorFilter = response => {
                return response.author.id === interaction.member.id && !isNaN(response.content);
            };
            
            responce = await interaction.editReply({ embeds: [new EmbedBuilder().setDescription("Please provide the amount required for this milestone! \n**Please type the amount below.**")], fetchReply: true, components: [] })

            try {
                const collected = await responce.channel.awaitMessages({ filter: collectorFilter, max: 1, time: 300_000 });
                condition.value = Math.round(parseInt(collected.first().content) < 0 ? 0 : collected.first().content);
                collected.first().delete();
            } catch (error) {
                if (error.message === "Collector received no interactions before ending with reason: time") {
                    interaction.followUp({ embeds: [new EmbedBuilder().setDescription('No condition provided Aborting!').setColor([255,0,0])] });
                    return;
                }
                console.error(error);
                return;
            }
        } else if (condition.type === "rank_id") {
            const ranks = await db.Ranks.findAll({ where: { guild_id: interaction.guild.id } });

            while (condition.value === 0) {
                const rankSelect = new RoleSelectMenuBuilder()
                    .setCustomId('rank_select')
                    .setPlaceholder('Select the rank required for this milestone')
                    .setMinValues(1)
                    .setMaxValues(1);

                responce = await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`# Please select the rank required to achieve this milestone:`)], components: [new ActionRowBuilder().addComponents(rankSelect)] });
                try {
                    const collector = await responce.awaitMessageComponent({ filter, time: 60000, max: 1 });
                    if (ranks.map(rank => rank.id).includes(collector.values[0])) {
                        await collector.update({ content: 'You selected a rank!' });
                        condition.value = collector.values[0];
                    } else {
                        continue;
                    }
                } catch (error) {
                    if (error.message === "Collector received no interactions before ending with reason: time") {
                        interaction.followUp({ content: 'You did not select a rank in time!' });
                        return;
                    }
                    console.error(error);
                    return;
                }
            }

        } else {
            throw new Error('Invalid condition type: ' + condition.type);
        }

        const promopointsButton = new ButtonBuilder()
            .setCustomId('promopoints')
            .setLabel(nameOfPromoPoints)
            .setStyle('Primary');
        
        const promotionsButton = new ButtonBuilder()
            .setCustomId('promotions')
            .setLabel('Promotions')
            .setStyle('Primary');

        const roleButton = new ButtonBuilder()
            .setCustomId('role')
            .setLabel('Role')
            .setStyle('Primary');

        const rewardRow = new ActionRowBuilder().addComponents(promopointsButton, promotionsButton, roleButton);

        responce = await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`# Now select a reward type: \n**${nameOfPromoPoints}** will give the user a ${nameOfPromoPoints} \n**promotions** will give the user a promotion (does not apply for officers (do you belive this is a bad choice by Ererej? complain to him!))\n**role** will assign a specific role to the user.\n\n The milestone now looks like this: \n\n> **Milestone Type:** ${selectedMilestone[1]} \n> **Condition ${condition.type === "integer" ? "amount:** " + condition.value : "rank:** <@&" + condition.value + ">"}`)], components: [rewardRow] });

        let  reward = {type: '', value: 0};
        try {
            const collector = await responce.awaitMessageComponent({ filter, time: 300_000, max: 1 });
            await collector.update({ content: 'You selected a reward type!', components: [] });
            reward.type = collector.customId;
        } catch (error) {
            if (error.message === "Collector received no interactions before ending with reason: time") {
                interaction.followUp({ content: 'You did not select a reward type in time!' });
                return;
            }
            console.error(error);
            return;
        }


        if (reward.type === "role") {
            const roleSelectMenu = new RoleSelectMenuBuilder()
                .setCustomId('role_select')
                .setPlaceholder('Select the role to give')
                .setMinValues(1)
                .setMaxValues(1);
            const roleSelectRow = new ActionRowBuilder().addComponents(roleSelectMenu);

            responce = await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Please select the role to give as a reward for this milestone! \n\n The milestone now looks like this: \n\n> **Milestone Type:** ${selectedMilestone[1]} \n> **Condition ${condition.type === "integer" ? "amount:** " + condition.value : "rank:** <@&" + condition.value + ">"} \n> reward type: ${reward.type}`)], components: [roleSelectRow] });

            try {
                const collector = await responce.awaitMessageComponent({ filter, time: 300_000, max: 1 });
                await collector.update({ content: 'You selected a role!' });
                reward.value = collector.values[0];
            } catch (error) {
                if (error.message === "Collector received no interactions before ending with reason: time") {
                    interaction.followUp({ content: 'You did not select a role in time!' });
                    return;
                }
                console.error(error);
                return;
            }
        } else {

            const collectorFilter = response => {
                return response.author.id === interaction.member.id && !isNaN(response.content);
            };

            responce = await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Please provide the amount of *${reward.type}* to give for the milestone! \n**Please type the amount below.**`)], fetchReply: true, components: [] })

            try {
                const collected = await responce.channel.awaitMessages({ filter: collectorFilter, max: 1, time: 300_000, errors: ['time'] });
                reward.value = condition.value = Math.round(parseInt(collected.first().content) < 0 ? 0 : collected.first().content);
                collected.first().delete()
            } catch (error) {
                if (error.message === "Collector received no interactions before ending with reason: time") {
                    interaction.followUp({ embeds: [new EmbedBuilder().setDescription('No reward amount provided Aborting!').setColor([255,0,0])] });
                    return;
                }
                console.error(error);
                return;
            }
        }


        let repeatable = false;
        if (selectedMilestone[2] === "repeatable" && reward.type !== "role") {
                const yesButton = new ButtonBuilder()
                    .setCustomId('milestone_repeatable_yes')
                    .setLabel('Yes')
                    .setStyle('Success');

                const noButton = new ButtonBuilder()
                    .setCustomId('milestone_repeatable_no')
                    .setLabel('No')
                    .setStyle('Danger');

            const repeatableRow = new ActionRowBuilder().addComponents(yesButton, noButton)

            responce = await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Should this milestone be able to be repeatably achived over and over again?\n\n The milestone now looks like this: \n\n> **Milestone Type:** ${selectedMilestone[1]} \n> **Condition ${condition.type === "integer" ? "amount:** " + condition.value : "rank:** <@&" + condition.value + ">"} \n> **reward type:** ${reward.type === "promopoints" ? nameOfPromoPoints : reward.type} \n> ${reward.type === "promopoints" ? "**amount:** " + reward.value : "**rank:** <@&" + reward.value + ">"} \n\n`)], components: [repeatableRow] });
            
            try {
                const collector = await responce.awaitMessageComponent({ filter, time: 300_000, max: 1 });
                await collector.update({ content: 'You selected a repeatable option!' });
                repeatable = collector.customId === 'milestone_repeatable_yes';
            } catch (error) {
                if (error.message === "Collector received no interactions before ending with reason: time") {
                    interaction.followUp({ content: 'You did not select if the milestone is repeatable in time!' });
                    return;
                }
                console.error(error);
                return;
            }

        }


        const ranks = await db.Ranks.findAll({ where: { guild_id: interaction.guild.id } });
        const rankSelectFilter = i => (i.customId === 'milestone_min_rank' && i.user.id === interaction.user.id && ranks.map(rank => rank.id).includes(i.values[0])) || (i.customId === 'no' && i.user.id === interaction.user.id);

        const rankSelect = new RoleSelectMenuBuilder()
            .setCustomId('milestone_min_rank')
            .setPlaceholder('Select a minimum rank')

        const rankSelectRow = new ActionRowBuilder().addComponents(rankSelect);

        const noButton = new ButtonBuilder()
            .setCustomId('no')
            .setLabel('No')
            .setStyle('Danger');

        const noButtonRow = new ActionRowBuilder().addComponents(noButton);

        responce = await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Almost done! Should their be a minimum rank requirement for this milestone? If so then select it otherwise press **NO**\n\n The milestone now looks like this: \n\n> **Milestone Type: ${selectedMilestone[1]} \n> **Condition ${condition.type === "integer" ? "amount:** " + condition.value : "rank:** <@&" + condition.value + ">"} \n> reward type: ${reward.type === "promopoints" ? nameOfPromoPoints : reward.type} \n> ${reward.type === "role" ? "rank:** <@&" + reward.value + ">" :  "amount:** " + reward.value} \n\n`)], components: [rankSelectRow, noButtonRow] });

        let minimumRank;
        try {
            const collector = await responce.awaitMessageComponent({ filter: rankSelectFilter, time: 300_000, max: 1 });
            await collector.update({ content: '** **' });
            if (collector.customId === 'no') {
                minimumRank = null;
            } else {
                minimumRank = collector.values[0];
            }
        } catch (error) {
            if (error.message === "Collector received no interactions before ending with reason: time") {
                interaction.followUp({ content: 'You did not select a minimum rank!' });
                return
            }
            console.error(error)
            return;
        }

        responce = await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Almost almost done!! Should their be a maximum rank requirement for this milestone? If so then select it otherwise press **NO**\n\n The milestone now looks like this: \n\n> **Milestone Type: ${selectedMilestone[1]} \n> **Condition ${condition.type === "integer" ? "amount:** " + condition.value : "rank:** <@&" + condition.value + ">"} \n> reward type: ${reward.type === "promopoints" ? nameOfPromoPoints : reward.type} \n> ${reward.type === "promopoints" ? "amount:** " + reward.value : "rank:** <@&" + reward.value + ">"} \n> **minimum rank:** ${minimumRank ? `<@&${minimumRank}>` : "none"} \n \n\n`)], components: [rankSelectRow, noButtonRow] });

        let maxRank;
        try {
            const collector = await responce.awaitMessageComponent({ filter: rankSelectFilter, time: 300_000, max: 1 });
            await collector.update({ content: '** **' });
            if (collector.customId === 'no') {
                maxRank = null;
            } else {
                maxRank = collector.values[0];
            }
        } catch (error) {
            if (error.message === "Collector received no interactions before ending with reason: time") {
                interaction.followUp({ content: 'You did not select a maximum rank!' });
                return;
            }
            console.error(error);
            return;
        }

        responce = await interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Last step! **Please provide a custom name** for this milestone this is what will be shown in the milestone logs and when a user achieves the milestone! \n\n The milestone now looks like this: \n\n> **Milestone Type: ${selectedMilestone[1]} \n> **Condition ${condition.type === "integer" ? "amount:** " + condition.value : "rank:** <@&" + condition.value + ">"} \n> reward type: ${reward.type === "promopoints" ? nameOfPromoPoints : reward.type} \n> ${reward.type === "promopoints" ? "amount:** " + reward.value : "rank:** <@&" + reward.value + ">"} \n> **minimum rank:** ${minimumRank ? `<@&${minimumRank}>` : "none"} \n> **maximum rank:** ${maxRank ? `<@&${maxRank}>` : "none"} \n\n`)], components: [] , fetchReply: true })

        const customNameFilter = (i) =>  i.member.id === interaction.user.id;
        try {
            const collected = await responce.channel.awaitMessages({ filter: customNameFilter, max: 1, time: 300_000, errors: ['time'] });
            customName = collected.first().content
            collected.first().delete()
        } catch (error) {
            if (error.message === "Collector received no interactions before ending with reason: time") {
                interaction.followUp({ content: 'You did not provide a custom name!' });
                return;
            }
            console.error(error);
            return;
        }

        const milestone = await db.Milestones.create({
            guild_id: interaction.guild.id,
            custom_name: customName,
            milestone_type: selectedMilestone[0],
            condition_type: condition.type,
            condition_config: condition.value,
            repeating: repeatable,
            reward_type: reward.type,
            reward: reward.value,
            max_rank: maxRank,
            min_rank: minimumRank,
            applies_to_officers: false
        });


        interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`**Success!** The milestone has been created and saved to the database! \n\n Here is a summary of the milestone: \n\n> Custom Name: ${customName} \n> **Milestone Type: ${selectedMilestone[1]} \n> **Condition ${condition.type === "integer" ? "amount:** " + condition.value : "rank:** <@&" + condition.value + ">"} \n> reward type: ${reward.type === "promopoints" ? nameOfPromoPoints : reward.type} \n> ${reward.type === "promopoints" ? "amount:** " + reward.value : "rank:** <@&" + reward.value + ">"} \n> **minimum rank:** ${minimumRank ? `<@&${minimumRank}>` : "none"} \n> **maximum rank:** ${maxRank ? `<@&${maxRank}>` : "none"} \n\n`).setColor(Colors.Green)], components: [] });
    }
}

/*
    milestone types:
    # recruiters recruit:
    recruit reaches spesific rank
    recruit reaches spesific amount of recruits
    recruit attends specific amount of events

    # user:
    user reaches specific rank
    user reaches specific amount of recruits
    user attends specific amount of events
    user hosts specific amount of events
    user cohosts specific amount of events

    # repeating:
    every specific amount of recruits
    every specific amount of events
    every specific amount of events hosted
*/

/*
    Reward types:

    - promo_points: Give the user a specific amount of promotional points.
    - promotions: Promote the user to a specific rank.
    - role: Assign a specific role to the user.
    - custom: Give a custom reward (to be implemented).

*/


/*
    # table structure:
    guild_id: string
    milestone_type: string //? done
    condition_type: string //? done 
    condition_config: string //? done
    repeating: boolean //? almost done
    reward_type: string (promopoints | promotions | role | custom) //? done //! Add support for custom rewards
    reward: string //? done
    ping: string (optional) //!add support for pinging users to give custom rewards!
    max_rank: string
    min_rank: string
    applies_to_officers: boolean
*/