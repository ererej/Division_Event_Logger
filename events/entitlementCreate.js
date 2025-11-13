const { Events, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const db = require('../dbObjects.js');


module.exports = {
    name: Events.EntitlementCreate,
    async execute(entitlement) {
        const ticketPrices = {"1298023132027944980": 0.99, "1384130405560615002": 2.99, "1383014678002667571": 4.99, "1438118709364527165": 9.99}
        entitlement.client.guilds.cache.get("831851819457052692").channels.cache.get("1328990301565616250").send(`<@${entitlement.userId}> has bought a premium ticket worth ${ticketPrices[entitlement.skuId]}!`);
        const user = await entitlement.fetchUser()

        user.send("# Thanks for buying a premium ticket! \nYou can now use the /useticket command in your server to activate premium for that server! \n**You Should not provide a code to /useTicket.** The code is for when Ererej gives away premium to someone for example becouse they won a competition. \n\nIf you have any questions feel free to ask Ererej! He is also happy to help you setup the premium features in your server!")
    }
}

