# Chef collection import log

Target: 10 recipes per chef in labeled batches. On 2026-09-28 the user authorized continuing across chefs without waiting for review between batches. New records remain Needs review; existing keep/remove choices are preserved.

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

## Collections 003–012 — prepared 2026-09-28

Each collection contains ten entries, for 100 new recipes. Corresponding `src/data/chefBatchNNN.js` files are the source manifest; each record includes a direct source URL and canonical import key. The live per-user batch log is authoritative for review status.

| Batch | Chef / authors | Count |
| --- | --- | --- |
| 003 | Marcela Valladolid | 10 |
| 004 | Jacques Pépin | 10 |
| 005 | Tyler Florence | 10 |
| 006 | Lidia Bastianich | 10 |
| 007 | Maangchi | 10 |
| 008 | The Woks of Life family | 10 |
| 009 | Rick Bayless | 10 |
| 010 | Pati Jinich | 10 |
| 011 | Nagi Maehashi | 10 |
| 012 | Nami Chen | 10 |

Ingredients and yields were checked against public chef/publisher recipes. Preparation text is a short original NightFuel overview, not a reproduction of the full publisher method. Source links remain necessary before cooking. No publisher photos or nutrition estimates are included. Source quantity ranges use an explained endpoint, and cup/piece/batch yields are explicitly labeled. Where the source does not state portions, the record uses one complete batch rather than inventing a serving count. Optional substitutions or simplifications are disclosed in notes. All 120 source keys are unique, and import retries skip both existing and removed entries.

## Batch 013 — Leah Cohen · Asian recipes

Prepared 2026-09-28 at the user's request for Leah's Asian recipes. Ten records in `src/data/chefBatch013.js`: Chicken Pad See Ew, Beef Ka Prow with Basil, Chicken Adobo, Pancit Bihon with Chicken, Ukoy Shrimp and Sweet Potato Fritters, Red Snapper Sinigang, Vinegar-Braised Greens, Filipino Barbecue Chicken Skewers, Philippine Seafood Paella, and Philippine Fruit Salad. Two Thai and eight Filipino recipes, all initially Needs review.

Sources: Cohen's Feedfeed recipe, her GMA appearances, and Saveur recipes credited to her. Published substitutions are identified; uncertain serving counts use one batch. Notes flag specialty groceries, duplicate source salt in ukoy, and the inconsistent pineapple weight in the fruit salad. The skewer overview discards used marinade instead of reusing it for basting, and the noodle overview clarifies cooking the returned chicken fully. Summaries direct cooks to the original method. No photos or nutrition estimates imported. The complete registry now has 130 distinct source keys; imports preserve review decisions.

## Batches 014–016 — Jet Tila expansion

Prepared September 29, 2026. Thirty additional recipes, ten per batch, all initially Needs review. Source manifests are `chefBatch014.js`, `chefBatch015.js`, and `chefBatch016.js`. Every entry retains its source URL, cuisine, grocery quantities and a short original preparation overview. The registry has 160 distinct recipe sources, including 40 Jet Tila entries; live review history remains authoritative.

