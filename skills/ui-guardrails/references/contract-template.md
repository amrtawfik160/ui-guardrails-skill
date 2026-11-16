# Design contract template

The contract is the first section of `DESIGN.md` (or the repo's design doc). It is rules only and fits on one screen.

## Budget

- At most 600 words for the whole section, the path included.
- At most 15 rules. Each rule is a bold name and one or two sentences: what to do, the part or token that does it, and the lint rule that checks it.
- No history: no dates, PR numbers, "used to", rationale paragraphs or one-off exceptions. History lives in git, a changelog or decision records. Detail and reasons live in the section below the contract that the rule links to.

Check the budget:

```sh
awk '/^## The UI contract/{f=1; next} /^## /{f=0} f' DESIGN.md | wc -w
```

When you shorten an existing contract, move each detail sentence to its section; do not delete it. Then prove nothing was lost: every code identifier in the old contract still appears in the docs.

```sh
git show HEAD:DESIGN.md | awk '/^## <old contract heading>/{f=1; next} /^## /{f=0} f' \
  | rg -o '`[^`]+`' | tr -d '`' | sort -u | while read -r id; do
      rg -qF -- "$id" DESIGN.md docs/design || echo "missing: $id"
    done
```

## Template

Replace every `<...>`. Delete a rule that does not apply rather than keep a vague one. Mark each rule a lint rule checks with *(lint: rule-name)*.

```markdown
## The UI contract (read first)

Do UI work in this order. Each step names the one place that answers it.

1. **Rules.** The rules below. The sections after them hold the detail; read only the
   section for the part you touch.
2. **Parts.** [`docs/design/components.md`](docs/design/components.md) names the shared part
   for each need. Use the part; never copy its classes.
3. **Tokens.** Colour, type, radius and spacing come from `<token file>` through the semantic
   names listed here: no palette colours, hex or arbitrary values.
4. **Check.** `<lint command>` checks the rules marked *(lint)*.
5. **Look.** Light, dark and <phone width> in a browser, with worst-case data, before you
   call it done.

1. **Frame.** Every page renders `<Page>` from `<path>`; the page owns no width or title of
   its own. *(lint: <rule>)*
2. **One primary action per view.** The `<primary variant>` button is the one main action.
   Row actions are `<secondary variants>` or a menu.
3. **Use the part, never a copy.** Status, badges, notices, cards, rows, empty states and
   icons come from the part `components.md` names. Never hand-build a status chip or banner,
   a local `*Badge`, or a second empty state. *(lint: no-hand-built-status)*
4. **Parts own their look.** A page passes a shared part only layout (margin, width, grid or
   flex placement). A new look is a new variant on the part.
5. **Colour means something.** Semantic tokens only. Colour marks <a status, the primary
   action, ...> and nothing else.
6. **Status reads one way.** <The status part> with one tone per meaning: <green done, blue
   working, amber waiting, red failed, grey paused>.
7. **Type from the scale.** <The type steps and named utilities>, in <sentence case>.
8. **Depth.** <How surfaces separate: borders, fills, shadows only on floating parts>.
9. **Icons.** <Icon set> only, one icon per meaning from the icon table in `components.md`.
10. **Proof.** Open the page in light mode, dark mode and at <phone width>, with the longest
    real data, before you call it done.
```

## What goes where

| Content | Home |
|---|---|
| A rule an agent applies on every page | The contract |
| How a part looks, its variants, its tokens | The section for that part, below the contract |
| Which part to use for a need | `docs/design/components.md` |
| Why a rule exists, what was tried before | A decision record or the commit that made the rule |
| A page to copy | A recipes table at the end of `DESIGN.md` |
