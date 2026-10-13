// Files surface: workspace browser, highlighted viewer with search,
// on-device editor with dirty state, mock upload, version history.

import { useState } from "react";
import { FILES, FILE_VERSIONS } from "./data.js";
import { CheckIcon, DownloadIcon, PlusIcon } from "./icons.jsx";
import { AgSheet } from "./bits.jsx";

export function FilesView({ toast }) {
  const [files, setFiles] = useState(FILES);
  const [openId, setOpenId] = useState(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [query, setQuery] = useState("");
  const [versions, setVersions] = useState(false);
  const [uploading, setUploading] = useState(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);

  const file = openId ? files.find((f) => f.id === openId) || null : null;
  const dirty = editing && file && draft !== file.body;

  const open = (f) => {
    setOpenId(f.id);
    setDraft(f.body);
    setEditing(false);
    setQuery("");
    setConfirmDiscard(false);
  };

  const save = () => {
    if (!file) return;
    setFiles((prev) => prev.map((f) => (f.id === file.id ? { ...f, body: draft } : f)));
    setEditing(false);
    toast("Saved");
  };

  const upload = () => {
    setUploading(0);
    const iv = window.setInterval(() => {
      setUploading((p) => {
        if (p === null) {
          window.clearInterval(iv);
          return null;
        }
        if (p >= 100) {
          window.clearInterval(iv);
          window.setTimeout(() => setUploading(null), 400);
          toast("Uploaded");
          return 100;
        }
        return p + 25;
      });
    }, 220);
  };

  const lines = file ? file.body.split("\n") : [];
  const needle = query.trim().toLowerCase();
  const shown = needle ? lines.filter((l) => l.toLowerCase().includes(needle)) : lines;

  return (
    <>
      <div className="ag-crumb">
        workspace <b>/</b> {file ? <b>{file.path}</b> : <b>browse</b>}
        {dirty ? <span className="ag-dirty" title="Unsaved changes" /> : null}
      </div>
      <div className="ag-body" style={{ background: "var(--ag-panel)" }}>
        {!file ? (
          <div className="ag-file-list">
            {files.map((f) => (
              <button key={f.id} type="button" className="ag-file-row rise" onClick={() => open(f)}>
                <span className="ag-file-ic">{f.kind}</span>
                <span className="ag-row-b">
                  <span className="ag-row-t">{f.path}</span>
                  <span className="ag-row-s">{f.size}</span>
                </span>
              </button>
            ))}
            <button type="button" className="ag-file-row rise" onClick={upload}>
              <span className="ag-file-ic">
                <PlusIcon />
              </span>
              <span className="ag-row-b">
                <span className="ag-row-t">Upload file</span>
                <span className="ag-row-s">{uploading === null ? "from this device" : `${uploading}%`}</span>
              </span>
            </button>
            {uploading !== null ? (
              <div className="ag-progress" role="status" aria-label="Uploading">
                <i style={{ width: `${uploading}%` }} />
              </div>
            ) : null}
          </div>
        ) : (
          <>
            <div className="ag-searchin">
              <input
                type="search"
                value={query}
                maxLength={40}
                placeholder="Search in file"
                aria-label="Search in file"
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
            {!editing ? (
              <div className="ag-viewer">
                <div className="ag-viewer-head">
                  <b>{file.path}</b>
                  <button type="button" className="ag-codebtn" onClick={() => setVersions(true)} aria-label="Version history">
                    v3
                  </button>
                  <button type="button" className="ag-codebtn" onClick={() => setEditing(true)} aria-label="Edit file">
                    Edit
                  </button>
                </div>
                <p className="ag-viewer-pre">
                  {shown.length === 0 ? (
                    <span className="ln">
                      <span className="no">·</span>
                      <span>No matches</span>
                    </span>
                  ) : (
                    shown.map((l, i) => (
                      <span key={i} className={needle ? "ln hit" : "ln"}>
                        <span className="no">{i + 1}</span>
                        <span>{l || " "}</span>
                      </span>
                    ))
                  )}
                </p>
              </div>
            ) : (
              <>
                <textarea
                  className="ag-editor"
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    setConfirmDiscard(false);
                  }}
                  aria-label={`Edit ${file.path}`}
                  spellCheck={false}
                />
                <div style={{ display: "flex", gap: 8, padding: "0 12px 20px" }}>
                  <button type="button" className="ag-btn primary full" onClick={save} disabled={!dirty}>
                    Save
                  </button>
                  <button
                    type="button"
                    className="ag-btn plain full"
                    onClick={() => {
                      if (dirty && !confirmDiscard) {
                        setConfirmDiscard(true);
                        return;
                      }
                      setDraft(file.body);
                      setEditing(false);
                      setConfirmDiscard(false);
                    }}
                  >
                    {dirty && confirmDiscard ? "Discard?" : "Cancel"}
                  </button>
                </div>
              </>
            )}
            {files.length === 0 ? <AgEmpty icon={<FileIcon />} title="No files" sub="Upload one to begin." /> : null}
          </>
        )}
      </div>
      <div className="ag-foot" style={{ display: "flex", gap: 8 }}>
        {file ? (
          <>
            <button type="button" className="ag-btn ghost full sm" onClick={() => setOpenId(null)}>
              Files
            </button>
            <button type="button" className="ag-btn ghost full sm" onClick={() => toast("Shared")} aria-label="Share file">
              <DownloadIcon /> Share
            </button>
          </>
        ) : (
          <button type="button" className="ag-btn ghost full sm" onClick={() => toast("Synced")}>
            <CheckIcon /> Sync workspace
          </button>
        )}
      </div>
      {versions ? (
        <AgSheet title="Versions" onClose={() => setVersions(false)}>
          {FILE_VERSIONS.map((v) => (
            <button key={v.id} type="button" className="ag-sheetrow" onClick={() => toast(`Opened ${v.name}`)}>
              <span className="ag-sheet-l">
                <span className="ag-sheet-t">{v.name}</span>
                <span className="ag-sheet-s">{v.when}</span>
              </span>
            </button>
          ))}
        </AgSheet>
      ) : null}
    </>
  );
}
