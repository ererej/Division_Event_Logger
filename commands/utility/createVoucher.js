const { SlashCommandBuilder, EmbedBuilder, PermissionsBitField, AttachmentBuilder } = require('discord.js');
const { createCanvas, loadImage } = require('canvas');
const noblox = require('noblox.js');
const getRobloxUser = require('../../utils/getRobloxUser.js');



module.exports = {
    data: new SlashCommandBuilder()
        .setName('createvoucher')
        .setDescription('Creates a voucher!')
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageGuild || PermissionsBitField.Flags.Administrator)
        .addStringOption(option => 
            option.setName("officer_type")
            .setDescription("The type of officer for the voucher!")
        )
        .addStringOption(option =>
            option.setName("expiration_date")
            .setDescription("The expiration date of the voucher in DD-MM-YYYY format! or just NEVER")
        )
        .addStringOption(option =>
            option.setName("hr_slot")
            .setDescription("The HR slot the voucher is for!")
        ),

    guildLock: ["1073682080380243998"],
    
    async execute(interaction) {
        await interaction.deferReply();
        
        const officerType = interaction.options.getString('officer_type') || 'Host';
        const expirationDate = interaction.options.getString('expiration_date') || 'Never';
        const hrslot = interaction.options.getString('hr_slot') || 'HR';

        let robloxUser = await getRobloxUser({ MEMBER: interaction.member });
        if (robloxUser.error) {
            return interaction.editReply({ embeds: [new EmbedBuilder().setDescription(`Error fetching Roblox user: ${robloxUser.error}`).setColor([255, 0, 0])] });
        }
        
        robloxUser = robloxUser ? await robloxUser.json() : robloxUser;
        if (!robloxUser) {
            return interaction.editReply({ embeds: [new EmbedBuilder().setDescription('Roblox user not found or not linked!').setColor([255, 0, 0])] });
        }
        const characterId = robloxUser.robloxId;
        let characterImageHeadshootUrl = null;
        try {
            characterImageHeadshootUrl = await noblox.getPlayerThumbnail(characterId, 420, 'png', false, 'headshot');
        } catch (error) {
            console.error('Error fetching Roblox thumbnail:', error);
        }
        let characterImageBodyshotUrl = null;
        try {
            const ererej = await getRobloxUser({ memberId: '386838167506124800', guildId: '1073682080380243998' });
            robloxUser = ererej ? await ererej.json() : ererej;
            const characterId = robloxUser.robloxId;
            characterImageBodyshotUrl = await noblox.getPlayerThumbnail(characterId, 420, 'png', false, 'body');
        } catch (error) {
            console.error('Error fetching Roblox bodyshot thumbnail:', error);
        }
        const characterImage = (characterImageHeadshootUrl ? { url: characterImageHeadshootUrl[0].imageUrl } : null);

        // Canvas size (landscape coupon)
        const W = 1600, H = 700;
        const margin = 40;
        
        const canvas = createCanvas(W, H);
        const ctx = canvas.getContext('2d');
        
        // Create base with textured paper color (sepia/beige)
        ctx.fillStyle = '#EFE4D2';
        ctx.fillRect(0, 0, W, H);
        
        // Subtle paper texture (noise)
        const imageData = ctx.getImageData(0, 0, W, H);
        for (let i = 0; i < imageData.data.length; i += 4) {
            const noise = Math.random() * 14;
            imageData.data[i] = Math.min(255, 235 + noise);     // R
            imageData.data[i + 1] = Math.min(255, 225 + noise); // G
            imageData.data[i + 2] = Math.min(255, 200 + noise); // B
        }
        ctx.putImageData(imageData, 0, 0);
        
        // Decorative border
        ctx.strokeStyle = '#5E3A1E';
        ctx.lineWidth = 6;
        ctx.strokeRect(margin, margin, W - 2 * margin, H - 2 * margin);
        
        // Inner fine line
        ctx.strokeStyle = '#785032';
        ctx.lineWidth = 2;
        ctx.strokeRect(margin + 12, margin + 12, W - 2 * (margin + 12), H - 2 * (margin + 12));
        
        // Perforation line (dashed) across width
        const perforationY = H / 2 + 40;
        const dashW = 12;
        const gap = 10;
        ctx.strokeStyle = '#786446';
        ctx.lineWidth = 2;
        
        for (let x = margin + 15; x < W - margin - 15; x += dashW + gap) {
            ctx.beginPath();
            ctx.moveTo(x, perforationY);
            ctx.lineTo(x + dashW, perforationY);
            ctx.stroke();
        }
        
        // Small circular perforation dots along edges
        const dotRadius = 3;
        const step = 22;
        ctx.fillStyle = '#C8B496';
        
        for (let y = margin + 20; y < H - margin - 20; y += step) {
            // Left edge dots
            ctx.beginPath();
            ctx.arc(margin - 9, y, dotRadius, 0, 2 * Math.PI);
            ctx.fill();
            
            // Right edge dots
            ctx.beginPath();
            ctx.arc(W - margin + 9, y, dotRadius, 0, 2 * Math.PI);
            ctx.fill();
        }
        
        // Typography
        ctx.textAlign = 'center';
        ctx.fillStyle = '#5E3A1E';
        ctx.font = 'bold 72px Arial';
        ctx.fillText('COUPON', W / 2, margin + 80);
        
        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = '#50321E';
        ctx.fillText(`Good for ONE ${hrslot} SLOT`, W / 2, margin + 150);
        
        // Decorative divider
        const dividerY = margin + 180;
        ctx.font = '22px Arial';
        ctx.fillStyle = '#785032';
        for (let i = margin + 60; i < W - margin - 60; i += 34) {
            ctx.fillText('[]', i, dividerY);
        }
        
        // Left block: Issuer, class, expires
        ctx.textAlign = 'left';
        ctx.font = '22px Arial';
        ctx.fillStyle = '#3C281E';
        const leftX = margin + 40;
        const leftY = margin + 240;
        
        const lines = [
            `Issuer: ${interaction.user.displayName}`,
            `Class: ${officerType}`,
            `Expires: ${expirationDate}`
        ];
        
        lines.forEach((line, idx) => {
            ctx.fillText(line, leftX, leftY + idx * 40);
        });
        
        // Right block: Serial and Officer
        const rightX = W - margin - 420;
        const rightY = margin + 220;
        
        ctx.strokeStyle = '#6E4B2D';
        ctx.lineWidth = 2;
        ctx.strokeRect(rightX, rightY, 360, 220);
        
        ctx.font = 'bold 36px Arial';
        ctx.fillStyle = '#643C28';
        ctx.fillText('Serial', rightX + 20, rightY + 50);
        
        ctx.font = '18px Arial';
        ctx.fillStyle = '#50321E';
        const serialNumber = 'FAF-' + Math.floor(Math.random() * 900000 + 100000);
        ctx.fillText(serialNumber, rightX + 20, rightY + 90);
        
        ctx.font = '22px Arial';
        ctx.fillStyle = '#3C281E';
        ctx.fillText('Officer:', rightX + 20, rightY + 130);
        
        ctx.strokeStyle = '#826A3C';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(rightX + 20, rightY + 160);
        ctx.lineTo(rightX + 340, rightY + 160);
        ctx.stroke();
        
        // Create star stamp (FAF official stamp)
        const starStampSize = Math.min(W, H) * 0.22;
        const starCanvas = createCanvas(starStampSize, starStampSize);
        const starCtx = starCanvas.getContext('2d');
        
        // Draw star shape
        const numPoints = 5;
        const starCx = starStampSize / 2;
        const starCy = starStampSize / 2;
        const outerR = starStampSize / 2 - 6;
        const innerR = outerR / 2.5;
        const starPoints = [];
        
        for (let i = 0; i < numPoints * 2; i++) {
            const r = i % 2 === 0 ? outerR : innerR;
            const angle = i * Math.PI / numPoints - Math.PI / 2;
            const x = starCx + r * Math.cos(angle);
            const y = starCy + r * Math.sin(angle);
            starPoints.push([x, y]);
        }
        
        // Draw star polygon
        starCtx.strokeStyle = '#5F2E14';
        starCtx.lineWidth = 6;
        starCtx.beginPath();
        starCtx.moveTo(starPoints[0][0], starPoints[0][1]);
        for (let i = 1; i < starPoints.length; i++) {
            starCtx.lineTo(starPoints[i][0], starPoints[i][1]);
        }
        starCtx.closePath();
        starCtx.stroke();
        
        // Add "FAF" text in center of star
        starCtx.fillStyle = '#5F2E14';
        starCtx.textAlign = 'center';
        starCtx.textBaseline = 'middle';
        starCtx.font = `bold ${starStampSize * 0.20}px Arial`;
        starCtx.fillText('FAF', starCx, starCy);
        
        // Rotate star stamp and place it (top-right position)
        ctx.save();
        const starStampX = W * 0.62;
        const starStampY = H * 0.42;
        ctx.translate(starStampX + starStampSize / 2, starStampY + starStampSize / 2);
        ctx.rotate(-12 * Math.PI / 180);
        ctx.drawImage(starCanvas, -starStampSize / 2, -starStampSize / 2);
        ctx.restore();
        
        // Modify the existing character stamp code (replace the existing character stamp section)
        if (characterImage) {
            try {
                const charImg = await loadImage(characterImage.url);
                
                // Create character stamp (original size)
                const charStampD = Math.min(W, H) * 0.24;
                const charStampCanvas = createCanvas(charStampD, charStampD);
                const charStampCtx = charStampCanvas.getContext('2d');
                
                // Draw circular border only (no text on character stamp)
                charStampCtx.strokeStyle = '#5F2E14';
                charStampCtx.lineWidth = 8;
                charStampCtx.beginPath();
                charStampCtx.arc(charStampD / 2, charStampD / 2, charStampD / 2 - 4, 0, 2 * Math.PI);
                charStampCtx.stroke();
                
                charStampCtx.lineWidth = 3;
                charStampCtx.beginPath();
                charStampCtx.arc(charStampD / 2, charStampD / 2, charStampD / 2 - 18, 0, 2 * Math.PI);
                charStampCtx.stroke();
                
                // Draw character image centered in the stamp
                const charSize = charStampD * 0.7;
                const charX = (charStampD - charSize) / 2;
                const charY = (charStampD - charSize) / 2 - 30;
                
                charStampCtx.drawImage(charImg, charX, charY, charSize, charSize);
                
                // Rotate character stamp and place it below perforation line (bottom-left position)
                ctx.save();
                const charStampX = W * 0.18;
                const charStampY = H * 0.65;
                ctx.translate(charStampX + charStampD / 2, charStampY + charStampD / 2);
                ctx.rotate(8 * Math.PI / 180); // Rotate in opposite direction from star
                ctx.drawImage(charStampCanvas, -charStampD / 2, -charStampD / 2);
                ctx.restore();
                
            } catch (error) {
                console.error('Error processing character image:', error);
            }
        }
        // Add multiple watermarks using ererej's character image
        if (characterImageBodyshotUrl) {
            try {
                const watermarkImg = await loadImage(characterImageBodyshotUrl[0].imageUrl);
                
                // Define watermark positions and sizes
                const watermarkConfigs = [
                    // Large center watermark
                    {
                        x: W * 0.5,
                        y: H * 0.5,
                        size: Math.min(W, H) * 0.4,
                        opacity: 0.05,
                        rotation: (Math.random() - 0.5) * 30 // -15 to +15 degrees
                    },
                    // Top left corner
                    {
                        x: W * 0.2,
                        y: H * 0.25,
                        size: Math.min(W, H) * 0.15,
                        opacity: 0.08,
                        rotation: (Math.random() - 0.5) * 45 // -22.5 to +22.5 degrees
                    },
                    // Bottom right corner
                    {
                        x: W * 0.8,
                        y: H * 0.8,
                        size: Math.min(W, H) * 0.12,
                        opacity: 0.06,
                        rotation: (Math.random() - 0.5) * 60 // -30 to +30 degrees
                    },
                    // Middle left
                    {
                        x: W * 0.15,
                        y: H * 0.6,
                        size: Math.min(W, H) * 0.1,
                        opacity: 0.04,
                        rotation: (Math.random() - 0.5) * 90 // -45 to +45 degrees
                    },
                    // Top right (avoiding the star stamp)
                    {
                        x: W * 0.85,
                        y: H * 0.2,
                        size: Math.min(W, H) * 0.08,
                        opacity: 0.07,
                        rotation: (Math.random() - 0.5) * 120 // -60 to +60 degrees
                    }
                ];
                
                // Apply each watermark
                watermarkConfigs.forEach((config, index) => {
                    try {
                        ctx.save();
                        
                        // Set opacity for this watermark
                        ctx.globalAlpha = config.opacity;
                        
                        // Move to position and rotate
                        ctx.translate(config.x, config.y);
                        ctx.rotate(config.rotation * Math.PI / 180);
                        
                        // Draw watermark centered at the position
                        ctx.drawImage(
                            watermarkImg, 
                            -config.size / 2, 
                            -config.size / 2, 
                            config.size, 
                            config.size
                        );
                        
                        ctx.restore();
                        
                    } catch (err) {
                        console.error(`Error applying watermark ${index + 1}:`, err);
                    }
                });
                
            } catch (error) {
                console.error('Error processing watermark image:', error);
            }
        }
        // Convert to buffer and send
        const buffer = canvas.toBuffer('image/png');
        const attachment = new AttachmentBuilder(buffer, { name: 'voucher.png' });
        
        const embed = new EmbedBuilder()
            .setTitle('HR Slot Voucher Created!')
            .setDescription(`**Officer Type:** ${officerType}\n**Expires:** ${expirationDate}\n**Serial:** ${serialNumber || 'N/A'}`)
            .setColor('#5E3A1E')
            .setImage('attachment://voucher.png');
            
        await interaction.editReply({ embeds: [embed], files: [attachment] });
    }
};
