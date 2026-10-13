// Global settings page for the Codino Agent: connection, model, behaviour,
// appearance and data. All controls are live; destructive ones confirm by toast.

import { useState } from "react";
import { MODELS } from "./data.js";
import { BellIcon, DownloadIcon, KeyIcon, LockIcon, ServerIcon, TrashIcon } from "./icons.jsx";
import { AgRow, AgSeg, AgSheet, AgSwitch } from "./bits.jsx";
const POSTURES = [
  { id: "ask", label: "Ask" },
  { id: "auto", label: "Auto" },
  { id: "deny", label: "Deny" },
];

const THEMES = [
  { id: "system", label: "System" },
  { id: "light", label: "Light" },
  { id: "dark", label: "Dark" },
];

const ACCENTS = ["#1cb0f6", "#58cc02", "#7b61b8", "#ff9600", "#e5484d"];

export function SettingsView({ toast }) {
  const [url, setUrl] = useState("https://api.codino.dev");
  const [key, setKey] = useState("ck_live_9f27…");
  const [model, setModel] = useState("auto");
  const [temp, setTemp] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(4096);
  const [posture, setPosture] = useState("ask");
  const [theme, setTheme] = useState("system");
  const [accent, setAccent] = useState(0);
  const [fontSize, setFontSize] = useState(1);
  const [streaming, setStreaming] = useState(true);
  const [haptics, setHaptics] = useState(true);
  const [sounds, setSounds] = useState(false);
  const [lock, setLock] = useState(false);
  const [diag, setDiag] = useState(false);
  const [licenses, setLicenses] = useState(false);
  const [timeout, setTimeout] = useState(30);
  const [retries, setRetries] = useState(3);
  const [cellular, setCellular] = useState(true);
  const [incognito, setIncognito] = useState(false);
  const [clearExit, setClearExit] = useState(false);
  const [analytics, setAnalytics] = useState(true);

  return (
    <>
      <div className="ag-set">
        <div className="ag-group rise">
          <p className="ag-group-k">Connection</p>
          <label className="ag-flabel" htmlFor="ag-url">
            Server URL
          </label>
          <input
            id="ag-url"
            className="ag-textin"
            value={url}
            maxLength={80}
            onChange={(e) => setUrl(e.target.value)}
            inputMode="url"
          />
          <label className="ag-flabel" htmlFor="ag-key">
            API key
          </label>
          <input
            id="ag-key"
            className="ag-textin"
            value={key}
            maxLength={80}
            onChange={(e) => setKey(e.target.value)}
            autoComplete="off"
          />
          <div style={{ padding: "10px 0 12px" }}>
            <button type="button" className="ag-btn primary full" onClick={() => toast("Connected · 42ms")}>
              Test connection
            </button>
          </div>
        </div>

        <div className="ag-group rise d1">
          <p className="ag-group-k">Model</p>
          {MODELS.map((m) => (
            <button
              key={m.id}
              type="button"
              className={model === m.id ? "ag-modelrow on" : "ag-modelrow"}
              aria-pressed={model === m.id}
              onClick={() => setModel(m.id)}
            >
              <span className="ag-radio" aria-hidden="true" />
              <span className="ag-row-b">
                <span className="ag-row-t">{m.name}</span>
                <span className="ag-row-s">{m.desc}</span>
              </span>
            </button>
          ))}
          <div className="ag-slider">
            <div className="ag-slider-head">
              <b>Temperature</b>
              <span>{temp.toFixed(1)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.1}
              value={temp}
              aria-label="Temperature"
              onChange={(e) => setTemp(Number(e.target.value))}
            />
          </div>
          <div className="ag-slider">
            <div className="ag-slider-head">
              <b>Max tokens</b>
              <span>{maxTokens}</span>
            </div>
            <input
              type="range"
              min={1024}
              max={8192}
              step={1024}
              value={maxTokens}
              aria-label="Max tokens"
              onChange={(e) => setMaxTokens(Number(e.target.value))}
            />
          </div>
        </div>

        <div className="ag-group rise d2">
          <p className="ag-group-k">Permissions</p>
          <AgSeg options={POSTURES} value={posture} onChange={setPosture} label="Default permission posture" />
          <AgRow
            icon={<ServerIcon />}
            title="Streaming"
            sub={streaming ? "token by token" : "full replies only"}
            right={<AgSwitch on={streaming} onToggle={() => setStreaming((v) => !v)} label="Streaming" />}
          />
          <AgRow
            icon={<BellIcon />}
            title="Haptics"
            sub={haptics ? "tick on stream start" : "off"}
            right={<AgSwitch on={haptics} onToggle={() => setHaptics((v) => !v)} label="Haptics" />}
          />
          <AgRow
            icon={<BellIcon />}
            title="Sounds"
            sub={sounds ? "on" : "off"}
            right={<AgSwitch on={sounds} onToggle={() => setSounds((v) => !v)} label="Sounds" />}
          />
          <AgRow
            icon={<LockIcon />}
            title="App lock"
            sub={lock ? "biometric on launch" : "off"}
            right={<AgSwitch on={lock} onToggle={() => setLock((v) => !v)} label="App lock" />}
          />
        </div>

        <div className="ag-group rise d3">
          <p className="ag-group-k">Appearance</p>
          <AgSeg options={THEMES} value={theme} onChange={setTheme} label="Theme" />
          <div className="ag-dots" role="group" aria-label="Accent color">
            {ACCENTS.map((c, i) => (
              <button
                key={c}
                type="button"
                className={accent === i ? "ag-dot on" : "ag-dot"}
                style={{ background: c }}
                aria-label={`Accent ${i + 1}`}
                aria-pressed={accent === i}
                onClick={() => setAccent(i)}
              />
            ))}
          </div>
          <AgRow
            icon={<KeyIcon />}
            title="Text size"
            right={
              <span className="ag-stepper">
                <button type="button" className="ag-stepbtn" onClick={() => setFontSize((v) => Math.max(0, v - 1))} aria-label="Smaller text">
                  −
                </button>
                <b>{["S", "M", "L"][fontSize]}</b>
                <button type="button" className="ag-stepbtn" onClick={() => setFontSize((v) => Math.min(2, v + 1))} aria-label="Larger text">
                  +
                </button>
              </span>
            }
          />
        </div>

        <div className="ag-group rise d4">
          <p className="ag-group-k">Network</p>
          <AgRow
            icon={<ServerIcon />}
            title="Timeout"
            right={
              <span className="ag-stepper">
                <button type="button" className="ag-stepbtn" onClick={() => setTimeout((v) => Math.max(10, v - 5))} aria-label="Shorter timeout">
                  −
                </button>
                <b>{timeout}s</b>
                <button type="button" className="ag-stepbtn" onClick={() => setTimeout((v) => Math.min(120, v + 5))} aria-label="Longer timeout">
                  +
                </button>
              </span>
            }
          />
          <AgRow
            icon={<ServerIcon />}
            title="Retries"
            right={
              <span className="ag-stepper">
                <button type="button" className="ag-stepbtn" onClick={() => setRetries((v) => Math.max(0, v - 1))} aria-label="Fewer retries">
                  −
                </button>
                <b>{retries}</b>
                <button type="button" className="ag-stepbtn" onClick={() => setRetries((v) => Math.min(9, v + 1))} aria-label="More retries">
                  +
                </button>
              </span>
            }
          />
          <AgRow
            icon={<ServerIcon />}
            title="Cellular data"
            sub={cellular ? "on" : "off"}
            right={<AgSwitch on={cellular} onToggle={() => setCellular((v) => !v)} label="Cellular data" />}
          />
        </div>

        <div className="ag-group rise d4">
          <p className="ag-group-k">Privacy</p>
          <AgRow
            icon={<LockIcon />}
            title="Incognito"
            sub={incognito ? "no history written" : "off"}
            right={<AgSwitch on={incognito} onToggle={() => setIncognito((v) => !v)} label="Incognito mode" />}
          />
          <AgRow
            icon={<TrashIcon />}
            title="Clear on exit"
            sub={clearExit ? "on" : "off"}
            right={<AgSwitch on={clearExit} onToggle={() => setClearExit((v) => !v)} label="Clear on exit" />}
          />
          <AgRow
            icon={<BellIcon />}
            title="Analytics"
            sub={analytics ? "on" : "off"}
            right={<AgSwitch on={analytics} onToggle={() => setAnalytics((v) => !v)} label="Analytics" />}
          />
        </div>

        <div className="ag-group rise d4">
          <p className="ag-group-k">Data</p>
          <AgRow icon={<DownloadIcon />} title="Export data" onClick={() => toast("Exported")} />
          <AgRow icon={<TrashIcon />} title="Clear cache" onClick={() => toast("Cache cleared")} />
          <AgRow icon={<ServerIcon />} title="Health check" sub="probe server caps" onClick={() => setDiag(true)} />
          <div className="ag-health">
            <span className="pulse" />
            All systems normal
          </div>
        </div>

        <div className="ag-group rise d4">
          <p className="ag-group-k">About</p>
          <AgRow title="Version" sub="Codino 1 · build 4021" />
          <AgRow title="Licenses" sub="open source" onClick={() => setLicenses(true)} />
        </div>
      </div>

      {licenses ? (
        <AgSheet title="Licenses" onClose={() => setLicenses(false)}>
          <AgRow title="React" sub="MIT" />
          <AgRow title="KaTeX" sub="MIT" />
          <AgRow title="Codino SDK" sub="Apache-2.0" />
        </AgSheet>
      ) : null}

      {diag ? (
        <AgSheet title="Diagnostics" onClose={() => setDiag(false)}>
          <AgRow title="Latency" sub="42ms" />
          <AgRow title="Tools exposed" sub="14 · edit, run, read, web" />
          <AgRow title="Context window" sub="200k tokens" />
          <AgRow title="Version" sub="Codino 1 · build 4021" />
        </AgSheet>
      ) : null}
    </>
  );
}
