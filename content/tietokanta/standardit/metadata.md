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
- **date**: Luontipäivämäärä muodossa "YYYY-MM-DD"
- **lastmod**: Viimeisimmän muokkauksen päivämäärä muodossa "YYYY-MM-DD"
- **draft**: Julkaisutila (false = julkaistu, true = luonnos)
- **description**: Ytimekäs kuvaus reseptistä ja sen käyttötarkoituksesta
- **headimg**: Reseptin pääkuvan polku, oletuksena "/images/CalculatorSearch.jpeg"
- **categories**: Reseptin kategoriat määräytyy kaksiosaisesti:
  - Ensisijainen: määräytyy tiedoston sijainnin perusteella hakemistorakenteessa
  - Toissijainen: valitaan Käyttötarkoitus-kategorioista (katso ## Käyttötarkoitus)
- **author**: Tekijän nimi tai "???" jos tuntematon

### Reseptitiedot
- **difficulty**: Vaikeusaste (Helppo, Keskitaso, Haastava, Vaikea, Erittäin vaikea)
- **valmistusaika**: Kokonaisaika muodossa "HH:MM"
- **maara**: Valmistettavien yksiköiden määrä numerona
- **servings**: Annoskoko per yksikkö numerona
- **impsize**: Tarvittavat vuoat tai astiat mittoineen
- **storage**: Säilyvyysajat järjestyksessä:
  - Huoneenlämpö
  - Jääkaappi
  - Pakastin
  Käytä yksikköjä: pv (päivä), vk (viikko), kk (kuukausi), v (vuosi)

### Välineet ja menetelmät
- **appliances**: Lista tarvittavista laitteista ja välineistä:
  - Listaa ensin kriittiset, korvaamattomat välineet
  - Sitten päälaitteet
  - Lopuksi muut tarvittavat välineet
  - Jätä pois itsestäänselvät perusvälineet

- **method**: Lista käytetyistä valmistusmenetelmistä kronologisessa järjestyksessä

- **diet**: Allergeenit ja erityisruokavaliot:
  - Allergeenit: Listaa kaikki pääallergeenit
  - Haram: Merkitse alkoholi- ja sianlihaperäiset ainesosat (myös liivate)
  - Paasto: Merkitse toinen tarvittaessa:
    - "Tiukka-paasto": Ei lihaa, kananmunia, maitotuotteita tai öljyjä
    - "Paasto": Ei lihaa tai kananmunia, alkoholiton

- **skaalaus**: Reseptin skaalausvaihtoehdot ja niiden tuottamat määrät

## Tagit
Valitse tagit seuraavista kategorioista. Pakolliset kategoriat on merkitty (aina).

### Pääraaka-aine (aina)
Valitse reseptin tärkein maku, valmiste (e.g. kinuski), tai ainesosa.

### Rakenne (aina)
Valitse yksi tai useampi:
- Rapea
- Rapeahko
- Sitkeä
- Murea
- Sileä
- Kermainen
- Mureneva
- Jyväinen
- Tahmea
- Kuituinen

### Maku (aina)
Valitse yksi tai useampi:
- Makea
- Suolainen
- Hapan
- Karvas
- Umami

### Tarjoilutapa
#### Lämpötila
- Kuuma
- Lämmin
- Huoneenlämpö
- Viileä
- Kylmä

#### Valmistusmenetelmä
- Keitetty
- Paistettu
- Grillattu
- Höyrytetty
- Raaka

## Käyttötarkoitus
### Aamiainen
- Nopea aamiainen
- Brunssi
- Viikonlopun aamiainen

### Lounas
- Arkipäivän lounas
- Lounaslaatikko (eväät)
- Viikonlopun lounas

### Päivällinen
- Arkipäivän päivällinen
- Juhlapäivällinen
- Romanttinen illallinen
- Perheillallinen

### Välipala
- Aamupäivän välipala
- Iltapäivän välipala
- Illan välipala
- Terveellinen välipala

### Jälkiruoka
- Arkipäivän jälkiruoka
- Juhlava jälkiruoka
- Kesäjälkiruoka
- Talvijälkiruoka

### Juhla
- Syntymäpäivät
- Häät
- Valmistujaiset
- Kesäjuhlat
- Pikkujoulut

### Kahvipöytä
- Arkipäivän kahvihetki
- Juhlava kahvipöytä
- Lastenkutsut
