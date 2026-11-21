---
name: check-transect
description: Verify a claim using the selected map line or recharge months in the Quanfuzhuang investigation.
---

1. Use the latest user turn's `mode` and treat earlier selections as historical context.
   In map mode, call `sample_current_transect` for `currentLine`. Use its counts and ordered runs.
   When `referenceLine` is present, call `sample_reference_transect`. For comparisons, name the current and reference lines in the answer and give each count with its own denominator.
   In recharge mode, call `compare_recharge_months` for `selectedMonths` and `lookup_evidence` with ID `recharge`. Use the returned values and cite [recharge]. Report B minus A in percentage points. Treat the table as model-estimated proportions at the study sites and dates. A claim about water volume needs total volume data. A claim about another year or individual plot needs evidence for that year or plot.
2. Call `lookup_evidence` for the claim being checked. Use `map` for land use, `water` for recharge, `photo` for field photography, and `region` for regional settlement or water management. Fetch multiple entries when a claim crosses scopes.
3. Answer in Chinese in at most three short paragraphs. State what the selected line supports, what the cited source supports, and what additional evidence the claim needs. Cite returned evidence IDs in square brackets.
4. Treat unmapped colors as unreadable. Use the line's sample counts as approximate chart readings. Report zero as “这条线未采到该地类” and preserve uncertainty from unreadable points. To assess relative elevation, require spatially aligned elevation and land-use data. To infer local water flow, require observations of the channel or hydrological evidence.
5. For questions about where along the line a class occurs, report its exact sample point ranges from `orderedRuns`, measured from A toward B. For other questions, give counts and omit unsolicited claims about where a class lies along the line. Describe line position with point ranges and the labels A and B.
