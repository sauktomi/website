---
title: "Metadata"
description: "Reseptien metatietojen standardit"
date: "2024-11-09"
lastmod: "2024-11-10"
draft: false
---

## Pakolliset kentät

### Perustiedot
- **title**: Reseptin nimi lainausmerkeissä
- **date**: Muodossa "YYYY-MM-DD"
- **lastmod**: Viimeisimmän muokkauksen päivämäärä
- **draft**: false/true
- **description**: Ytimekäs kuvaus tuotteesta ja käyttötarkoituksesta
- **headimg**: Oletuksena "/images/CalculatorSearch.jpeg"
- **categories**: Vastaa hakemistorakennetta
- **author**: "[Nimi](linkki)" tai "???"

### Reseptitiedot
- **difficulty**: Helppo, Keskitaso, Haastava, Vaikea, Erittäin vaikea
- **valmistusaika**: "HH:MM"
- **maara**: Valmistettavien yksiköiden määrä
- **servings**: Annoskoko per yksikkö
- **impsize**: Tarvittavat vuoat/astiat mittoineen
- **storage**: Säilyvyys kolmessa muodossa:
  ```yaml
  storage:
  - "2pv"      # Huoneenlämpö
  - "1vk"      # Jääkaappi
  - "2kk"      # Pakastin
  ```

### Välineet ja menetelmät
- **appliances**: Tarvittavat laitteet ja välineet tärkeysjärjestyksessä
- **method**: Keskeiset valmistusmenetelmät kronologisessa järjestyksessä
- **diet**: Allergeenit ja erityisruokavaliot:
  - Allergeenit: Maito, Kananmuna, Vehnä
  - Haram: Merkitään jos sisältää:
    - Alkoholia tai alkoholipohjaisia ainesosia
    - Sianlihaa tai sianlihapohjaisia ainesosia (esim. liivate)
  - Paasto:
    - "Tiukka-paasto": Ei lihaa, kananmunia, maitotuotteita tai öljyjä
    - "Paasto": Ei lihaa tai kananmunia, alkoholiton, helposti ruoansulattaa
- **skaalaus**: Reseptin skaalausvaihtoehdot selkein tuloksin

## Tagit
Luokittele resepti seuraavien kategorioiden mukaan:
- Pääraaka-aineet (liha, kala, juusto, suklaa)
- Rakenne (rapea, pehmeä, kuohkea)
- Maku (makea, suolainen, hapan)
- Ruokavalio (kasvis, vegaani, gluteeniton)
- Käyttötarkoitus (juhla, arki, piknik)
