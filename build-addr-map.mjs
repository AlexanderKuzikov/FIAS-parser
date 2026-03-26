// build-addr-map.mjs
import fs from 'fs';
import path from 'path';
import sax from 'sax';

const dir = 'data/59';
const files = fs.readdirSync(dir).filter(f => f.startsWith('AS_ADDR_OBJ_') && f.endsWith('.XML'));
const file = path.join(dir, files[0]);

console.log('Читаем:', file);

const map = {};
let total = 0;
let kept = 0;

const parser = sax.createStream(true, { trim: true });

parser.on('opentag', node => {
    if (node.name !== 'OBJECT') return;
    total++;

    const { OBJECTID, OBJECTGUID, NAME, TYPENAME, LEVEL, ISACTIVE, ISACTUAL } = node.attributes;

    if (ISACTIVE !== '1' || ISACTUAL !== '1') return;

    const type = TYPENAME.toLowerCase().replace(/\.$/, '').trim();
    const key = `${type}:${NAME}`;

    if (!map[key]) map[key] = [];
    map[key].push({ OBJECTID, OBJECTGUID, LEVEL });
    kept++;
});

parser.on('end', () => {
    fs.writeFileSync('data/addr-map-59.json', JSON.stringify(map, null, 2));
    console.log(`Всего записей: ${total}, сохранено: ${kept}, уникальных ключей: ${Object.keys(map).length}`);
});

parser.on('error', err => console.error('Parser error:', err));

fs.createReadStream(file).pipe(parser);