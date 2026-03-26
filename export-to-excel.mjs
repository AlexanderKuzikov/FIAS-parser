// export-to-excel.mjs
import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

const data = JSON.parse(fs.readFileSync('data/resolved-59.json', 'utf8'));
console.log(`Записей: ${data.length}`);

const rows = data.map(c => ({
    'Код':        c.code,
    'Название':   c.name,
    'Тип':        c.court_type,
    'Адрес':      c.address,
    'ОКТМО':      c.oktmo,
    'ИНН':        c.inn,
    'Сайт':       c.website,
    'OBJECTGUID': c.objectguid,
    'Статус':     c.status,
}));

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(rows);

// ширина колонок
ws['!cols'] = [
    { wch: 12 }, { wch: 60 }, { wch: 8 }, { wch: 45 },
    { wch: 12 }, { wch: 14 }, { wch: 35 }, { wch: 38 }, { wch: 12 },
];

XLSX.utils.book_append_sheet(wb, ws, 'Суды');

const outFile = 'data/courts-59.xlsx';
XLSX.writeFile(wb, outFile);
console.log(`Сохранено: ${outFile}`);