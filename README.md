# FIAS-parser

Утилита для обогащения базы российских судов данными из ГАР (ФИАС):
`OBJECTGUID` дома и код `ОКТМО`.

🔗 Репо: https://github.com/AlexanderKuzikov/FIAS-parser

---

## Что делает

Берёт базу судов (`courts.json`, ~10 000 записей) с текстовыми адресами
и для каждого суда находит в ГАР:
- `objectguid` — глобальный уникальный идентификатор дома (UUID)
- `oktmo` — код ОКТМО муниципального образования

**Пилот (регион 59, Пермский край):** 182/182 судов — 100%.

---

## Стек

- **Node.js** (ESM, `.mjs`)
- **sax** — потоковый парсер XML (ГАР-файлы весят гигабайты)
- **xlsx** — экспорт в Excel

---

## Структура проекта

```
FIAS-parser/
├── data/
│   ├── courts.json                  # База судов (входной файл)
│   ├── 59/                          # XML-файлы ГАР региона 59
│   │   ├── AS_ADDR_OBJ_*.XML
│   │   ├── AS_MUN_HIERARCHY_*.XML
│   │   └── AS_HOUSES_*.XML
│   ├── addr-map-59.json             # "тип:Название" → OBJECTID улиц
│   ├── mun-map-59.json              # OBJECTID → {PATH, OKTMO}
│   ├── houses-map-59.json           # houseObjectId → {OBJECTGUID, HOUSENUM}
│   ├── street-houses-map-59.json    # streetObjectId → [дома]
│   └── resolved-59.json            # Результат: суды с GUID и ОКТМО
├── build-addr-map.mjs
├── build-mun-map.mjs
├── build-houses-map.mjs
├── build-street-houses-map.mjs
├── resolve-court-address.mjs
└── export-to-excel.mjs
```

---

## Пайплайн

### 1. Подготовка индексов (один раз на регион)

```bash
node build-addr-map.mjs          # → addr-map-59.json
node build-mun-map.mjs           # → mun-map-59.json
node build-houses-map.mjs        # → houses-map-59.json
node build-street-houses-map.mjs # → street-houses-map-59.json
```

### 2. Разрешение адресов

```bash
node resolve-court-address.mjs   # → resolved-59.json
```

### 3. Экспорт

```bash
node export-to-excel.mjs         # → courts-59.xlsx
```

---

## Формат результата (`resolved-59.json`)

```json
{
  "code": "59MS0001",
  "name": "Судебный участок № 1 Дзержинского судебного района г. Перми",
  "court_type": "MS",
  "address": "614095, г Пермь, ул Танкистов, стр 50",
  "oktmo": "57701000001",
  "inn": null,
  "website": "http://...",
  "objectguid": "25f50dfd-e73e-488f-858f-c23a82da5f8b",
  "status": "found"
}
```

---

## Особенности парсинга адресов

- Поддерживаются `д`, `зд` (здание), `стр` (строение)
- Корпус (`к 2`) отбрасывается
- Двойные адреса (`ул X, 15/ул Y, 20`) — берётся первый
- Буквенный суффикс номера: `1А` → фоллбэк на `1` если не найден
- Строения в ГАР хранятся на 4-м уровне иерархии (не 3-м)
- Фильтрация улиц по населённому пункту через PATH в иерархии

---

## Статус

| Задача | Статус |
|--------|--------|
| Пилот: регион 59 | ✅ 182/182 (100%) |
| Все регионы (85) | 🔄 В работе |
| Merge в единый файл | ⏳ Планируется |
| Обновление courts.json | ⏳ Планируется |

---

## Зависимости

```bash
npm install sax xlsx
```
