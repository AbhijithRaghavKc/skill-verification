---
name: LaTeX Report Setup
description: Report is in main -doc/ directory, uses NCI template with tectonic compiler, dcu bibliography style
type: reference
---

The LaTeX research report lives at: `main -doc/`

**Structure:**
- `researchProject.tex` — Main file, includes titlepage + text/*.tex files
- `titlepage.tex` — NCI-branded title page with tikz border
- `text/abstract.tex` — Abstract
- `text/introduction.tex` — Section 1
- `text/relatedwork.tex` — Section 2
- `text/methodology.tex` — Section 3
- `text/implementation.tex` — Section 4 (not yet written)
- `text/evaluation.tex` — Section 5 (not yet written)
- `text/conclusion.tex` — Section 6 (not yet written)
- `text/declaration.tex` — NCI declaration page
- `refs.bib` — BibTeX references (25 entries, Harvard/dcu style)
- `figures/` — Images directory
- `logos/` — NCI logo

**Compilation:**
```bash
cd "main -doc" && tectonic researchProject.tex
```
Uses tectonic (auto-handles bibtex + multiple passes). Output: `researchProject.pdf`

**Style:** Harvard referencing (dcu), natbib package, \citet and \citep commands.
