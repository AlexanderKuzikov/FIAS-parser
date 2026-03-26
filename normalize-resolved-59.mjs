// normalize-resolved-59.mjs
import fs from 'fs';

const addrMap = JSON.parse(fs.readFileSync('data/addr-map-59.json', 'utf8'));
const munMap = JSON.parse(fs.readFileSync('data/mun-map-59.json', 'utf8'));
const housesMap = JSON.parse(fs.readFileSync('data/houses-map-59.json', 'utf8'));
const streetHousesMap = JSON.parse(fs.readFileSync('data/street-houses-map-59.json', 'utf8'));
const resolved = JSON.parse(fs.readFileSync('data/resolved-59.json', 'utf8'));

// строим обратный словарь OBJECTID → {name, typename}
console.log('Строим обратный addr-map...');
const objIdToAddr = {};
for (const [key, entries] of Object.entries(addrMap)) {
    const [typename, name] = key.split(':');
    for (const entry of entries) {
        objIdToAddr[entry.OBJECTID] = { name, typename };
    }
}
console.log(`Объектов в обратном словаре: ${Object.keys(objIdToAddr).length}`);

// строим обратный словарь OBJECTGUID → houseObjectId
console.log('Строим обратный houses-map...');
const guidToHouseId = {};
for (const [houseObjectId, house] of Object.entries(housesMap)) {
    if (house.OBJECTGUID) guidToHouseId[house.OBJECTGUID] = houseObjectId;
}

function buildGarAddress(objectguid, houseNum) {
    const houseObjectId = guidToHouseId[objectguid];
    if (!houseObjectId) return null;

    const mun = munMap[houseObjectId];
    if (!mun?.PATH) return null;

    const pathIds = mun.PATH.split('.');
    // убираем сам дом (последний элемент)
    const chainIds = pathIds.slice(0, -1);

    const parts = [];
    for (const id of chainIds) {
        const obj = objIdToAddr[id];
        if (!obj) continue;
        parts.push(`${obj.typename} ${obj.name}`);
    }
    parts.push(`д ${houseNum}`);
    return parts.join(', ');
}

let normalized = 0;
const result = resolved.map((court, i) => {
    process.stdout.write(`\r[${i + 1}/${resolved.length}] нормализовано: ${normalized}`);
    if (court.status !== 'found' || !court.objectguid) return court;

    const houseNumMatch = court.parsed?.match(/д\s+(\S+)$/);
    const houseNum = houseNumMatch?.[1] ?? '';
    const garAddress = buildGarAddress(court.objectguid, houseNum);
    if (garAddress) normalized++;

    return { ...court, gar_address: garAddress ?? null };
});

console.log(`\nНормализовано: ${normalized} из ${resolved.filter(r => r.status === 'found').length}`);
fs.writeFileSync('data/resolved-59.json', JSON.stringify(result, null, 2));
console.log('→ data/resolved-59.json');