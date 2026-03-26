// resolve-court-address.mjs
import fs from 'fs';

console.log('Загружаем данные...');
const courts = JSON.parse(fs.readFileSync('data/courts.json', 'utf8')).courts;
console.log(`  courts.json: ${courts.length} судов`);
const addrMap = JSON.parse(fs.readFileSync('data/addr-map-59.json', 'utf8'));
console.log(`  addr-map-59.json: ${Object.keys(addrMap).length} ключей`);
const munMap = JSON.parse(fs.readFileSync('data/mun-map-59.json', 'utf8'));
console.log(`  mun-map-59.json: ${Object.keys(munMap).length} записей`);
const streetHousesMap = JSON.parse(fs.readFileSync('data/street-houses-map-59.json', 'utf8'));
console.log(`  street-houses-map-59.json: ${Object.keys(streetHousesMap).length} улиц`);
const housesMap = JSON.parse(fs.readFileSync('data/houses-map-59.json', 'utf8'));
console.log(`  houses-map-59.json: ${Object.keys(housesMap).length} домов`);

const courts59 = courts.filter(c => c.code.startsWith('59'));
console.log(`\nСудов региона 59: ${courts59.length}`);

const STREET_TYPES = {
    'ул': 'ул', 'пр': 'пр-кт', 'пр-кт': 'пр-кт', 'просп': 'пр-кт',
    'пер': 'пер', 'б-р': 'б-р', 'бул': 'б-р', 'бульв': 'б-р',
    'пл': 'пл', 'наб': 'наб', 'ш': 'ш', 'пр-д': 'пр-д',
    'туп': 'туп', 'тракт': 'тракт', 'аллея': 'аллея', 'мкр': 'мкр',
};

const LOCALITY_TYPES = new Set(['г', 'п', 'с', 'д', 'пос', 'рп', 'пгт', 'гп']);
const STREET_TYPE_KEYS = new Set(Object.keys(STREET_TYPES));

console.log('\nСтроим вспомогательные индексы...');
const guidToHouseId = {};
for (const [houseObjectId, house] of Object.entries(housesMap)) {
    if (house.OBJECTGUID) guidToHouseId[house.OBJECTGUID] = houseObjectId;
}
console.log(`  guidToHouseId: ${Object.keys(guidToHouseId).length} записей`);

function parseAddress(addr) {
    if (!addr) return null;
    addr = addr.split('/')[0];
    addr = addr.replace(/^\d{6},\s*/, '').trim();
    const parts = addr.split(',').map(s => s.trim());

    let houseNum = null, houseIdx = -1;
    for (let i = parts.length - 1; i >= 0; i--) {
        const m = parts[i].match(/^(?:д|зд|стр)\.?\s+(\S+)(?:\s+к\.?\s*\S+)?$/i);
        if (m) { houseNum = m[1].replace(/[,.]$/, ''); houseIdx = i; break; }
        const m2 = parts[i].match(/^(\d+[а-яёА-ЯЁa-zA-Z]?)$/);
        if (m2) { houseNum = m2[1]; houseIdx = i; break; }
    }
    if (!houseNum) return null;

    let streetType = null, streetName = null, streetIdx = -1;
    for (let i = houseIdx - 1; i >= 0; i--) {
        const m = parts[i].match(/^([а-яёa-z][а-яё\-]*\.?)\s+(.+)$/i);
        if (!m) continue;
        const rawType = m[1].replace(/\.$/, '').toLowerCase();
        if (!STREET_TYPE_KEYS.has(rawType)) continue;
        streetType = STREET_TYPES[rawType];
        streetName = m[2].trim();
        streetIdx = i;
        break;
    }
    if (!streetType) return null;

    let localityType = null, localityName = null;
    for (let i = streetIdx - 1; i >= 0; i--) {
        const m = parts[i].match(/^([а-яёa-z]+\.?)\s+(.+)$/i);
        if (!m) continue;
        const rawType = m[1].replace(/\.$/, '').toLowerCase();
        if (!LOCALITY_TYPES.has(rawType)) continue;
        localityType = rawType === 'пос' ? 'п' : rawType;
        localityName = m[2].trim();
        break;
    }
    return { streetType, streetName, houseNum, localityType, localityName };
}

