# UI guardrails skill

An agent skill that gives coding agents a clean path for UI work in a product that already has a design system. The agent diagnoses why agents drift from the system in your repo, then sets up the guardrails: a short design contract, a parts inventory, a lint rule with a baseline that only shrinks, and a thin project skill that fixes the order of work.

In one production app, agents kept shipping hand-built status chips beside the shared one. The rules existed, but nothing said which part draws a status, and no check caught a copy. Hand-built tints had spread across dozens of files at several strengths, each copying its neighbour. The same review found five more causes: no worst-case look before done, copy written last, lint skipping folders agents edit, a design doc grown into product history, and general design skills that contradicted the repo. This skill turns that fix into steps any team can run.

## Install

Claude Code:

```sh
git clone https://github.com/amrtawfik160/ui-guardrails-skill.git
cp -r ui-guardrails-skill/skills/ui-guardrails ~/.claude/skills/
```

Codex:

```sh
git clone https://github.com/amrtawfik160/ui-guardrails-skill.git
cp -r ui-guardrails-skill/skills/ui-guardrails ~/.agents/skills/
```

Other agents, with the [skills](https://github.com/vercel-labs/skills) CLI:

```sh
npx skills add amrtawfik160/ui-guardrails-skill
```

To share it with a team, copy `skills/ui-guardrails` into the repo instead: `.claude/skills/` for Claude Code, `.agents/skills/` for Codex and most other agents.

## Use

Ask your agent to set up UI guardrails, or to find out why agents keep drifting from your design system. The skill's six steps are in `skills/ui-guardrails/SKILL.md`. The templates for the contract, the inventory and the project skill, and an ESLint rule with its baseline script and tests, are in `skills/ui-guardrails/references/`.

## License

MIT
