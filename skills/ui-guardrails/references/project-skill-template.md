# Project skill template

A thin skill inside the target repo that sets the order of UI work and points at the one source for each answer. It holds no design rules of its own: those live in the contract and the inventory.

## Where it goes

- `.agents/skills/<product>-ui/SKILL.md`. Codex and other agents read `.agents/skills/`.
- A symlink for Claude Code: `ln -s ../../.agents/skills/<product>-ui .claude/skills/<product>-ui`.
- One line in `AGENTS.md` / `CLAUDE.md` for harnesses without skill discovery: "UI work: follow `.agents/skills/<product>-ui/SKILL.md`."

If the repo has a frontend agent doc, put "Before you call it done" and "When a design skill disagrees" there instead and point at them, so each list has one home.

## Fill it

- The description names the surfaces (folders, apps) and the small parts that trigger it, because small changes (a chip, an icon) are where agents skip the system.
- Every path in the skill exists.
- The disagree table has one row per conflict from the diagnosis (see `design-skills.md`).
- The order stays: rules, parts, build, worst case, words, screenshots.

## Template

```markdown
---
name: <product>-ui
description: Use for any change to what a person sees in <surfaces and folders>, including small parts such as a status chip, badge, icon, card, notice or empty state. Gives the order of work and the one source for each answer. Load it before any general design skill.
---

# <Product> UI

<Product> already has a design system. A good result reuses it exactly; a new look is a
design-system change in its own PR. Work in this order.

1. **Rules.** Read "The UI contract (read first)" at the top of `DESIGN.md`. Read a later
   section only for the part you touch.
2. **Parts.** Find each need in `docs/design/components.md` and use the part it names. Never
   copy a part's classes, and never copy a fork listed under "Known forks", even when the file
   next to yours does.
3. **Build.** Start from the closest page in the `DESIGN.md` recipes. Use tokens from
   `<token file>` only. A look a part lacks is a new variant in `<shared parts folder>`, in the
   same PR. Run `<lint command>`; fix a finding in the code, never in the baseline.
4. **Worst case.** Load the screen with the longest real name, none and hundreds of items, a
   failed read, and right-to-left text when the product supports it. Fix what breaks.
5. **Words.** The empty, error and long-data states from step 4 are on screen now. Write their
   labels, empty states and errors against `<voice or copy guide>`: name what happened and the
   one next step.
6. **Screenshots.** Light, dark and <phone width> in a browser. Take each screenshot at real
   size, look at it, and zoom on each control you changed. Passing types, tests or lint is not
   proof.

## When a design skill disagrees

General design skills are written for any product. Use them for what they do well (motion,
accessibility, worst-case data, copy) with this repo's values. Where one disagrees, the repo
wins:

| A general skill says | Here |
|---|---|
| <what the skill says> | <the repo's answer and the file that holds it> |

Off for this repo: <skills that set a direction>. Kept only for <named jobs>: <review skills>.
```
