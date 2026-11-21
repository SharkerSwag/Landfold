# Landfold iteration reviews

## 0.6.0 · 2026-11-21

Review task: start on the public homepage from a phone, choose a geography question, find the cited evidence, then run the same question and a terrain follow-up with the local Agent.

- The home cover put the only investigation link in the article. The white opening now identifies Landfold as a geography investigation Agent, offers three questions that open with evidence selected, and links directly to the elevation profile. All three questions appear in the initial screen at 320–1920 px. The photographic journal still supports its photo annotations, diagram, folios and notebook.
- The combined question reads the current and comparison lines and the recharge table in one turn. Initial model runs misstated the complementary point range or the exact water shares. The server now formats tool readings directly and the Skill asks the model to interpret the results. Recorded tool output confirms 8 of 55 versus 0 of 45 village samples and a 4% to 78% change.
- Both SRTM profiles were checked against the data service. The default north-to-south profile reads 2124 m at 2.22 km and 415 m of total relief. Tests cover sharing a selected point, restoring each selection from its reply, and an export containing map, water and elevation links.
- **First-time orientation: 4.5 / 5. Evidence use across views: 4 / 5.** The public page can replay a recorded DeepSeek trace with its evidence. Free-form conversation uses the local service. The regional SRTM lines lack matching map coordinates, so a follow-up about the altitude of a mapped village still requires aligned data.

## 0.5.0 · 2026-11-21

Review task: check a village's sample range, switch to a monthly water-source comparison in the same conversation, change the months, and reopen both kinds of evidence.

- The map-only version could cite research about water, but it had no calculation or reproducible selection for a water question. The second view now presents twelve months from Table 2 and compares the selected pair.
- In a live DeepSeek session, the map answer located village samples 37–44. After switching views, the Agent calculated a 74-percentage-point increase for July 2015 versus April 2016 and an 8-percentage-point decrease for November versus December 2015. The replies kept the distinction between estimated shares and recharge volumes.
- Tested at 320–1440 pixels. A copied link restores the month pair, and conversation recall restores the months or map evidence from the corresponding turn. The mixed Markdown export includes the selections, results and original source.
- **Range of investigation: 4 / 5. Evidence reproducibility: 4.5 / 5.** Both experiences cover one field study. Recharge estimates cover one sampling year, and the site still lacks georeferenced elevation for the study map. Live dialogue remains a local feature.

## 0.4.2 · 2026-11-21

Review task: on a phone, locate the eight settlement readings on the map, compare the terrace line, and send someone a link that restores the selected evidence.

- In 0.4.1, a reviewer had to scrub individual points or infer where the count came from. Selecting a count now highlights every matching sample range. The comparison fixture places the settlement on points 37–44 of the 55-point reference line, with zero settlement readings on the 45-point current line.
- The mobile navigation jumps among the map, results, Agent and sources. Early testing found that native jumps overwrote the selection fragment. The revised navigation preserves it. A fresh browser opened the copied link with both lines and the same highlight, and the exported Markdown contained that link.
- The Agent's map checks restore the line and reference from the relevant turn. The sample range calculation is shared by the interface and server tools. Regression checks verify the range in both A-to-B and reverse order.
- **Evidence reproducibility: 4.5 / 5. Mobile interaction: 4 / 5.** The viewer can verify counts without interpreting model wording. The source image's labels remain dense on small screens, and the image coordinates still do not provide aligned elevation.

## 0.4.1 · 2026-11-21

Review task: open the investigation and find the map, selection controls, current results and Agent without searching through the introduction.

- The tinted 0.4.0 layout still read like a long-form article. The white layout moves the map and its controls up, puts results beside the map and keeps study photographs in the evidence section.
- Readability and interaction: **4 / 5**. The hierarchy is clearer on desktop. On mobile, the map and results still require vertical scrolling. The published figure's labels are dense at small sizes.
- Verified white backgrounds and the select, pin, compare, share and export workflow in Chrome at 320–1440 pixels. The local DeepSeek form and the public evidence browser use the same layout.
- A live reply misplaced the settlement toward the beginning of the line. The sampling tool now includes exact ranges for every continuous segment, and the Skill asks for A-to-B sample numbers when a question concerns position. A second live browser run correctly identified settlement points 37–44 and reported zero settlement readings after switching to the terrace line. Both replies preserved the elevation limitation.

## 0.4.0 · 2026-11-21

Review task: use the public page to determine which of two lines sampled a settlement, check why that result cannot establish elevation, and give someone else enough information to reproduce the reading.

| Criterion                                              | 0.3.0 | 0.4.0 |
| ------------------------------------------------------ | ----: | ----: |
| Complete the investigation without configuring a model | 2 / 5 | 4 / 5 |
| Reproduce and inspect the evidence                     | 3 / 5 | 4 / 5 |
| Demonstrate live tool use and follow-up                | 2 / 5 | 4 / 5 |
| Readability and interaction                            | 3 / 5 | 4 / 5 |

These are product review scores. The course rubric is separate.

- The previous chart gave counts without locating individual samples. The reviewer can now move from the sequence to its position on the map, pin a reference, and reopen the same pair of lines from the shared URL. The downloaded comparison includes denominators, the source and the review link.
- The village row reads 0 / 45 for the terrace line and 8 / 55 for the line crossing the settlement. The traces and the paper support the land-use reading. A georeferenced land-use layer aligned to elevation data is still needed to test relative altitude.
- The first live DeepSeek run succeeded on the opening question but exhausted tool rounds on the follow-up. The server now requests specific missing tools and verifies citation IDs against the current turn. A browser run against DeepSeek then completed both questions in one session, used both lines in the second turn, and preserved the limit on claims about altitude.
- The interface uses a cool blue-gray background across the journal and investigation. Review checks cover layout at 320, 390, 768 and 1440 pixels, keyboard selection, sample marker movement, sharing and Markdown export.
- The public page covers one map and one case. Agent dialogue runs locally. Broader evidence coverage and a hosted model endpoint are the largest gaps for outside reviewers.

For subsequent releases, record the review task, previous shortcoming, proof after the change and remaining limitation. Score against what a reviewer can verify in the delivered version.
