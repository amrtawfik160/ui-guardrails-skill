# Triage general design skills

General design skills are written for any product. On a product that already has a design system, some help and some set a new look. Give every design skill from the diagnosis one verdict.

## Verdicts

| Verdict | The skill | Examples of what it does |
|---|---|---|
| **Keep** | Improves work inside any system and sets no look | Accessibility, worst-case and edge-case data, interface copy, motion mechanics (curves, durations, interruption), animation performance, UX review of a running flow |
| **Keep for named jobs** | Reviews or polishes, and judges against its own taste unless told otherwise | Critique, audit, polish and "one ranked report" reviews. Run them with the contract as the bar |
| **Off for this product** | Sets a direction | Picks fonts, palettes, shadows or elevation, icon sets, gradients and glows; asks for a "bold", "distinct" or "memorable" identity; starts new work from a blank canvas. These fit landing pages, demos and projects with no design system |

A skill that triggers on any frontend task and sets a direction does the most damage: it loads on every UI change. Weigh it first.

## Make the verdicts stick

1. **Precedence, in the project skill.** The project skill says it loads before any general design skill and that the repo wins any disagreement. This works in every harness.
2. **A "When a design skill disagrees" table** in the project skill, one row per conflict from the diagnosis: what the general skill says, and the repo's answer with the file that holds it. Agents follow a named conflict far more reliably than a general "the repo wins".
3. **Switch off "Off" skills for this repo** where the harness allows it:
   - Claude Code: `.claude/settings.json` → `{"permissions": {"deny": ["Skill(<name>)"]}}`.
   - Codex: `.codex/config.toml` (or `~/.codex/config.toml`) → `[[skills.config]]` with `name = "<name>"` and `enabled = false`.
   - Other harnesses: rely on 1 and 2.
4. **Vendored design skills in the repo.** If the repo vendors a skill that sets a direction, either remove it or keep it only for the "Keep for named jobs" uses, and say which in the project skill.

## Common conflicts

Fill the table from what the diagnosis found. Typical rows:

| A general skill says | The repo's answer |
|---|---|
| Use shadows for depth, or replace borders with layered shadows | The repo's elevation rule (for example: hairline borders, shadows only on floating parts) |
| Give the screen a distinct, bold visual direction | Screens reuse the shared parts; a new look is a variant on a part, agreed in its own PR |
| Use the system font, or pair a display face | The repo's font tokens only |
| Pick an icon set that fits | The repo's icon set, one icon per meaning (`docs/design/components.md`) |
| Add a gradient, glow or accent colour for emphasis | Colour marks status and the primary action only |
| Build or extend the palette | Colours are tokens; a new token is a design-system change with its own PR |
