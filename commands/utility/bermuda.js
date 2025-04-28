const { SlashCommandBuilder, UserEntitlements, EmbedBuilder, PermissionsBitField, Client, User  } = require('discord.js');
const noblox = require("noblox.js")
const config = require('../../config.json');
const db = require('../../dbObjects');
const cytoscape = require('cytoscape');
const { createCanvas } = require('canvas');
const fs = require('fs');
const { default: cluster } = require('cluster');
const { all } = require('axios');
const generateGraph = require('../../utils/generateGraph.js');



module.exports = {
	data: new SlashCommandBuilder()
        .setName('bermuda')
        .setDescription('A test command')
        .addStringOption(option =>
            option.setName('treatment')
                .setDescription('The treatment to use for when ererej is playing with stuff')
                .setRequired(false)
                .addChoices(
                    { name: 'test', value: 'test' },
                    { name: 'test2', value: 'test2' },
                    { name: 'test3', value: 'test3' },
                    { name: 'test4', value: 'test4' },
                    { name: 'test5', value: 'test5' },
                    { name: 'test6', value: 'test6' },
                    { name: 'test7', value: 'test7' },
                    { name: 'test8', value: 'test8' },
                    { name: 'test9', value: 'test9' },
                    { name: 'test10', value: 'test10' }
                )
        ),



    /**
     *  @param {import('discord.js').CommandInteraction} interaction
     */
    async execute(interaction) {
        await interaction.deferReply();
        if (interaction.guild.id == "831851819457052692" || (interaction.member.id == "386838167506124800" && interaction.options.getString('treatment'))) {
            switch (interaction.options.getString('treatment')) {
                case 'test':
                    const servers = await db.Servers.findAll()
                    const premiumServers = servers.filter(server => server.premium_end_date > Date.now())
                    
                    return interaction.editReply({content: `There are ${servers.length} servers using the bot, and ${premiumServers.length} of them are premium!\n\n` + servers.map(server => `${server.name}`).join("\n")})
                break;
                case 'test2':
                    const guilds = await interaction.client.guilds.fetch()
                    // const specialNick )

                    break
                case 'test3':
                    
                    const rankNames = ["[LR1]", "[LR2]", "[LR3]", "[MR1]", "[MR2]","[MR3]", "[WO]", "[HR1]", "[HR2]", "[HR3]", "[HC1]", "[HC2]", "[HC3]"]
                    let dataPerRank = []

                    interaction.editReply("sending")
                    
                    
                    let replyString = ""
                    for (const rankName of rankNames) {
                        let ranks = await noblox.getRoles(2648601)
                        ranks = ranks.filter(rank=> rank.name.includes(rankName))
                            
                        const officers = await noblox.getPlayers(2648601, ranks.map(rank => rank.id))

                        let amount = 0
                        replyString += `\n\n***${rankName}:***\n`
                        const members = await interaction.guild.members.fetch();
                        for (const officer of officers) {
                            const member = members.find(m => m.displayName === officer.username);
                            if (member) {
                                amount++
                                replyString += "💜"
                            } else {
                                if (rankName == "[HC3]") {
                                    console.log(officer.username + " is one of the HC3s that are not in FAF")
                                } 
                                replyString += "🖤"
                            }
                            //interaction.editReply(replyString)
                        }
                        replyString += `\n\nThere are ${amount} ${rankName}'s in the server! (${amount*100/officers.length}%)\n\n`
                        dataPerRank.push({rank: rankName, amount: amount, total: officers.length})
                        console.log(rankName + ": " + amount + " / " + officers.length)
                    }

                    const graph = await generateGraph({values: dataPerRank.map(data => Math.round(data.amount*100/data.total)), title: "SEA officers in FAF", labels: rankNames}, "line", 400, 400)
                    await interaction.editReply({content: replyString, files: [graph.attachment]})
                    fs.unlinkSync(graph.filePath)
                    return

                default:
                    return interaction.editReply({content: "test!"})
            }


        
    //     const targetGroupId = 34309406//interaction.options.getInteger('groupid')
    //     const seaMilitary = 2648601/*16992878*/
    //     const lineSize = 1
    //     const depth = 3
        
    //     const getAffiliates = async (groupId, type) => {
    //         const responce = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/relationships/${type}?` + new URLSearchParams({MaxRows: 1000, StartRowIndex: 0}), {
    //             method: 'GET',
    //         })
    //         return (await responce.json()).relatedGroups
    //     }

    //     const nodes = []
    //     let edges = []


    //     let groups = [[seaMilitary]]
    //     for (let i = 0; i < depth; i++) {
    //         groups.push([])
    //     }
    //     const visited = new Set()
    //     const queue = [seaMilitary]
        
    //     for (let i = 0; i < depth; i++) {
    //         const nextQueue = []
    //         groups[i].push(...queue)
    //         for (const groupId of queue) {
    //             console.log(visited.size)
    //             if (visited.has(groupId)) continue
    //             visited.add(groupId)
    //             nodes.push({ data: { id: groupId, label: groupId } })
    //             const allies = await getAffiliates(groupId, "Allies")
    //             const enemies = await getAffiliates(groupId, "Enemies")
    //             allies.forEach(ally => {
    //                 if (visited.has(ally.id)) return
    //                 edges.push({ data: { source: groupId, target: ally.id, type: "ally" } } )
    //                 nextQueue.push(ally.id)
    //             })
    //             enemies.forEach(enemy => {
    //                 if (visited.has(enemy.id)) return
    //                 edges.push({ data: { source: groupId, target: enemy.id, type: "enemy" } } )
    //                 nextQueue.push(enemy.id)
    //             })
    //         }
    //         queue.push(...nextQueue)
    //     }

    //      edges = edges.filter(edge => visited.has(edge.data.target))
        
    //     // const allysJson = await allys.json()
    //     // //console.log(allysJson)
    //     // const nodes = allysJson.relatedGroups.map((ally) => {
    //     //     return { data: { id: ally.id, /*label: ally.name*/ } };
    //     // });
    //     // nodes.push({ data: { id: groupId, label: "SEA military", renderedPosition: {x: 500, y: 500 } } });
    //     // const edges = allysJson.relatedGroups.map((ally) => {
    //     //     return { data: { source: groupId, target: ally.id } };
    //     // }
    //     // );

    //     //TODO make it use real data instead of hardcoded data and make it centered
    //     // Create a Cytoscape instance
    //     const cy = cytoscape({

    //         elements: [... nodes, ... edges],

    //         /*elements: [
    //         { data: { id: 'a' } },
    //         { data: { id: 'b' } },
    //         { data: { id: 'c' } },
    //         { data: { id: 'd' } },
    //         { data: { id: 'e' } },
    //         { data: { id: 'ab', source: 'a', target: 'b' } },
    //         { data: { id: 'bc', source: 'b', target: 'c' } },
    //         { data: { id: 'cd', source: 'c', target: 'd' } },
    //         { data: { id: 'de', source: 'd', target: 'e' } },
    //         { data: { id: 'ea', source: 'e', target: 'a' } }
    //         ],*/

    //         style: [
    //         {
    //             selector: 'node',
    //             style: {
    //             'background-color': '#666',
    //             'label': 'data(id)'
    //             }
    //         },
    //         {
    //             selector: 'edge',
    //             style: {
    //             'width': 1,
    //             'line-color': '#ccc',
    //             'target-arrow-color': '#ccc',
    //             'target-arrow-shape': 'triangle',
    //             'curve-style': 'bezier'
    //             }
    //         }
    //         ],
    //         /*
    //         layout: {
    //         name: 'breadthfirst',
    //         circle: false,
    //         directed: false,
    //         padding: 10,
    //         spacingFactor: 1.01,
    //         avoidOverlap: true,
    //         nodeDimensionsIncludeLabels: true,
    //         fit: true,
    //         // rows: 3
    //         },*/

    //         layout: {
    //             name: 'cose',
    //             nodeRepulsion: 2048,
    //             idealEdgeLength: 32,
    //             edgeElasticity: 32,
    //             nodeOverlap: 4,
    //             fit: true,
    //             nestingFactor: 1.2,
    //         },

    //         headless: true, // Run in headless mode
    //         height: 1000, // Set the height of the canvas
    //         width: 1000 // Set the width of the canvas
    //     });
        
    //     // Run the layout
    //     // cy.layout(cy.layout).run();
    //     cy.center(cy.elements());
    //     cy.fit(cy.elements(), 50);
        
    //     // Create a canvas for rendering
    //     const width = 1000;
    //     const height = 1000;
    //     const padding = 10;
    //     const canvas = createCanvas(width, height);
    //     const ctx = canvas.getContext('2d');

    //     // Render the graph manually
    //     // ctx.fillStyle = '#ffffff';
    //     // ctx.fillRect(0, 0, width, height);

    //     // console.log('Nodes:', cy.nodes())
    //     // console.log('Edges:', cy.edges())

    //     const scale = 1; // Adjust the scale as needed
    //     const biggestX = Math.max(...cy.nodes().map(node => node.position().x));
    //     const biggestY = Math.max(...cy.nodes().map(node => node.position().y));
    //     const minX = Math.min(...cy.nodes().map(node => node.position().x));
    //     const minY = Math.min(...cy.nodes().map(node => node.position().y));
    //     console.log(nodes.length)
    //     console.log(edges.length)
    //     cy.nodes().forEach(node => {
    //         const position = node.position();
    //         position.x = (position.x - minX) / (biggestX - minX) * (width - padding * 2) + padding;
    //         position.y = (position.y - minY) / (biggestY - minY) * (height - padding * 2) + padding;
    //     })

    //     cy.nodes().filter(node => node.data('id') == seaMilitary).forEach(node => {
    //         const position = node.position();
    //         position.x = width/2;
    //         position.y = height/2;
    //     })


    //     cy.edges().forEach(edge => {
    //         const source = cy.getElementById(edge.data('source')).position();
    //         const target = cy.getElementById(edge.data('target')).position();

    //         ctx.beginPath();
    //         ctx.moveTo(source.x*scale, source.y*scale);
    //         ctx.lineTo(target.x*scale, target.y*scale);
    //         ctx.strokeStyle = edge.data('type') == "enemy" ? '#ff0000' : '#00ff00'; // Red for enemies, green for allies
    //         ctx.lineWidth = lineSize;
    //         ctx.stroke();
    //     });




    //     cy.nodes().forEach(node => {
    //         const position = node.position();
            
    //         ctx.beginPath();
            
    //         ctx.arc(position.x * scale, position.y * scale, (node.data('id') == seaMilitary ? 20: (node.data('id') == targetGroupId ? 20 : 10)), 0, 2 * Math.PI);
    //         ctx.fillStyle = '#666';
    //         if (node.data('id') == seaMilitary) {
    //             ctx.fillStyle = '#0000ff'; // Blue for the main node
    //         } else if (node.data('id') == targetGroupId) {
    //             ctx.fillStyle = '#ff69b4'; // Pink for the target node
    //         }
    //         ctx.fill();
    //         ctx.strokeStyle = '#000';
    //         ctx.stroke();

    //         // Draw the label
    //         ctx.fillStyle = '#fff';
    //         ctx.font = '12px Arial';
    //         ctx.textAlign = 'center';
    //         ctx.fillText(node.data('id'), position.x/biggestX *scale, position.y*scale + 4);
    //     });

        

    //     // Save the canvas as a PNG
    //     const outputPath = './graph.png';
    //     const out = fs.createWriteStream(outputPath);
    //     const stream = canvas.createPNGStream();
    //     stream.pipe(out);

    //     out.on('finish', async () => {
    //         // Send the PNG file to the user
    //         await interaction.editReply({
    //             content: 'Here is your graph:',
    //             files: [outputPath]
    //         });

    //         // Optionally delete the file after sending
    //         fs.unlinkSync(outputPath);
    //     });    


        



    // //     interaction.client.emit('guildCreate', interaction.guild);
    // //    //eventEmitter.emit('guildMemberAdd', interaction.member);
    // //     return interaction.editReply({content: "event emitted!"})
        

    //     /*
    //     let rateLimitRemaining = 99;
    //     let robloxUser;
    //     let i = 0;
    //     let rateLimitReset;
    //     while ((rateLimitReset == undefined || rateLimitReset == null ) && i < 30) {
    //     robloxUser = await fetch(`https://registry.rover.link/api/guilds/${interaction.guild.id}/discord-to-roblox/${interaction.user.id}`, {
    //         headers: {
    //         'Authorization': `Bearer ${config.roverkey}`
    //         }
    //     })
    //     rateLimitRemaining = robloxUser.headers.get('x-ratelimit-remaining');
    //     console.log("rateLimitRemaining: ", rateLimitRemaining + " i: " + i)
    //     rateLimitReset = robloxUser.headers.get('x-ratelimit-reset');
    //     i++;
    //     }
    //     console.log("AFTER LOOP")
    //     console.log(robloxUser)

    //     // Access the x-ratelimit-bucket header
    //     const rateLimitBucket = robloxUser.headers.get('x-ratelimit-bucket');
    //     console.log('x-ratelimit-bucket:', rateLimitBucket);
    //     // Access the x-ratelimit-remaining header
    //     console.log('x-ratelimit-remaining:', rateLimitRemaining);
    //     // Access the x-ratelimit-reset header
    //     console.log('x-ratelimit-reset:', rateLimitReset);

        
    //     console.log("\n\n\n\n\nAFTER JSON")
    //     robloxUser = await robloxUser.json()
    //     console.log(robloxUser)
    //     interaction.editReply({content: `Your roblox user is ${robloxUser.cachedUsername}`})
    //     */

        } else {
            const gameInstants = await noblox.getGameInstances(12983079028)
            const placeInfo = await noblox.getPlaceInfo(12983079028)
            const gameInfo = await noblox.getUniverseInfo(placeInfo[0].universeId)
            const totalPlayers = gameInfo[0].playing
            let playersInPublicGames = 0;
            for (const game of gameInstants) {
                playersInPublicGames += game.playing
            }
            
            interaction.editReply({content: "it looks like there are " + totalPlayers + " players in Bermuda Air Base, and " + playersInPublicGames + " of them are in public servers!"})
        }
    }
};