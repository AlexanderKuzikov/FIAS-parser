// check-keys.mjs
import fs from 'fs';

const addrMap = JSON.parse(fs.readFileSync('data/addr-map-59.json', 'utf8'));
const streetHousesMap = JSON.parse(fs.readFileSync('data/street-houses-map-59.json', 'utf8'));
const housesMap = JSON.parse(fs.readFileSync('data/houses-map-59.json', 'utf8'));

const keys = ['ул:Песочная', 'ул:Бородинская', 'мкр:Нефтяников'];
for (const k of keys) {
    const candidates = addrMap[k] ?? [];
    console.log(`\n${k} (${candidates.length} улиц):`);
    for (const street of candidates) {
        const houses = streetHousesMap[street.OBJECTID] ?? [];
        const h1a = houses.filter(h => h.HOUSENUM?.match(/^1[аА]?$/i));
        console.log(`  OBJECTID: ${street.OBJECTID}, домов: ${houses.length}, 1А: ${JSON.stringify(h1a)}`);
    }
}