# Redraw with LLMs

## Branches

See `branches.txt` for the list of branches.

### 1 Gemini, chat mode

```text
v2.1.0

After this prompt, I will switch you to drawing mode and will only give you names and descriptions, and you will draw according to the instructions below:

A magnificent, detailed illustration of a dark fantasy location in the world of Dungeon Crawl.

The scene should preserve the essence of roguelike design — mysterious, deadly, yet filled with divine and arcane beauty.
Architecture and landscape should appear both real and symbolic, as if drawn by a medieval alchemist mapping the soul of the underworld.
Perspective is vertical and flattened, reminiscent of illuminated manuscripts or sacred frescoes.
Lighting should emanate from within the scene — magical sources, runes, lava, or ghostly light — never daylight.

Textures: ancient stone, bone, tarnished metal, organic matter, smoke, salt, and arcane energy. 
Include subtle sigils, glowing symbols, and faint inscriptions around the edges of the frame, as if the image were a holy diagram. 

Style: gothic renaissance + roguelike realism + medieval alchemical manuscript + Zdzisław Beksiński + Moebius.
Mood: solemn, haunting, majestic, mystical.
Medium: digital painting imitating ink, gold leaf, and aged parchment, with deep shadows and fine engraving detail.

– cinematic wide shot, ultra-wide aspect ratio (16:9), panoramic composition, epic scale, distant perspective.
– the scene fills the horizontal space, showing both near and far elements with clear atmospheric depth.
– composition: wide framing with central focal point and secondary elements extending into the distance.

There should be no inscriptions or signatures on the image.

Stylistic cues (depending on location type):
– For divine or sacred places (Temple, Ziggurat, Bazaar): use warm gold, marble light, and symmetry.
– For infernal or cursed places (Hell, Dis, Tartarus, Crypt): use shadowed reds, black iron, green fire, and skull motifs.
– For natural or bestial places (Lair, Swamp, Shoals, Snake Pit, Spider Nest): use organic shapes, bioluminescence, and mist.
– For arcane or cosmic places (Zot, Abyss, Pandemonium, Wizlab): use shifting geometry, fractal light, floating stones, and color auras.
– For ruins and decay (Desolation, Vaults, Necropolis): use erosion, dust, and muted tones of stone and bone.

--ar 16:9 --style raw

```

### 2 Gemini, image mode

Copy and paste name and description from <https://github.com/crawl/crawl/blob/master/crawl-ref/source/dat/descript/branches.txt>.

## Clouds

See `branches.txt` for the list of branches.

### 1 Gemini, chat mode

```text
v1.0.0

After this prompt, I will switch you to drawing mode and will only give you names and descriptions, and you will draw according to the instructions below:

A magnificent, highly detailed depiction of an arcane magical cloud from the world of Dungeon Crawl. 
The cloud is a living manifestation of magic, elemental energy, or divine wrath. It floats or expands within a dark subterranean space, interacting with the environment — stone walls, water, ancient runes, or bones. 

The atmosphere should be dynamic, filled with swirling motion, sparks, vapors, and subtle light refractions.
Color and luminosity must reflect the essence of the described cloud:  
– fire clouds: molten orange, scarlet, and gold tones, sparks and heat haze.  
– ice or frost clouds: pale blue and white with crystalline particles.  
– poison or pestilence clouds: green-yellow fog, toxic glow.  
– necromantic or misery clouds: black mist with ghostly faces and violet light.  
– divine or blessed clouds: golden radiance with geometric holy sigils.  
– chaos or mutagenic clouds: prismatic turbulence, fractured light, distorted space.  
– smoke or dust clouds: subdued tones, visible particles, faint sunlight through haze.  

There should be no inscriptions or signatures on the image.

Style: gothic alchemical illustration + roguelike realism + mystical energy study + Zdzisław Beksiński + Moebius + renaissance etching.
Medium: digital painting imitating ink, vapor, and gold dust on dark parchment.
Lighting: self-emissive; the cloud itself is the main light source.
Composition: centered or asymmetrical, with tendrils of mist extending outward.
Aspect ratio: square or 16:9 panoramic depending on scene scale.
Mood: mysterious, volatile, sacred, or dangerous, depending on the type of magic.

--style raw

```

### 2 Gemini, image mode

Copy and paste name and description from <https://github.com/crawl/crawl/blob/master/crawl-ref/source/dat/descript/branches.txt>.

## Items

See `items.txt` & folders with images for the list of items.

### 1 Gemini, chat mode

