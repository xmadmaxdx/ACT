// Minimal ZIP writer (stored, no compression) so the testing ground can
// offer source downloads with zero dependencies. Pure logic, no DOM.

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function u16(v, out) {
  out.push(v & 0xff, (v >>> 8) & 0xff);
}

function u32(v, out) {
  out.push(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
}

function strBytes(s) {
  return new TextEncoder().encode(s);
}

// files: [{name, content}]. Returns a Blob ready for download.
export function makeZip(files) {
  const chunks = [];
  const central = [];
  let offset = 0;
  for (const f of files || []) {
    const name = strBytes(String(f.name || "file.txt"));
    const data = strBytes(String(f.content || ""));
    const crc = crc32(data);
    const local = [];
    u32(0x04034b50, local);
    u16(20, local);
    u16(0x0800, local);
    u16(0, local);
    u16(0, local);
    u16(0, local);
    u32(crc, local);
    u32(data.length, local);
    u32(data.length, local);
    u16(name.length, local);
    u16(0, local);
    const header = new Uint8Array([...local, ...name]);
    chunks.push(header, data);
    const ce = [];
    u32(0x02014b50, ce);
    u16(20, ce);
    u16(20, ce);
    u16(0x0800, ce);
    u16(0, ce);
    u16(0, ce);
    u16(0, ce);
    u32(crc, ce);
    u32(data.length, ce);
    u32(data.length, ce);
    u16(name.length, ce);
    u16(0, ce);
    u16(0, ce);
    u16(0, ce);
    u16(0, ce);
    u32(0, ce);
    u32(offset, ce);
    central.push(new Uint8Array([...ce, ...name]));
    offset += header.length + data.length;
  }
  const centralStart = offset;
  let centralSize = 0;
  for (const c of central) {
    chunks.push(c);
    centralSize += c.length;
  }
  const end = [];
  u32(0x06054b50, end);
  u16(0, end);
  u16(0, end);
  u16(central.length, end);
  u16(central.length, end);
  u32(centralSize, end);
  u32(centralStart, end);
  u16(0, end);
  chunks.push(new Uint8Array(end));
  return new Blob(chunks, { type: "application/zip" });
}
