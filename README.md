# Clickscape — Idle Adventure

A phone-first idle clicker inspired by classic MMO skilling. Tap to mine, smelt, smith, chop, burn, fish, cook, farm, dig and fight — then hire workers who keep going while the app is closed.

Installs to your home screen as an app (PWA) and works offline.

## Put it on GitHub Pages (free)

1. Create a new **public** repository on GitHub, e.g. `clickscape`.
2. Upload **every file in this folder** to the root of the repo (keep the `icons` folder as a folder).
   - On a computer: drag the files into the repo page → **Commit changes**.
   - On a phone: in the repo tap **Add file → Upload files** (unzip first in your Files app).
3. Go to **Settings → Pages**. Under *Build and deployment* choose **Deploy from a branch**, branch **main**, folder **/ (root)**, then **Save**.
4. After a minute your game is live at `https://YOUR-USERNAME.github.io/clickscape/`.

## Install it on your phone

- **iPhone (Safari):** open the link → Share button → **Add to Home Screen**.
- **Android (Chrome):** open the link → menu ⋮ → **Install app** (or use the button in the game's *More* tab).

## Updating the game

Change any file, then open `sw.js` and bump `VERSION` (e.g. `clickscape-v2`) so installed phones fetch the new version.

Your save lives on the device. Use **More → Export save** to back it up or move it to another phone.

## What's in it

| Feature | Details |
|---|---|
| 12 skills | Attack, Strength, Defence, Hitpoints, Mining, Smithing, Woodcutting, Firemaking, Fishing, Cooking, Farming, Archaeology — levels 1–99 using the classic XP curve |
| Mining → Furnace → Anvil | Copper/tin → bronze, iron, steel (iron + 2 coal), mithril, adamant, rune bars, plus silver & gold. Each metal forges daggers, scimitars, pickaxes, hatchets, full helms, kiteshields, platelegs and platebodies at the right level |
| Tools matter | Better pickaxes, hatchets, rods and mattocks multiply gathering speed |
| Workers | Hire Dwarf Miners, Lumberjacks, Cooks… costs scale ×1.17 each (Cookie Clicker / AdVenture Capitalist style). They earn 35% XP — tapping earns full XP |
| Offline progress | Up to 8h (24h with the Feather Bed upgrade), with a "Welcome back" summary |
| Combat | 13 monsters from Chicken to the Elder Wyrm boss, accuracy/max-hit formulas, combat styles, auto-eat, hitsplats, rare drops (dragon gear, Shadow whip) |
| Farming | Real-time crop patches, buy more land, ashes as compost, auto-gardener upgrade |
| Archaeology | Dig sites with artifact sets — donate to the Museum for permanent buffs |
| Upgrades | 100+ unlockable multipliers, some costing items (e.g. 50 gold bars for a Gilded Pickaxe Handle) |
| Random events | A wandering 🧞 appears every few minutes — tap it for a ×7 frenzy, XP lamp, coins or a mystery box |
| Pets | Ultra-rare skilling pets that boost their skill |
| Ascension | Prestige reset for Ancient Runes (+5% production each) |
| Slayer | 5 masters (Turael → Duradel), tasks, streak points, Slayer shop (helmet, superiors, boss tasks, autopilot), 20 Slayer monsters with level & kit requirements |
| Prayer | Offer bones at the altar; prayer boosts up to Piety and Protect from Melee |
| God Wars | Kill count, four generals, Bandos/Armadyl armour, godswords from shards + hilts, Nex and Torva |
| Bosses | Dagannoth Rex, Kraken, Cerberus, Alchemical Hydra, Corporeal Beast, TzTok-Jad (fire cape), TzKal-Zuk (infernal cape) |
| Gear | 10 equipment slots, special attacks, 2-handers, jewellery from the furnace, skillcapes & max cape, combine recipes (infernal tools, tentacle, spirit shields…) |

| v3 skills | Herblore (potions + auto-drink setup), Crafting (gems, jewellery, d'hide, mystic), Fletching (bows, arrows), Thieving, Agility (timing runs, graceful), Ranged & Magic combat |
| v3 systems | Skill guides, message feed, bank search & locks, sounds, Barrows, clue scrolls, collection log, achievements, daily/weekly challenges, shooting stars, seasonal events, loadouts & character view, Grand Exchange, drop tables |
| Levels | Combat skills & Prayer cap at 99; every other skill goes to 120, with primal-tier and post-99 content |

| v4 ascension | Rising total-level cost, essence perk shop (head start, veteran levels, keep workers/tools/gear, XP, luck, offline, damage), ascension loot (capes, ring, cape, crown, pet), level caps +3 per ascension (up to 129/150), the 🌌 Rift with ascension-gated monsters |
| v4 content | Metal dragons, Cyclops defenders, KBD, Kalphite Queen, Giant Mole, Chaos Elemental, Sarachnis, Vorkath, Zulrah, Chambers of Xeric raid (twisted bow etc.), prayer scrolls, master clues, bigger clue & casket loot, Voidforged tier, Celestial weapons, 125–145 skilling unlocks |
| v4.3 | Loot screen for boxes & clues, combat academy (paid auto-training), clue step swap/destroy, grouped bank, Ranged & Magic shop tabs, Halloween monsters/boosts/goodies, seasonal items kept through ascension |
| v4.4 combat | Fight analysis strip (DPS, time-to-kill, damage taken, food timer, risk + tips), Setup / Monsters / Stats tabs, style comparison |
| v5.0 skills | Runecrafting (runes power up spells), Construction (sawmill, furniture, planks for house rooms), Hunter (implings, chinchompas, moths) |
| v5.0 content | Wintertodt, Tempoross, Zalcano & Mahogany Homes with skilling outfits; Wilderness (revenants, Callisto, Venenatis, Vet'ion, Scorpia, 10% coin loss on death); Theatre of Blood; Grotesque Guardians, Abyssal Sire, Thermy; Slayer block list & longer tasks; Christmas event monsters |
| v5.0 systems | 17 quests, 20 diary tiers (permanent bonuses), skill mastery past max level, XP tracker, bulk hire, save files, message filters, compact mode, interactive random events, daily login streak, titles |
| v5.1 | GE buy/sell any amount, shop cleanup (no Slayer kit, boss drops or high tools), level-banded monster loot + rare drop table + tool drops, tool finds while skilling, auto-sell loot filter, skill milestones, buy-missing-inputs bar, livestock farming (feathers, hides, newts, silk, dragonhide) |
| v5.3 | Prayer points & protection prayers (prayer potions), Pest Control + Void armour, Tombs of Amascut with raid levels, boss kill-count mastery, harder ascensions (scale with skill count, XP slows each ascension), ✴️ Transcendence (super-reset after 10 ascensions → divine shards → Pantheon perks), pet collection bonus, GitHub Gist cloud save |
| v6.0 loop | 🔮 Run relics (pick 1 of 3 per tier each ascension), 🏁 ascension challenges incl. Ironman (permanent rewards), ✴️ Echo bosses after Transcending (echo shards → divine shards), Fight Caves & Inferno runs, Gauntlet & Corrupted Gauntlet, The Nightmare, Barbarian Assault, Giants' Foundry & Guardians of the Rift outfits, 5 more quests, getting-started tutorial |
| v4 coin sinks | Player house (12 rooms), wishing well blessings, infinite guild investments |

All balance numbers live in `data.js`, `data3.js` and `data4.js` — tweak away.

*Fan-made project. Not affiliated with or endorsed by any game company.*