```text
v1.4.0

After this prompt, I will switch you to drawing mode and will only give you the names and descriptions of the items, and you will draw according to the instructions below:

Draw a **realistic dark fantasy reinterpretation** of the original art (see attachment) and description (see below). Keep the **same composition, form, disposition, and colours**. This is a **dramatic, cinematic detailed reinterpretation**, that feels ancient, mystical, and handcrafted, not a copy, not a pixel-art.

The design must preserve the recognizable silhouette and color palette of the original art, but reimagine it as a richly textured artefact from a dark fantasy world, inspired by Dungeon Crawl and alchemical manuscripts. 

Render it with exquisite material detail — tarnished metal, aged leather, cracked gemstones, runes etched into surfaces, faint glow of ancient magic. 
Background: neutral parchment or dark void with golden alchemical sigils and subtle vignette, so the focus stays on the object. 
Lighting: candlelight or arcane glow, emphasizing texture and mystical depth. 
Style: gothic renaissance + roguelike realism + H.R. Giger + Zdzisław Beksiński + medieval manuscript illumination. 
Medium: digital painting with painterly brushstrokes and fine engraving detail, as if restored from a forgotten grimoire. 
Aspect ratio: square, centered composition, one artefact only.

There should be no inscriptions or signatures on the image.

Optional additions:
– add faint hovering glyphs, energy particles, or reflections hinting at the item’s magical nature.
– for cursed or demonic items, add shadow halos, black fire, or crimson smoke.
– for holy or divine items, add gold dust light and sacred geometry symbols.

--style raw

```

### 2 Gemini, image mode

Copy and paste name and description from <https://github.com/crawl/crawl/blob/master/crawl-ref/source/dat/descript/items.txt>.

## Monsters

See `monsters.txt` & folders with images for the list of monsters.

### 1 Gemini, chat mode

```text
v5.4.0

After this prompt, I will switch you to drawing mode and will only give you names and descriptions, and you will draw according to the instructions below:

Draw a **realistic dark fantasy reinterpretation** of the original art (see attachment) and description (see below). Keep the **same composition, silhouette, pose, and colours**, as well as the **relative layout of background elements**. This is a **dramatic, cinematic reinterpretation**, not a copy, not a pixel-art.

Render the creature (item, object, building, etc.), its armor, and surroundings with:
- **Realistic materials** (metal, bone, leather, fabric, stone, mist, etc.) in the colours of the provided image.
- **High-detail textures** and **volumetric lighting**.
- **Cinematic shadows** and **strong light direction** (like from a torch, spell, or moon).
- **Atmospheric depth**, with subtle fog, floating dust, and background blur.
- **Dynamic tension** and **epic scale feeling**, as if from a movie still.

Like a still frame from a dark fantasy film, captured with cinematic lighting and lens blur.

Depict the creature as a mythic abomination, awe-inspiring and terrifying, blending beauty and horror.

The atmosphere should feel **moody, ancient, and mythic**, combining realism with fantasy.
Do not try to make the creature biologically plausible — interpret it artistically, as a **dark mythic entity**.

**Style references:** 
Dark Souls / Elden Ring / Diablo IV / Magic: The Gathering / Greg Rutkowski / Magali Villeneuve / Wētā Workshop concept art.

Use the attached image as reference for **composition and silhouette**, but reinterpret every surface, light, and texture in **a fully rendered, realistic way**.

There should be no inscriptions or signatures on the image.

Use the name and description to understand the creature's appearance and behavior.

--ar 1:1 --style raw

```

### 2 Gemini, image mode

Copy and paste name and description from <https://github.com/crawl/crawl/blob/master/crawl-ref/source/dat/descript/monsters.txt>.

### 3 Comet, Assistant

Open the Comet Assistant on the Gemini chat.

```text
v1.2.0

Copy the links to the generated images and download them.

```

### 3 v2 Comet, Assistant

TBD This step is not implemented yet. Just a prototype.

Open the Comet Assistant on the Gemini chat.

```text
v2.0.0

1/ Read the name of the prototype file from the prompt located in front of the generated image.

2/ Click the download button for the generated image.

3/ Set the file name to be the same as the prototype file name (from step 1).

4/ Save the image to your computer.

```

## Mutations

See `mutations.txt` for the list of mutations.

### 1 Gemini, chat mode

```text
v1.0.0

After this prompt, I will switch you to drawing mode and will only give you the names and descriptions of the mutations, and you will draw according to the instructions below:

A dark alchemical illustration of a creature in the world of Dungeon Crawl, depicting the mutation.
The creature stands in a shadowy, otherworldly environment — a mix of ancient dungeon, arcane laboratory, and medieval bestiary. 
The anatomy is distorted yet elegant, as if sculpted by divine madness. 
Lighting is dramatic chiaroscuro, with glows of magical energy matching the mutation’s element (ice = blue light, fire = red-orange, slime = green, demonic = crimson-black). 
Surrounding symbols and runes float in the air, drawn in gold ink and geometric spirals. 
Style: gothic horror + renaissance alchemy illustration + Zdzisław Beksiński + H.R. Giger + ancient manuscript etching. 
Medium: ink and gold on aged parchment, detailed, painterly texture, mystical atmosphere, symmetrical composition.

--ar 1:1 --style raw

```

### 2 Gemini, image mode

Copy and paste name and description from <https://github.com/crawl/crawl/blob/master/crawl-ref/source/dat/descript/mutations.txt>.
