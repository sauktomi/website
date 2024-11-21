---
title: "Reseptistandardit"
date: "2024-11-10"
lastmod: "2024-11-12"
author: "TMS"
draft: false
headimg: "/images/CalculatorSearch.jpeg"
description: "Kattavat ohjeet reseptien kirjoittamiseen ja muotoiluun Hugo-sivustolle"
categories: ["Ohjeet", "Standardit"]
tags:
- resepti
- standardi
- muotoilu
- hugo
---

# Reseptistandardit

Tämä dokumentti sisältää standardit reseptien kirjoittamiseen ja muotoiluun Hugo-sivustoa varten. Tavoitteena on varmistaa reseptien helppolukuisuus, toistettavuus ja johdonmukaisuus.

## 1. Yleiskatsaus

### 1.1 Tarkoitus

Reseptistandardit määrittelevät yhtenäisen tavan kirjoittaa ja muotoilla reseptejä Hugo-sivustolle. Standardien tavoitteena on varmistaa, että reseptit ovat helposti toistettavissa, ohjeet ovat yksiselitteisiä, mittayksiköt ovat yhdenmukaisia, reseptit ovat helposti löydettävissä ja sisältö on johdonmukaisesti järjestetty.

### 1.2 Rakenne

Reseptistandardit koostuvat seuraavista osista:

* **Metatiedot:** Reseptin perustietojen määrittely (otsikko, kuvaus, valmistusaika jne.).
* **Ainesosat:** Ainesosien listausperiaatteet, mittayksiköiden käyttö ja ryhmittely.
* **Ohjeet:** Valmistusvaiheiden kirjoitus, kriittisten tietojen merkintä ja muotoilu.
* **Välineet:** Tarvittavien välineiden määrittely.
* **Kategoriat ja tagit:** Reseptien luokitteluperiaatteet ja hakemistorakenne.
* **Mittayksiköt:** Standardiyksiköiden käyttö ja mittaustarkkuus.
* **Nimeämiskäytännöt:** Tiedostojen ja hakemistojen nimeäminen.
* **Indeksitiedostot:** Kategorioiden kuvaukset ja rakenne.
* **JSON-LD Schema:** Rakenteellinen data hakukoneoptimointia varten.
* **Kuvat:** Kuvien nimeäminen, koko ja optimointi.
* **Saavutettavuus:** Ohjeet saavutettavan sisällön luomiseen.
* **Suorituskyky:** Sisällön optimointi nopeaa latautumista varten.

## 2. Metatiedot

### 2.1 Pakolliset kentät

```yaml
title: "Reseptin nimi"                    # Otsikko lainausmerkeissä
date: "YYYY-MM-DD"                        # Luontipäivä
lastmod: "YYYY-MM-DD"                     # Viimeisin muokkaus
author: "Tekijän nimi"                    # Tekijä tai "???"
draft: false                              # true = luonnos, false = julkaistu
headimg: "/images/kuvan-nimi.jpeg"        # Pääkuvan polku
description: "Lyhyt kuvaus reseptistä"    # Ytimekäs kuvaus lainausmerkeissä
categories: ["Kategoria1", "Kategoria2"]  # Pääkategoriat
```

### 2.2 Tekniset tiedot

```yaml
difficulty: "Keskitaso"                   # Helppo/Keskitaso/Haastava/Vaikea/Erittäin vaikea
valmistusaika: "HH:MM"                    # Kokonaisaika tunteina ja minuutteina
maara: 1                                  # Valmistettavien yksiköiden määrä numerona
servings: 4                               # Annosten määrä per yksikkö numerona
impsize: "20cm irtopohjavuoka"            # Tarvittavat astiat mittoineen
```

### 2.3 Säilytystiedot

```yaml
storage:                                  # Muoto: [aika][yksikkö], yksiköt: pv/vk/kk/v/-
  - "3pv"                                 # huoneenlämmössä
  - "1vk"                                 # jääkaapissa
  - "2kk"                                 # pakastimessa
```

### 2.4 Valmistustiedot

```yaml
appliances:                               # Lista tärkeysjärjestyksessä
  - "Yleiskone"                           # Kriittiset välineet
  - "Uuni"                                # Päälaitteet
  - "Vatkain"                             # Muut välineet

method:                                   # Valmistusmenetelmät käyttöjärjestyksessä
  - "Vaahdotus"                           # Alkuvalmistelut
  - "Keittäminen"                         # Pääkäsittelyt
  - "Temperoiminen"                       # Viimeistelyt
```

### 2.5 Erityisruokavaliot ja skaalaus

