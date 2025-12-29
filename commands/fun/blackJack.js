const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, ButtonBuilder, ButtonStyle, ActionRowBuilder, Colors } = require('discord.js');
const db = require("../../dbObjects.js");
const noblox = require("noblox.js")
const config = require('../../config.json');
const getNameOfPromoPoints = require("../../utils/getNameOfPromoPoints.js");
const { col } = require('sequelize');

module.exports = {
	data: new SlashCommandBuilder()
        .setName('blackjack')
        .setDescription('gamble your promopoints away in a game of blackjack!')
        .addIntegerOption(option => 
            option.setName('promopoints')
                .setDescription('How many promopoints do you want to gamble')
                .setRequired(true)
                .setMinValue(1)
                .setMaxValue(100000)
        ),
        
    premiumLock: true,
    botPermissions: [PermissionsBitField.Flags.ManageRoles],

    /**
     * @param {import('discord.js').CommandInteraction} interaction
    */
    async execute(interaction) {
        await interaction.deferReply()
        const embeded_error = new EmbedBuilder().setColor([255,0,0])
        const nameOfPromoPoints = await getNameOfPromoPoints(db, interaction.guild.id)
        const bet = interaction.options.getInteger('promopoints')


        const blackjackenabled = await db.Settings.findOne({
            where: {
                guild_id: interaction.guild.id,
                type: 'blackjackenabled',
            }
        });

        if ((!blackjackenabled || blackjackenabled.config !== 'enabled') && interaction.member.id !== "386838167506124800") {
            return interaction.editReply({embeds: [embeded_error.setDescription(`Blackjack is not enabled in this server! Server admins can enable it using /settings blackjackEnabled command.`)]})
        }

        // Get server info for groupId
        const server = await db.Servers.findOne({
            where: {
                guild_id: interaction.guild.id,
            },
        });

        if (!server) {
            return interaction.editReply({embeds: [embeded_error.setDescription(`Server is not setup please get a server admin to run /setup!`)]})
        }

        // Check if user has enough promo points
        const user = await db.Users.findOne({
            where: {
                user_id: interaction.user.id,
                guild_id: interaction.guild.id,
            },
        });

        if (!user) {
            return interaction.editReply({embeds: [embeded_error.setDescription(`Could not find you in the database!`)]})
        }

        // Get user's current rank and calculate total promo points
        const currentRank = await user.getRank()

        if (!currentRank) {
            return interaction.editReply({embeds: [embeded_error.setDescription(`Your current rank could not be found!`)]})
        }

        const totalPromoPoints = user.promo_points + currentRank.promo_points;

        if (totalPromoPoints < bet) {
            return interaction.editReply({embeds: [embeded_error.setDescription(`You don't have enough ${nameOfPromoPoints}! You have ${totalPromoPoints} total (${user.promo_points} current + ${currentRank.promo_points} from rank) but need at least ${bet}.`)]})
        }

        // Check if losing this bet would demote user to a non-obtainable rank
        // Only the user's personal promo points are affected by gambling, not the rank's base points
        const remainingPersonalPoints = user.promo_points - bet;
        const allRanks = await db.Ranks.findAll({
            where: {
                guild_id: interaction.guild.id,
            },
            order: [['promo_points', 'DESC']]
        });

        // Find what rank the user would have after losing the bet (based on their remaining personal points)
        let newRank = allRanks.find(rank => rank.rank_index === currentRank.rank_index - 1 );

        // Special handling for users with unobtainable ranks
        if (!currentRank.obtainable) {
            // Users with unobtainable ranks can only bet their personal promo points (down to 0)
            const maxBetForUnobtainable = user.promo_points;
            
            if (bet > maxBetForUnobtainable) {
                return interaction.editReply({embeds: [embeded_error.setDescription(`You have an unobtainable rank and can only bet your personal ${nameOfPromoPoints}! Maximum bet allowed: ${maxBetForUnobtainable} ${nameOfPromoPoints}.`)]})
            }
        } else {
            // For obtainable ranks, check if they would be demoted below the lowest obtainable rank
            // Find the lowest obtainable rank
            const lowestObtainableRank = allRanks
                .filter(rank => rank.obtainable)
                .sort((a, b) => a.promo_points - b.promo_points)[0];
            
            const minPointsNeeded = lowestObtainableRank ? lowestObtainableRank.promo_points : 0;
            
            // Check if losing this bet would put their total points below the minimum obtainable rank
            // Total points after loss = current rank base points + remaining personal points
            const totalPointsAfterLoss = currentRank.promo_points + remainingPersonalPoints;
            
            if (totalPointsAfterLoss < minPointsNeeded) {
                // Calculate max bet: can lose personal points until total points = minimum needed
                // maxBet = user.promo_points - (minPointsNeeded - currentRank.promo_points)
                const maxBet = Math.max(0, user.promo_points - Math.max(0, minPointsNeeded - currentRank.promo_points));
                return interaction.editReply({embeds: [embeded_error.setDescription(`You cannot bet ${bet} ${nameOfPromoPoints} as it would demote you below the minimum obtainable rank! Maximum bet allowed: ${maxBet} ${nameOfPromoPoints}.`)]})
            }
        }

        const gambleButton = new ButtonBuilder()
            .setCustomId('gamble')                
            .setLabel('Gamble!')
            .setStyle(ButtonStyle.Danger)
        
        const cancel = new ButtonBuilder()
            .setCustomId('cancel')
            .setLabel('Cancel')
            .setStyle(ButtonStyle.Secondary)
        const row = new ActionRowBuilder().addComponents(gambleButton, cancel)

        const response = await interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Red).setDescription(`Are you sure you want to gamble ${bet} ${nameOfPromoPoints}? You might get demoted if you lose!!!\n\nCurrent total: ${totalPromoPoints} ${nameOfPromoPoints}\nAfter loss: ${user.promo_points - bet} personal ${nameOfPromoPoints}\nPotential rank if you lose: ${!currentRank.obtainable || !newRank ? "<@&" + currentRank.id + "> (unchanged)" : "<@&" + newRank.id + ">"}`)], components: [row]})

        const collectorFilter = i => (i.customId === 'gamble' || i.customId === 'cancel') && i.user.id === interaction.user.id
        try {
            const confirmation = await response.awaitMessageComponent({ filter: collectorFilter, time: 60_000 })
            await confirmation.deferUpdate()
            
            if (confirmation.customId === 'gamble') {
                class Card {
                    constructor(type, cardType, hidden = false) {
                        this.type = type //hearts, spades, diamond, clubs
                        this.cardType = cardType //1-13
                        this.hidden = hidden
                        switch (cardType) {
                            case 1:
                                this.name = "Trainee"
                                this.value = 11
                                break;
                            case 11:
                                this.name = "HC"
                                this.value = 10
                                break;
                            case 12:
                                this.name = "Marshal"
                                this.value = 10
                                break;
                            case 13:
                                this.name = "Commandent"
                                this.value = 10
                                break;
                            default:
                                this.name = cardType.toString()
                                this.value = cardType
                                break;
                        }
                    }
                    hide() {
                        this.hidden = true
                    }

                    show() {
                        this.hidden = false
                    }
                }
            
                let cardPile = []
                let houseCards = []
                let playerCards = []
                const types =["hearts", "spades", "diamonds", "clubs"]

                // Create deck (2 decks)
                for(let l = 0; l < 2; l++){
                    for(let i = 0; i < types.length; i++){
                        for(let j = 1; j <= 13; j++){
                            const card = new Card(types[i], j, false);
                            cardPile.push(card)
                        }
                    }
                }
                
                const drawCard = (hand, hide = false) => {
                    const randomIndex = Math.floor(Math.random() * cardPile.length);
                    const card = cardPile.splice(randomIndex, 1)[0]; // Use splice instead of pop
                    hand.push(card);
                    if (hide) card.hide();
                    return card;
                }

                const calculateHandValue = (hand) => {
                    let value = 0;
                    let aces = 0;
                    for (const card of hand) {
                        if (card.hidden) continue;
                        value += card.value;
                        if (card.value === 11) aces++;
                    }
                    while (value > 21 && aces > 0) {
                        value -= 10;
                        aces--;
                    }
                    return value;
                }

                // Deal initial cards
                drawCard(playerCards);
                drawCard(playerCards);
                drawCard(houseCards);
                drawCard(houseCards, true);

                let message = "";
                let gameOver = false;
                let color = Colors.Red;

                const showGame = (color = Colors.Red) => {
                    const playerValue = calculateHandValue(playerCards);
                    const houseValue = calculateHandValue(houseCards);
                    

                    const game = new EmbedBuilder()
                        .setTitle(`${interaction.member.displayName}'s Blackjack Game`)
                        .setColor(color)
                        .addFields(
                            { name: "House's Cards", value: `${houseCards.map(card => card.hidden ? "???" : card.name).join(", ")}\nTotal: ${houseValue}`, inline: true },
                            { name: "Your Cards", value: `${playerCards.map(card => card.name).join(", ")}\nTotal: ${playerValue}`, inline: true },
                            { name: "Bet", value: `${bet} ${nameOfPromoPoints}`, inline: true }
                        )

                    if (message) {
                        game.setDescription(message);
                    }

                    const hitButton = new ButtonBuilder()
                        .setCustomId('hit')
                        .setLabel('Hit')
                        .setStyle(ButtonStyle.Primary)
                        .setDisabled(gameOver || playerValue >= 21);

                    const standButton = new ButtonBuilder()
                        .setCustomId('stand')
                        .setLabel('Stand')
                        .setStyle(ButtonStyle.Success)
                        .setDisabled(gameOver || playerValue >= 21);

                    const row2 = new ActionRowBuilder().addComponents(hitButton, standButton)

                    return { embeds: [game], components: gameOver ? [] : [row2] };
                }

                const checkGameEnd = async () => {
                    const playerValue = calculateHandValue(playerCards);
                    
                    if (playerValue > 21) {
                        // Player busted - use removePromoPoints which handles rank changes safely
                        message = "💥 **BUST!** You went over 21! House wins!";
                        color = Colors.Red;
                        // 1 in 10 chance to send the gif
                        if (Math.random() < 0.1) {
                            message += "\nhttps://cdn.discordapp.com/attachments/1213718932238762004/1398059893189251273/IMG_2472.webp?ex=6883fc3d&is=6882aabd&hm=dba9e35462a18a390690ac81bbabfa7aabca420c52539f69e900810def2a06a1&";
                        }
                        
                        gameOver = true;
                        const ranks = await db.Ranks.findAll({ where: { guild_id: interaction.guild.id }});
                        const result = await user.removePromoPoints(server.group_id, interaction.member, ranks, Math.floor(bet));
                        if (result && result.message) {
                            message += "\n\n" + result.message;
                        }
                        return true;
                    } else if (playerValue === 21) {
                        // Player got 21
                        houseCards.forEach(card => card.show());
                        const houseValue = calculateHandValue(houseCards);
                        
                        if (playerCards.length === 2) {
                            // Player blackjack (21 with 2 cards)
                            if (houseValue === 21 && houseCards.length === 2) {
                                message = "🤝 **PUSH!** Both have blackjack! It's a tie!";
                                color = Colors.Yellow;
                            } else {
                                color = Colors.LuminousVividPink;
                                message = "🎉 **BLACKJACK!** You win 1.5x your bet!";
                                const ranks = await db.Ranks.findAll({ where: { guild_id: interaction.guild.id }});
                                const result = await user.addPromoPoints(server.group_id, interaction.member, ranks, Math.floor(bet * 1.5));
                                //if (result.message === ) //make it give promo points even if they cant rank up with them
                                if (result && result.message) {
                                    message += "\n\n" + result.message;
                                }
                            }
                        } else {
                            // Player got 21 with more than 2 cards - automatic win
                            color = Colors.Green;
                            message = "🎉 **21!** You got 21 and win!";
                            const ranks = await db.Ranks.findAll({ where: { guild_id: interaction.guild.id }});
                            const result = await user.addPromoPoints(server.group_id, interaction.member, ranks, Math.floor(bet));
                            if (result && result.message) {
                                message += "\n\n" + result.message;
                            }
                        }
                        gameOver = true;
                        return true;
                    }
                    return false;
                }

                const playHouseHand = async () => {
                    // Reveal house's hidden card
                    houseCards.forEach(card => card.show());
                    
                    // House draws until 17 or higher
                    while (calculateHandValue(houseCards) < 17) {
                        drawCard(houseCards);
                    }
                    
                    const playerValue = calculateHandValue(playerCards);
                    const houseValue = calculateHandValue(houseCards);
                    const ranks = await db.Ranks.findAll({ where: { guild_id: interaction.guild.id }});
                    
                    if (houseValue > 21) {
                        color = Colors.Green;
                        message = "🎉 **House busted!** You win!";
                        const result = await user.addPromoPoints(server.group_id, interaction.member, ranks, Math.floor(bet));
                        if (result && result.message) {
                            message += "\n\n" + result.message;
                        }
                    } else if (houseValue > playerValue) {
                        color = Colors.Red;
                        message = "😔 **House wins!** Better luck next time!";
                        
                        // 1 in 10 chance to send the gif
                        if (Math.random() < 0.1) {
                            message += "\nhttps://cdn.discordapp.com/attachments/1213718932238762004/1398059893189251273/IMG_2472.webp?ex=6883fc3d&is=6882aabd&hm=dba9e35462a18a390690ac81bbabfa7aabca420c52539f69e900810def2a06a1&";
                        }
                        
                        const result = await user.removePromoPoints(server.group_id, interaction.member, ranks, Math.floor(bet));
                        if (result && result.message) {
                            message += "\n\n" + result.message;
                        }
                    } else if (playerValue > houseValue) {
                        color = Colors.Green;
                        message = "🎉 **You win!** Congratulations!";
                        const result = await user.addPromoPoints(server.group_id, interaction.member, ranks, Math.floor(bet));
                        if (result && result.message) {
                            message += "\n\n" + result.message;
                        }
                    } else {
                        color = Colors.Yellow;
                        message = "🤝 **PUSH!** It's a tie! No points lost or gained.";
                    }
                    
                    gameOver = true;
                }

                // Initial game display
                await interaction.editReply(showGame(color));
                
                // Check for initial blackjack
                if (await checkGameEnd()) {
                    return interaction.editReply(showGame(color));
                }

                // Game loop
                while (!gameOver) {
                    try {
                        const gameFilter = i => (i.customId === 'hit' || i.customId === 'stand') && i.user.id === interaction.user.id;
                        
                        // Wait for button interaction on the current message
                        const collected = await response.awaitMessageComponent({filter: gameFilter, time: 60000});
                        await collected.deferUpdate();

                        if (collected.customId === 'hit') {
                            drawCard(playerCards);
                            await checkGameEnd();
                        } else if (collected.customId === 'stand') {
                            await playHouseHand();
                        }

                        // Always update the same message
                        await interaction.editReply(showGame(color));

                    } catch (error) {
                        if (error.message.includes("time")) {
                            message = "⏰ **Game timed out!** No points lost.";
                            gameOver = true;
                            return interaction.editReply({embeds: [embeded_error.setDescription("No response given within 60 seconds, game cancelled!")], components: []});
                        } else {
                            throw error;
                        }
                    }
                }

            } else if (confirmation.customId === 'cancel') {
                return interaction.editReply({embeds: [new EmbedBuilder().setColor(Colors.Green).setDescription(`The gambling has been cancelled!`)], components: []})
            }
        } catch (error) {
            if (error.message.includes("time")) {
                return interaction.editReply({embeds: [embeded_error.setDescription("No response given within 60 seconds, cancelling!")], components: []})
            } else {
                console.error('Blackjack error:', error);
                return interaction.editReply({embeds: [embeded_error.setDescription("An error occurred during the game!")], components: []})
            }
        }
    }
}