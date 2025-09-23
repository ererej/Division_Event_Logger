const { SlashCommandBuilder, PermissionsBitField } = require('discord.js')
const db = require('../../dbObjects.js')

module.exports = {
    data: new SlashCommandBuilder()
        .setName('leaderboard')
        .setDescription("Show different leaderboards")
        .addSubcommand(subcommand =>
            subcommand
                .setName('exp')
                .setDescription('Show the leaderboard for servers with the most exp')
        ),

    async execute(interaction) {
        await interaction.deferReply()

        if (interaction.options.getSubcommand() === 'exp') {
            console.log("Fetching exp leaderboard")
            let servers = await db.Servers.findAll()
            servers = servers.filter(s => s.exp)
            servers = servers.filter(s => s.guild_id !== "831851819457052692")

            servers = servers.sort((a, b) => {
                return a.exp - b.exp
            })

            servers = servers.reverse()

            let replyString = "Servers with the most exp:\n\n"
            let index = 1
            for (const server of servers) {
                replyString += `> **${index}.** ${server.name} - ${server.exp} exp\n`
                index++
            }

            // To lazy to code this so COPILOTTTT
            if (replyString.length > 2000) {
                // Split the replyString into chunks of max 2000 characters
                const chunks = [];
                let current = "";
                for (const line of replyString.split('\n')) {
                    if ((current + line + '\n').length > 2000) {
                        chunks.push(current);
                        current = "";
                    }
                    current += line + '\n';
                }
                if (current) chunks.push(current);

                // Send the first chunk as the reply, the rest as follow-ups
                await interaction.editReply({ content: chunks[0] });
                for (let i = 1; i < chunks.length; i++) {
                    await interaction.followUp({ content: chunks[i], ephemeral: false });
                }
                // Prevent double reply below
                return;
            }
            interaction.editReply({ content: replyString })
        }

    }
}