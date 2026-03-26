// build-mun-map.mjs
import fs from 'fs';
import path from 'path';
import sax from 'sax';

const dir = 'data/59';
const files = fs.readdirSync(dir).filter(f => f.startsWith('AS_MUN_HIERARCHY_') && f.endsWith('.XML'));
const file = path.join(dir, files[0]);

console.log('Читаем:', file);

const map = {};
let total = 0;

const parser = sax.createStream(true, { trim: true });

parser.on('opentag', node => {
    if (node.name !== 'ITEM') return;
    total++;

    const { OBJECTID, PARENTOBJID, OKTMO, PATH, ISACTIVE } = node.attributes;

    // сохраняем все записи, предпочитая ISACTIVE=1
    if (!map[OBJECTID] || ISACTIVE === '1') {
        map[OBJECTID] = { PARENTOBJID, OKTMO: OKTMO || null, PATH, ISACTIVE };
    }
});

parser.on('end', () => {
    const withOktmo = Object.values(map).filter(v => v.OKTMO && v.OKTMO !== '0').length;
    fs.writeFileSync('data/mun-map-59.json', JSON.stringify(map, null, 2));
    console.log(`Всего записей: ${total}, уникальных OBJECTID: ${Object.keys(map).length}, с ОКТМО: ${withOktmo}`);
});

parser.on('error', err => console.error('Parser error:', err));

fs.createReadStream(file).pipe(parser);