---
title: "Metadata"
description: "Reseptien metatietojen standardit"
date: "2024-11-09"
lastmod: "2024-11-10"
draft: false
---
\* Don't output the headers when processing \*
## Pakolliset kentät

### Perustiedot
- **title**: Reseptin nimi lainausmerkeissä
- **date**: Luontipäivämäärä muodossa "YYYY-MM-DD"
- **lastmod**: Viimeisimmän muokkauksen päivämäärä muodossa "YYYY-MM-DD"
- **draft**: Julkaisutila (false = julkaistu, true = luonnos)
- **description**: Ytimekäs kuvaus reseptistä ja sen käyttötarkoituksesta
- **headimg**: Reseptin pääkuvan polku, oletuksena "/images/CalculatorSearch.jpeg"
- **categories**: Reseptin kategoriat määräytyy kaksiosaisesti (Näytä vain kategorioiden nimet ilman polkuja):
  - Ensisijainen: määräytyy tiedoston sijainnin perusteella hakemistorakenteessa
  - Toissijainen: valitaan Käyttötarkoitus-kategorioista (katso alla)
- **author**: Tekijän nimi tai "???" jos tuntematon

### Reseptitiedot
- **difficulty**: Vaikeusaste (Helppo, Keskitaso, Haastava, Vaikea, Erittäin vaikea)
- **valmistusaika**: Kokonaisaika muodossa "HH:MM"
- **maara**: Valmistettavien yksiköiden määrä numerona
- **servings**: Annoskoko per yksikkö numerona
- **impsize**: Tarvittavat vuoat tai astiat mittoineen
- **storage**: Säilyvyysajat järjestyksessä (huoneenlämpö, jääkaappi, pakastin):
  - [aika] [yksikkö]
  - [aika] [yksikkö]
  - [aika] [yksikkö]
  Käytä yksikköjä: - (ei säilytystä),pv (päivä), vk (viikko), kk (kuukausi), v (vuosi)

### Välineet ja menetelmät
- **appliances**: Lista tarvittavista laitteista ja välineistä:
- Listaa ensin kriittiset, korvaamattomat välineet
- Sitten päälaitteet
- Lopuksi muut tarvittavat välineet
- Jätä pois itsestäänselvät perusvälineet

- **method**: Lista käytetyistä valmistusmenetelmistä kronologisessa järjestyksessä:
  - Valitse sopivat menetelmät seuraavista:
    Vaahdotus, Kaikki-yhteen, Sulaita-sekoita-paista, Vatkaus, Nyppiminen,
    Vaivaaminen, Kauliminen, Vesihaude, Kylmähaude, Ryöppääminen,
    Keittäminen, Hauduttaminen, Grillaaminen, Uppopaisto, Pannupaisto,
    Paistaminen, Paahtaminen, Leipominen, Höyryttäminen, Poché, Hauduttaa,
    Wokkaus, Kohotus, Sokkopaisto, Temperoiminen, Glaseeraus, Pistely,
    Viiltäminen, Pursottaminen, Taikinan kerrostaminen
  - Listaa valitut menetelmät siinä järjestyksessä kuin niitä käytetään reseptissä
  - Voit lisätä tarvittaessa muita menetelmiä, jos niitä ei löydy listasta

- **diet**: Allergeenit ja erityisruokavaliot:
- Allergeenit: Listaa kaikki pääallergeenit (vain sana)
- Haram: Merkitse alkoholi- ja sianlihaperäiset ainesosat (myös liivate)
- Paasto: Merkitse toinen tarvittaessa: "Tiukka-paasto": Ei lihaa, kananmunia, maitotuotteita tai öljyjä; "Paasto": Ei lihaa tai kananmunia, alkoholiton

- **skaalaus**: Lista reseptin skaalausvaihtoehdoista. Jokainen vaihtoehto sisältää kertoimen ja vähintään yhden seuraavista: määrä, koko, astia, annokset. Esimerkiksi:
- "0.67x 23cm vuoka (8 annosta)"
- "2x 2kpl 28cm vuokaa (20 annosta)"
- "2x 2.7L vuoka (16 annosta)"
- "1.5x 27 kpl"
- "2x 36 kpl"

### Tagit
- Valitse tagit seuraavista kategorioista. Pakolliset kategoriat on merkitty (aina).

#### Pääraaka-aine (aina)
- Valitse reseptin tärkein maku, valmiste (e.g. kinuski), tai ainesosa.

#### Rakenne (aina)
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

#### Maku (aina)
Valitse yksi tai useampi:
- Makea
- Suolainen
- Hapan
- Karvas
- Umami

#### Tarjoilutapa
##### Lämpötila
- Kuuma
- Lämmin
- Huoneenlämpö
- Viileä
- Kylmä

##### Valmistusmenetelmä
- Keitetty
- Paistettu
- Grillattu
- Höyrytetty
- Raaka

### Käyttötarkoitus
#### Aamiainen
- Nopea aamiainen
- Brunssi
- Viikonlopun aamiainen

#### Lounas
- Arkipäivän lounas
- Lounaslaatikko (eväät)
- Viikonlopun lounas

#### Päivällinen
- Arkipäivän päivällinen
- Juhlapäivällinen
- Romanttinen illallinen
- Perheillallinen

#### Välipala
- Aamupäivän välipala
- Iltapäivän välipala
- Illan välipala
- Terveellinen välipala

#### Jälkiruoka
- Arkipäivän jälkiruoka
- Juhlava jälkiruoka
- Kesäjälkiruoka
- Talvijälkiruoka

#### Juhla
- Syntymäpäivät
- Häät
- Valmistujaiset
- Kesäjuhlat
- Pikkujoulut

#### Kahvipöytä
- Arkipäivän kahvihetki
- Juhlava kahvipöytä
- Lastenkutsut
