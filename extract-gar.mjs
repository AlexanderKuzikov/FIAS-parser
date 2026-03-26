// extract-gar.mjs
// npm install yauzl

import yauzl from 'yauzl';
import { mkdirSync, createWriteStream } from 'fs';
import { dirname, join } from 'path';

const ZIP_PATH = 'D:\\GitHub\\gar_xml.zip';
const OUT_DIR  = 'C:\\gar_extracted';
const NEEDED   = /\/(AS_ADDR_OBJ_20|AS_HOUSES_20|AS_MUN_HIERARCHY_20)/;

yauzl.open(ZIP_PATH, { lazyEntries: true }, (err, zip) => {
  if (err) throw err;

  let extracted = 0;
  let skipped   = 0;

  zip.readEntry();

  zip.on('entry', (entry) => {
    const name = entry.fileName;

    if (!NEEDED.test(name)) {
      skipped++;
      zip.readEntry();
      return;
    }

    const outPath = join(OUT_DIR, name);
    mkdirSync(dirname(outPath), { recursive: true });

    zip.openReadStream(entry, (err, stream) => {
      if (err) throw err;
      const out = createWriteStream(outPath);
      stream.pipe(out);
      out.on('finish', () => {
        extracted++;
        process.stdout.write(`\r Извлечено: ${extracted}  Пропущено: ${skipped}  Последний: ${name}`);
        zip.readEntry();
      });
    });
  });

  zip.on('end', () => {
    console.log(`\nГотово. Извлечено файлов: ${extracted}`);
  });
});