import { useCallback, useEffect, useRef, useState } from "react";
import {
  buildGaps,
  buildSingleGap,
  scoreGaps,
  segmentsFromOffsets,
  splitSentences,
  SINGLE_TIME_SEC,
  PASSAGE_TIME_SEC,
  PASSAGE_GAP_COUNT,
  PASSAGE_EASY_COUNT,
} from "../gapsEngine.js";
import { sendCodinoMessage, isCodinoConfigured } from "../ai/zynq.js";
import { tolerantParse } from "../tolerantJson.js";
import gapsPrompt from "../data/gapsDetPrompt.md?raw";
import SaveLink from "./SaveLink.jsx";
import "../gaps.css";

/* Isolated DET-style fill-in-the-gaps game. Own screen + own CSS file so the
   whole mode deletes cleanly. AI supplies raw text only; gapsEngine picks
   every gap. Instant per-round banners, no results screen. */

const GAPS_PIN = "246810";

const MOODS = [
  "a quiet morning routine",
  "a city park at dusk",
  "a small neighborhood bakery",
  "a rainy bus commute",
  "an old public library",
  "a beach cleanup morning",
  "a night market",
  "a mountain hiking trip",
  "a school science fair",
  "a visit to grandparents",
  "a neighborhood power outage",
  "a community garden",
];

function playSfx(ok) {
  try {
    const a = new Audio(ok ? "/audio/correct1.wav" : "/audio/error.wav");
    const p = a.play();
    if (p && typeof p.catch === "function") p.catch(() => {});
  } catch {
    /* Audio unavailable (autoplay policy, missing file) — game continues. */
  }
}

function formatClock(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  return `${m}:${String(s % 60).padStart(2, "0")}`;
}

function ClockIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
      <circle cx="10" cy="10" r="8" fill="none" stroke="currentColor" strokeWidth="2" />
      <path
        d="M10 5.5V10l3 1.8"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/* One gap: shown-letter cells + one input per missing letter. */
