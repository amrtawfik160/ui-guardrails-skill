# Parts inventory template

`docs/design/components.md` answers one question: which shared part draws this thing? Each row is a need, the part, and the hand-built copies to stop making.

## Fill it

- One row per need an agent meets, worded the way an agent would look for it ("a state on a list row", not "StatusChip dot variant").
- **Use** names the part, its variant or prop, and its file path. Check every path exists.
- **Never** lists the copies the diagnosis found, so an agent recognises one in the file next to theirs. Leave it empty when nothing was found.
- Every hand-built kind from the diagnosis has a row.
- One icon per meaning. Where the code uses several icons for one meaning, pick one and list it.
- **Known forks** lists the old duplicates the baseline grandfathers, so nobody copies them.

Check the paths:

```sh
rg -o '\(`([^`]+\.(tsx|ts|jsx|js|vue|svelte|css))`\)' -r '$1' docs/design/components.md | sort -u | while read -r p; do
  [ -e "$p" ] || echo "missing: $p"
done
```

## Template

````markdown
# Parts inventory

Step 2 of the UI contract in [`DESIGN.md`](../../DESIGN.md): before you write markup, find the
need below and use the part it names. If no part fits, add a variant or a new part in
`<shared parts folder>` in the same PR. Never copy a part's classes into a page.

<Where to see every part rendered: a catalog route, Storybook, ...>

## Status, badges and notices

| Need | Use | Never |
|---|---|---|
| A state on a card or header ("Done", "Failed") | `<StatusPart tone="...">` (`<path>`) | A `span` with `<hand-built tint classes>`, a local `StatusBadge` |
| A state on a list row | `<StatusPart variant="dot">` | A coloured dot drawn by hand |
| A count or a "New" mark | `<Badge>` (`<path>`) | A local `*Badge` component |
| A banner or inline notice | `<Alert variant="...">` (`<path>`) | `<hand-built banner classes>` on a `div` |
| A failure with its next step | `<ErrorPart>` (`<path>`) | A toast, or a red paragraph |

Tones mean one thing everywhere: <tone> is <meaning>, ... The lint rule
`ui-guardrails/no-hand-built-status` fails a string that pairs a status tint with the same
tone's text or border.

## Surfaces and rows

| Need | Use | Never |
|---|---|---|
| A card | `<Card>` (`<path>`) | A `div` with `<card classes>` |
| A list row | `<Row>` (`<path>`) | Rows that pick their own height and hover |
| An empty list, tab or page | `<EmptyState>` (`<path>`) | A second empty-state part |
| Loading | `<Skeleton>`, `<Spinner>` (`<path>`) | "Loading..." text |

## Page frame and controls

| Need | Use |
|---|---|
| A routed page | `<Page>` (`<path>`) |
| Tabs | `<Tabs>` (`<path>`) |
| Buttons | `<Button>` variants: `<primary>` (the one main action), `<secondary>`, `<destructive>` |
| A form dialog / a confirm | `<Dialog>` / `<ConfirmDialog>` |
| Fields | `<Input>`, `<Select>`, `<Textarea>` |
| A toast | `<toast>`, only for confirmations |

## Icons

<Icon set> only. One meaning, one icon.

| Meaning | Icon |
|---|---|
| Done, approved, succeeded | `<Icon>` |
| Failed, warning | `<Icon>` |
| Close, dismiss | `<Icon>` |
| Open in a new place | `<Icon>` |
| Running | `<Spinner>`, not an icon |

## Known forks

These predate the inventory and are grandfathered in `scripts/ui-baseline.json`. Do not copy
them; move a caller to the shared part when you touch it.

- `<path>` draws its own status pill.
- <n> local `*Badge` components outside `<shared parts folder>`.
````
