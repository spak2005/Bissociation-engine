# Bisociation Engine

A web app that discovers drug-repurposing hypotheses by cross-connecting the molecular properties of a drug with the biological mechanisms of a disease using AI.

Enter a drug and a disease. The app decomposes each into a graph of real biomedical entities — mechanisms, protein targets, pathways, genes — then connects every drug node to every disease node and generates a novel repurposing hypothesis at each intersection.

## How it works

1. **Input** — Enter a drug name and disease name.
2. **Data fetch** — Drug data is pulled from the [PubChem](https://pubchem.ncbi.nlm.nih.gov/) PUG REST / PUG View APIs (mechanisms, targets, pharmacology).
3. **Decomposition** — An LLM (gpt-4o-mini) structures both drug and disease into graph nodes grounded in real biology.
4. **Split view** — Two interactive 3D force-directed graphs render side-by-side. Click either to expand full-screen.
5. **Merge** — Both graphs combine into one. Cross-links connect every drug node to every disease node.
6. **Hypothesis generation** — Batched LLM calls generate a repurposing hypothesis for each cross-link. Links illuminate in real-time: green (strong), yellow (speculative), red (weak). Click any link to inspect the full hypothesis.

## Tech stack

- React (Vite)
- react-force-graph-3d + Three.js
- Tailwind CSS v4
- OpenAI API (gpt-4o-mini)
- PubChem PUG REST API

## Setup

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

## Project structure

```
src/
├── api/
│   ├── llm.js            # LLM decomposition + batched hypothesis generation
│   ├── pubchem.js         # PubChem name→CID and compound view fetch
│   └── parsePubChem.js    # PUG View section tree parser
├── components/
│   ├── BioGraph.jsx       # 3D force graph with glowing nodes
│   ├── SplitView.jsx      # Side-by-side drug/disease graphs
│   ├── MergedView.jsx     # Combined graph + hypothesis generation
│   └── HypothesisModal.jsx
├── utils/
│   └── buildGraphData.js  # Graph data builders (single + merged)
└── App.jsx                # Screen routing and pipeline orchestration
```

## License

MIT
