<p align="center">
  <a href="https://www.typescriptlang.org"><img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white"></a>
  <a href="https://github.com/AlexanderKuzikov/FIAS-parser/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/License-Apache--2.0-blue"></a>
</p>

<h1 align="center">FIAS-parser</h1>
<p align="center">Обогащение базы судов данными ГАР (ФИАС)</p>

---

Парсер данных ГАР (ФИАС) для обогащения базы судов. Извлечение OBJECTGUID и ОКТМО, сопоставление адресов, экспорт в XLSX.

- **ГАР/ФИАС** — работа с данными Государственного адресного реестра.
- **OBJECTGUID/ОКТМО** — извлечение и сопоставление идентификаторов.
- **Экспорт** — выгрузка результатов в XLSX и DOCX.

## Быстрый старт

```bash
git clone https://github.com/AlexanderKuzikov/FIAS-parser.git
cd FIAS-parser
npm install
npx ts-node src/index.ts
```

## Документация

- [`docs/CONTEXT.md`](docs/CONTEXT.md) — состояние проекта
- [`docs/DECISIONS.md`](docs/DECISIONS.md) — архитектурные решения

## Статус

**v1.0.0** — работает.

## Лицензия

[Apache-2.0](LICENSE) © Alexander Kuzikov
