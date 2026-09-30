import { useEffect, useRef, useState } from "react";
import "./summary.css";

const FILE_NAME = "Strings.pdf";
const WORD = ["s", "t", "r", "i", "n", "g"];

function BackIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M15 5l-7 7 7 7" />
    </svg>
  );
}

function DocIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 2.5h8L19.5 8v13.5a1 1 0 0 1-1 1h-12a1 1 0 0 1-1-1v-18a1 1 0 0 1 1-1z" />
      <path d="M14 2.5V8.5h5.5" />
      <path d="M9 12.5h6M9 16h6" />
    </svg>
  );
}

function BulbIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 18h6M10 21h4" />
      <path d="M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.3 2.2h4.6c.2-.9.6-1.6 1.3-2.2A6 6 0 0 0 12 3z" />
    </svg>
  );
}

function CodeBlock({ label, code, children, copied, onCopy }) {
  return (
    <div className="sum-code">
      <div className="sum-code-bar">
        <span className="sum-code-label">{label}</span>
        <button
          type="button"
          className={copied ? "sum-copy ok" : "sum-copy"}
          onClick={onCopy}
          aria-label={copied ? "Copied" : `Copy ${label} code`}
        >
          {copied ? "✓ COPIED" : "COPY"}
        </button>
      </div>
      <pre className="sum-pre">
        <code>{children}</code>
      </pre>
      <span className="sum-code-hidden" aria-hidden="true">{code}</span>
    </div>
  );
}

