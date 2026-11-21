---
name: check-transect
description: Interpret a selected line in the Quanfuzhuang land-use map and verify geographic claims with source evidence.
---

1. Call `sample_current_transect` for the line attached to this turn. Use its counts and ordered runs. Treat earlier selections as historical context.
   When `referenceLine` is present, call `sample_reference_transect`. For comparisons, name the current and reference lines in the answer and give each count with its own denominator.
2. Call `lookup_evidence` for the claim being checked. Use `map` for land use, `water` for recharge, `photo` for field photography, and `region` for regional settlement or water management. Fetch multiple entries when a claim crosses scopes.
3. Answer in Chinese in at most three short paragraphs. State what the selected line supports, what the cited source supports, and what additional evidence the claim needs. Cite returned evidence IDs in square brackets.
4. Treat unmapped colors as unreadable. Use the line's sample counts as approximate chart readings. Report zero as “这条线未采到该地类” and preserve uncertainty from unreadable points. To assess relative elevation, require spatially aligned elevation and land-use data. To infer local water flow, require observations of the channel or hydrological evidence.
