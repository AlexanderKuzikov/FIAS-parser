// match-courts.mjs
import fs from 'fs';

const TYPE_ALIASES = {
    'г': 'г', 'город': 'г',
    'п': 'п', 'посёлок': 'п', 'поселок': 'п',
    'с': 'с', 'село': 'с',
    'д': 'д', 'деревня': 'д',
    'пгт': 'пгт', 'рп': 'рп',
    'ул': 'ул', 'улица': 'ул',
    'пр-кт': 'пр-кт', 'пр-т': 'пр-кт', 'проспект': 'пр-кт',
    'пер': 'пер', 'переулок': 'пер',
    'пл': 'пл', 'площадь': 'пл',
    'ш': 'ш', 'шоссе': 'ш',
    'б-р': 'б-р', 'бульвар': 'б-р',
    'наб': 'наб', 'набережная': 'наб',
    'пр-д': 'пр-д', 'проезд': 'пр-д',
    'мкр': 'мкр', 'микрорайон': 'мкр',
    'тер': 'тер', 'территория': 'тер',
    'кв-л': 'кв-л', 'квартал': 'кв-л',
};
const HOUSE_PREFIXES = new Set(['д', 'дом', 'влд', 'владение', 'зд', 'здание']);

function normalizeType(raw) {
    return TYPE_ALIASES[raw.toLowerCase().replace(/\.$/, '').trim()] ?? raw.toLowerCase().replace(/\.$/, '').trim();
}

function parseAddress(raw) {
    if (!raw) return null;
    const parts = raw.split(',').map(s => s.trim()).filter(Boolean);
    const result = { postalCode: null, locality: null, street: null, house: null };

    for (const part of parts) {
        if (/^\d{6}$/.test(part)) { result.postalCode = part; continue; }

        const tokens = part.split(/\s+/);
        if (!tokens.length) continue;

        const firstKey = tokens[0].toLowerCase().replace(/\.$/, '');
        const lastKey = tokens[tokens.length - 1].toLowerCase().replace(/\.$/, '');

        if (HOUSE_PREFIXES.has(firstKey)) {
            result.house = tokens.slice(1).join(' ');
            continue;
        }

        let type = null, name = null;
        if (TYPE_ALIASES[firstKey] !== undefined) {
            type = normalizeType(tokens[0]);
            name = tokens.slice(1).join(' ');
        } else if (TYPE_ALIASES[lastKey] !== undefined) {
            type = normalizeType(tokens[tokens.length - 1]);
            name = tokens.slice(0, -1).join(' ');
        }

        if (!type || !name) continue;

        if (['г', 'п', 'с', 'д', 'пгт', 'рп'].includes(type)) {
            result.locality = { type, name };
        } else {
            result.street = { type, name };
        }
    }
    return result;
}

function getOktmo(objectId, munMap) {
    let current = objectId;
    for (let i = 0; i < 5; i++) {
        const entry = munMap[current];
        if (!entry) break;
        if (entry.OKTMO && entry.OKTMO !== '0') return entry.OKTMO;
        current = entry.PARENTOBJID;
    }
    return null;
}

// --- загрузка ---
console.log('Загружаем courts-59.json...');
const courtsData = JSON.parse(fs.readFileSync('data/courts-59.json', 'utf8'));

console.log('Загружаем addr-map-59.json...');
const addrMap = JSON.parse(fs.readFileSync('data/addr-map-59.json', 'utf8'));

console.log('Загружаем mun-map-59.json...');
const munMap = JSON.parse(fs.readFileSync('data/mun-map-59.json', 'utf8'));

console.log('Загружаем street-houses-map-59.json...');
const streetHousesMap = JSON.parse(fs.readFileSync('data/street-houses-map-59.json', 'utf8'));

console.log('Все карты загружены. Начинаем матчинг...\n');

// --- матчинг ---
const results = [];
const notFound = [];

for (const court of courtsData.courts) {
    const parsed = parseAddress(court.address);
    const result = { ...court, oktmo: null, address_guid: null };

    if (!parsed || !parsed.street) {
        notFound.push({ code: court.code, address: court.address, reason: 'no_street' });
        results.push(result);
        continue;
    }

    const streetKey = `${parsed.street.type}:${parsed.street.name}`;
    const streetCandidates = addrMap[streetKey];

    if (!streetCandidates || streetCandidates.length === 0) {
        notFound.push({ code: court.code, address: court.address, reason: 'street_not_found', key: streetKey });
        results.push(result);
        continue;
    }

    // если несколько кандидатов — ищем дом для каждого и берём первый совпавший
    let matched = false;
    for (const street of streetCandidates) {
        const houses = streetHousesMap[street.OBJECTID];
        if (!houses) continue;

        const house = parsed.house
            ? houses.find(h => h.HOUSENUM.toLowerCase() === parsed.house.toLowerCase())
            : null;

        if (house) {
            result.oktmo = getOktmo(house.houseObjectId, munMap);
            result.address_guid = house.OBJECTGUID;
            matched = true;
            break;
        }
    }

    if (!matched) {
        // fallback: берём первого кандидата улицы, ОКТМО с уровня улицы
        const street = streetCandidates[0];
        result.oktmo = getOktmo(street.OBJECTID, munMap);
        result.address_guid = street.OBJECTGUID;
        notFound.push({ code: court.code, address: court.address, reason: 'house_not_found', key: streetKey });
    }

    results.push(result);
}

// --- вывод ---
const output = { ...courtsData, courts: results };
fs.writeFileSync('data/courts-59-gar.json', JSON.stringify(output, null, 2));
fs.writeFileSync('data/not-found-59.json', JSON.stringify(notFound, null, 2));

const withOktmo = results.filter(r => r.oktmo).length;
console.log(`Готово → data/courts-59-gar.json`);
console.log(`Сохранено: ${results.length} судов`);
console.log(`С ОКТМО: ${withOktmo} / ${results.length}`);
console.log(`Проблемных → data/not-found-59.json: ${notFound.length}`);