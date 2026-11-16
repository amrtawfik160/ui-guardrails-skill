// UI guardrails: design-system rules a machine can check.
// Example rule for a Tailwind codebase with semantic status tokens
// (bg-success, text-success-foreground, border-warning, ...). Adapt TINT and
// INK to how your styling names status colours.

const DEFAULT_TONES = ["success", "warning", "danger", "destructive", "info"];
const DEFAULT_USE = "Use the shared status part named in docs/design/components.md.";
const CLASS_HELPERS = new Set(["cn", "clsx", "cx", "classNames", "twMerge", "cva", "tv"]);

function escape(text) {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

// "dark:hover:!bg-success/10" -> "bg-success/10"
function utilityOf(token) {
  let depth = 0;
  let start = 0;
  for (let index = 0; index < token.length; index += 1) {
    const char = token[index];
    if (char === "[" || char === "(") depth += 1;
    else if (char === "]" || char === ")") depth -= 1;
    else if (char === ":" && depth === 0) start = index + 1;
  }
  return token.slice(start).replace(/^!|!$/gu, "");
}

const noHandBuiltStatus = {
  meta: {
    type: "problem",
    docs: { description: "Status colours come from the shared status parts, never hand-picked classes." },
    schema: [
      {
        type: "object",
        properties: {
          tones: { type: "array", items: { type: "string" }, minItems: 1 },
          use: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      handBuilt: "{{tint}} with {{ink}} hand-builds a status chip or banner. {{use}}",
    },
  },
  create(context) {
    const { tones = DEFAULT_TONES, use = DEFAULT_USE } = context.options[0] ?? {};
    // Longest first, so "success-soft" is not read as "success" plus a suffix.
    const tone = `(${[...tones].sort((a, b) => b.length - a.length).map(escape).join("|")})`;
    // A tint is a status colour at reduced opacity: the background of a chip or banner.
    const TINT = new RegExp(`^bg-${tone}(?:-[a-z0-9]+)*/\\S+$`, "u");
    // Ink is the same tone's text or border.
    const INK = new RegExp(`^(?:text|border(?:-[xytrblse])?)-${tone}(?:-[a-z0-9]+)*(?:/\\S+)?$`, "u");

    // Every string, not only className: hand-built chips usually hide their
    // classes in a tone map or a helper's return value.
    function check(node, text) {
      const utilities = text.split(/\s+/u).filter(Boolean).map(utilityOf);
      const tints = new Map();
      for (const utility of utilities) {
        const match = TINT.exec(utility);
        if (match && !tints.has(match[1])) tints.set(match[1], utility);
      }
      if (tints.size === 0) return;
      for (const utility of utilities) {
        const match = INK.exec(utility);
        if (match && tints.has(match[1])) {
          context.report({ node, messageId: "handBuilt", data: { tint: tints.get(match[1]), ink: utility, use } });
          return;
        }
      }
    }

    const textOf = (node) =>
      node.type === "Literal" && typeof node.value === "string"
        ? node.value
        : node.type === "TemplateLiteral"
          ? node.quasis.map((quasi) => quasi.value.cooked ?? quasi.value.raw).join(" ")
          : null;
    const isHelperCall = (node) => node?.type === "CallExpression" && node.callee.type === "Identifier" && CLASS_HELPERS.has(node.callee.name);
    // A string passed straight to cn()/clsx() is read together with its sibling arguments.
    const isHelperArgument = (node) => isHelperCall(node.parent) && node.parent.arguments.includes(node);

    return {
      Literal(node) {
        if (typeof node.value === "string" && !isHelperArgument(node)) check(node, node.value);
      },
      TemplateLiteral(node) {
        if (!isHelperArgument(node)) check(node, textOf(node));
      },
      CallExpression(node) {
        if (!isHelperCall(node)) return;
        const texts = node.arguments.map(textOf).filter((text) => text !== null);
        if (texts.length) check(node, texts.join(" "));
      },
    };
  },
};

const plugin = {
  meta: { name: "ui-guardrails" },
  rules: {
    "no-hand-built-status": noHandBuiltStatus,
  },
};

export const RULE_IDS = Object.keys(plugin.rules).map((name) => `${plugin.meta.name}/${name}`);

export default plugin;
