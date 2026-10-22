# Intel's Climate Promises, Checked

A data case study: Intel's five public sustainability deadlines (2030, 2040, 2050) set against Intel's own reported figures for 2021–2025, with one plain status per goal.

Live: https://srao189.github.io/intel-sustainability-timeline/

- Every yearly number comes from the performance data table in Intel's [2025-26 Corporate Responsibility Report executive summary](https://csrreportbuilder.intel.com/pdfbuilder/pdfs/CSR-2025-26-Executive-Summary.pdf#page=9). The one computed figure (a 48% rise in emissions, 2023–2025) is labeled on the page.
- Charts are drawn by `script.js` from the data table inside each figure; the tables stay in the page for screen readers and readers without JavaScript.
- The hero wafer (`wafer.js`) is procedural three.js r170, self-hosted and loaded after first paint. It has 100 dies, one per percent of Intel's electricity use, and 99 are lit for the 2025 renewable share. It refuses to render unless it holds exactly 100 dies, and the caption carries the number without WebGL. The renewable electricity section also includes an illustrative cleanroom motion study with reduced-motion pause controls.
- No build step. The font (Archivo, SIL Open Font License) is self-hosted so the strict Content-Security-Policy needs no outside origins.

Preview locally with `python -m http.server 8000` and open http://127.0.0.1:8000/.

This began as a class assignment. The graded version is preserved at the [`submitted-original`](https://github.com/SRao189/intel-sustainability-timeline/tree/submitted-original) tag, together with its `RUBRIC_CHECKLIST.md` and `REFLECTION_QUESTIONS.md`.

Independent student project; not affiliated with or endorsed by Intel.