export default function Summary() {
  const [view, setView] = useState("lesson");
  const [copied, setCopied] = useState(null);
  const topRef = useRef(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    topRef.current?.scrollIntoView({ block: "start", behavior: reduced ? "auto" : "smooth" });
  }, [view]);

  const copyCode = async (id, text) => {
    try {
      if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(text);
      else throw new Error("no clipboard");
      setCopied(id);
      window.setTimeout(() => setCopied((c) => (c === id ? null : c)), 1500);
    } catch (err) {
      window.console.debug("summary copy skipped", err);
    }
  };

  const quoteCode = `name  = "Ada"
shout = 'It\\'s fun!'
notes = """line one
line two"""`;
  const sliceCode = `word = "string"
word[0:3]   # "str"
word[3:]    # "ing"
word[-1]    # "g"`;
  const methodCode = `msg = "  hello there  "
msg.strip()            # "hello there"
msg.upper()            # "  HELLO THERE  "
"a,b,c".split(",")     # ["a", "b", "c"]`;
  const fstrCode = `name = "Ada"
age = 36
f"{name} is {age}"     # "Ada is 36"`;

  if (view === "pdf") {
    return (
      <div className="sum-wrap" ref={topRef}>
        <div className="sum-top rise">
          <button type="button" className="sum-back" onClick={() => setView("lesson")} aria-label="Back to lesson">
            <BackIcon />
          </button>
          <div className="sum-titlebox">
            <p className="sum-eyebrow">PDF READER</p>
            <h2 className="sum-title sm">{FILE_NAME}</h2>
          </div>
          <span className="sum-pagepill">3 / 12</span>
        </div>

        <div className="sum-paper rise d1">
          <p className="sum-paper-eyebrow">STRINGS · PAGE 1</p>
          <h3 className="sum-paper-title">What is a string?</h3>
          <div className="sum-paper-lines" aria-hidden="true">
            <span style={{ width: "96%" }} /><span style={{ width: "88%" }} />
            <span style={{ width: "93%" }} /><span className="hl" style={{ width: "61%" }} />
            <span style={{ width: "90%" }} /><span style={{ width: "83%" }} />
          </div>
        </div>
        <div className="sum-paper rise d2">
          <p className="sum-paper-eyebrow">STRINGS · PAGE 2</p>
          <h3 className="sum-paper-title">Indexing &amp; slicing</h3>
          <div className="sum-paper-lines" aria-hidden="true">
            <span style={{ width: "91%" }} /><span className="hl" style={{ width: "57%" }} />
            <span style={{ width: "94%" }} /><span style={{ width: "86%" }} />
            <span style={{ width: "78%" }} />
          </div>
        </div>
        <div className="sum-paper rise d3">
          <p className="sum-paper-eyebrow">STRINGS · PAGE 3</p>
          <h3 className="sum-paper-title">Methods &amp; f-strings</h3>
          <div className="sum-paper-lines" aria-hidden="true">
            <span style={{ width: "89%" }} /><span style={{ width: "95%" }} />
            <span className="hl" style={{ width: "64%" }} /><span style={{ width: "81%" }} />
          </div>
        </div>

        <button type="button" className="sum-open rise d4" onClick={() => setView("lesson")}>
          ← BACK TO LESSON
        </button>
        <p className="sum-foot">Full 12-page PDF ships with the course.</p>
      </div>
    );
  }

  return (
    <div className="sum-wrap" ref={topRef}>
      <span className="sum-blob b1" aria-hidden="true" />
      <span className="sum-blob b2" aria-hidden="true" />

      <div className="sum-top rise">
        <button type="button" className="sum-back" onClick={() => {}} aria-label="Back to recap">
          <BackIcon />
        </button>
        <div className="sum-titlebox">
          <h2 className="sum-title">Strings</h2>
        </div>
      </div>

      <button type="button" className="sum-pdf rise d1" onClick={() => setView("pdf")} aria-label={`Open ${FILE_NAME}`}>
        <span className="sum-badge" aria-hidden="true">PDF</span>
        <span className="sum-pdfinfo">
          <span className="sum-filename">{FILE_NAME}</span>
        </span>
        <span className="sum-thumb" aria-hidden="true">
          <span style={{ width: "88%" }} /><span style={{ width: "96%" }} />
          <span className="hl" style={{ width: "58%" }} /><span style={{ width: "80%" }} />
        </span>
        <span className="sum-openbtn"><DocIcon /> OPEN</span>
      </button>

      <section className="sum-flow rise d2">
        <h3 className="sum-h"><span className="sum-ghost" aria-hidden="true">Aa</span>What is a string?</h3>
        <p className="sum-p">A string is a <b>sequence of characters</b> wrapped in quotes. Words, sentences, even emojis — all strings.</p>
        <ul className="sum-ul">
          <li>Made of single characters, read left to right</li>
          <li><b>Immutable</b> — you build new strings, never edit in place</li>
          <li>Empty string <span className="sum-ic">""</span> is still a string</li>
        </ul>
      </section>

      <section className="sum-flow rise d3">
        <h3 className="sum-h">Three ways to quote</h3>
        <CodeBlock label="quotes.py" code={quoteCode} copied={copied === "q"} onCopy={() => copyCode("q", quoteCode)}>
          <span className="c-k">name  </span>= <span className="c-s">"Ada"</span>{'\n'}
          <span className="c-k">shout </span>= <span className="c-s">'It\'s fun!'</span>{'\n'}
          <span className="c-k">notes </span>= <span className="c-s">"""line one{'\n'}line two"""</span>
        </CodeBlock>
        <ul className="sum-ul">
          <li><span className="sum-ic">"..."</span> and <span className="sum-ic">'...'</span> are identical — pick one style</li>
          <li><span className="sum-ic">"""..."""</span> spans multiple lines</li>
        </ul>
      </section>

      <section className="sum-flow rise d4">
        <h3 className="sum-h">Indexing — every letter has a seat</h3>
        <div className="sum-idx" aria-hidden="true">
          {WORD.map((ch, i) => (
            <span className="sum-cell" key={ch}>
              <span className="sum-digit">{i}</span>
              <span className="sum-char">{ch}</span>
            </span>
          ))}
        </div>
        <ul className="sum-ul">
          <li>Counting starts at <span className="sum-ic">0</span> — <span className="sum-ic">word[0]</span> is <span className="sum-ic">"s"</span></li>
          <li>Negative counts from the end — <span className="sum-ic">word[-1]</span> is <span className="sum-ic">"g"</span></li>
        </ul>
      </section>

      <section className="sum-flow rise d4">
        <h3 className="sum-h">Slicing — grab a chunk</h3>
        <CodeBlock label="slice.py" code={sliceCode} copied={copied === "s"} onCopy={() => copyCode("s", sliceCode)}>
          <span className="c-k">word </span>= <span className="c-s">"string"</span>{'\n'}
          <span className="c-k">word</span>[0:3]   <span className="c-c"># "str"</span>{'\n'}
          <span className="c-k">word</span>[3:]    <span className="c-c"># "ing"</span>{'\n'}
          <span className="c-k">word</span>[-1]    <span className="c-c"># "g"</span>
        </CodeBlock>
        <ul className="sum-ul">
          <li><span className="sum-ic">[start:end]</span> includes start, <b>excludes</b> end</li>
          <li>Leave a side blank to run to that edge</li>
        </ul>
      </section>

      <section className="sum-flow rise d4">
        <h3 className="sum-h">Handy methods</h3>
        <CodeBlock label="methods.py" code={methodCode} copied={copied === "m"} onCopy={() => copyCode("m", methodCode)}>
          <span className="c-k">msg </span>= <span className="c-s">"  hello there  "</span>{'\n'}
          <span className="c-k">msg</span>.strip()            <span className="c-c"># "hello there"</span>{'\n'}
          <span className="c-k">msg</span>.upper()            <span className="c-c"># "  HELLO THERE  "</span>{'\n'}
          <span className="c-s">"a,b,c"</span>.<span className="c-k">split</span>(<span className="c-s">","</span>)     <span className="c-c"># ["a", "b", "c"]</span>
        </CodeBlock>
        <ul className="sum-ul">
          <li><span className="sum-ic">.strip()</span> trims edge spaces</li>
          <li><span className="sum-ic">.replace(a, b)</span> swaps every <span className="sum-ic">a</span> for <span className="sum-ic">b</span></li>
          <li>Methods return a <b>new</b> string — the original never changes</li>
        </ul>
      </section>

      <section className="sum-flow rise d4">
        <h3 className="sum-h">f-strings — plug values in</h3>
        <CodeBlock label="fstring.py" code={fstrCode} copied={copied === "f"} onCopy={() => copyCode("f", fstrCode)}>
          <span className="c-k">name </span>= <span className="c-s">"Ada"</span>{'\n'}
          <span className="c-k">age </span>= <span className="c-n">36</span>{'\n'}
          <span className="c-s">f"{'{name}'} is {'{age}'}"</span>     <span className="c-c"># "Ada is 36"</span>
        </CodeBlock>
      </section>

      <div className="sum-tip rise d4">
        <span className="sum-tipicon" aria-hidden="true"><BulbIcon /></span>
        <p><b>TIP ·</b> Quote inside a quote? Switch styles instead of escaping: <span className="sum-ic">'Say "hi"'</span> beats <span className="sum-ic">"Say \"hi\""</span>.</p>
      </div>

      <section className="sum-sec danger rise d4">
        <h3 className="sum-h">Watch out</h3>
        <ul className="sum-ul">
          <li><span className="sum-ic">word[0] = "S"</span> crashes — strings are immutable</li>
          <li><span className="sum-ic">[0:3]</span> gives 3 letters, not 4 — the end is excluded</li>
          <li>Compare text with <span className="sum-ic">==</span>, never <span className="sum-ic">is</span></li>
        </ul>
      </section>

      <section className="sum-sec goal rise d4">
        <h3 className="sum-h">Your turn</h3>
        <p className="sum-p">Make <span className="sum-ic">shout</span> hold <span className="sum-ic">"HELLO!"</span> starting from <span className="sum-ic">greeting = "hello"</span>.</p>
      </section>
    </div>
  );
}