Sources: [Lee Kum Kee’s Jet Tila collection](https://usa.lkk.com/en/recipes?tag=jet-tila), Food Network UK, Jet’s Hallmark Home & Family appearances, Good Morning America, and WeightWatchers. LKK collection membership supplies attribution where individual pages have no byline. Existing dishes were compared by name as well as URL; alternate Beef and Broccoli, Pineapple Fried Rice and Korean BBQ Short Ribs pages were excluded. Original kept/removed choices are preserved.

| Batch | Recipes |
| --- | --- |
| 014 | Shrimp Drunken Noodles; Sriracha Honey Chicken Legs; Hoisin Mustard Pork Chops; Nasi Goreng; Pineapple Hoisin Sliders; Crab Rangoon Dip; Sweet and Spicy Wings; Vegetable Stir-Fry; Honey Sriracha Carrot Fries; Chiu Chow Avocado Toast |
| 015 | Hoisin Shrimp and Broccoli; Spicy Tangerine Beef; Hoisin Salmon with Egg Fried Rice; Beef Chow Fun; Chicken Pad See Ew; Yellowtail Sashimi; Spicy Basil Beef; Pork and Pâté Banh Mi; Lumpia; Vegan Drunken Noodles |
| 016 | Korean Short Rib Tacos; Quick Beef Pho; Vegan Pad Thai; Cauliflower Fried Rice; Chicken Satay; Honey Mint Fruit Salad; Sausage Vegetable Fusilli; Miso Black Cod and Apple Salad; Chicken Parmesan; Panang Chicken Curry |

Quantity ranges use the explained lower endpoint. Unspecified yields are one batch; lumpia and satay use rolls/skewers. Published portion inconsistencies in chicken legs and salmon are disclosed. UK basil, noodle and sugar conversions were cross-checked against the US originals; their household-volume measures are used. NightFuel clarifications cover the omitted chicken step in Pad See Ew, cooking endpoints, and discarding used pork marinade. Chicken Parmesan uses a disclosed prepared-sauce shortcut. Specialty ingredients and raw-fish preparation are identified. No nutrition estimates, photos, or kitchen-testing claims are added.

Held for source clarification: LKK California Roll (salt and rice-yield inconsistencies); Hallmark Street Style Pork Basil Krapow (missing sauce units); Hallmark BBQ Pork Lo Mein (missing noodle-sauce amount). Cookbook-only, inaccessible and duplicate sources were not guessed. This is a researched collection, not a claim to exhaust every Jet Tila recipe online.

## Batch 017 — Rick Bayless · Mexican foundations

Prepared September 29, 2026 after the user requested foundational coverage for every cuisine, starting with Mexican, then Italian and Greek. Ten gap-filling recipes in `chefBatch017.js`: Enchiladas Rojas, Enchiladas Verdes, Roasted Salsa Verde, Red Chile Adobo Sauce, Pico de Gallo, Lime-Pickled Red Onions, Home-Style Carnitas, Tortilla Soup, Chilaquiles Rojos and Flour Tortillas. All sourced directly from Rick Bayless’s website and initially Needs review. Existing rice, beans, guacamole, tinga and roasted tomato salsa are not duplicated.

Adds a Sauces & Condiments course to recipe editing and filtering. Four new records use it. Unspecified source yields use one batch; salsa uses cups, and tortillas/enchiladas/tacos use piece yields. Notes identify chosen published alternatives, lower quantity ranges and the supplied 400°F oven setting absent from the written red-enchilada source. Adobo is explicitly identified as a finished warm sauce, not interchangeable with the enchilada sauce or a marinade concentrate. Condensed original overviews link to the complete published methods. No photos, nutrition estimates, existing review-state changes or security changes are included. Registry total: 170 unique sources.

## Batch 018 — Giada De Laurentiis — Italian foundations
Ten additions: marinara, basil pesto, simple Bolognese with pasta, chicken cacciatore, winter minestrone, classic eggplant Parmesan, shortcut focaccia Barese, basic Parmesan risotto, tomato-mozzarella bruschetta, classic tiramisu. Sources checked September 30, 2026: nine Giadzy recipes and Giada's Everyday Italian risotto published by Epicurious. Food Network was searched for discovery; these import source links point to the editions actually used.

All start Needs review. Live pre-import audit found 170 records, twelve Italian entries, and none of these ten dishes. Preserve existing review decisions. Sauce-only marinara and minestrone use batch yields where their pages omit portions; bruschetta counts toasts. Focaccia explicitly uses purchased pizza dough; simple Bolognese is labeled as Giada's simplified version. Eggplant source labels itself Member Exclusive. Tiramisu uses pasteurized yolks as an explicit NightFuel safety substitution. No photos or nutrition estimates imported.

Registry total: 180, including removed recipes; not an active cookbook count.

## Batches 019–023 — Fifty additional recipes

Prepared September 30, 2026. Each batch has ten entries, all initially Needs review, with measured ingredients, condensed original cooking directions and the published source link. The user approved Greek specialists and added Sánchez, Zakarian and Brown as options while sourcing. This is not a FoodNetwork.com-only collection.

| Batch | Collection |
| --- | --- |
| 019 | Giada/Giadzy: pizza dough, potato gnocchi, eggless pasta, caprese, polenta, fettuccine al burro, bean dip, panna cotta, lemon ricotta cookies, puttanesca |
| 020 | Michael Chiarello: grilled tomato sauce, roasted strawberries, broccoli gratin, frico, ricotta pesto, balsamic steak sauce, fresh tomato olive sauce, salsa verde, asparagus bundles, roasted-lemon chicken |
| 021 | Jet Tila (6): long-life noodles, beef khao soi, nabeyaki udon, California fried rice, steamed rockfish, sausage/chestnut rice. Alton Brown (4): slaw, sushi rice, sesame peanut sprouts, miso squid |
| 022 | Michael Symon (3): spanakopita, salmon with lemon-egg sauce, feta eggs. Michael Psilakis (2): pepper-feta spread, tomato/bean/artichoke salad. Diane Kochilas (5): spanakorizo, skordalia, lentil-chard soup, briam, fasolada |
| 023 | Aarón Sánchez (7): guacamole, birria, hominy, chorizo, street corn, carne asada, tomato-arbol salsa. Geoffrey Zakarian (3): corn soup, lamb with herb sauce, chicken skewers |

Two Giadzy team recipes are credited to Giadzy rather than individually to Giada. Unspecified yields use batch/piece units; published ranges and clarifications are disclosed. The chorizo entry is explicitly the standalone component of its linked beans recipe. Prepared dressing, dashi and serving salsa are identified. Specialty ingredients remain named; no substitutions are silently presented as chef originals. Street-style pork krapow and Zakarian's incomplete tapenade meal were excluded for source gaps.

No existing reviews or photos are changed. No nutrition or kitchen-testing claims. Registry now contains 230 unique source entries; the live database remains authoritative for review choices.
