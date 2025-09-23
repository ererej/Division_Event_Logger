const { SlashCommandBuilder, EmbedBuilder, Colors } = require('discord.js');
const db = require("../../dbObjects.js");

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listmilestones')
        .setDescription('Lists all the milestones'),

    async execute(interaction) {
        await interaction.deferReply();

        const milestones = await db.Milestones.findAll({ where: { guild_id: interaction.guild.id } });

        if (!milestones || milestones.length === 0) {
            return interaction.followUp({ embeds: [new EmbedBuilder().setDescription('No milestones found for this server.').setColor(Colors.Red)] });
        }

        const embed = new EmbedBuilder()
            .setTitle('Milestones')
            .setDescription('Here are the milestones for this server:')
            .setColor(0x00AE86);

        milestones.forEach(milestone => {
            embed.addFields(
                { name: milestone.custom_name, value: `Type: ${milestone.milestone_type}\nCondition type: ${milestone.condition_type}\nCondition amount/rank: ${milestone.condition_type === "integer" ? milestone.condition_config : "<@&" + milestone.condition_config + ">" } \nReward type: ${milestone.reward_type} \nReward: ${milestone.reward} \n max rank: ${milestone.max_rank} \n min rank: ${milestone.min_rank} \n Applies to officers: ${milestone.applies_to_officers ? "Yes" : "No"}`, inline: false }
            );
        });

        await interaction.followUp({ embeds: [embed] });
    }
};


/*
    # table structure:
    guild_id: string
    milestone_type: string //? done
    condition_type: string //? done 
    condition_config: string //? done
    repeating: boolean //? almost done
    reward_type: string (promopoints | promotions | custom) //? done //! Add support for custom rewards
    reward: string //? done
    ping: string (optional) //!add support for pinging users to give custom rewards!
    max_rank: string
    min_rank: string
    applies_to_officers: boolean
*/