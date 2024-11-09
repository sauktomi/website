---
title: "Reseptistandardi"
description: "Reseptien kirjoitus- ja muotoiluohjeet"
date: 2024-01-01
draft: false
---

# Content Standards for Recipe Files

## Required Fields
All recipe markdown files must include these fields with standardized formatting:

### Metadata
- title: Always in quotes
- date: Format "YYYY-MM-DD"
- draft: Boolean (false/true)
- description: Always in quotes, should never be empty. Format: Brief description of the dish, followed by a key characteristic or serving suggestion.
- headimg: Default to "/images/CalculatorSearch.jpeg" if no specific image
- categories: Should match directory structure (see Categories section)
- author: 
  - Use `author: "???"` if no specific author
  - Use quoted name and optional link for specific authors: `author: "[Name](link)"`

### Recipe Info
- difficulty: One of: "Helppo", "Keskitaso", "Haastava", "Vaikea", "Erittäin vaikea"
- valmistusaika: Format "HH:MM"
- maara: Integer (number of items/batches produced)
- servings: Integer (number of portions per item/batch)
- impsize: Always in quotes, be specific with measurements and equipment type (e.g., "23 cm irtopohjavuoka")
- storage: 
  - List format, order indicates storage method:
    1. Room temperature (huoneenlämpö)
    2. Refrigerated (jääkaappi)
    3. Frozen (pakastin)
  - All three methods must be listed, use "-" for not applicable
  - Use standardized time units: "pv" (päivä), "vk" (viikko), "kk" (kuukausi)
  - For ranges use dash: "1-2pv"
  - Example:
    ```yaml
    storage:
    - "2pv"      # Room temperature
    - "1vk"      # Refrigerated
    - "2kk"      # Frozen
    ```
- appliances: List of required equipment. When creating content, consider these categories:
  - Primary Equipment (list first):
    - Uuni
    - Kiertoilmauuni
    - Yleiskone
    - Tehosekoitin
    - Monitoimikone
    - Mikroaaltouuni
  - Essential Tools (list second):
    - Vatkain
    - Vuoka (specify type)
    - Kaulin
    - Mittavälineet
    - Sekoituskulho
  - Optional Tools (list last):
    - Palettilasta
    - Pursotinpussi
    - Leivontapaperi
    - Siivilä
  Example format in recipe:
  ```yaml
  appliances:
  - Uuni
  - Vatkain
  - Sekoituskulho
  - Mittavälineet
  - Palettilasta
  ```

- method: List of cooking methods. When creating content, consider these categories:
  - Primary Techniques (list first):
    - Paisto
    - Keitto
    - Haudutus
    - Grillaus
    - Höyrytys
  - Secondary Techniques (list second):
    - Vatkaus
    - Sekoitus
    - Vaivaus
    - Murskaus
    - Sulatus
  - Finishing Techniques (list last):
    - Koristelu
    - Kuorrute
    - Hyydytys
    - Täyttö
    - Jäähdytys
  Example format in recipe:
  ```yaml
  method:
  - Paisto
  - Vatkaus
  - Sekoitus
  - Jäähdytys
  ```

- diet: List of dietary notes and allergens
  - List allergens present in the recipe: Maito, Kananmuna, Vehnä
  - Mark "Haram" if recipe contains:
    - Alcohol or alcohol-derived ingredients
    - Pork or pork-derived ingredients (e.g. Gelatin)
  - Fasting categories (choose one):
    - "Strict-fasting": No meat, eggs, dairy, or oils; gentle on empty stomachs
    - "Fasting": No meat or eggs, alcohol-free; gentle on empty stomachs
  Example format in recipe:
  ```yaml
  diet:
  - Kananmuna
  - Maito
  - Vehnä
  - Haram
  ```
- skaalaus: List of scaling options with clear results (e.g., "2x 2 kakkua (32 annosta)")

### Tags
Tags should be categorized under these types:
- Main Ingredients:
  - liha, kala, kana
  - juusto, kerma, maito
  - suklaa, vanilja, kaneli
  - marjat, hedelmät, pähkinät
- Texture:
  - rapea, pehmeä, kuohkea
  - kostea, mehukas, murea
  - kermainen, tahmea
- Flavor Profile:
  - makea, suolainen, hapan
  - tulinen, mausteinen
  - raikas, täyteläinen
- Dietary:
  - kasvis, vegaani
  - gluteeniton, maidoton
  - vähäsokerinen, kevyt
- Occasion:
  - juhla, arki
  - joulu, pääsiäinen
  - piknik, brunssi

### Standard Section Names
#### Ingredients
- Main dough/batter: "Taikina"
- Filling: "Täyte"
- Frosting/Icing: "Kuorrute"
- Syrup: "Siirappi"
- Decoration: "Koriste"

#### Instructions
- Preparation steps: "Esivalmistelut"
- Main steps: Numbered list
- Timing format: "n. X min" for estimates, "X-Y min" for ranges
- Temperature format: "X°C (*tasalämpö*)" or "X°C (*kiertoilma*)"

