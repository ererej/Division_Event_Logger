module.exports = async (db, guildId, settings) => {
    let nameOfPromoPoints = "Promo Points"
    if (!settings) {
        settings = await db.Settings
    }
    const dbNameOfPromoPoints = await settings.findOne({ where: { guild_id: guildId, type: "nameofpromopoints" } })
    if (dbNameOfPromoPoints) {
        nameOfPromoPoints = dbNameOfPromoPoints.config
    }
    return nameOfPromoPoints
}