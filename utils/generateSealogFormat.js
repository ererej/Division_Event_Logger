module.exports = ({eventType, DivisionName, announcmentLink, Date, lenth, attendeeCount, mapName, codeblock=""}) => {
    //todo actully make the function!
    let format = `
    ${codeblock ? "```" : ""}
    Divison: ${DivisionName}
    Link to Event: ${announcmentLink}
    Date: ${Date}\n`

    format += ["tryout", "training"].includes(eventType) ? `Duration: ${lenth} Min\n` : ""
    format += ["patrol", "training"].includes(eventType) ? `5+ Attendees?: ${attendeeCount >=5 ? "5+\n": "No\n"}` : "Attendee Count: " + attendeeCount + "\n"
    format += ["tryout", "training"].includes(eventType) ? `Map Name: ${mapName}\n` : ""
    format += ["tryout", "training"].includes(eventType) ? `base: No\n` : ""
    format += `Screenshot of Event:
    ${codeblock ? "```" : ""}
    `
    return format
}