```yaml
diet:                                    
  - "Maito"                               # Allergeenit
  - "Vehnä"                               # Allergeenit
  - "Haram"                               # Jos ei sisällä alkoholia tai ole siasta peräisin
  - "Paasto"                              # Jos ei sisällä alkoholia, öljyä, maitoa, tai lihaa

skaalaus:                                 # Muoto: "[kerroin]x [määrä (kpl)] (vaihtoehtoiset perään [mitta] [(annokset)])"
  - "0.67x 23cm vuoka (8 annosta)"
  - "2x 2 kpl 28cm vuokaa (20 annosta)"
  - "2x 18 kpl"
  - "1.5x 16 kpl (8 annosta)"
```

### 2.6 Tagit

```yaml
tags:                                    
  - "peruna"                              # Pääraaka-aine (pakollinen)
  - "rapea"                               # Rakenne (pakollinen)
  - "makea"                               # Maku (pakollinen)
  - "nopea aamiainen"                     # Käyttötarkoitus
  - "arkipäivän lounas"                   # Tilaisuus
  - "syntymäpäivät"                       # Juhlatilaisuus
```


## 3. Valmistusmenetelmät

### 3.1 Alkuvalmistelut
Vaahdotus, Kaikki-yhteen, Sulaita-sekoita-paista, Vatkaus, Nyppiminen, Vaivaaminen, Kauliminen

### 3.2 Pääkäsittelyt
Keittäminen, Hauduttaminen, Paistaminen, Paahtaminen, Leipominen, Höyryttäminen, Grillaaminen, Uppopaisto, Pannupaisto

### 3.3 Viimeistelyt
Temperoiminen, Glaseeraus, Pistely, Viiltäminen, Pursottaminen, Kerrostaminen, Poché, Wokkaus, Kohotus, Sokkopaisto, Vesihauhe, Kylmähauhe, Ryöppääminen


## 4. Ainesosat

### 4.1 Perusmuoto
Jokainen ainesosa tulee kirjata seuraavasti:
- Määrä ja yksikkö erotettuna **yhdellä** välilyönnillä
- Ainesosan nimi isolla alkukirjaimella
- Muoto: "[määrä] [yksikkö] [Ainesosa]"
- Kappalemäärät: "[määrä] kpl [Ainesosa]"

### 4.2 Yksiköt
Käytä vain standardisoituja yksiköitä: g, kg, ml, dl, l, °C, kpl. Älä koskaan muunna painoyksiköitä tilavuusyksiköiksi tai päinvastoin.

### 4.3 Yksikkömuunnokset
- Huom: Muunna vain saman tyypin yksiköiden välillä. 
- Tilavuusmitat muunnetaan millilitroiksi, painomitat grammoiksi. Käytä pakkausmittojen alkuperäistä mittayksikköä.

### 4.4 Pyöristys
Pyöristä määrät seuraaviin tarkkuuksiin:
- Alle 100 g: 5 g tarkkuus
- 100-500 g: 10 g tarkkuus
- Yli 500 g: 25 g tarkkuus
- Nesteet: 5 ml tarkkuus

### 4.5 Ryhmittely
Jaa ainesosat loogisiin ryhmiin käyttötarkoituksen mukaan. Järjestä ainesosat valmistusjärjestykseen ja pidä samaan vaiheeseen kuuluvat ainekset yhdessä.

### 4.6 Ryhmien järjestys
Listaa ryhmät valmistusjärjestyksessä, esim: pohja/taikina, täytteet ja väliosat, kuorrutukset ja koristeet, lisäosat.

### 4.7 Lisätiedot

#### 4.7.1 Sallitut lisämerkinnät
Merkitse sulkeisiin vain ainesosan lämpötila, valmistustila tai -aste, vaihtoehtoiset aineet kauttaviivalla ja kriittiset ominaisuudet.

#### 4.7.2 Kielletyt merkinnät
??? Vältä valmistusohjeita, huutomerkkejä, korostuksia, kommentteja, ylimääräisiä sulkumerkintöjä ja painon ja tilavuuden välisiä muunnoksia.

#### 4.7.3 Järjestyksen periaatteet
- Noudata valmistusjärjestystä
- Ryhmittele loogiset kokonaisuudet
- Huomioi reseptin erityispiirteet
- Varmista yhteensopivuus ohjeiden kanssa


## 5. Ohjeet

### 5.1 Rakenne

#### 5.1.1 Vaiheistus
Numeroi päävaiheet, aloita jokainen vaihe verbillä ja etene kronologisessa järjestyksessä. Yhdistä toisiinsa liittyvät toiminnot ja jaa monimutkainen vaihe tarvittaessa. Järjestä vaiheet tehokkaan ajankäytön mukaan, esim:
  1. Esivalmistelut (lämmitys, vuoat)
  2. Odotusaikaa vaativat valmistelut
  3. Päävaiheet
  4. Viimeistely

