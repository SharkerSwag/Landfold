# Landfold · 地景志

**An interactive geography journal exploring the connections between land, water, and people through photography and visual storytelling.**

山水之间，生活有迹。循着地景的纹理，读懂一片土地。

[Visit Landfold](https://sharkerswag.github.io/Landfold/) · [Photography & sources](THIRD_PARTY_NOTICES.md) · [Design direction](DESIGN.md)

![Landfold photographic cover](docs/assets/share-preview.png)

Landfold 通过真实风景摄影、可点击的观察点与有来源的解释，呈现地理景观与人地关系。第一期从云南元阳的梯田开始：田埂的纹理、水面的光、林与田的边界，以及人留在山地中的痕迹。

## Current experience

- Click photographic observation points to explore four geographical themes.
- Read the accompanying explanations and their regional sources.
- View each photograph in full, with photographer credit and license information.
- Keep observations in a session-only notebook.
- Share a direct link to a selected observation through URL fragments.
- Use the same experience on desktop and mobile.

This initial release is a static, interactive reading experience. A live conversational Agent is not connected yet. Future model calls will require a separate backend; model API keys must never be shipped to this public site.

## Local development

No dependencies or build step are required. With Node.js 20 or later:

```sh
npm run dev
```

Open **http://127.0.0.1:4180/Landfold/**. The local server uses the same project path as GitHub Pages so relative assets and module imports can be checked before publication.

## GitHub Pages

This is an independent project site backed by **SharkerSwag/Landfold**. It does not require changing a personal homepage repository.

Publication source:

- Branch: `main`
- Folder: `/docs`
- URL: **https://sharkerswag.github.io/Landfold/**

Pushes to `main` update the published site after GitHub Pages finishes its deployment. `docs/.nojekyll` keeps this a plain static site.

## Project layout

```text
docs/                   Public website and static assets
  app.js                Observation, reader, notebook and photo interactions
  content.js            Curated geography and photography metadata
  styles.css            Photographic cover and responsive reading layouts
scripts/serve.mjs       Local preview server
THIRD_PARTY_NOTICES.md   Photographer credits, sources and licenses
DESIGN.md               Selected direction and design archive
```

## Content and photography

The photographs are authentic, attributed images from Wikimedia Commons. Original files are retained unchanged; layout crops and interactive annotations are separate webpage elements. The photographers' original licensing terms continue to apply. Details are in [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).

Photographic observations are distinguished from regional explanations. Regional context is based on the UNESCO World Heritage Centre's [Cultural Landscape of Honghe Hani Rice Terraces](https://whc.unesco.org/en/list/1111/). The site does not present inferred water routes, unidentified villages or invented elevations as measured data.

No open-source license has been selected for the project code yet. Third-party photographic licenses are explicitly documented and are not replaced by the code's licensing status.