#### Notes
- Tips section: "### Vinkkejä:"
- Variations section: "### Versioita:"
- Alternative ingredients: "### Vaihtoehdot:"

### Text Formatting
- Use *italics* for:
  - Important technique notes (e.g., "*Huom: Älä ylisekoita (!)*")
  - Temperature types (e.g., "*tasalämpö*")
  - Critical timing notes
- Use **bold** for:
  - Section names in instructions
  - Temperature warnings
  - Critical steps

### Ingredient Formatting
- Amount and unit must be separated by a space
- Units should be standardized:
  - Weight: g, kg
  - Volume: ml, dl, l
  - Teaspoons/Tablespoons: convert to ml where possible
  - Temperature: °C
- Ingredient names should be capitalized
- Format: "[amount] [unit] [Ingredient]" (e.g., "200 g Voi")
- For count-based ingredients: "[number] kpl [Ingredient]" (e.g., "2 kpl Kananmuna")

### Ingredient Ordering
1. Main ingredients by weight (largest to smallest)
2. Dry ingredients together
3. Wet ingredients together
4. Spices and small amounts last
5. Keep related ingredients grouped

### Instructions Style
1. Start with preparation steps (equipment, temperature)
2. Group related steps together
3. Include parallel tasks (e.g., "sillä aikaa...")
4. End with finishing/storage instructions
5. Use semicolons for related sub-steps
6. Use dashes for alternatives

### Timing and Temperature Standards
- Use "n." for approximate times (e.g., "n. 5 min")
- Use ranges for variable times (e.g., "5-7 min")
- Temperature format: "175°C (*tasalämpö*)" or "160°C (*kiertoilma*)"
- Standard temperature adjustments:
  - Kiertoilma: -15-20°C from tasalämpö
  - Alalämpö: +10°C from tasalämpö
- Preheating always mentioned in first step

### Equipment Standards
#### Vuoka Sizes
- GN sizes for commercial:
  - 1/1 GN: 530x325 mm
  - 1/2 GN: 265x325 mm
  - 1/3 GN: 176x325 mm
  - 1/4 GN: 265x162 mm
- Standard sizes:
  - Irtopohja: 18, 20, 23, 26, 28 cm
  - Leipävuoka: 15x8, 25x11, 30x11 cm
  - Pelti: 30x20, 30x40, 40x60 cm

#### Vuoka Preparation
- "Vuoraa": Line with parchment paper
- "Voitele": Grease with butter/oil
- "Jauhota": Dust with flour after greasing

### Measurement Standards
- Weight preferred over volume when precision needed
- Standard conversions:
  - 1 rkl = 15 ml
  - 1 tl = 5 ml
  - 1 dl = 100 ml
- Round to:
  - 5g increments for <100g
  - 10g increments for 100-500g
  - 25g increments for >500g
  - 5ml increments for liquids

### Variations Format
- Prefix changes with +/- and amounts
- Group related changes together
- Include any special instructions
- Reference variations in main instructions if needed
Example:
```markdown
### Versioita:
- **Mauste**: +1 tl kaneli, +1 tl inkivääri
- **Suklaa**: -25g sokeri, +50g suklaa
```

### Cross-References
- Use [links](#section-name) for references
- Include scaling notes in parentheses
- Reference variations at start of instructions
- Note equipment changes for variations

## Categories
Categories should be related to the directory structure:
- /Kakut/Juustokakut/ → "Juustokakku"
- /Kakut/Kahvikakut/ → "Kahvikakku"
- /Kakut/Kermakakut/ → "Kermakakku"
- /Kakut/Sokerikakut/ → "Sokerikakku"
- /Makeat herkut/Keksit ja patukat/ → "Keksi" or "Patukka"
- /Taikinapohjaiset/Piirakat/ → "Piirakka"
- /Tuotteet/ → "Tuote"

## Content Structure
```markdown
---
[metadata fields]
---

{{< ingredients >}}
### [Standard Section Name]
- [amount] [unit] [Ingredient]
{{</ ingredients >}}

{{< instructions >}}
1. Clear, concise steps
2. Use *italics* for important notes
3. Group related steps together
4. Include timing and temperature details
{{</ instructions >}}

{{< notes >}}
### Vinkkejä:
- Essential tips for success
- Common pitfalls and solutions
- Technique explanations

### Versioita:
- **[Version Name]**: Changes and special instructions
- **[Alternative]**: Ingredient substitutions
{{</ notes >}}
```

### Example Ingredient Section
```markdown
#### Taikina
- 200 g Voi
- 170 g Sokeri
- 2 kpl Kananmuna
- 200 g Vehnäjauho
- 5 ml Leivinjauhe
- 2 ml Suola

#### Kuorrute
- 200 g Tomusokeri
- 30 ml Vesi
```

### Example Instruction Step
```markdown
1. Esilämmitä uuni 175°C (*tasalämpö*); valmistele vuoka.
2. Vatkaa voi ja sokeri kuohkeaksi, n. 5 min (keski).
3. Lisää munat yksitellen; varmista sekoitus nuolijalla.
