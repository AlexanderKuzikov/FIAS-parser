const fs = require('fs');
const path = require('path');
const sax = require('sax');

const dir = 'C:\\gar_extracted\\59';
const files = fs.readdirSync(dir).filter(f => f.startsWith('AS_ADDR_OBJ_') && f.endsWith('.XML'));
const file = path.join(dir, files[0]);

console.log('Читаем:', file);

const results = [];
const LIMIT = 100;
let done = false;

const parser = sax.createStream(true, { trim: true });

parser.on('opentag', node => {
    if (node.name === 'OBJECT' && results.length < LIMIT) {
        results.push(node.attributes);
    }
    if (results.length >= LIMIT && !done) {
        done = true;
        fs.writeFileSync('peek-addr-obj-59.json', JSON.stringify(results, null, 2));
        console.log('Готово, записано:', results.length);
        process.exit(0);
    }
});

parser.on('end', () => {
    if (!done) {
        fs.writeFileSync('peek-addr-obj-59.json', JSON.stringify(results, null, 2));
        console.log('Готово, записано:', results.length);
    }
});

parser.on('error', err => console.error('Parser error:', err));

fs.createReadStream(file).pipe(parser);