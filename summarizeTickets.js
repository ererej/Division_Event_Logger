const fs = require('fs');
const path = require('path');
const csvParse = require('csv-parse/sync');

const earningsDir = path.join(__dirname, 'earnings');

const ticketNames = ['1$ Premium ticket', '3$ Premium ticket', '5$ Premium ticket'];

const summary = {};
const total = { '1$ Premium ticket': 0, '3$ Premium ticket': 0, '5$ Premium ticket': 0, money: 0 };

fs.readdirSync(earningsDir).forEach(file => {
    if (!file.endsWith('.csv')) return;
    const csv = fs.readFileSync(path.join(earningsDir, file), 'utf8');
    // Remove comment lines if present
    const cleanCsv = csv.replace(/^\/\/.*\n/gm, '');
    const records = csvParse.parse(cleanCsv, { columns: true, skip_empty_lines: true });

    const month = records[0]?.month || file.slice(0, 10);
    summary[month] = summary[month] || { '1$ Premium ticket': 0, '3$ Premium ticket': 0, '5$ Premium ticket': 0, money: 0 };

    for (const row of records) {
        // Sum ticket counts
        if (ticketNames.includes(row.name_default)) {
            summary[month][row.name_default] += parseInt(row.sales_count, 10) || 0;
            total[row.name_default] += parseInt(row.sales_count, 10) || 0;
        } else if (row.name_default === 'Division Event Logger') {
            summary[month]['1$ Premium ticket'] += parseInt(row.sales_count, 10) || 0;
            total['1$ Premium ticket'] += parseInt(row.sales_count, 10) || 0;
        }
        // Sum money (all rows)
        if (row.sales_currencies) {
            try {
                const currencies = JSON.parse(row.sales_currencies.replace(/""/g, '"'));
                for (const cur of currencies) {
                    summary[month].money += Number(cur.sales_amount) || 0;
                    total.money += Number(cur.sales_amount) || 0;
                }
            } catch (e) {
                // ignore parse errors
            }
        }
    }
});

console.log('Monthly Ticket Sales Summary:');
console.log('--------------------------------------------------------------------------');
console.log('Month      | 1$ Tickets | 3$ Tickets | 5$ Tickets | Total Tickets |  Total');
console.log('-----------|------------|------------|------------|---------------|--------');
Object.keys(summary).sort().forEach(month => {
    const one = summary[month]['1$ Premium ticket'];
    const three = summary[month]['3$ Premium ticket'];
    const five = summary[month]['5$ Premium ticket'];
    const sum = one + three + five;
    const money = summary[month].money;
    console.log(`${month} | ${one.toString().padStart(10)} | ${three.toString().padStart(10)} | ${five.toString().padStart(10)} | ${sum.toString().padStart(13)} | ${(money / 100).toString().padStart(6)}`);
});
console.log('--------------------------------------------------------------------------');
console.log(
    `TOTAL      | ${total['1$ Premium ticket'].toString().padStart(10)} | ${total['3$ Premium ticket'].toString().padStart(10)} | ${total['5$ Premium ticket'].toString().padStart(10)} | ${(total['1$ Premium ticket'] + total['3$ Premium ticket'] + total['5$ Premium ticket']).toString().padStart(13)} | ${(total.money / 100).toString().padStart(6)}`
);