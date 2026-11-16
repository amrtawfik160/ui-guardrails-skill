// node --test eslint-rules/ui-guardrails.test.mjs
import assert from "node:assert/strict";
import { test } from "node:test";
import { RuleTester } from "eslint";
import plugin from "./eslint-plugin-ui-guardrails.mjs";
import { baselineFailures, pruneBaseline, seedBaseline } from "../scripts/check-ui-baseline.mjs";

const RULE = "ui-guardrails/no-hand-built-status";

test("no-hand-built-status", () => {
  new RuleTester({
    languageOptions: { ecmaVersion: "latest", sourceType: "module", parserOptions: { ecmaFeatures: { jsx: true } } },
  }).run("no-hand-built-status", plugin.rules["no-hand-built-status"], {
    valid: [
      `<StatusBadge tone="success">Done</StatusBadge>`,
      `const tone = "bg-success text-white"`,
      `const quiet = "bg-success/10 text-muted-foreground"`,
      `const mixed = "bg-warning/10 text-success-foreground"`,
      `const word = "text-success-foreground font-medium"`,
      `cn("bg-success/10", "text-muted-foreground")`,
      { code: `const c = "bg-success-soft/10 text-success"`, options: [{ tones: ["success", "success-soft"] }] },
    ],
    invalid: [
      { code: `<span className="rounded-full bg-success/10 text-success-foreground">Approved</span>`, errors: 1 },
      { code: `const tones = { failed: "bg-danger/15 border border-danger/30" }`, errors: 1 },
      { code: "const chip = `px-2 dark:bg-info/20 ${size} dark:text-info`", errors: 1 },
      { code: `const c = clsx("rounded-full", "bg-success/10", active && "ring-1", "text-success")`, errors: 1 },
      { code: `const c = cn("bg-success/10 text-success", "px-2")`, errors: 1 },
      {
        code: `const c = "bg-ok/10 text-ok"`,
        options: [{ tones: ["ok"], use: "Use <Chip tone>." }],
        errors: [{ message: "bg-ok/10 with text-ok hand-builds a status chip or banner. Use <Chip tone>." }],
      },
    ],
  });
});

const baseline = (counts, rules = [RULE]) => ({ version: 1, rules, counts });
const ruleIds = [RULE];

test("a new finding fails and a listed one passes", () => {
  const listed = baseline({ "src/a.tsx": { [RULE]: 2 } });
  assert.deepEqual(baselineFailures({ baseline: listed, current: { "src/a.tsx": { [RULE]: 2 } }, base: listed, ruleIds }), []);
  const [failure] = baselineFailures({ baseline: listed, current: { "src/a.tsx": { [RULE]: 2 }, "src/b.tsx": { [RULE]: 1 } }, base: listed, ruleIds });
  assert.equal(failure.kind, "new");
  assert.equal(failure.file, "src/b.tsx");
});

test("a fixed finding must leave the baseline in the same commit", () => {
  const listed = baseline({ "src/a.tsx": { [RULE]: 2 } });
  const current = { "src/a.tsx": { [RULE]: 1 } };
  assert.equal(baselineFailures({ baseline: listed, current, base: listed, ruleIds })[0].kind, "stale");
  const pruned = pruneBaseline(listed, current);
  assert.deepEqual(pruned.counts, { "src/a.tsx": { [RULE]: 1 } });
  assert.deepEqual(baselineFailures({ baseline: pruned, current, base: listed, ruleIds }), []);
});

test("the baseline cannot grow past the base branch", () => {
  const base = baseline({ "src/a.tsx": { [RULE]: 1 } });
  const raised = baseline({ "src/a.tsx": { [RULE]: 2 } });
  const kinds = baselineFailures({ baseline: raised, current: { "src/a.tsx": { [RULE]: 2 } }, base, ruleIds }).map((failure) => failure.kind);
  assert.deepEqual(kinds, ["grown"]);
});

test("seeding lists today's findings only for a rule the base branch has not seeded", () => {
  const empty = baseline({}, []);
  const current = { "src/a.tsx": { [RULE]: 3 } };
  assert.deepEqual(baselineFailures({ baseline: empty, current: {}, base: empty, ruleIds }).map((failure) => failure.kind), ["unseeded"]);
  const seeded = seedBaseline(empty, current, empty, ruleIds);
  assert.deepEqual(seeded, baseline(current));
  assert.deepEqual(baselineFailures({ baseline: seeded, current, base: empty, ruleIds }), []);

  const seededOnBase = baseline({ "src/a.tsx": { [RULE]: 1 } });
  assert.deepEqual(seedBaseline(seededOnBase, current, seededOnBase, ruleIds), seededOnBase);
});
