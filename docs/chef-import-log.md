# Chef collection import log

Target: approximately 10 recipes per chef, one batch at a time, with user review between batches.

## Batch 001 — Jet Tila

Prepared 2026-09-28. Ten source-checked recipes in `src/data/chefBatch001.js`. The live per-user log in Cookbook is authoritative for imported, kept, and removed status. Record metadata includes batch, canonical source key, source-check date, import date, review date, and removal date. Removed records are retained and can be restored; retries never overwrite them. Preparation text is a concise NightFuel summary; original publisher links remain on every recipe. No publisher photographs are copied.

| Recipe | Course |
| --- | --- |
| Beef and Broccoli | Main Dishes |
| Classic Lo Mein | Main Dishes |
| Kung Pao Prawns | Main Dishes |
| Korean BBQ Short Ribs | Main Dishes |
| Thai BBQ Chicken (Gai Yang) | Main Dishes |
| Thai Green Curry with Chicken and Sweet Potato | Main Dishes |
| Vietnamese Shrimp Spring Rolls | Appetizers |
| Spicy Shrimp and Pork Szechuan Wontons | Appetizers |
| Pineapple Fried Rice | Sides |
| Mapo Tofu | Main Dishes |

Quantity ranges use their lower endpoint and are explained in the notes. Dumpling and roll yields count individual pieces, as labeled. Specialty ingredients are flagged. The fried-rice summary explicitly discloses adding the missing shrimp-cooking step. The chicken summary uses a 165°F/74°C safety endpoint and labels that clarification. No nutrition values or claims that the recipes were kitchen-tested have been added.

## Batch 002 — Michael Symon · Greek

Prepared 2026-09-28. Ten Greek/Greek-inspired selections in `src/data/chefBatch002.js`, all initially needing review. Sources are Food Network UK, Good Morning America, Bon Appétit, and one explicitly credited Mike Vrobel adaptation of Symon's tzatziki. Recipe records retain direct source links. Short preparation overviews direct readers to the complete original methods before cooking. The imported ingredient quantities support grocery-list scaling; meatballs and grape leaves use individual-piece yields, and tzatziki uses one complete batch because its source does not specify portions.

No nutrition estimates or publisher photographs were imported. Specialty ingredients are flagged. NightFuel safety clarifications are distinguished from source instructions. Deterministic IDs and source keys prevent duplicate imports and preserve earlier keep/remove decisions. The cookbook now tracks both batches separately.

## Upcoming batches — not imported

Marcela Valladolid, Jacques Pépin, Tyler Florence, followed by Lidia Bastianich, Maangchi, the Woks of Life family, Rick Bayless, Pati Jinich, Nagi Maehashi, and Nami Chen. Chef order and selections can change after user review. Aim for suitable appetizers, sides, mains and desserts across the collection; do not invent attribution to fill a course quota.
