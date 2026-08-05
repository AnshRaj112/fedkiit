/**
 * Find HTML nesting that the parser rewrites, which is what turns into a
 * hydration mismatch once the markup is server-rendered.
 *
 * Only literal lowercase tags are tracked. Uppercase names are components —
 * what they render is unknowable from here, so they are skipped rather than
 * guessed at.
 */
import { readFileSync } from "node:fs";
import { globSync } from "node:fs";
import { execSync } from "node:child_process";

// Elements that force an open <p> closed when the parser meets them.
const CLOSES_P = new Set([
  "address", "article", "aside", "blockquote", "details", "div", "dl",
  "fieldset", "figcaption", "figure", "footer", "form", "h1", "h2", "h3",
  "h4", "h5", "h6", "header", "hgroup", "hr", "main", "menu", "nav", "ol",
  "p", "pre", "section", "table", "ul",
]);

// Elements that may never contain another of themselves.
const NO_SELF_NEST = new Set(["a", "button", "form", "p"]);

const VOID = new Set([
  "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
  "meta", "param", "source", "track", "wbr",
]);

const files = process.argv.length > 2
  ? process.argv.slice(2)
  : execSync(
      'git ls-files "src/**/*.jsx" "src/**/*.tsx" "app/**/*.jsx" "app/**/*.tsx"',
      { encoding: "utf8" },
    ).trim().split("\n").filter(Boolean);

const findings = [];

/**
 * Blank out comments, keeping newlines so reported line numbers stay true.
 * Without this a comment that merely *mentions* `<p>` is scanned as markup.
 */
const blank = (m) => m.replace(/[^\n]/g, " ");

const stripComments = (s) =>
  s
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, blank)
    .replace(/\/\*[\s\S]*?\*\//g, blank)
    .replace(/(^|[^:])\/\/[^\n]*/g, (m, p) => p + " ".repeat(m.length - p.length));

/**
 * Blank out regex literals and quoted strings too. `.replace(/<a\s[^>]*>/gi,'')`
 * is not markup, and reading it as markup reports a nested <a> that is not there.
 * The regex heuristic keys off the token before the slash: a regex may only
 * start where an operand is expected.
 */
const stripLiterals = (s) =>
  s
    // `<` and `>` are deliberately absent: with them, the `/` of a closing tag
    // like `</span>` reads as the start of a regex and eats the tags after it.
    // Character classes are kept disjoint so the alternation cannot match the
    // same text two ways — CodeQL flagged the earlier form as a polynomial
    // ReDoS. Upstream autofix, kept verbatim.
    .replace(/(^|[=(,:[!&|?{};\n])(\s*)\/(?![/*])((?:\\.|\[(?:\\.|[^\]\\\n])*\]|[^/\\\[\n])+)\/[gimsuyv]*/g,
      (m, pre, ws, body) => pre + ws + blank("/" + body + "/"))
    .replace(/'(?:\\.|[^'\\\n])*'/g, blank)
    .replace(/`(?:\\.|[^`\\])*`/g, blank);

for (const file of files) {
  const src = stripLiterals(stripComments(readFileSync(file, "utf8")));
  const stack = [];
  // Matches <tag, </tag and the closing bracket of a tag.
  const re = /<\/?([a-zA-Z][\w.-]*)((?:[^<>'"]|'[^']*'|"[^"]*")*?)(\/?)>/g;
  let m;
  while ((m = re.exec(src)) !== null) {
    const [full, rawName, , selfSlash] = m;
    const name = rawName;
    if (name[0] === name[0].toUpperCase()) continue; // component
    const closing = full.startsWith("</");
    const line = src.slice(0, m.index).split("\n").length;

    if (closing) {
      for (let i = stack.length - 1; i >= 0; i--) {
        if (stack[i].name === name) { stack.length = i; break; }
      }
      continue;
    }
    if (selfSlash || VOID.has(name)) continue;

    const openP = stack.find((e) => e.name === "p");
    if (openP && CLOSES_P.has(name)) {
      findings.push({
        file, line, kind: `<${name}> inside <p>`,
        detail: `<p> opened at line ${openP.line}; the parser closes it before this <${name}>`,
      });
    }
    if (NO_SELF_NEST.has(name)) {
      const same = stack.find((e) => e.name === name);
      if (same && name !== "p") {
        findings.push({
          file, line, kind: `<${name}> inside <${name}>`,
          detail: `outer <${name}> opened at line ${same.line}`,
        });
      }
    }
    stack.push({ name, line });
  }
}

if (!findings.length) {
  console.log(`${files.length} files scanned — no parser-rewriting nesting found.`);
} else {
  console.log(`${files.length} files scanned — ${findings.length} finding(s):\n`);
  for (const f of findings) {
    console.log(`  ${f.file}:${f.line}`);
    console.log(`    ${f.kind} — ${f.detail}`);
  }
}
