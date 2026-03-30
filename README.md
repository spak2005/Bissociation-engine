# Bisociation Engine

**Engineering creativity through cross-domain pattern matching.**


https://github.com/user-attachments/assets/e6a3190d-533f-4bd0-af10-53cbe9ce6da7
![demo](https://github.com/user-attachments/assets/feb36b0b-1d77-4401-8c72-8d3f82242e96)


![Demo](./demo.gif)

## The idea

Can AI be creative? If creativity is the collision of patterns across unrelated domains, then yes -- and it can be engineered. Arthur Koestler called this *bisociation*: the moment two previously unconnected frames of reference intersect and produce something neither could alone. Every major scientific breakthrough follows this shape. Penicillin, Velcro, CRISPR -- accidents where knowledge from one field crashed into another.

This engine mechanizes that collision. It takes a drug and a disease, decomposes each into a graph of real biomedical properties -- mechanisms, protein targets, pathways, genes -- and then systematically connects every property of the drug to every property of the disease. At each intersection, an LLM generates a novel repurposing hypothesis grounded in actual biology. The result is a combinatorial search over the space between two domains, surfacing connections a human researcher might take years to notice.

Drug repurposing is the first application, but the architecture is domain-agnostic. Swap the data sources and you can bisociate across materials science, synthetic chemistry, or any field with structured knowledge. Connect it to an automated testing pipeline -- generate hypotheses, run the strong ones through wet-lab or simulation, feed results back -- and you have a system that doesn't just suggest. It discovers. That closed loop is what real knowledge-creating AI looks like.

## How it works

1. Enter a **drug name** and a **disease name**
2. The app fetches real biomedical data from [PubChem](https://pubchem.ncbi.nlm.nih.gov/) (mechanisms, targets, pharmacology). Optionally, [DisGeNET](https://www.disgenet.org/) gene-disease associations ground the disease side
3. An LLM decomposes both into structured graph nodes -- each a real biological entity
4. Two interactive 3D force-directed graphs render side by side. Click either to expand full-screen
5. Trigger **bisociation** -- every drug node connects to every disease node
6. Parallel LLM calls generate a hypothesis at each intersection, scored 1--10 by confidence
7. Links illuminate in real time: **green** (strong), **yellow** (speculative), **red** (weak)
8. Click any connection to inspect the full hypothesis

## Tech stack

- React 19 (Vite)
- react-force-graph-3d + Three.js (WebGL)
- Tailwind CSS v4
- OpenAI API (gpt-4o-mini)
- PubChem PUG REST / PUG View API
- DisGeNET REST API (optional, for grounded disease decomposition)

## Getting started

```bash
git clone <repo-url>
cd bissociation_engine
npm install
```

Create a `.env` file:

```
VITE_OPENAI_API_KEY=sk-your-key-here
```

Run the dev server:

```bash
npm run dev
```

**DisGeNET (optional):** On the input screen, toggle to "DisGeNET + LLM" and enter your API key (free at [disgenet.org](https://www.disgenet.org/)). The key is stored in localStorage. When enabled, gene-disease associations are fetched and injected into the LLM prompt so disease nodes are grounded in real association data rather than model priors alone.

## Project structure

```
src/
├── api/
│   ├── llm.js            # LLM decomposition + batched hypothesis generation
│   ├── pubchem.js         # PubChem name -> CID and compound view fetch
│   ├── parsePubChem.js    # PUG View section tree parser
│   └── disgenet.js        # DisGeNET gene-disease association fetch
├── components/
│   ├── BioGraph.jsx       # 3D force graph with glowing nodes
│   ├── SplitView.jsx      # Side-by-side drug/disease graphs
│   ├── MergedView.jsx     # Combined graph + hypothesis generation
│   ├── HypothesisModal.jsx
│   ├── GraphContextLabels.jsx
│   ├── AmbientMeshBackground.jsx
│   └── AnalysisLoadingOverlay.jsx
├── utils/
│   └── buildGraphData.js  # Graph data builders (single + merged)
├── App.jsx                # Screen routing and pipeline orchestration
└── main.jsx
```

## Beyond drug repurposing

This engine is a proof of concept for a general principle: structured cross-domain search, powered by LLMs, over real data. Replace PubChem with a materials database, or DisGeNET with a pathway atlas, and the same decompose-connect-hypothesize loop applies. Pair it with automated experimental validation and you close the loop entirely -- AI that generates hypotheses, tests them, and refines its model. That is the direction this points toward.

## License

MIT
