# Diagnose drift

Measure each cause in the target repo and rank the causes by defects explained. The commands assume `rg`, `git` and `gh`, a React and Tailwind codebase under `src/` with shared parts in `src/components/ui/`, and `DESIGN.md` as the design doc. Swap in the repo's real paths, file types, class names and doc first.

## 1. Sample real defects

Take the last 5 to 10 merged PRs that changed UI. Every follow-up commit that fixes the PR's own UI is a defect: overflow, contrast, a wrong part, a wrong icon, reworded copy. Tag each defect with one of the causes below. A cause with no tagged defect is *latent*: a risk to note, ranked last.

```sh
gh pr list --state merged --limit 30 --json number,title,files \
  --jq '.[] | select([.files[].path | test("^src/.*\\.(tsx|jsx|css)$")] | any) | "\(.number) \(.title)"'
gh pr view <number> --json commits --jq '.commits[].messageHeadline'
```

Read the diff of each fix-up commit to name the cause; the headline alone misleads.

## 2. Hand-built copies of shared parts

Count each kind of part that exists more than once: status chips, badges, banners and notices, cards, empty states, and icons for one meaning. For each kind, write the shared part, the number of hand-built copies, the number of files, and one example path.

```sh
# Local badge, chip and status components outside the shared parts folder
rg -n "^(export )?(default )?(function|const) \w*(Badge|Chip|Pill|Tag|Status)\w*" src -g '!src/components/ui/**'

# Hand-picked status tints, and how many different strengths they use
rg -o --no-filename "bg-(success|warning|danger|destructive|error|info|green|red|amber|yellow|blue)(-[0-9]{2,3})?/[0-9]+" src -g '!src/components/ui/**' | sort | uniq -c | sort -rn
rg -l "bg-(success|warning|danger|destructive|error|info)/[0-9]+" src -g '!src/components/ui/**' | wc -l

# More than one empty-state part
rg -l "function \w*Empty\w*|const \w*Empty\w* =" src

# Icons for one meaning: every "done" tick in use
rg -o --no-filename "\b\w*(Check|Tick)\w*Icon\b" src | sort | uniq -c | sort -rn
```

Many copies at several strengths means agents copy the nearest file, because nothing tells them which part draws the thing.

## 3. Lint blind spots

- List what the UI lint skips: read `ignores` / `ignorePatterns` in the lint config. For each skipped folder, count recent edits. A folder agents edit is a blind spot.

  ```sh
  git log --since=90.days --name-only --format= -- <skipped-folder> | sort -u | wc -l
  ```

- Find what the rules read. A rule that only checks `className` props misses classes kept in tone maps, helper return values and constants. Probe it: add `const tones = { failed: "bg-danger/10 text-danger" }` to a page and run the lint. No finding means the rule is blind there.
- Find whether any rule checks *which part* was used, not only which token. Token rules pass a hand-built chip made of valid tokens.

## 4. No worst-case look

Check whether the design doc, the agent instructions or the PR template require a look in a browser with worst-case data before done: the longest real name, zero and hundreds of items, a failed read, phone width, dark mode. Count defects from step 1 that such a look would have caught (overflow, clipping, contrast, a broken empty state).

## 5. Copy written last

Count follow-up commits from step 1 that only changed labels, empty states or error text. Check whether the repo has a voice or copy guide and whether the agent instructions point at it before review.

## 6. A design doc grown into history

```sh
wc -w DESIGN.md
awk '/^## The UI contract/{f=1; next} /^## /{f=0} f' DESIGN.md | wc -w  # the rules part, if one exists
git log --since=30.days --oneline -- DESIGN.md | wc -l
rg -n "[0-9]{4}-[0-9]{2}-[0-9]{2}|#[0-9]{3,}|used to|previously|no longer|we moved|was changed|for now" DESIGN.md
```

Rules state what to do now. History explains how the doc got here: dates, PR numbers, "used to", rationale paragraphs, one-off exceptions. A rule longer than about 60 words is usually a rule wrapped in its history. A contract an agent cannot read in one screen gets skimmed.

## 7. Design skills that contradict the repo

List every installed skill an agent could load for UI work, in each harness the team uses:

```sh
ls ~/.claude/skills .claude/skills ~/.agents/skills .agents/skills ~/.codex/skills 2>/dev/null
rg -il "design|ui|interface|frontend|visual" ~/.claude/skills/*/SKILL.md ~/.agents/skills/*/SKILL.md .claude/skills/*/SKILL.md .agents/skills/*/SKILL.md 2>/dev/null
```

Include plugin skills and vendored skill folders in the repo. For each design skill, grep for the signals that set a look, then read each hit against the repo's contract:

```sh
rg -in "shadow|elevation|font|typeface|palette|gradient|glow|icon set|bold|distinct|aesthetic|identity|dream" <skill>/SKILL.md
```

Write one line per conflict: the skill, what it says, and what the repo says. Note which skills trigger on any frontend task: those load most often.

## Output

One table, ranked by defects explained, latent causes last:

| Cause | Measured | Example | Defects explained |
|---|---|---|---|
| Hand-built copies, lint blind to part choice | count, files, strengths | path | n |
| No worst-case look | | PR, commit | n |
| Copy written last | | PR, commit | n |
| Lint blind spots | folders, rule gaps | path | n |
| Design doc grown into history | words, rule lengths, growth | rule | n or latent |
| Contradicting design skills | conflicts | skill: line | n or latent |
