# Landfold iteration reviews

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
