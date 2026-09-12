// Tolerant JSON parser for AI-generated test content.
// Accepts strict JSON plus three common AI mistakes:
//   1. // and /* */ comments (outside strings)
//   2. trailing commas in objects/arrays
//   3. unescaped double quotes inside string values, e.g.
//      "stem": "the word "conspicuous" most nearly means:"
//      (a quote only ends a string when a real delimiter follows it)
// Raw newlines inside strings are also tolerated.
// Throws Error with line:col + snippet on genuinely broken input.

export function tolerantParse(src) {
  if (src && src.charCodeAt(0) === 0xfeff) src = src.slice(1);
  let i = 0;
  const len = src.length;
  const fixes = { comments: 0, trailingCommas: 0, innerQuotes: 0 };

  function loc() {
    let line = 1;
    let col = 1;
    for (let k = 0; k < i; k++) {
      if (src[k] === "\n") {
        line++;
        col = 1;
      } else {
        col++;
      }
    }
    return `line ${line}, col ${col}`;
  }

  function fail(msg) {
    const s = Math.max(0, i - 30);
    const snippet = src.slice(s, i + 30).replace(/\n/g, " ");
    throw new Error(`${msg} at ${loc()} near “…${snippet}…”`);
  }

  function ws() {
    for (;;) {
      while (i < len && /\s/.test(src[i])) i++;
      if (src[i] === "/" && src[i + 1] === "/") {
        fixes.comments++;
        while (i < len && src[i] !== "\n") i++;
        continue;
      }
      if (src[i] === "/" && src[i + 1] === "*") {
        fixes.comments++;
        i += 2;
        while (i < len && !(src[i] === "*" && src[i + 1] === "/")) i++;
        i += 2;
        continue;
      }
      break;
    }
  }

  function followsValue(k) {
    while (k < len && /\s/.test(src[k])) k++;
    const after = src[k];
    if (after === undefined) return true;
    return (
      after === '"' ||
      after === "{" ||
      after === "[" ||
      after === "}" ||
      after === "]" ||
      /[0-9\-]/.test(after) ||
      after === "t" ||
      after === "f" ||
      after === "n"
    );
  }

  function isEndQuote(j) {
    let k = j + 1;
    while (k < len && /\s/.test(src[k])) k++;
    const nx = src[k];
    if (nx === undefined) return true;
    if (nx === ",") return followsValue(k + 1);
    return nx === "}" || nx === "]" || nx === ":";
  }

  function parseString() {
    let out = "";
    i++;
    let closed = false;
    while (i < len) {
      const ch = src[i];
      if (ch === "\\") {
        const nx = src[i + 1];
        if (nx === undefined) break;
        if (nx === "u") {
          const hex = src.substr(i + 2, 4);
          if (/^[0-9a-fA-F]{4}$/.test(hex)) {
            out += String.fromCharCode(parseInt(hex, 16));
            i += 6;
            continue;
          }
          out += "\\u";
          i += 2;
          continue;
        }
        const map = {
          '"': '"',
          "\\": "\\",
          "/": "/",
          b: "\b",
          f: "\f",
          n: "\n",
          r: "\r",
          t: "\t",
        };
        out += nx in map ? map[nx] : nx;
        i += 2;
        continue;
      }
      if (ch === '"') {
        if (isEndQuote(i)) {
          i++;
          closed = true;
          break;
        }
        fixes.innerQuotes++;
        out += '"';
        i++;
        continue;
      }
      out += ch;
      i++;
    }
    if (!closed) fail("Unterminated string");
    return out;
  }

  function parseNumber() {
    const m = /^-?\d+(\.\d+)?([eE][+-]?\d+)?/.exec(src.slice(i));
    if (!m) fail("Bad number");
    i += m[0].length;
    return Number(m[0]);
  }

  function skipCommas(closeCh) {
    for (;;) {
      ws();
      if (src[i] !== ",") return;
      let k = i + 1;
      while (k < len && /\s/.test(src[k])) k++;
      if (src[k] === closeCh || src[k] === ",") fixes.trailingCommas++;
      i++;
    }
  }

  function parseArray() {
    const arr = [];
    i++;
    for (;;) {
      ws();
      if (i >= len) fail("Unterminated array");
      if (src[i] === "]") {
        i++;
        return arr;
      }
      arr.push(parseValue());
      skipCommas("]");
    }
  }

  function parseObject() {
    const obj = {};
    i++;
    for (;;) {
      ws();
      if (i >= len) fail("Unterminated object");
      if (src[i] === "}") {
        i++;
        break;
      }
      if (src[i] !== '"') fail("Expected \"key\"");
      const key = parseString();
      ws();
      if (src[i] !== ":") fail('Expected : after key "' + key + '"');
      i++;
      obj[key] = parseValue();
      skipCommas("}");
    }
    return obj;
  }

  function parseValue() {
    ws();
    if (i >= len) fail("Unexpected end of input");
    const ch = src[i];
    if (ch === '"') return parseString();
    if (ch === "{") return parseObject();
    if (ch === "[") return parseArray();
    if (ch === "-" || (ch >= "0" && ch <= "9")) return parseNumber();
    if (src.startsWith("true", i)) {
      i += 4;
      return true;
    }
    if (src.startsWith("false", i)) {
      i += 5;
      return false;
    }
    if (src.startsWith("null", i)) {
      i += 4;
      return null;
    }
    fail("Unexpected value");
  }

  const value = parseValue();
  ws();
  if (i < len) fail("Trailing content after JSON");
  return { value, fixes };
}

export function fixSummary(fixes) {
  const parts = [];
  if (fixes.innerQuotes > 0) parts.push(`${fixes.innerQuotes} inner quote${fixes.innerQuotes === 1 ? "" : "s"}`);
  if (fixes.trailingCommas > 0) parts.push(`${fixes.trailingCommas} trailing comma${fixes.trailingCommas === 1 ? "" : "s"}`);
  if (fixes.comments > 0) parts.push(`${fixes.comments} comment${fixes.comments === 1 ? "" : "s"}`);
  if (parts.length === 0) return "";
  return `Auto-fixed: ${parts.join(", ")}.`;
}
