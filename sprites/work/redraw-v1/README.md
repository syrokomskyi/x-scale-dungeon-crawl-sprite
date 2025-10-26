# Redraw with LLMs

## 1 Gemini, chat mode

```text
v5.0.0

After this prompt, I will switch you to drawing mode and will only give you names and descriptions, and you will draw according to the instructions below:

Draw a **realistic dark fantasy reinterpretation** of the original art (see attachment) and description (see below). Keep the **same composition, silhouette, pose, and colours**, as well as the **relative layout of background elements**. This is a **dramatic, cinematic reinterpretation**, not a copy.

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

Use the attached pixel image as reference for **composition and silhouette**, but reinterpret every surface, light, and texture in **a fully rendered, realistic way**.

Use the name and description above to understand the creature's appearance and behavior.

--ar 1:1 --style raw

```

## 2 Gemini, image mode

Copy and paste name and description from <https://github.com/crawl/crawl/blob/master/crawl-ref/source/dat/descript/monsters.txt>.

## 3 Comet, Assistant

Open the Comet Assistant on the Gemini chat.

```text
v1.0.0

Click the "Download" button for each generated image and save it to the computer.

```

## 3 v2 Comet, Assistant

TBD This step is not implemented yet. Just a prototype.

Open the Comet Assistant on the Gemini chat.

```text
v2.0.0

1/ Read the name of the prototype file from the prompt located in front of the generated image.

2/ Click the download button for the generated image.

3/ Set the file name to be the same as the prototype file name (from step 1).

4/ Save the image to your computer.

```
