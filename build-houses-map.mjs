// build-houses-map.mjs
import fs from 'fs';
import path from 'path';
import sax from 'sax';

const dir = 'data/59';
const files = fs.readdirSync(dir).filter(f => f.startsWith('AS_HOUSES_') && f.endsWith('.XML'));
const file = path.join(dir, files[0]);

console.log('Читаем:', file);

const map = {};
let total = 0;
let kept = 0;

const parser = sax.createStream(true, { trim: true });

parser.on('opentag', node => {
    if (node.name !== 'HOUSE') return;
    total++;
    if (total % 100000 === 0) console.log(`  обработано: ${total}`);

    const { OBJECTID, OBJECTGUID, HOUSENUM, ISACTIVE, ISACTUAL } = node.attributes;

    if (ISACTIVE !== '1' || ISACTUAL !== '1') return;
    if (!HOUSENUM) return;

    // ключ: OBJECTID родителя узнаем из mun-map — пока сохраняем по OBJECTID дома
    map[OBJECTID] = { OBJECTGUID, HOUSENUM };
    kept++;
});

parser.on('end', () => {
    fs.writeFileSync('data/houses-map-59.json', JSON.stringify(map, null, 2));
    console.log(`Всего: ${total}, сохранено: ${kept}`);
});

parser.on('error', err => console.error('Parser error:', err));

fs.createReadStream(file).pipe(parser);