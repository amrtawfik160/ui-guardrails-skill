#!/usr/bin/env node
// Ratchet for the UI guardrail rules. Old findings are listed per file and
// rule in the baseline; the list may only shrink.
//
//   node scripts/check-ui-baseline.mjs           fail on a new finding, a fixed one still listed, or a grown list
//   node scripts/check-ui-baseline.mjs --prune   lower the list to today's findings
//   node scripts/check-ui-baseline.mjs --seed    list today's findings for rules the base branch has not seeded
//
// The rules run from their own config file, so the repo's ordinary lint run
// never sees the grandfathered findings. The base branch is UI_BASELINE_BASE,
// default origin/main. CI must fetch it.

import { spawnSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { ESLint } from "eslint";
import { RULE_IDS } from "../eslint-rules/eslint-plugin-ui-guardrails.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const BASELINE_FILE = "scripts/ui-baseline.json";
const CONFIG_FILE = "eslint.ui.config.mjs";
const LINT_TARGETS = ["src"];
const PRUNE = "node scripts/check-ui-baseline.mjs --prune";

const EMPTY = { version: 1, rules: [], counts: {} };

// knownRules is null for the base branch's baseline, which may list a rule this branch removes.
export function parseBaseline(text, knownRules = RULE_IDS) {
  const parsed = JSON.parse(text);
  if (parsed?.version !== 1 || !Array.isArray(parsed.rules) || typeof parsed.counts !== "object" || parsed.counts === null) {
    throw new Error("UI baseline must be { version: 1, rules: [...], counts: {...} }");
  }
  const rules = new Set(parsed.rules);
  for (const rule of rules) {
    if (knownRules && !knownRules.includes(rule)) throw new Error(`UI baseline lists ${rule}, which the plugin does not define. Remove it.`);
  }
  for (const [file, perRule] of Object.entries(parsed.counts)) {
    for (const [rule, count] of Object.entries(perRule)) {
      if (!rules.has(rule)) throw new Error(`UI baseline counts ${rule} for ${file} but does not list it under "rules".`);
      if (!Number.isInteger(count) || count < 1) throw new Error(`UI baseline count for ${file} ${rule} must be a positive integer.`);
    }
  }
  return { version: 1, rules: [...rules].sort(), counts: parsed.counts };
}

export function serializeBaseline({ rules, counts }) {
  const sorted = {};
  for (const file of Object.keys(counts).sort()) {
    const names = Object.keys(counts[file]).filter((rule) => counts[file][rule] > 0).sort();
    if (names.length) sorted[file] = Object.fromEntries(names.map((rule) => [rule, counts[file][rule]]));
  }
  return `${JSON.stringify({ version: 1, rules: [...rules].sort(), counts: sorted }, null, 2)}\n`;
}

export function countFindings(results, root = ROOT) {
  const counts = {};
  for (const result of results) {
    const file = path.relative(root, result.filePath).split(path.sep).join("/");
    for (const message of result.messages) {
      if (!RULE_IDS.includes(message.ruleId)) continue;
      counts[file] ??= {};
      counts[file][message.ruleId] = (counts[file][message.ruleId] ?? 0) + 1;
    }
  }
  return counts;
}

function entries(counts) {
  return Object.entries(counts).flatMap(([file, perRule]) => Object.entries(perRule).map(([rule, count]) => ({ file, rule, count })));
}

const countOf = (counts, file, rule) => counts[file]?.[rule] ?? 0;

// new:   a file has more findings than the baseline allows.
// stale: a file has fewer; the baseline must come down in the same commit.
// grown: the baseline allows more than the base branch did, for a rule the base branch already seeded.
// unseeded: a plugin rule the baseline does not list yet.
export function baselineFailures({ baseline, current, base, ruleIds = RULE_IDS }) {
  const failures = [];
  for (const rule of ruleIds) {
    if (!baseline.rules.includes(rule)) failures.push({ kind: "unseeded", rule });
  }
  for (const { file, rule, count } of entries(current)) {
    const allowed = countOf(baseline.counts, file, rule);
    if (count > allowed) failures.push({ kind: "new", file, rule, allowed, found: count });
  }
  for (const { file, rule, count } of entries(baseline.counts)) {
    const found = countOf(current, file, rule);
    if (found < count) failures.push({ kind: "stale", file, rule, allowed: count, found });
  }
  for (const { file, rule, count } of entries(baseline.counts)) {
    if (!base.rules.includes(rule)) continue;
    const allowed = countOf(base.counts, file, rule);
    if (count > allowed) failures.push({ kind: "grown", file, rule, allowed, found: count });
  }
  return failures;
}

export function pruneBaseline(baseline, current) {
  const counts = {};
  for (const { file, rule, count } of entries(baseline.counts)) {
    const kept = Math.min(count, countOf(current, file, rule));
    if (kept > 0) (counts[file] ??= {})[rule] = kept;
  }
  return { ...baseline, counts };
}

// Lists today's findings for every plugin rule the base branch has not seeded,
// so a new rule can land before the code it flags is fixed.
export function seedBaseline(baseline, current, base, ruleIds = RULE_IDS) {
  const seeding = ruleIds.filter((rule) => !base.rules.includes(rule));
  const counts = {};
  for (const { file, rule, count } of entries(baseline.counts)) {
    if (!seeding.includes(rule)) (counts[file] ??= {})[rule] = count;
  }
  for (const { file, rule, count } of entries(current)) {
    if (seeding.includes(rule)) (counts[file] ??= {})[rule] = count;
  }
  return { version: 1, rules: [...new Set([...baseline.rules, ...seeding])], counts };
}

function git(args) {
  return spawnSync("git", args, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function readBase(ref) {
  if (git(["rev-parse", "--verify", "--quiet", `${ref}^{commit}`]).status !== 0) {
    throw new Error(`Cannot read the base branch ${ref}. Fetch it first (in CI: fetch-depth 0, or git fetch origin main).`);
  }
  // "./" resolves against ROOT, so this also works in a package inside a monorepo.
  const shown = git(["show", `${ref}:./${BASELINE_FILE}`]);
  if (shown.status === 0) return parseBaseline(shown.stdout, null);
  if (/does not exist|exists on disk, but not in/u.test(shown.stderr)) return EMPTY;
  throw new Error(`Cannot read ${BASELINE_FILE} on ${ref}: ${shown.stderr.trim()}`);
}

const severityOf = (setting) => (Array.isArray(setting) ? setting[0] : setting);
const isOn = (setting) => ![undefined, 0, "off"].includes(severityOf(setting));

// A file that does not parse, or that the rules do not run on, would count as
// zero findings and look fixed. Both stop the check instead.
async function lint() {
  const eslint = new ESLint({ cwd: ROOT, overrideConfigFile: CONFIG_FILE, ruleFilter: ({ ruleId }) => RULE_IDS.includes(ruleId) });
  const results = await eslint.lintFiles(LINT_TARGETS);
  const problems = [];
  if (results.length === 0) problems.push(`${CONFIG_FILE} lints no files under ${LINT_TARGETS.join(", ")}.`);
  for (const result of results) {
    const file = path.relative(ROOT, result.filePath).split(path.sep).join("/");
    for (const message of result.messages.filter((entry) => entry.fatal)) problems.push(`${file}:${message.line} does not parse: ${message.message}`);
    const config = await eslint.calculateConfigForFile(result.filePath);
    for (const rule of RULE_IDS) {
      if (!isOn(config?.rules?.[rule])) problems.push(`${file}: ${rule} is off. Turn it on in ${CONFIG_FILE}, or add the folder to its global ignores if it holds the shared parts.`);
    }
  }
  return { results, problems };
}

function describe(failure, results) {
  switch (failure.kind) {
    case "unseeded":
      return `${failure.rule} has no baseline yet. Run node scripts/check-ui-baseline.mjs --seed once, in the PR that adds the rule.`;
    case "stale":
      return `${failure.file}: ${failure.rule} is down to ${failure.found} from ${failure.allowed}. Run \`${PRUNE}\` and commit the smaller baseline.`;
    case "grown":
      return `${failure.file}: ${failure.rule} allows ${failure.found} in ${BASELINE_FILE} but ${failure.allowed} on the base branch. The baseline may only shrink; fix the code instead.`;
    default: {
      const lines = results
        .filter((result) => path.relative(ROOT, result.filePath).split(path.sep).join("/") === failure.file)
        .flatMap((result) => result.messages.filter((message) => message.ruleId === failure.rule))
        .map((message) => `    ${failure.file}:${message.line} ${message.message}`);
      return [`${failure.file}: ${failure.rule} found ${failure.found}, grandfathered ${failure.allowed}. Fix the new ones:`, ...lines].join("\n");
    }
  }
}

export async function main(argv = process.argv.slice(2)) {
  const baselinePath = path.join(ROOT, BASELINE_FILE);
  let baseline = EMPTY;
  try {
    baseline = parseBaseline(readFileSync(baselinePath, "utf8"));
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const { results, problems } = await lint();
  if (problems.length) {
    console.error(problems.join("\n"));
    return 1;
  }
  const current = countFindings(results);

  if (argv.includes("--prune")) {
    writeFileSync(baselinePath, serializeBaseline(pruneBaseline(baseline, current)));
    console.log(`Pruned ${BASELINE_FILE} to today's findings.`);
    return 0;
  }
  const base = readBase(process.env.UI_BASELINE_BASE || "origin/main");
  if (argv.includes("--seed")) {
    writeFileSync(baselinePath, serializeBaseline(seedBaseline(baseline, current, base)));
    console.log(`Seeded ${BASELINE_FILE} for the rules the base branch has not seeded.`);
    return 0;
  }
  const failures = baselineFailures({ baseline, current, base });
  if (failures.length) {
    console.error(failures.map((failure) => describe(failure, results)).join("\n"));
    return 1;
  }
  const total = entries(baseline.counts).reduce((sum, entry) => sum + entry.count, 0);
  console.log(`UI guardrails: no new findings. Grandfathered: ${total} in ${Object.keys(baseline.counts).length} file(s); the list may only shrink.`);
  return 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().then(
    (code) => {
      process.exitCode = code;
    },
    (error) => {
      console.error(error.message);
      process.exitCode = 1;
    },
  );
}