#### 5.1.2 Tehokas ajankäyttö
Tunnista, mainitse, ja yhdistele rinnakkaisia työvaiheita. Hyödynnä odotusajat muihin valmisteluihin ja minimoi turha odottelu. Kerro mitä voi tehdä jäähtymis- tai odotusaikoina.

#### 5.1.3 Mittayksiköt ohjeissa
Käytä suhteellisia määriä ohjeessa tarkan mittaamisen sijaan, esimerkiksi "puolet", "kolmasosa", "2/3" tai "loput".

#### 5.1.4 Kriittiset tiedot
Mainitse aina lämpötilat muodossa "X°C (lämmitystapa)", valmistusastioiden esivalmistelu, ainesosien lämpötilavaatimukset, kypsennysajat ja -merkit, jäähdytys- ja säilytysvaatimukset sekä riippuvuudet eri vaiheiden välillä.

#### 5.1.5 Tarkkuustasot
Määrittele tarkasti lämpötilat, valmistustavat, kriittiset ajat, tekstuurit ja rakenteet, erityistekniikat sekä konkreettiset onnistumisen merkit.

### 5.2 Muotoilu

#### 5.2.1 Lämpötilat
Merkitse aina lämpötila ja lämmitystapa sulkeissa, esimerkiksi "180°C (kiertoilma)".

#### 5.2.2 Ajat
Ilmoita kriittiset minimiajat, tarvittavat vaihteluvälit, kypsyysmerkit, jäähdytysajat sekä kokonaisaika ja aktiivinen työaika.

#### 5.2.3 Rinnakkaiset toiminnot
Osoita selkeästi samanaikaiset valmistelut, odotusaikojen hyödyntäminen, toimintojen ajoitus, valmistelujärjestys ja riippuvuudet eri vaiheiden välillä.

#### 5.2.4 Korostukset
Käytä harkiten *kursiivia* teknisiin huomioihin, huutomerkkiä "(!)" kriittisiin varoituksiin, **lihavointia** tärkeisiin vaiheisiin ja sulkeita "()" tarkentaviin tietoihin.

### 5.3 Kirjoitustyyli

#### 5.3.1 Ytimekkyys
Yhdistä toisiinsa liittyvät toiminnot yhteen virkkeeseen, mainitse vain oleelliset yksityiskohdat, käytä täsmällisiä verbejä ja vältä turhaa toistoa.

#### 5.3.2 Järjestys
Etene loogisesti valmistelusta päävaiheiden kautta viimeistelyyn, hyödynnä odotusajat muihin toimiin, kerro riippuvuudet selkeästi ja numeroi päävaiheet.

#### 5.3.3 Tarkkuus
Ilmoita lämpötilat muodossa "X°C (lämmitystapa)", mainitse kriittiset ajat ja onnistumisen merkit, korosta tärkeät huomiot kursiivilla ja erota valinnaiset vaiheet selkeästi.

``` Esimerkki hyvästä ohjeesta
1. Yhdistä murskatut keksit, sekä sulatettu voi, ja paina valmiiseen irtopohjavuokaan. Jäähdytä.
2. Liuota kaikki liivatteet erillään. Pehmennä ja vatkaa tuorejuusto sekä sokerit tasaiseksi; samalla erikseen vaahdota kerma löysäksi vaahdoksi.
3. Sulata täytteen liivatteet, sekoita soseeseen, ja yhdistä täyteseokseen. Kääntele kermavaahto mukaan ja kaada vuokaan. Pakasta ~30 min (vain kunnes pinta hyytyy) tai jääkaapita vähintään 2 t.
5. Sulata sokeri veteen – sitten liivatteet – ja lisää hedelmäsose ja sitruunamehu. Kaada kakun päälle lusikan avulla.
```


## 6. Mittayksiköt ja Ainesosat

### 6.1 Perusyksiköt

#### 6.1.1 Paino
- gramma (g); alle 1000g grammoina, yli 1000g kilogrammoina (kg). 

#### 6.1.2 Tilavuus
- millilitra (ml); alle 1000ml millilitroina, yli 1000ml litroina (l). 
- Desilitrat (dl) vain vakiintuneissa yhteyksissä.

#### 6.1.3 Lämpötila
- celsiusasteina (°C); Tasalämpö peruslämpötilana, kiertoilma 15-25°C tasalämmöstä, alalämpö +10°C tasalämmöstä.

#### 6.1.4 Kappalemäärät
- lyhenne "kpl"; kokonaisina numeroina.

### 6.2 Mittausperiaatteet

#### 6.2.1 Yksikkömuunnokset
- Muunna vain saman tyypin yksiköiden välillä. Älä muunna painoyksiköitä tilavuusyksiköiksi tai päinvastoin.

