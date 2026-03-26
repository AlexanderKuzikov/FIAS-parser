// parse-address.mjs

const TYPE_ALIASES = {
    'г': 'г', 'город': 'г',
    'п': 'п', 'посёлок': 'п', 'поселок': 'п', 'пос': 'п',
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

const HOUSE_PREFIXES = new Set(['д', 'дом', 'влд', 'владение', 'зд', 'здание', 'стр', 'строение', 'лит', 'литера']);
const LOCALITY_TYPES = new Set(['г', 'п', 'с', 'д', 'пгт', 'рп']);

function normalizeType(raw) {
    const t = raw.toLowerCase().replace(/\.$/, '').trim();
    return TYPE_ALIASES[t] ?? t;
}

// нормализует номер дома: "192 к 2" → "192", "96/1" → "96", "1А" → "1А"
function normalizeHouseNum(raw) {
    if (!raw) return null;
    // убираем корпус/строение после пробела: "192 к 2" → "192"
    const withoutCorpus = raw.split(/\s+/)[0];
    // убираем дробную часть: "96/1" → "96"
    const withoutFraction = withoutCorpus.split('/')[0];
    return withoutFraction.trim();
}

export function parseAddress(raw) {
    if (!raw) return null;

    // обработка двойного адреса: берём первую часть до "/"
    // но только если "/" стоит после номера дома, не в названии улицы
    const normalizedRaw = raw.replace(/,\s*[\w-]+\s*\/\s*[\w-]+.*$/, '');

    const parts = normalizedRaw.split(',').map(s => s.trim()).filter(Boolean);
    const result = {
        postalCode: null,
        locality: null,
        street: null,
        house: null,
    };

    const localities = []; // собираем все населённые пункты

    for (const part of parts) {
        if (/^\d{6}$/.test(part)) { result.postalCode = part; continue; }

        const tokens = part.split(/\s+/);
        if (!tokens.length) continue;

        const firstKey = tokens[0].toLowerCase().replace(/\.$/, '');
        const lastKey = tokens[tokens.length - 1].toLowerCase().replace(/\.$/, '');

        // дом/строение/литера
        if (HOUSE_PREFIXES.has(firstKey)) {
            result.house = normalizeHouseNum(tokens.slice(1).join(' '));
            continue;
        }

        // просто число без префикса — тоже номер дома
        if (!result.house && tokens.length === 1 && /^\d+[А-Яа-яA-Za-z]?$/.test(tokens[0])) {
            result.house = normalizeHouseNum(tokens[0]);
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

        if (LOCALITY_TYPES.has(type)) {
            localities.push({ type, name });
        } else {
            result.street = { type, name };
        }
    }

    // берём последний населённый пункт перед улицей как locality
    // это решает случай "г. Чернушка, пос. Пермдорстрой, ул. Ленина"
    if (localities.length > 0) {
        result.locality = localities[localities.length - 1];
        result.allLocalities = localities; // сохраняем все для fallback
    }

    return result;
}

// --- тест ---
const samples = [
    '614095, г Пермь, ул Танкистов, стр 50',
    '614026, г Пермь, ул Песочная, д 1А',
    '614021, г. Пермь, ул. Бородинская, 31/ Лодыгина, 41',
    '618270, Пермский край, г Гремячинск, ул Ленина, д 192 к 2',
    '617832, Пермский край, г. Чернушка, пос. Пермдорстрой, ул. Ленина, 141',
    '614000, г Пермь, ул Пермская, стр 11А',
    '614500, г Пермь, ул 2-я Красавинская, стр 86А',
    '618740, Пермский край, г Добрянка, ул Советская, д 96/1',
];

for (const s of samples) {
    console.log(s);
    console.log(JSON.stringify(parseAddress(s), null, 2));
    console.log('---');
}