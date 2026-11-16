---
name: ui-guardrails
description: Sets up UI guardrails in a repo so coding agents build with its existing design system instead of drifting from it. Produces a drift diagnosis, a short design contract, a parts inventory, a lint rule with a baseline that only shrinks, and a thin project skill. Use when agents hand-build parts the system already has, when a design doc has grown into history, or when general design skills fight the repo's look.
---

# UI guardrails

Agents drift from a design system for structural reasons: nothing tells them which part draws a thing, nothing fails when they hand-build a copy, nobody looks at worst-case data, and louder instructions (a long design doc, a general design skill) outvote the repo. Fix the structure. This skill changes docs, lint and skills in the target repo. It changes no product UI.

Copy the six steps into your task list. A step you skip stays in the report with its reason.

## Steps

### 1. Diagnose

Measure why agents drift in this repo with [references/diagnose.md](references/diagnose.md): sample recent UI PRs for defects, count hand-built copies of shared parts, find lint blind spots, check for a worst-case look and copy review, measure the design doc, and list installed design skills that contradict the repo.

Done when the diagnosis table has a measured value for all six causes, each with the command or PR that showed it, ranked by defects explained, latent causes last.

### 2. Write the contract

Write "The UI contract (read first)" at the top of `DESIGN.md` (or the repo's design doc) from [references/contract-template.md](references/contract-template.md). Rules only. Move detail to the section each rule links to, and leave history to git.

Done when the section is at most 600 words with at most 15 rules, and every code identifier from the old contract still appears in the docs.

### 3. Write the parts inventory

Write `docs/design/components.md` from [references/inventory-template.md](references/inventory-template.md): need, part, and the hand-built copies to stop making, plus one icon per meaning and the known forks.

Done when every hand-built kind from step 1 has a row and every path in the file exists.

### 4. Add the lint guard and the ratchet

Follow [references/lint/README.md](references/lint/README.md). Target the hand-built kind with the most copies, close the blind spots from step 1, and seed the baseline once, in the PR that adds the rule.

Done when the tests pass, a probe with a new hand-built copy fails with a message naming the part, the same tree without the probe passes, and CI runs the check against the fetched base branch.

### 5. Write the project skill

Write `.agents/skills/<product>-ui/SKILL.md` from [references/project-skill-template.md](references/project-skill-template.md). It sets the order of UI work: contract, parts, build, worst-case data, words, screenshots.

Done when a fresh agent session lists the skill and every path it names exists.

### 6. Triage the design skills

Give each design skill from step 1 a verdict with [references/design-skills.md](references/design-skills.md): keep, keep for named jobs, or off for this product. Write each conflict into the project skill's "When a design skill disagrees" table, and switch off the "off" skills where the harness allows it.

Done when every design skill from step 1 has a verdict and every conflict has a row naming the repo's answer.

## Report

Open with one paragraph: why agents drifted here, and what now stops each cause. Then:

- The diagnosis table from step 1.
- The files added or changed, with the contract's word count before and after.
- Lint proof: the probe that failed, the clean run that passed, and the seeded baseline total.
- The design-skill verdicts.
- Follow-ups: migrating the grandfathered findings oldest fork first, folding duplicate parts into one, and latent causes left open.
