# Philippines 2030 · Three Futures (review draft)

This branch reframes the original single-path crisis narrative into **one shared 2026–2029 story and three conditional 2030–2032 outcomes**. The original long-form story is preserved in [crisis.html](crisis.html), not deleted. The original [Research.html](Research.html) and its charts remain available and are **not** claimed to have been independently validated.

## Editorial framing

The central question is not "will AI make the Philippines poorer?" It is **who owns, captures, and distributes the value of AI-enabled productivity** in a labor-export development model. The same technology can create genuine domestic welfare improvements while lowering demand for particular jobs.

- **A · Managed transition:** meaningful adaptation, credible placement-based worker support, retention of some local value, and relative stability.
- **B · Divided economy (default):** firms and high-skill workers benefit while many middle-income households earn less or have less predictable income. This is the central editorial lens, **not a calibrated modal forecast**.
- **C · Structural crisis:** faster displacement coincides with external income, energy/import or credit shocks and poor state response. The detailed original crisis narrative is available separately.

## Source vs assumption vs fiction

| Layer | What belongs here | Treatment |
|---|---|---|
| Observed | Actual BPO employment/revenue, remittances, exports, prices, reserves, government figures | Trace to dated primary sources; recheck before publication. |
| Projected | Automation adoption, replacement jobs, demand response, domestic value capture, currency and debt stress | Publish assumptions, calculations, ranges and sensitivities. |
| Fictional | Maria, Benjie, Lira, Celina, speeches, corporate decisions, dates, future crisis events | Illustrations only; not documentary evidence. |

The BPO 2030 employment numbers **1.71M / 1.42M / 1.15M** are carried over from the current dossier to permit comparison. They are **conditional illustrations** rather than new estimates.

The existing **13% / 66% / 21%** weights come from author-specified Monte Carlo inputs in the original research (8,000 simulated samples): triangular displacement and policy-absorption distributions and a Bernoulli AGI-cascade term. These weights are not yet calibrated to realized BPO data, and a BPO-specific probability does *not* imply the probability of a wider financial crisis with multiple added events. They are intentionally **not printed as probabilities on the redesigned landing page**.

## Before publishing as a research forecast

1. Correct the claim that $59B revenue, 2.5M jobs and rising revenue-per-employee are arithmetically incompatible. Together they imply $23,600 per worker, versus ~$21,053 for $40B / 1.9M; the more defensible challenge is pricing, adoption and labor demand, not algebraic impossibility.
2. Distinguish **AI-only unit costs** from **fully loaded per-resolved-contact costs** that include escalations, software, supervision, quality assurance and exceptions.
3. Audit the indirect-employment multiplier: the original narrative includes 2.5 jobs supported per BPO job, whereas the dossier's displacement calculation uses 0.8 indirect jobs per job lost. These are not interchangeable. Apply attribution and lag.
4. Stress-test robotics separately. Cheap, reliable general-purpose household humanoids by 2029 are a *tail assumption*, not required for weaker Gulf remittances. Other plausible mechanisms include wage pressure, shorter contracts, dispatch automation, oil-price cycles and host-country policy.
5. Model depreciation symmetrically: import-price pass-through and FX-denominated debt can be damaging; peso depreciation can *also* improve peso-cost export competitiveness and remittance purchasing power.
6. Include positive productivity, domestically retained profits, investment, taxes, wage substitution and new occupations. Revenue, GDP, profit, worker count, wages and welfare are different variables.
7. For each path, explicitly condition **external shock severity, fiscal response, worker absorption, policy execution, financial feedback**; do not simply label macro paths according to a sampled BPO employment threshold.
8. Recheck future-dated and attributed claims in the original dossier before presenting any of them as observed facts.
9. Clarify that narrative specificity (exact future timestamps, FX closes, election results) illustrates causal chains but is **not** model precision.
10. Ensure the three paths maintain year-by-year family finances and legal/government mechanics if extending them beyond this editorial prototype.

## Suggested next data model

```
AI capability and commercial readiness
  -> adoption by task and contract renewal date
  -> direct job destruction, job creation, and hours/wage changes
  -> local productivity gains and foreign vs domestic ownership
  -> household disposable income and consumption
  -> exports/imports/remittances/capital flows -> currency and fiscal constraints
  -> credit and real-estate feedback
  -> policy response and re-employment effectiveness
```

Input dependencies should be modelled explicitly: capability growth can affect both software and hardware deployment, but commercialization lags differ. Currency valuation, external macro shocks, and domestic politics are not determined by the date of AGI.

## Technical review checklist

- `index.html`: new responsive, long-form narrative with a shared 2026–2029 arc and three full 2030–2032 arcs.
- `three-futures.css`: standalone styles layered on original palette/type system.
- `three-futures.js`: accessible tab state, keyboard arrows/Home/End, URL hash deep links (`#path-managed`, `#path-accelerated`, `#path-crisis`), and shareable path URL.
- `crisis.html`: prior index story preserved, with a contextual editorial note.
- `Research.html`: original research kept intact except navigation and a contextual link/note to the new narrative.
- `SCENARIO_NOTES.md`: this review checklist and methodological limitations.

Test mobile widths, keyboard access and color contrast, page-to-page navigation, path hashes and GitHub Pages base-path deployment. There is no build pipeline; site is static HTML/CSS/JS.

**Editorial status:** This is a substantial narrative prototype intended for review, not a finalized econometric study or publication-ready data audit.