function matchHouseInList(houses, houseNum) {
    let house = houses.find(h => h.HOUSENUM?.toLowerCase() === houseNum.toLowerCase());
    if (!house) {
        const numOnly = houseNum.replace(/[а-яёa-z]+$/i, '');
        if (numOnly !== houseNum)
            house = houses.find(h => h.HOUSENUM?.toLowerCase() === numOnly.toLowerCase());
    }
    return house ?? null;
}

function findHouse(streetType, streetName, houseNum, localityType, localityName) {
    const key = `${streetType}:${streetName}`;
    const allCandidates = addrMap[key] ?? [];

    let filteredCandidates = allCandidates;
    if (localityType && localityName) {
        const localityIds = new Set(
            (addrMap[`${localityType}:${localityName}`] ?? []).map(e => e.OBJECTID)
        );
        if (localityIds.size > 0) {
            const f = allCandidates.filter(street => {
                const path = munMap[street.OBJECTID]?.PATH ?? '';
                return [...localityIds].some(id => path.includes(id));
            });
            if (f.length > 0) filteredCandidates = f;
        }
    }

    for (const street of filteredCandidates) {
        const house = matchHouseInList(streetHousesMap[street.OBJECTID] ?? [], houseNum);
        if (house) return { objectguid: house.OBJECTGUID };
    }
    if (filteredCandidates !== allCandidates) {
        for (const street of allCandidates) {
            const house = matchHouseInList(streetHousesMap[street.OBJECTID] ?? [], houseNum);
            if (house) return { objectguid: house.OBJECTGUID };
        }
    }
    return null;
}

function getOktmo(objectguid) {
    const houseObjectId = guidToHouseId[objectguid];
    if (!houseObjectId) return null;
    return munMap[houseObjectId]?.OKTMO ?? null;
}

console.log('\nОбрабатываем суды...');
const results = [];
let found = 0, notFound = 0;

for (let i = 0; i < courts59.length; i++) {
    const court = courts59[i];
    process.stdout.write(`\r  [${i + 1}/${courts59.length}] найдено: ${found}, не найдено: ${notFound}`);

    const parsed = parseAddress(court.address);
    if (!parsed) {
        results.push({
            code: court.code,
            name: court.name,
            court_type: court.court_type,
            address: court.address,
            oktmo: null,
            inn: court.inn,
            website: court.website,
            objectguid: null,
            status: 'parse_error',
        });
        notFound++;
        continue;
    }

    const { streetType, streetName, houseNum, localityType, localityName } = parsed;
    const match = findHouse(streetType, streetName, houseNum, localityType, localityName);

    if (match) found++;
    else notFound++;

    results.push({
        code: court.code,
        name: court.name,
        court_type: court.court_type,
        address: court.address,
        oktmo: match ? getOktmo(match.objectguid) : null,
        inn: court.inn,
        website: court.website,
        objectguid: match?.objectguid ?? null,
        status: match ? 'found' : 'not_found',
    });
}

console.log(`\n\nИтог: найдено ${found} из ${courts59.length}, не найдено ${notFound}`);

const outFile = 'data/resolved-59.json';
fs.writeFileSync(outFile, JSON.stringify(results, null, 2));
console.log(`Сохранено: ${outFile} (${results.length} записей)`);

const failed = results.filter(r => r.status !== 'found');
if (failed.length) {
    console.log('\n--- Не найдено ---');
    failed.forEach(r => console.log(`  [${r.status.padEnd(11)}] ${r.address}`));
} else {
    console.log('Все адреса найдены!');
}