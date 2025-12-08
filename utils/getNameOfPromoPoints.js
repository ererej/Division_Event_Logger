module.exports = async (db, guildId, settings) => {
    let nameOfPromoPoints = "Promo Points"
    
    const dbNameOfPromoPoints = settings ?
     await settings.findOne({ where: { guild_id: guildId, type: "nameofpromopoints" } }) 
     : await db.settings.findOne({ where: { guild_id: guildId, type: "nameofpromopoints" } })
    if (dbNameOfPromoPoints) {
        nameOfPromoPoints = dbNameOfPromoPoints.config
    }
    return nameOfPromoPoints
}