// peek-tags-59.js
const fs = require('fs');
const path = require('path');
const sax = require('sax');

const dir = 'C:\\gar_extracted\\59';
const prefix = 'AS_HOUSES_'; //менять здесь

const files = fs.readdirSync(dir).filter(f => f.startsWith(prefix) && f.endsWith('.XML'));
const file = path.join(dir, files[0]);

const seen = new Set();
const parser = sax.createStream(true, { trim: true });

parser.on('opentag', node => {
    if (!seen.has(node.name)) {
        seen.add(node.name);
        console.log('TAG:', node.name, '| attrs:', Object.keys(node.attributes).join(', '));
    }
    if (seen.size >= 5) process.exit(0);
});

parser.on('error', err => console.error('Parser error:', err));

fs.createReadStream(file).pipe(parser);