import { useState } from "react";
import SupportersWall from "./supporter_wall/SupportersWall.jsx";

const FOLDERS = [
  {
    id: "supporters",
    title: "Supporters Wall",
    desc: "Monthly donor wall targets",
    icon: "♥",
    screens: [
      { id: "sw-main", title: "Supporters Wall", desc: "Spotlight, ranked donors, foot CTA.", Comp: SupportersWall },
    ],
  },
];

function FolderIcon({ glyph }) {
  return (
    <span className="tst-folder-icon" aria-hidden="true">
      {glyph}
    </span>
  );
}

export default function Testing() {
  const [folderId, setFolderId] = useState(null);
  const [screenId, setScreenId] = useState(null);
  const folder = FOLDERS.find((f) => f.id === folderId) || null;
  const screen = folder
    ? folder.screens.find((s) => s.id === screenId) || null
    : null;

  const openScreen = (s) => {
    setScreenId(s.id);
    window.scrollTo(0, 0);
  };
  const closeScreen = () => setScreenId(null);

  return (
    <div className="tst-page">
      <div className="tst-inner">
        <p className="tst-secret rise">SECRET · DEVELOPERS ONLY</p>
        <h1 className="tst-title rise d1">Testing ground</h1>
        <p className="tst-sub rise d2">
          {folder
            ? folder.desc
            : "Mobile design targets. Open a folder, then a screen for the full-size fixed look."}
        </p>

        {!folder ? (
          <div className="tst-grid">
            {FOLDERS.map((f, i) => (
              <button
                key={f.id}
                type="button"
                className={`tst-folder-card rise d${Math.min(i + 1, 4)}`}
                onClick={() => {
                  setFolderId(f.id);
                  window.scrollTo(0, 0);
                }}
              >
                <FolderIcon glyph={f.icon} />
                <span className="tst-folder-title">{f.title}</span>
                <span className="tst-folder-meta">
                  {f.screens.length} screens · {f.desc}
                </span>
                <span className="tst-folder-go" aria-hidden="true">▸</span>
              </button>
            ))}
          </div>
        ) : (
          <>
            <button
              type="button"
              className="flag-btn tst-back"
              onClick={() => {
                setFolderId(null);
                window.scrollTo(0, 0);
              }}
            >
              <span>← All folders</span>
            </button>
            <h2 className="tst-folder-head rise">
              {folder.title}
              <span className="count-pill">{folder.screens.length}</span>
            </h2>
            <div className="tst-grid">
              {folder.screens.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className={`tst-screen-card rise d${Math.min(i + 1, 4)}`}
                  onClick={() => openScreen(s)}
                >
                  <span className="tst-thumb" aria-hidden="true">
                    <span className="tst-thumb-bar" />
                    <span className="tst-thumb-bar short" />
                    <span className="tst-thumb-pill" />
                  </span>
                  <span className="tst-screen-title">{s.title}</span>
                  <span className="tst-screen-desc">{s.desc}</span>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {screen && (
        <div className="tst-overlay" onClick={closeScreen}>
          <div
            className="tst-phone"
            role="dialog"
            aria-modal="true"
            aria-label={screen.title}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="tst-notch" aria-hidden="true" />
            <button
              type="button"
              className="modal-close tst-close"
              aria-label="Close preview"
              onClick={closeScreen}
            >
              ✕
            </button>
            <p className="tst-phone-title">{screen.title}</p>
            <div className="tst-phone-screen">
              <screen.Comp tab={screen.tab} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
