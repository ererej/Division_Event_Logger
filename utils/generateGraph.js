const { ChartJSNodeCanvas, AnimatedChartJSNodeCanvas } = require('chartjs-node-canvas');
const fs = require('fs');
const path = require('path');
const { AttachmentBuilder } = require('discord.js');

module.exports = async ({data /*{labels, values, title, colors}*/, type = 'line', height = 600, width = 800, fontSize = 26, lineWidth = 5, pointRadius = 7, curvedLines = true}) => {
    const chartJSNodeCanvas = new AnimatedChartJSNodeCanvas({ type: 'gif', width, height });

    const configuration = {
    type: type, // or 'bar', 'pie', etc.
    data: {
      labels: data.labels,
      datasets: [
        {
          label: data.title,
          data: data.values,
          backgroundColor: data.colors ?? ["rgba(143, 5, 255, 1)", "rgba(255, 0, 0, 1)", "rgba(0, 68, 255, 1)", "rgba(0,255,0, 1)" , "rgba(255,251,0, 1)", "rgba(0, 217, 255, 1)", "rgba(255, 1, 255, 1)" ],
          borderColor: data.colors ?? ["rgb(143, 5, 255)", "rgb(255, 0, 0)", "rgba(0, 68, 255, 1)", "rgb(0,255,0)", "rgb(255,251,0)", "rgb(0, 217, 255)", "rgb(255, 1, 255)" ],
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
  const filePath = path.join(__dirname, `./chart_${Date.now()}.gif`);
  fs.writeFileSync(filePath, image);

  // Return an attachment that can be used in the Discord message
  return { filePath, attachment: new AttachmentBuilder(filePath) };
}