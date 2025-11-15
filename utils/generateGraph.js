const { ChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');

module.exports = async ({data /*{labels, values, title, colors}*/, type = 'line', height = 600, width = 800, fontSize = 26, lineWidth = 5, pointRadius = 7, curvedLines = false}) => {
    const chartJSNodeCanvas = new ChartJSNodeCanvas({ width, height });

    const configuration = {
    type: type, // or 'bar', 'pie', etc.
    data: {
      labels: data.labels,
      datasets: [
        {
          label: data.title,
          data: data.values,
          backgroundColor: type === 'doughnut' ? data.colors : 'rgba(75, 192, 192, 0.2)',
          borderColor: type === 'doughnut' ? data.colors : 'rgba(75, 192, 192, 1)',
          borderWidth: type === 'doughnut' ? 1 : lineWidth,
        },
      ],
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: 'white',
            font: {
              size: fontSize
            }
          }
        }
      },
      elements: {
        line: {
          tension: 0.4 * curvedLines
        },
        point: {
          radius: pointRadius,
          backgroundColor: 'rgba(75, 192, 192, 1)',
        },
      },
      scales: {
        y: type === 'doughnut' ? {display: false} : { beginAtZero: true },

      },
    },
  };
  
  const image = await chartJSNodeCanvas.renderToBuffer(configuration);
  
  // Generate a unique file path
  const filePath = path.join(__dirname, `./chart_${Date.now()}.png`);
  fs.writeFileSync(filePath, image);

  // Return an attachment that can be used in the Discord message
  return { filePath, attachment: new AttachmentBuilder(filePath) };
}