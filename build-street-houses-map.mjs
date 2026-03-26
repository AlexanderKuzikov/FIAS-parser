// build-street-houses-map.mjs
import fs from 'fs';

console.log('Загружаем mun-map-59.json...');
const munMap = JSON.parse(fs.readFileSync('data/mun-map-59.json', 'utf8'));
console.log(`mun-map: ${Object.keys(munMap).length} записей`);

console.log('Загружаем houses-map-59.json...');
const housesMap = JSON.parse(fs.readFileSync('data/houses-map-59.json', 'utf8'));
console.log(`houses-map: ${Object.keys(housesMap).length} записей`);

const streetHousesMap = {};
let linked = 0;
let skipped = 0;
let i = 0;

for (const [houseObjectId, house] of Object.entries(housesMap)) {
    i++;
    if (i % 100000 === 0) console.log(`  обработано: ${i}...`);

    const mun = munMap[houseObjectId];
    if (!mun?.PATH) { skipped++; continue; }

    const pathParts = mun.PATH.split('.');
    if (pathParts.length < 2) { skipped++; continue; }

    // пробуем предпоследний элемент как улицу
    // если это тоже дом (строение) — берём на уровень выше
    let streetObjectId = pathParts[pathParts.length - 2];

    // если родитель сам является домом в housesMap — значит мы строение, берём выше
    if (housesMap[streetObjectId] && pathParts.length >= 3) {
        streetObjectId = pathParts[pathParts.length - 3];
    }

    if (!streetHousesMap[streetObjectId]) streetHousesMap[streetObjectId] = [];
    streetHousesMap[streetObjectId].push({
        houseObjectId,
        OBJECTGUID: house.OBJECTGUID,
        HOUSENUM: house.HOUSENUM,
    });
    linked++;
}

fs.writeFileSync('data/street-houses-map-59.json', JSON.stringify(streetHousesMap, null, 2));
console.log(`\nГотово → data/street-houses-map-59.json`);
console.log(`Привязано: ${linked}, пропущено: ${skipped}`);
console.log(`Уникальных улиц: ${Object.keys(streetHousesMap).length}`);