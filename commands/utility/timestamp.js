const {SlashCommandBuilder, EmbedBuilder, Colors} = require('discord.js')

module.exports = {
	data: new SlashCommandBuilder()
        .setName('timestamp')
        .setDescription('A command for quickly generating a timestamp')
        .addStringOption(option => 
            option.setName('relative_time')
                .setDescription("plase enter the the relative_time you want for the timestamp like: in 5 min or xx:45")
                .setRequired(true)
        ),


    /**
     *  @param {import('discord.js').CommandInteraction} interaction
     */
    async execute(interaction) {
        await interaction.deferReply();
        const embeded_error = new EmbedBuilder().setColor(Colors.Red)

        const input = interaction.options.getString('relative_time').toLowerCase()
        let time;
        const now = new Date()
        if (input.includes("minutes ") || input.includes("minutes\n") || input.includes("minutes") || input.includes("min ") || input.includes("min\n") || input.includes("min") || input.includes("mins ") || input.includes("mins\n") || input.includes("mins")) {
            let words = input.toLowerCase().replace("\n", " ").split(" ")
            const indexOfTime = words.findIndex(word => /\b(min|minutes|mins)\b/.test(word)) - 1
            if (indexOfTime >= 0) {
                const timeofset = parseInt(words[indexOfTime], 10)
                if (!isNaN(timeofset)) {
                    time = new Date(now.getTime() + timeofset * 60 * 1000)
                } else {
                    return interaction.editReply({ embeds: [embeded_error.setDescription("Please enter a valid time!")]} )
                }
                if (timeofset < 0) {
                    interaction.followUp("<@386838167506124800> Time traveler detected!")
                }
            } else if (words.filter(word => /\b\d+(min|minutes|mins)/.test(word)).length > 0) {
                const timeSubString = words.filter(word => /\b\d+(min|minutes|mins)/.test(word))[0]
                const ofset = parseInt(timeSubString.match(/\d+/)[0], 10)
                time = new Date(now.getTime() + ofset * 60 * 1000)
    
            } else {
                return interaction.editReply({ embeds: [embeded_error.setDescription("Please enter a valid time!")]})
            }
        } else if (input.toLowerCase().includes("xx:")) {
            const ofset = input.split(":")[1]
            
            if (ofset > now.getMinutes()) {
                time = new Date(now.setMinutes(ofset))
            } else {
                time = new Date(now.setHours(now.getHours() + 1))
                time.setMinutes(ofset)
            }
            
        }
        if (time) {
            interaction.editReply({ content: `<t:${Math.round(time.getTime()/1000)}:R>`})
        } else {
            interaction.editReply({ embeds: [embeded_error.setDescription("Please enter a valid time!")]})
        }
    }
}