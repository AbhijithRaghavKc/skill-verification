---
name: Project Artifacts Created
description: All files created across conversations — zip files, MD docs, Python eval scripts, seed endpoint, run.sh, rewritten LaTeX report
type: project
---

Files created/modified across conversations:

**Documentation:**
1. **CONTEXT.md** (project root) — Concise project context with all tables, APIs, pages, folder structure
2. **PROJECT_DOCUMENTATION.md** (project root) — 18-section exhaustive documentation
3. **SKILLCHAIN_COMPLETE_GUIDE.md** (project root) — Technical guide covering frontend, backend, DB, AI, ML, Python eval, how to run (no blockchain)
4. **DETAILED_FLOW_GUIDE.md** (project root) — Deep-dive walkthrough of every flow, every function call, every algorithm step-by-step with worked examples

**Zip files:**
5. **skillchain-core.zip** (~/Desktop/) — First zip, all code except blockchain
6. **abhi.zip** (~/Desktop/) — Latest zip with everything: run.sh, eval scripts, graphs, skill dropdown fix, seed endpoint, all docs. No blockchain code.

**Python Evaluation:**
7. **evaluation/requirements.txt** — Unpinned deps (numpy, pandas, matplotlib, seaborn, scikit-learn, tabulate)
8. **evaluation/ml_matching_evaluation.py** — Ports ML matching to Python, 20 test cases, accuracy/F1/confusion matrix, 6 graphs
9. **evaluation/assessment_evaluation.py** — Ports AI scoring to Python, 500 simulations, tier accuracy, 6 graphs
10. **evaluation/graphs/** — 12 PNG graphs + 2 JSON result files (auto-generated)

**Scripts:**
11. **run.sh** — One-command setup: installs deps, creates venv, runs both evals, pushes DB, seeds skills, starts dev server

**Code fixes:**
12. **src/app/api/skills/seed/route.ts** — GET endpoint that seeds 10 skills (JavaScript, Python, Solidity, React, TypeScript, Node.js, Docker, AWS, Rust, Go)
13. **src/app/assessments/page.tsx** — Fixed: raw "Skill ID" text input replaced with dropdown that fetches skills from DB

**LaTeX Report (rewritten):**
14. **main -doc/text/abstract.tex** — Shortened to 125 words, research-framed, no tech details
15. **main -doc/text/introduction.tex** — Removed lit review from intro, RQ is Section 1.1, contributions have no tech stack
16. **main -doc/text/relatedwork.tex** — Karatas 2018 changed to "early exploration" (not "earliest"), no claim blockchain verification started in 2018
17. **main -doc/text/methodology.tex** — Removed tech stack table, phases described in research terms
18. **main -doc/researchProject.pdf** — Compiled with tectonic, all fixes applied
19. **report/report.html + SkillChain_Report.pdf** — Earlier HTML/weasyprint version (superseded by LaTeX)

**Why:** User (Tarun) is helping Abhijith with the MSc project. Artifacts serve submission, demo, and documentation purposes.

**How to apply:** Don't recreate existing files. abhi.zip is the latest deliverable zip. LaTeX report is the latest academic document.
