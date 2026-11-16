# Lint guard and ratchet

A lint rule for the defect class the diagnosis ranked first, plus a baseline of today's findings that may only shrink. New code cannot raise a file's count. Old code is fixed over time, and each fix lowers the baseline in the same commit.

The baseline counts findings per file, so a fix and a new copy in the same file cancel out. Review keeps that honest; the count still never grows.

The files here mirror where they go in the target repo:

| File | Goes to | Does |
|---|---|---|
| `eslint-rules/eslint-plugin-ui-guardrails.mjs` | `eslint-rules/` | The ESLint plugin with `no-hand-built-status` |
| `eslint-rules/ui-guardrails.test.mjs` | `eslint-rules/` | Rule cases and ratchet cases (`node --test`) |
| `scripts/check-ui-baseline.mjs` | `scripts/` | The ratchet: check, `--prune`, `--seed` |

The rules run from their own config, `eslint.ui.config.mjs`, so the repo's ordinary `eslint` run never fails on grandfathered findings. Only the ratchet script reads that config.

The baseline lands at `scripts/ui-baseline.json`. It lists the seeded rules and a count per file and rule:

```json
{
  "version": 1,
  "rules": ["ui-guardrails/no-hand-built-status"],
  "counts": { "src/pages/runs.tsx": { "ui-guardrails/no-hand-built-status": 2 } }
}
```

## The example rule

`no-hand-built-status` reads every string in a file and fails one that pairs a status tint (`bg-success/10`) with the same tone's text or border (`text-success-foreground`, `border-success/30`). That pair is a hand-built status chip or banner. It reads every string, not only `className`, because hand-built chips hide in tone maps and helper return values. Options: `tones` (the status token names) and `use` (the fix the message names).

## Adapt it

1. **Pick the class.** Target the hand-built kind with the most copies in the diagnosis. Write a rule that recognises the *copy*, not a bad token: a token rule passes a hand-built chip made of valid tokens.
2. **Match the styling.** Edit `TINT` and `INK` to how the repo names status colours (palette classes such as `bg-green-100 text-green-700`, CSS module class names, a `tone` prop on a styled component). Add a sibling rule for a second kind, and add its id to the plugin's `rules`.
3. **Name the part in the message.** The message is what the agent reads at the moment it drifts: name the part to use and `docs/design/components.md`.
4. **Report one finding per offending string** so the per-file count moves with every fix.
5. **Test the edit.** Change the cases in `ui-guardrails.test.mjs` to the repo's real strings, then run `node --test eslint-rules/ui-guardrails.test.mjs`. Break the rule on purpose once and see the test fail.

## Wire it

`eslint.ui.config.mjs` at the repo root. Lint everything agents edit, vendored folders included. Exclude only the shared parts folder, where the tints legitimately live, as a global ignore. Use the parser the repo's main config uses:

```js
import tsParser from "@typescript-eslint/parser";
import uiGuardrails from "./eslint-rules/eslint-plugin-ui-guardrails.mjs";

export default [
  { ignores: ["src/components/ui/**"] },
  {
    files: ["src/**/*.{js,jsx,ts,tsx}"],
    languageOptions: { parser: tsParser, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { "ui-guardrails": uiGuardrails },
    rules: {
      "ui-guardrails/no-hand-built-status": ["error", { use: "Use <StatusBadge> or <Alert> (docs/design/components.md)." }],
    },
  },
];
```

Set `BASELINE_FILE`, `CONFIG_FILE`, `LINT_TARGETS` and the plugin import path at the top of `check-ui-baseline.mjs` if the repo differs. Then `package.json`:

```json
{ "scripts": { "lint:ui": "node scripts/check-ui-baseline.mjs" } }
```

CI runs `lint:ui` on every PR with the base branch fetched (`fetch-depth: 0`, or `git fetch origin main`). `UI_BASELINE_BASE` overrides the base ref, default `origin/main`.

The script lints through ESLint's Node API and counts only this plugin's rules. A repo on another linter swaps `lint()` for its JSON output and maps each diagnostic to a file and rule id, keeping the two stops below.

## Land it

In the PR that adds the rule:

1. `node scripts/check-ui-baseline.mjs --seed` lists today's findings for every rule the base branch has not seeded.
2. `node scripts/check-ui-baseline.mjs` passes.
3. Probe it: add one new hand-built chip to a page. The check fails with the file, line and the part to use. Remove the probe; it passes. Keep both outputs as proof.

## How the check fails

| Failure | Meaning | Fix |
|---|---|---|
| new | A file has more findings than the baseline lists | Use the shared part |
| stale | A file has fewer findings than listed | `--prune`, commit the smaller baseline |
| grown | The baseline lists more than the base branch did | Revert the baseline edit; fix the code |
| unseeded | A plugin rule is missing from `rules` | `--seed`, once, in the PR that adds the rule |
| is off | A linted file does not run every guardrail rule | Turn the rule on, or move the folder to the global ignores if it holds the shared parts |
| does not parse | A file has a parsing error, so its findings are unknown | Fix the file or the parser setup |

The last two stop `--prune` and `--seed` too, so switching a rule off or breaking the parser never looks like a fix.

Seeding works only for a rule the base branch has not seeded, so after merge every rule gets the same may-only-shrink check. The base branch must be fetched; the script stops rather than skip the grown check.
