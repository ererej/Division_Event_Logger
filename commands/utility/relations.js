const { SlashCommandBuilder, UserEntitlements, EmbedBuilder, PermissionsBitField, Client, User, AttachmentBuilder  } = require('discord.js');
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
                { name: 'cose2', value: 'cose2' },
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
        const testData = false
        const nodeSize = interaction.options.getInteger('nodesize') || 10
        const ignoreLinksToStartGroup = false


        const getAffiliates = async (groupId, type) => {
            const responce = await fetch(`https://groups.roblox.com/v1/groups/${groupId}/relationships/${type}?` + new URLSearchParams({MaxRows: 1000, StartRowIndex: 0}), {
                method: 'GET',
            })
            if (responce.status != 200) {
                console.log(responce.status)
                return []
            }
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
        
        for (let i = 0; i < depth; i++) {
            console.log("DEPTH: " + i + " QUEUE: " + queue.length)
            if (i == 0 && nodes.length != 0) {
                break
            }
            const nextQueue = []
            groups[i].push(...queue)
            for (const groupId of queue) {
                if (visited.has(groupId)) {
                    continue
                }
                visited.add(groupId)
                console.log(visited.size)
                nodes.push({ data: { id: groupId, label: groupId } })
                const allies = await getAffiliates(groupId, "Allies")
                const enemies = await getAffiliates(groupId, "Enemies")
                allies.forEach(ally => {
                    if (visited.has(ally.id)) return
                    edges.push({ data: { source: groupId, target: ally.id, type: "ally" } } )
                    nextQueue.push(ally.id)
                })
                enemies.forEach(enemy => {
                    // if (visited.has(enemy.id)) return
                    edges.push({ data: { source: groupId, target: enemy.id, type: "enemy" } } )
                    nextQueue.push(enemy.id)
                })
            }
            queue.push(...nextQueue)
        }

        console.log(edges.length)
        if (!testData) {
            edges = edges.filter(edge => visited.has(edge.data.target))
        }
        const edgesWithoutLinkesToStartGroup = edges.filter(edge => edge.data.source != startGroup && edge.data.target != startGroup)
        
        console.log(edges.length)
        
        // if (testData) {
        //     fs.writeFileSync('./tempData_nodes.json', JSON.stringify(nodes, null, 2))
        //     fs.writeFileSync('./tempData_edges.json', JSON.stringify(edges, null, 2))
        // }


        let layout = interaction.options.getString('configs') || 'breadthfirst'
        let layoutPart2 = null
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
                    idealEdgeLength: function (edge){ return [edge.data('source'), edge.data('target')].includes(startGroup) ? width/2 : (edge.data('type') == "enemy" ? 400 : 50); },
                    nodeRepulsion: 10000,
                    edgeElasticity: function (edge) { return [edge.data('source'), edge.data('target')].includes(startGroup) ? 0 : edge.data('type') == "enemy" ? 200 : 1000; },
                    nodeOverlap: 1000,
                    nestingFactor: 1,
                    numIter: 99,
                    gravity: 0.1,
                    refresh: 100
                }
                break;
            case 'cose2':
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
                layoutPart2 = {
                    name: 'cose',
                    nodeDimensionsIncludeLabels: true,
                    fit: true,
                    padding: 10,
                    idealEdgeLength: function (edge){ return [edge.data('source'), edge.data('target')].includes(startGroup) ? width/2 : (edge.data('type') == "enemy" ? 500 : 300); },
                    nodeRepulsion: 10,
                    edgeElasticity: function (edge) { return [edge.data('source'), edge.data('target')].includes(startGroup) ? 10 : edge.data('type') == "enemy" ? 1 : 10; },
                    nodeOverlap: 10,
                    nestingFactor: 1,
                    numIter: 100,
                    gravity: 1,
                    refresh: 1000
                }
                break;
        }


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
        const padding = interaction.options.getInteger('padding') || nodeSize;
        const canvas = createCanvas(width, height);
        const ctx = canvas.getContext('2d');

        // Render the graph manually
        // ctx.fillStyle = '#ffffff';
        // ctx.fillRect(0, 0, width, height);

        // console.log('Nodes:', cy.nodes())
        // console.log('Edges:', cy.edges())

        

        

        //const test = await getMetadata(`https://www.roblox.com/communities/${startGroup}/SEA-First-Air-Force#!/affiliates`)
       // console.log(test)

        const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));
        const render = async() => {

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
            ctx.strokeStyle = edge.data('type') == "enemy" ? '#ff0000' : '#0000ff'; // Red for enemies, blue for allies
            ctx.lineWidth = lineSize;
            ctx.stroke();
        });


        let cachedImages = JSON.parse(fs.readFileSync('./tempData_images.json', 'utf8'))
        cachedImages = new Map(cachedImages)

        if (interaction.options.getBoolean('groupimage')) {
            for (const group of nodes.map(node => node.data.id)) {
                try {
                    // Add a delay before each API call
                    await delay(cachedImages ? 1: 1000); // Adjust the delay as needed
        
                    const logo = cachedImages.get(group) ?? await noblox.getLogo({ group: parseInt(group) }).catch(err => console.log(err));
                    cachedImages.set(group, logo)
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
            fs.writeFileSync('./tempData_images.json', JSON.stringify(Array.from(cachedImages.entries())))
            console.log(cachedImages.size)
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
        const now = new Date()
        const outputPath = './graph' + now.getTime() + '.png';
        return new Promise((resolve, reject) => {
            const out = fs.createWriteStream(outputPath);
            const stream = canvas.createPNGStream();
            stream.pipe(out);
            out.on('finish', () => {
                console.log('The PNG file was created.')
                resolve({ path: outputPath, attachment: new AttachmentBuilder(outputPath).setName('graph.png')}); 
            });

            out.on('error', (err) => {
                console.error('Error writing PNG file:', err);
                reject(err); // Reject the promise on error
            })
        })
        
        }
        let reply = ""
        const graphs = []
        for (let i = 0; i < 1; i++) {
            ctx.clearRect(0, 0, width, height); // Clear the canvas before each render
            graphs.push(await render())
            console.log('Graph ' + i + ' rendered')
            console.log(typeof cy.data.edges)
            if (ignoreLinksToStartGroup) {
                
                // const before = cy.data.edges.size;
                // cy.data.edges = edgesWithoutLinkesToStartGroup
                // reply = `Graph ${i} rendered with ${before - cy.data.edges.size} edges removed.`
            }
            if (layoutPart2) {
                
                cy.layout(layoutPart2).run();
            } else {
                cy.layout(layout).run();
            }
            
            
        }

        // Send the PNG file to the user
        await interaction.editReply({
            content: 'Here is your graph:    ' + reply,
            files: graphs.map(graph => graph.attachment),
        });

        // Optionally delete the file after sending
        graphs.forEach(outputPath => {
            fs.unlinkSync(outputPath.path);
        })
         

  }
};