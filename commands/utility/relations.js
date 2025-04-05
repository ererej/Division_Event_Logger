const { SlashCommandBuilder, UserEntitlements, EmbedBuilder, PermissionsBitField, Client, User  } = require('discord.js');
const noblox = require("noblox.js")
const config = require('../../config.json');
const db = require('../../dbObjects');
const cytoscape = require('cytoscape');
const { createCanvas, Image } = require('canvas');
const fs = require('fs');
const { default: cluster } = require('cluster');
const { all } = require('axios');
const getMetadata = require('../../utils/getMetadata.js')



module.exports = {
	data: new SlashCommandBuilder()
        .setName('relations')
        .setDescription('Get the relations of a group')
        .addIntegerOption(option => 
            option.setName('groupid').setDescription('The group ID to get relations for')
            .setRequired(false)
        )
        .addStringOption(option =>
            option.setName('configs').setDescription('The layout of the graph')
            .setRequired(false)
            .addChoices(
                { name: 'breadthfirst', value: 'breadthfirst' },
                { name: 'cose', value: 'cose' },
                { name: 'concentric', value: 'concentric' },
            )
        )
        .addIntegerOption(option =>
            option.setName('depth').setDescription('The depth of the relations to get')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(5)
        )
        .addIntegerOption(option =>
            option.setName('linesize').setDescription('The size of the lines')
            .setRequired(false)
            .setMinValue(1)
            .setMaxValue(10)
        )
        .addIntegerOption(option =>
            option.setName('width').setDescription('The width of the graph')
            .setRequired(false)
            .setMinValue(100)
            .setMaxValue(10000)
        )
        .addIntegerOption(option =>
            option.setName('height').setDescription('The height of the graph')
            .setRequired(false)
            .setMinValue(100)
            .setMaxValue(10000)
        )
        .addIntegerOption(option =>
            option.setName('padding').setDescription('The padding of the graph')
            .setRequired(false)
            .setMinValue(0)
            .setMaxValue(1000)
        )
        .addIntegerOption(option =>
            option.setName('highlight').setDescription('The group ID to highlight')
            .setRequired(false)
        )
        .addIntegerOption(option =>
            option.setName('nodesize').setDescription('The size of the nodes')
            .setRequired(false)
            .setMinValue(5)
            .setMaxValue(300)
        )
        .addBooleanOption(option =>
            option.setName('groupimage').setDescription('Whether to use the group image or not')
            .setRequired(false)
        )
        ,
        
        


    /**
     *  @param {import('discord.js').CommandInteraction} interaction
     */
    async execute(interaction) {
        await interaction.deferReply();
        
       
        
        const highlighted = interaction.options.getInteger('highlight') || 0//interaction.options.getInteger('groupid')
        const startGroup = interaction.options.getInteger('groupid') || 2648601
        const lineSize = interaction.options.getInteger('linesize') || 1
        const depth = interaction.options.getInteger('depth') || 2
        const testData = true
        const nodeSize = interaction.options.getInteger('nodesize') || 10


        const getAffiliates = async (groupId, type) => {
            const responce = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/relationships/${type}?` + new URLSearchParams({MaxRows: 1000, StartRowIndex: 0}), {
                method: 'GET',
            })
            return (await responce.json()).relatedGroups
        }

        let nodes = []
        let edges = []
        if (testData) {
            nodes = fs.readFileSync('./tempData_nodes.json', 'utf8') || []
            nodes = JSON.parse(nodes)
            edges = fs.readFileSync('./tempData_edges.json', 'utf8') || []
            edges = JSON.parse(edges)
        }
        


        let groups = [[startGroup]]
        
        for (let i = 0; i < depth; i++) {
            groups.push([])
        }
        const visited = new Set()
        const queue = [startGroup]
        if (nodes.length == 0) {
        for (let i = 0; i < depth; i++) {
            const nextQueue = []
            groups[i].push(...queue)
            for (const groupId of queue) {
                console.log(visited.size)
                if (visited.has(groupId)) 
                
                visited.add(groupId)
                nodes.push({ data: { id: groupId, label: groupId } })
                const allies = await getAffiliates(groupId, "Allies")
                const enemies = await getAffiliates(groupId, "Enemies")
                allies.forEach(ally => {
                    if (visited.has(ally.id)) return
                    edges.push({ data: { source: groupId, target: ally.id, type: "ally" } } )
                    nextQueue.push(ally.id)
                })
                enemies.forEach(enemy => {
                    if (visited.has(enemy.id)) return
                    edges.push({ data: { source: groupId, target: enemy.id, type: "enemy" } } )
                    nextQueue.push(enemy.id)
                })
            }
            queue.push(...nextQueue)
        }

         edges = edges.filter(edge => visited.has(edge.data.target))
        }
        
        if (testData) {
            fs.writeFileSync('./tempData_nodes.json', JSON.stringify(nodes, null, 2))
            fs.writeFileSync('./tempData_edges.json', JSON.stringify(edges, null, 2))
        }


        let layout = interaction.options.getString('configs') || 'breadthfirst'
        switch (layout) {
            case 'breadthfirst':
                layout = {
                    name: 'breadthfirst',
                    circle: true,
                    directed: true,
                    padding: 10,
                    spacingFactor: 1.01,
                    avoidOverlap: true,
                    nodeDimensionsIncludeLabels: true,
                    fit: true,
                }
                break;
            case 'cose':
                layout = {
                    name: 'cose',
                    nodeDimensionsIncludeLabels: true,
                    fit: true,
                    padding: 10,
                    idealEdgeLength: 20,
                    nodeRepulsion: 1000,
                    edgeElasticity: 1000,
                    nodeOverlap: 10,
                    nestingFactor: 1,
                    numIter: 19,
                    gravity: 1,
                }
                break;
        }

        //TODO make it use real data instead of hardcoded data and make it centered
        // Create a Cytoscape instance
        const cy = cytoscape({

             elements: [... nodes, ... edges],

            // elements: [
            // { data: { id: 'a' } },
            // { data: { id: 'b' } },
            // { data: { id: 'c' } },
            // { data: { id: 'd' } },
            // { data: { id: 'e' } },
            // { data: { id: 'x' } },
            // { data: { id: 'y' } },
            // { data: { id: 'z' } },
            // { data: { id: 'ax', source: 'a', target: 'x' } },
            // { data: { id: 'xy', source: 'x', target: 'y' } },
            // { data: { id: 'yz', source: 'y', target: 'z' } },
            // { data: { id: 'xz', source: 'x', target: 'z' } },
            // { data: { id: 'ab', source: 'a', target: 'b' } },
            // { data: { id: 'ac', source: 'a', target: 'c' } },
            
            // { data: { id: 'bc', source: 'b', target: 'c' } },
            // { data: { id: 'cd', source: 'c', target: 'd' } },
            // { data: { id: 'be', source: 'b', target: 'e' } },
            // { data: { id: 'de', source: 'd', target: 'e' } },
            // { data: { id: 'ea', source: 'e', target: 'a' } }
            // ],

            style: [
            {
                selector: 'node',
                style: {
                'background-color': '#666',
                'label': 'data(id)'
                }
            },
            {
                selector: 'edge',
                style: {
                'width': 3,
                'line-color': '#ccc',
                'target-arrow-color': '#ccc',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier'
                }
            }
            ],

            layout: layout,
            headless: true, // Run in headless mode
            height: interaction.options.getInteger('height') || 1000, // Set the height of the canvas
            width: interaction.options.getInteger('width') || 1000 // Set the width of the canvas
        });
        
        // Run the layout
        // cy.layout(cy.layout).run();
        cy.center(cy.elements());
        cy.fit(cy.elements(), 50);
        
        // Create a canvas for rendering
        const width = interaction.options.getInteger('width') || 1000;
        const height = interaction.options.getInteger('height') || 1000;
        const padding = interaction.options.getInteger('padding') || 10;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Render the graph manually
        // ctx.fillStyle = '#ffffff';
        // ctx.fillRect(0, 0, width, height);

        // console.log('Nodes:', cy.nodes())
        // console.log('Edges:', cy.edges())

        const scale = 1; // Adjust the scale as needed
        const biggestX = Math.max(...cy.nodes().map(node => node.position().x));
        const biggestY = Math.max(...cy.nodes().map(node => node.position().y));
        const minX = Math.min(...cy.nodes().map(node => node.position().x));
        const minY = Math.min(...cy.nodes().map(node => node.position().y));
        console.log(biggestX, biggestY, minX, minY)

        cy.nodes().forEach(node => {
            const position = node.position();
            position.x = (position.x - minX) / (biggestX - minX) * (width - padding * 2) + padding;
            position.y = (position.y - minY) / (biggestY - minY) * (height - padding * 2) + padding;
        })

        cy.nodes().filter(node => node.data('id') == startGroup).forEach(node => {
            const position = node.position();
            position.x = width/2;
            position.y = height/2;
        })


        cy.edges().forEach(edge => {
            const source = cy.getElementById(edge.data('source')).position();
            const target = cy.getElementById(edge.data('target')).position();

            ctx.beginPath();
            ctx.moveTo(source.x*scale, source.y*scale);
            ctx.lineTo(target.x*scale, target.y*scale);
            ctx.strokeStyle = edge.data('type') == "enemy" ? '#ff0000' : '#00ff00'; // Red for enemies, green for allies
            ctx.lineWidth = lineSize;
            ctx.stroke();
        });

        //const test = await getMetadata(`https://www.roblox.com/communities/${startGroup}/SEA-First-Air-Force#!/affiliates`)
       // console.log(test)

        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));


        if (interaction.options.getBoolean('groupimage')) {
            for (const group of nodes.map(node => node.data.id)) {
                try {
                    // Add a delay before each API call
                    await delay(30); // Adjust the delay as needed
        
                    const logo = await noblox.getLogo({ group: parseInt(group) }).catch(err => console.log(err));
                    const img = new Image();
                    img.src = logo || 'https://www.roblox.com/asset-thumbnail/image?assetId=0&width=420&height=420&format=png';
                    console.log(logo);
                    await new Promise((resolve, reject) => {
                        img.onload = () => {
                            const position = cy.getElementById(group).position();
                            ctx.drawImage(img, position.x - (nodeSize / 2), position.y - (nodeSize / 2), nodeSize, nodeSize);
                            resolve(); // Resolve when the image is loaded and drawn
                        };
                        img.onerror = (err) => {
                            console.error(`Failed to load image for group ${group}:`, err);
                            resolve(); // Resolve even if the image fails to load
                        };
                    });
                } catch (err) {
                    console.error(`Error loading image for group ${group}:`, err);
                }
            }
        } else {
        cy.nodes().forEach(node => {
            const position = node.position();
            
            ctx.beginPath();
            
            ctx.arc(position.x * scale, position.y * scale, (node.data('id') == startGroup ? 30: (node.data('id') == highlighted ? 20 : 10)), 0, 2 * Math.PI);
            ctx.fillStyle = '#666';
            if (node.data('id') == startGroup) {
                ctx.fillStyle = '#0000ff'; // Blue for the main node
            } else if (node.data('id') == highlighted) {
                ctx.fillStyle = '#ff69b4'; // Pink for the target node
            }
            ctx.fill();
            ctx.strokeStyle = '#000';
            ctx.stroke();

            // Draw the label
            ctx.fillStyle = '#999';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(node.data('id'), position.x/biggestX *scale, position.y*scale + 4);
        });
        }

        

        // Save the canvas as a PNG
        const outputPath = './graph.png';
        const out = fs.createWriteStream(outputPath);
        const stream = canvas.createPNGStream();
        stream.pipe(out);

        out.on('finish', async () => {
            // Send the PNG file to the user
            await interaction.editReply({
                content: 'Here is your graph:',
                files: [outputPath]
            });

            // Optionally delete the file after sending
            fs.unlinkSync(outputPath);
        });    

  }
};