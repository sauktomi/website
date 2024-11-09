---
title: "Ainesosat"
description: "Ainesosien listaus- ja muotoilustandardit"
date: "2024-11-09"
lastmod: "2024-11-10"
draft: false
---

## Muotoilu

### Perusmuoto
- Määrä ja yksikkö erotettuna välilyönnillä
- Ainesosan nimi isolla alkukirjaimella
- Muoto: "[määrä] [yksikkö] [Ainesosa]"
- Kappalemäärät: "[määrä] kpl [Ainesosa]"

### Yksiköt
- Paino: g, kg
- Tilavuus: ml, dl, l
- Lämpötila: °C
- Pyöristys:
  - Alle 100g: 5g tarkkuus
  - 100-500g: 10g tarkkuus
  - Yli 500g: 25g tarkkuus
  - Nesteet: 5ml tarkkuus

## Ryhmittely

### Vakio-otsikot
- Taikina/Pohja: Päätaikina tai pohja
- Täyte: Täytteet ja sisukset
- Kuorrute: Päällysteet ja koristeet
- Koristelu: Viimeistely

### Ainesosien järjestys
Esimerkki kakkutaikinan ainesosien järjestyksestä:
```yaml
#### Taikina
- 250 g Voi (huoneenlämpöinen)
- 200 g Sokeri
- 4 kpl Kananmuna
- 250 g Vehnäjauho
- 10 ml Leivinjauhe
- 2 ml Suola
- 5 ml Vaniljasokeri
```

Järjestys perustuu:
- Voi/rasva ensin (vaahdotettava aines)
- Sokeri toisena (vaahdotettava aines)
- Kananmunat kolmantena (sitova aines)
- Jauhot ja kuivat aineet yhdessä
- Mausteet lopuksi

## Lisätiedot
- Suluissa tarkentavat tiedot (esim. "huoneenlämpöinen", "pakaste")
- Vaihtoehtoiset aineet kauttaviivalla (Voi/Margariini)
- Lämpötilat tarvittaessa (esim. "37°C")