#### 6.2.2 Mittaustarkkuus
- Muunna kriittiset aineet tarkasti, joustavat aineet sallivat vaihtelua, mausteet tarpeen mukaan, koristeet joustavasti.

### 6.3 Ainesosat

#### 6.3.1 Muotoilu

##### 6.3.1.1 Perusmuoto
Jokainen ainesosa kirjataan muodossa:
```markdown
- [määrä] [yksikkö] [Ainesosa]
```

##### 6.3.1.2 Merkintäsäännöt
Määrä ja yksikkö erotettuna yhdellä välilyönnillä, ainesosan nimi isolla alkukirjaimella. Esim:
```markdown
- 250 g Vehnäjauho
- 2 kpl Kananmuna
- 100 ml Maito
```

#### 6.3.2 Ryhmittely

##### 6.3.2.1 Ainesosien ryhmittely
Jaa ainesosat loogisiin ryhmiin, noudattaen valmistusjärjestystä:
```markdown
#### Pohja
- 250 g Digestive keksi
- 100 g Voi

#### Täyte
- 500 g Tuorejuusto
- 85 g Sokeri
```

#### 6.3.3 Lisätiedot

##### 6.3.3.1 Sallitut lisämerkinnät
- Salli sulkeissa lämpötila, valmistustila, vaihtoehdot ja kriittiset ominaisuudet.

##### 6.3.3.2 Kielletyt merkinnät
- Vältä valmistusohjeita, huutomerkkejä, kommentteja ja ylimääräisiä merkintöjä.

##### 6.4 SEO-optimointi
- Käytä relevantteja, taikka long-tail avainsanoja tageissa
- Varmista, että kategoriat ja tagit ovat johdonmukaisia kokosivustolla

## 7. Välineet

### 7.1 Listausjärjestys
Listaa tärkeysjärjestyksessä: 
1. Kriittiset välineet
   - Välineet joita ei voi korvata muilla
   - Välineet jotka vaikuttavat oleellisesti lopputulokseen
   - Erikoisvuoat ja -muotit joita resepti vaatii

2. Päälaitteet
   - Suuret kodinkoneet ja laitteet
   - Laitteet jotka määrittävät valmistustavan

3. Tarvittavat välineet
   - Välineet jotka helpottavat valmistusta
   - Välineet jotka parantavat lopputulosta
   - Välineet joille voi olla vaihtoehtoja

### 7.2 Mainitsemisperiaatteet
- Mainitse vain oleelliset ja erikoisvälineet.

### 7.3 Vuokien määrittely

#### 7.3.1 Koon ilmoittaminen
- Ilmoita tarkat mitat, muoto, kappalemäärä ja erityisominaisuudet.

#### 7.3.2 Tyypin määrittely
- Kerro valmistelutapa ja kriittiset vaiheet.

### 7.4 Valmistelut

#### 7.4.1 Laitteiden valmistelu
- Mainitse esilämmitysvaatimukset, asetukset ja lisäosat.

### 7.5 Mittastandardit

#### 7.5.1 Vuokakoot
- Käytä standardisoituja vuokakokoja ja virallisia GN-kokoja.
- Kerro jos koko on kriittinen, muuten ilmoita vaihtoehtoiset koot.
- Mainitse täyttöaste tarvittaessa.


## 8. Kategorioiden Standardit

### 8.1 Periaatteet
- Järjestä reseptit hierarkkisesti, max 3-4 tasoa.
- Sijoita resepti tarkimpaan kategoriaan.

### 8.2 Kategorioiden luominen
- Luo uusi kategoria kun samankaltaisia reseptejä on useita
- Varmista että kategoria on selkeästi erottuva ja nimeä kategoria sen sisältöä kuvaavasti
- Huomioi mahdolliset tulevat reseptit

## 9. Nimeämiskäytännöt

### 9.1 Tiedostonimet
- pienet kirjaimet, välilyönnit viivaksi, ei ääkkösiä tai erikoismerkkejä, .md-pääte.

### 9.2 Hakemistonimet
- isot alkukirjaimet, välilyönnit ja ääkköset sallittu, kuvaavat nimet.

## 10. Indeksitiedostot

### 10.1 Pakolliset tiedot
Jokaisessa hakemistossa tulee olla _index.md, joka sisältää:
- Kategorian kuvauksen
- Kategorian tarkoituksen
- Mahdolliset alakategoriat
- Yleiset ohjeet

### 10.2 Indeksin rakenne
"
```markdown
- title: Kategorian nimi
- description: Lyhyt kuvaus sisällöstä
```

Yleiskuvaus kategorian resepteistä.

- Mahdolliset erityishuomiot
"
### 10.3 Indeksin tarkoitus
- Selventää sisältöä, ohjata sijoittelua, yhtenäistää käytäntöjä, sekä helpottaa navigointia.
