const http = require('http');

const port = process.argv[2] || 5000;
const days = process.argv[3] || 7;

http.get(`http://localhost:${port}/api/releases/upcoming?days=${days}`, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const j = JSON.parse(data);
    const byDate = {};

    j.data.forEach(r => {
      if (!byDate[r.release_date]) byDate[r.release_date] = [];
      byDate[r.release_date].push(r);
    });

    const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

    console.log('\n' + '='.repeat(90));
    console.log(' ECONOMIC CALENDAR - Week of Nov 30 - Dec 6, 2025');
    console.log(' With Forecast, Previous & Source URLs');
    console.log('='.repeat(90));

    Object.keys(byDate).sort().forEach(date => {
      const d = new Date(date + 'T12:00:00');
      console.log('\n' + '-'.repeat(90));
      console.log(' ' + dayNames[d.getDay()] + ', ' + date);
      console.log('-'.repeat(90));

      byDate[date].forEach(r => {
        const imp = r.importance === 'high' ? '[HIGH]' : r.importance === 'medium' ? '[MED] ' : '[LOW] ';
        const time = (r.release_time || 'TBD').padEnd(10);
        console.log(` ${imp} ${time} ${r.name}`);

        // Show forecast/previous/actual
        const parts = [];
        if (r.forecast !== null && r.forecast !== undefined) parts.push(`Forecast: ${r.forecast}`);
        if (r.previous !== null && r.previous !== undefined) parts.push(`Previous: ${r.previous}`);
        if (r.actual !== null && r.actual !== undefined) parts.push(`Actual: ${r.actual}`);
        if (r.unit) parts.push(`(${r.unit})`);

        if (parts.length > 0) {
          console.log(`         ${parts.join(' | ')}`);
        }

        if (r.source_url) {
          console.log(`         -> ${r.source_url}`);
        }
      });
    });

    console.log('\n' + '='.repeat(90));
    console.log(` Total: ${j.count} releases this week`);
    console.log('='.repeat(90) + '\n');
  });
}).on('error', (e) => {
  console.error('Error:', e.message);
});