function GapField({ gap, chars, disabled, mark, onChar, onKey, regRef }) {
  const boxes = [];
  for (let k = 0; k < gap.boxes; k++) {
    const state =
      mark === null ? "" : mark ? " right" : " wrong";
    boxes.push(
      <input
        key={k}
        ref={(el) => regRef(gap.id, k, el)}
        className={`gz-cell in${state}`}
        type="text"
        inputMode="text"
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        spellCheck={false}
        maxLength={1}
        disabled={disabled}
        value={chars[k] || ""}
        aria-label={`Letter ${k + 1} of ${gap.boxes} for ${gap.answer.length}-letter word`}
        onChange={(e) => onChar(gap.id, k, e.target.value)}
        onKeyDown={(e) => onKey(gap.id, k, e)}
      />
    );
  }
  return (
    <span className="gz-gap" role="group" aria-label={`Incomplete word, ${gap.boxes} letters missing`}>
      {gap.shown.split("").map((ch, i) => (
        <span
          key={`s${i}`}
          className={`gz-cell${mark === null ? "" : mark ? " right" : " wrong"}`}
          aria-hidden="true"
        >
          {ch}
        </span>
      ))}
      {boxes}
    </span>
  );
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="11" cy="11" r="10" fill="currentColor" />
      <path
        d="M6.5 11.5l3 3 6-7"
        fill="none"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CrossIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" aria-hidden="true">
      <circle cx="11" cy="11" r="10" fill="currentColor" />
      <path
        d="M8 8l6 6M14 8l-6 6"
        stroke="#fff"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PinPad({ onUnlock }) {
  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [bad, setBad] = useState(false);
  const refs = useRef({});

  const setDigit = (k, v) => {
    const ch = String(v || "").replace(/[^0-9]/g, "").slice(-1);
    setDigits((d) => {
      const next = d.slice();
      next[k] = ch;
      return next;
    });
    setBad(false);
    if (ch && k < 5) {
      const el = refs.current[k + 1];
      if (el) el.focus();
    }
  };

  const onDigitKey = (k, e) => {
    if (e.key === "Backspace" && !digits[k] && k > 0) {
      const el = refs.current[k - 1];
      if (el) el.focus();
    }
    if (e.key === "Enter") tryUnlock(digits.join(""));
  };

  const tryUnlock = (code) => {
    if (code === GAPS_PIN) {
      onUnlock();
      return;
    }
    setBad(true);
    window.setTimeout(() => {
      setDigits(["", "", "", "", "", ""]);
      setBad(false);
      const el = refs.current[0];
      if (el) el.focus();
    }, 450);
  };

  const full = digits.every((d) => d !== "");
  return (
    <div className="gz-overlay" role="presentation">
      <div
        className="gz-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Enter PIN to unlock AI generation"
      >
        <h2>One-time PIN</h2>
        <p>Enter the PIN once to unlock AI passage generation for this visit.</p>
        <div className={`gz-pin-row${bad ? " bad" : ""}`}>
          {digits.map((d, k) => (
            <input
              key={k}
              ref={(el) => {
                if (el) refs.current[k] = el;
                else delete refs.current[k];
              }}
              className="gz-digit"
              type="text"
              inputMode="numeric"
              autoComplete="off"
              maxLength={1}
              value={d}
              aria-label={`PIN digit ${k + 1} of 6`}
              onChange={(e) => setDigit(k, e.target.value)}
              onKeyDown={(e) => onDigitKey(k, e)}
            />
          ))}
        </div>
        <p className="gz-hint">Demo PIN: {GAPS_PIN}</p>
        <div className="gz-row">
          <button
            type="button"
            className={`gz-submit${full ? " ready" : ""}`}
            disabled={!full}
            onClick={() => tryUnlock(digits.join(""))}
          >
            UNLOCK
          </button>
        </div>
      </div>
    </div>
  );
}

export default function GapsScreen({ mode, testData, onExit }) {
  const gapsMode = testData && testData.mode ? testData.mode : mode || "single";
  const [unlocked, setUnlocked] = useState(!!testData);
  const [phase, setPhase] = useState(testData ? "loading" : "pin");
  const [round, setRound] = useState(null);
  const [roundKey, setRoundKey] = useState(0);
  const [typed, setTyped] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [errMsg, setErrMsg] = useState("");
  const [prog, setProg] = useState(null); // batch progress {pos,total,correct} | null

  const roundRef = useRef(null);
  const typedRef = useRef({});
  const doneRef = useRef(false);
  const timeRef = useRef(0);
  const boxRefs = useRef({});
  const abortRef = useRef(null);
  const batchRef = useRef(null);

  roundRef.current = round;
  typedRef.current = typed;

  useEffect(
    () => () => {
      if (abortRef.current) abortRef.current.abort();
    },
    []
  );

  const regBox = useCallback((gid, k, el) => {
    const key = `${gid}:${k}`;
    if (el) boxRefs.current[key] = el;
    else delete boxRefs.current[key];
  }, []);

  const focusBox = useCallback((gid, k) => {
    const r = roundRef.current;
    if (!r) return false;
    if (k < 0) return false;
    const g = r.gaps[gid];
    if (g && k < g.boxes) {
      const el = boxRefs.current[`${gid}:${k}`];
      if (el) {
        el.focus();
        return true;
      }
      return false;
    }
    const next = r.gaps[gid + 1];
    if (next) {
      const el = boxRefs.current[`${gid + 1}:0`];
      if (el) {
        el.focus();
        return true;
      }
    }
    if (document.activeElement && document.activeElement.blur) {
      document.activeElement.blur();
    }
    return false;
  }, []);

  const setBox = useCallback(
    (gid, k, raw) => {
      const r = roundRef.current;
      if (!r || result) return;
      const g = r.gaps[gid];
      if (!g) return;
      const ch = String(raw || "").replace(/[^a-z]/gi, "").slice(-1);
      setTyped((t) => {
        const cur = String(t[gid] || "").split("");
        while (cur.length <= k) cur.push("");
        cur[k] = ch;
        return { ...t, [gid]: cur.slice(0, g.boxes).join("") };
      });
      if (ch) focusBox(gid, k + 1);
    },
    [result, focusBox]
  );

  const onBoxKey = useCallback(
    (gid, k, e) => {
      if (result) return;
      if (e.key === "Backspace") {
        const cur = String(typedRef.current[gid] || "");
        if (!cur[k]) {
          e.preventDefault();
          if (k > 0) focusBox(gid, k - 1);
          else if (gid > 0) {
            const prev = roundRef.current ? roundRef.current.gaps[gid - 1] : null;
            if (prev) focusBox(gid - 1, prev.boxes - 1);
          }
        }
        return;
      }
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        if (k > 0) focusBox(gid, k - 1);
        else if (gid > 0) {
          const prev = roundRef.current ? roundRef.current.gaps[gid - 1] : null;
          if (prev) focusBox(gid - 1, prev.boxes - 1);
        }
        return;
      }
      if (e.key === "ArrowRight") {
        e.preventDefault();
        focusBox(gid, k + 1);
        return;
      }
      if (e.key === "Enter" && submittable()) {
        e.preventDefault();
        doSubmit(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [result]
  );

  const submittable = () => {
    const r = roundRef.current;
    if (!r || result) return false;
    return r.gaps.every((g) => String(typedRef.current[g.id] || "").length === g.boxes);
  };

  const doSubmit = useCallback(
    (auto) => {
      const r = roundRef.current;
      if (!r || doneRef.current) return;
      doneRef.current = true;
      const s = scoreGaps(r.gaps, typedRef.current);
      setResult({ ...s, auto: !!auto });
      playSfx(s.correct === s.total);
    },
    []
  );

  useEffect(() => {
    if (!round || result) return;
    const id = window.setInterval(() => {
      timeRef.current -= 1;
      setTimeLeft(timeRef.current);
      if (timeRef.current <= 0) {
        window.clearInterval(id);
        doSubmit(true);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [roundKey, result, doSubmit, round]);

  const buildBatch = useCallback(
    async (signal) => {
      if (!isCodinoConfigured()) {
        throw new Error(
          "AI is not configured. Set VITE_ZYNQ_URL and VITE_ZYNQ_SECRET in .env (and Netlify) then rebuild."
        );
      }
      const moods = MOODS.slice();
      let lastErr = "AI generation failed. Try again.";
      for (let attempt = 0; attempt < 2; attempt++) {
        if (signal && signal.aborted) throw new Error("Cancelled.");
        const mood = moods.splice(Math.floor(Math.random() * moods.length), 1)[0];
        let raw = "";
        try {
          raw = await sendCodinoMessage({
            messages: [
              { role: "system", content: gapsPrompt },
              { role: "user", content: `MODE: single\nMOOD: ${mood}\nOutput JSON only.` },
            ],
            extra: { max_tokens: 1200 },
          });
        } catch (e) {
          lastErr = (e && e.message) || lastErr;
          continue;
        }
        let arr = null;
        try {
          const parsed = tolerantParse(raw);
          const v = parsed && parsed.value !== undefined ? parsed.value : parsed;
          if (v && Array.isArray(v.sentences)) arr = v.sentences;
          else throw new Error("AI returned no sentences array.");
        } catch (e) {
          lastErr = (e && e.message) || lastErr;
          continue;
        }
        const items = [];
        const seen = new Set();
        for (const s of arr.slice(0, 12)) {
          if (typeof s !== "string" || !s.trim()) continue;
          const key = s.trim().toLowerCase();
          if (seen.has(key)) continue;
          try {
            const built = buildSingleGap(s.trim());
            seen.add(key);
            items.push({ text: s.trim(), gaps: built.gaps, segments: built.segments });
            if (items.length >= 10) break;
          } catch {
            /* dud sentence, skip it */
          }
        }
        if (items.length > 0) return items;
        lastErr = "AI returned no usable sentences.";
      }
      throw new Error(lastErr);
    },
    []
  );

  const buildRound = useCallback(
    async (signal) => {
      if (!isCodinoConfigured()) {
        throw new Error(
          "AI is not configured. Set VITE_ZYNQ_URL and VITE_ZYNQ_SECRET in .env (and Netlify) then rebuild."
        );
      }
      const moods = MOODS.slice();
      let lastErr = "AI generation failed. Try again.";
      for (let attempt = 0; attempt < 2; attempt++) {
        if (signal && signal.aborted) throw new Error("Cancelled.");
        const mood = moods.splice(Math.floor(Math.random() * moods.length), 1)[0];
        let raw = "";
        try {
          raw = await sendCodinoMessage({
            messages: [
              { role: "system", content: gapsPrompt },
              { role: "user", content: `MODE: passage\nMOOD: ${mood}\nOutput JSON only.` },
            ],
            extra: { max_tokens: 1500 },
          });
        } catch (e) {
          lastErr = (e && e.message) || lastErr;
          continue;
        }
        let v = null;
        try {
          const parsed = tolerantParse(raw);
          v = parsed && parsed.value !== undefined ? parsed.value : parsed;
        } catch (e) {
          lastErr = (e && e.message) || lastErr;
          continue;
        }
        try {
          const title = v && typeof v.title === "string" ? v.title.trim() : "";
          const paras = v && Array.isArray(v.paragraphs) ? v.paragraphs : [];
          const sentences = paras.flatMap((p) => splitSentences(p));
          if (sentences.length < 3) throw new Error("AI returned too little text.");
          const built = buildGaps(sentences, PASSAGE_GAP_COUNT, PASSAGE_EASY_COUNT);
          return {
            id: `GAPS-PASSAGE-${Date.now()}`,
            section: "gaps",
            mode: "passage",
            text: sentences.join(" "),
            title,
            gaps: built.gaps,
            segments: built.segments,
            timeSeconds: PASSAGE_TIME_SEC,
          };
        } catch (e) {
          lastErr = (e && e.message) || lastErr;
        }
      }
      throw new Error(lastErr);
    },
    []
  );

  const loadItem = (i, wasCorrect) => {
    const b = batchRef.current;
    if (!b || !b.items[i]) return;
    setTyped({});
    typedRef.current = {};
    doneRef.current = false;
    boxRefs.current = {};
    const it = b.items[i];
    const r = {
      id: `GAPS-SINGLE-${Date.now()}-${i}`,
      section: "gaps",
      mode: "single",
      text: it.text,
      title: "",
      gaps: it.gaps,
      segments: it.segments,
      timeSeconds: SINGLE_TIME_SEC,
    };
    timeRef.current = r.timeSeconds;
    setTimeLeft(r.timeSeconds);
    setRound(r);
    roundRef.current = r;
    setRoundKey((k) => k + 1);
    setResult(null);
    setProg((p) => ({
      pos: i,
      total: b.items.length,
      correct: (p ? p.correct : 0) + (wasCorrect ? 1 : 0),
    }));
  };

  const next = () => {
    const b = batchRef.current;
    if (b && prog && result && prog.pos + 1 < b.items.length) {
      loadItem(prog.pos + 1, result.correct === result.total);
      return;
    }
    if (testData) again();
    else startRound(gapsMode);
  };

  const startRound = useCallback(
    async (m) => {
      if (abortRef.current) abortRef.current.abort();
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      setPhase("loading");
      setErrMsg("");
      setResult(null);
      setTyped({});
      typedRef.current = {};
      doneRef.current = false;
      boxRefs.current = {};
      try {
        if (m === "single") {
          const items = await buildBatch(ctrl.signal);
          if (ctrl.signal.aborted) return;
          batchRef.current = { items };
          loadItem(0, false);
        } else {
          const r = await buildRound(ctrl.signal);
          if (ctrl.signal.aborted) return;
          batchRef.current = null;
          setProg(null);
          timeRef.current = r.timeSeconds;
          setTimeLeft(r.timeSeconds);
          setRound(r);
          roundRef.current = r;
          setRoundKey((k) => k + 1);
        }
        setPhase("play");
      } catch (e) {
        if (ctrl.signal.aborted) return;
        setErrMsg((e && e.message) || "Could not start a round.");
        setPhase("error");
      }
    },
    [buildRound, buildBatch]
  );

  useEffect(() => {
    if (!testData) return;
    try {
      const built = segmentsFromOffsets(testData.text, testData.gaps);
      const r = {
        id: testData.id || "GAPS-SHARED-1",
        section: "gaps",
        mode: testData.mode === "passage" ? "passage" : "single",
        text: String(testData.text || ""),
        title: String(testData.title || ""),
        gaps: built.gaps,
        segments: built.segments,
        timeSeconds:
          Number(testData.timeSeconds) > 0
            ? Number(testData.timeSeconds)
            : testData.mode === "passage"
              ? PASSAGE_TIME_SEC
              : SINGLE_TIME_SEC,
      };
      timeRef.current = r.timeSeconds;
      setTimeLeft(r.timeSeconds);
      setRound(r);
      roundRef.current = r;
      setRoundKey((k) => k + 1);
      setPhase("play");
    } catch (e) {
      setErrMsg((e && e.message) || "This shared gaps test is damaged.");
      setPhase("error");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const again = () => {
    if (testData) {
      setTyped({});
      typedRef.current = {};
      doneRef.current = false;
      boxRefs.current = {};
      timeRef.current = roundRef.current ? roundRef.current.timeSeconds : 0;
      setTimeLeft(timeRef.current);
      setResult(null);
      setRoundKey((k) => k + 1);
      return;
    }
    startRound(gapsMode);
  };

  if (phase === "pin" && !unlocked) {
    return (
      <div className="gz-wrap">
        <PinPad
          onUnlock={() => {
            setUnlocked(true);
            startRound(gapsMode);
          }}
        />
      </div>
    );
  }

  if (phase === "loading" || !round) {
    return (
      <div className="gz-wrap">
        <div className="gz-card">
          <div className="gz-top">
            <span className="gz-timer">
              <ClockIcon /> --:--
            </span>
            <button type="button" className="gz-x" aria-label="Exit gaps" onClick={onExit}>
              ✕
            </button>
          </div>
          <div className="gz-load" role="status">
            <div className="gz-spin" aria-hidden="true" />
            <p>{phase === "error" ? "Something went wrong." : "Dreaming up your text…"}</p>
          </div>
        </div>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="gz-wrap">
        <div className="gz-card">
          <div className="gz-top">
            <span className="gz-timer">
              <ClockIcon /> --:--
            </span>
            <button type="button" className="gz-x" aria-label="Exit gaps" onClick={onExit}>
              ✕
            </button>
          </div>
          <div className="gz-err" role="alert">
            <h2>Couldn&apos;t start that round</h2>
            <p>{errMsg}</p>
            <div className="gz-row">
              <button type="button" className="gz-btn ghost" onClick={onExit}>
                BACK
              </button>
              <button
                type="button"
                className="gz-btn go"
                onClick={() => (testData ? again() : startRound(gapsMode))}
              >
                RETRY
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const single = gapsMode === "single";
  const lowAt = single ? 10 : 30;
  const ready = !result && round.gaps.every((g) => String(typed[g.id] || "").length === g.boxes);
  const shareObject = {
    id: round.id,
    title: round.title || "Gaps Practice",
    section: "gaps",
    mode: gapsMode,
    timeSeconds: round.timeSeconds,
    text: round.text,
    gaps: round.gaps.map((g) => ({ answer: g.answer, shown: g.shown, start: g.start })),
  };

  return (
    <div className="gz-wrap">
      <div className="gz-card">
        <div className="gz-top">
          <span className={`gz-timer${timeLeft <= lowAt ? " low" : ""}`}>
            <ClockIcon /> {formatClock(timeLeft)} <span>for this question</span>
          </span>
          <div className="gz-top-right">
            <SaveLink testData={shareObject} />
            <button type="button" className="gz-x" aria-label="Exit gaps" onClick={onExit}>
              ✕
            </button>
          </div>
        </div>
        <div className="gz-body">
          <h1 className="gz-title">
            {single ? "Complete the sentence with the correct word" : "Complete the text with the correct words"}
          </h1>
          {prog ? (
            <p className="gz-batch">
              Sentence {prog.pos + 1} of {prog.total} · {prog.correct} correct
            </p>
          ) : null}
          {round.title ? <h2 className="gz-pass-title">{round.title}</h2> : null}
          <p className="gz-text">
            {round.segments.map((seg, i) => {
              if (seg.t !== undefined) return <span key={i}>{seg.t}</span>;
              const g = round.gaps[seg.gap];
              const chars = String(typed[g.id] || "");
              const mark = result ? result.per[g.id] : null;
              return (
                <GapField
                  key={`g${g.id}`}
                  gap={g}
                  chars={chars}
                  disabled={!!result}
                  mark={mark}
                  onChar={setBox}
                  onKey={onBoxKey}
                  regRef={regBox}
                />
              );
            })}
          </p>
        </div>
        {!result && (
          <div className="gz-foot">
            <button
              type="button"
              className={`gz-submit${ready ? " ready" : ""}`}
              disabled={!ready}
              onClick={() => doSubmit(false)}
            >
              SUBMIT
            </button>
          </div>
        )}
        {result && (
          <ResultBanner
            result={result}
            round={round}
            onNext={next}
          />
        )}
      </div>
    </div>
  );
}

function ResultBanner({ result, round, onNext }) {
  const { correct, total } = result;
  const kind = correct === total ? "ok" : correct === 0 ? "no" : "mid";
  const head =
    kind === "ok" ? (
      <>
        <CheckIcon /> Great job!
      </>
    ) : kind === "no" ? (
      <>
        <CrossIcon /> Incorrect
      </>
    ) : (
      <>
        <CheckIcon /> Partially correct
      </>
    );
  return (
    <div className={`gz-banner ${kind}`} role="status">
      <div>
        <p className="gz-banner-title">{head}</p>
        {kind !== "ok" && (
          <>
            <p className="gz-answer-label">Correct Answer:</p>
            <p className="gz-answer">
              {round.segments.map((seg, i) => {
                if (seg.t !== undefined) return <span key={i}>{seg.t}</span>;
                const g = round.gaps[seg.gap];
                return <strong key={`a${g.id}`}>{g.answer}</strong>;
              })}
            </p>
          </>
        )}
      </div>
      <button
        type="button"
        className="gz-go"
        onClick={onNext}
        autoFocus
      >
        {kind === "ok" ? "CONTINUE" : "GOT IT"}
      </button>
    </div>
  );
}
