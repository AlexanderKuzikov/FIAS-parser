// filter-region.mjs
import fs from 'fs';

const input = JSON.parse(fs.readFileSync('data/courts.json', 'utf8'));

const region = '59';

const filtered = input.courts.filter(c => c.code.startsWith(region));

const output = {
    meta: { ...input.meta, totalCourts: filtered.length, region },
    courts: filtered
};

fs.writeFileSync('data/courts-59.json', JSON.stringify(output, null, 2));
console.log(`Записано: ${filtered.length} судов региона ${region}`);