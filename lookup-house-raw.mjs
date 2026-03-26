// lookup-house-raw.mjs
import fs from 'fs';
import path from 'path';
import sax from 'sax';

const dir = 'data/59';
const files = fs.readdirSync(dir).filter(f => f.startsWith('AS_HOUSES_') && f.endsWith('.XML'));
const file = path.join(dir, files[0]);

// OBJECTID улиц Танкистов из предыдущего результата
const streetIds = new Set(['1030215', '1028259', '1033418']);

const parser = sax.createStream(true, { trim: true });
const munMap = JSON.parse(fs.readFileSync('data/mun-map-59.json', 'utf8'));

parser.on('opentag', node => {
    if (node.name !== 'HOUSE') return;
    const { OBJECTID, HOUSENUM, ADDNUM1, ADDTYPE1, ISACTIVE, ISACTUAL } = node.attributes;
    const mun = munMap[OBJECTID];
    if (!mun) return;
    const parentId = mun.PATH?.split('.').at(-2);
    if (streetIds.has(parentId) && (HOUSENUM === '50' || ADDNUM1 === '50')) {
        console.log(node.attributes);
    }
});

parser.on('error', err => console.error(err));
fs.createReadStream(file).pipe(parser);