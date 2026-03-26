// lookup-street.mjs
import fs from 'fs';

const addrMap = JSON.parse(fs.readFileSync('data/addr-map-59.json', 'utf8'));
const streetHousesMap = JSON.parse(fs.readFileSync('data/street-houses-map-59.json', 'utf8'));

const key = 'ул:Танкистов';
const searchHouse = '50';
const candidates = addrMap[key] ?? [];

for (const street of candidates) {
    const houses = streetHousesMap[street.OBJECTID] ?? [];
    const found = houses.filter(h => h.HOUSENUM === searchHouse);
    if (found.length) {
        console.log(`OBJECTID: ${street.OBJECTID} — найдено:`);
        found.forEach(h => console.log(' ', h.HOUSENUM, h.OBJECTGUID));
    } else {
        console.log(`OBJECTID: ${street.OBJECTID}, домов: ${houses.length} — НЕ НАЙДЕН`);
    }
}