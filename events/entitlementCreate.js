const { Events, StringSelectMenuBuilder, ActionRowBuilder } = require('discord.js');
const db = require('../dbObjects.js');


module.exports = {
    name: Events.EntitlementCreate,
    async execute(entitlement) {
        entitlement.client.guilds.cache.get("831851819457052692").channels.cache.get("1328990301565616250").send(`<@${entitlement.userId}> has bought a premium ticket!`);
        const user = await entitlement.fetchUser()

        user.send("# Thanks for buying a premium ticket! \nYou can now use the /useticket command in your server to activate premium for that server! \n**You Should not provide a code to /useTicket.** The code is for when Ererej gives away premium to someone for example becouse they won a competition. \n\nIf you have any questions feel free to ask Ererej! He is also happy to help you setup the premium features in your server!")
    }
}

