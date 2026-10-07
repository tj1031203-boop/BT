const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const PASSWORD = process.env.UPLOAD_PASSWORD || "";
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR || path.join(__dirname, "uploads"));
const MAX_FILE_MB = Number(process.env.MAX_FILE_MB || 50);

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Resolve a user-supplied relative path inside UPLOAD_DIR, or return null if it escapes.
function safePath(rel) {
  const cleaned = String(rel || "").replace(/\\/g, "/").replace(/^\/+/, "");
  if (!cleaned) return null;
  const full = path.resolve(UPLOAD_DIR, cleaned);
  if (full !== UPLOAD_DIR && full.startsWith(UPLOAD_DIR + path.sep)) return full;
  return null;
}

function requirePassword(req, res, next) {
  if (!PASSWORD) return next();
  const given = req.get("x-upload-password") || req.query.password || "";
  if (given === PASSWORD) return next();
  res.status(401).json({ error: "비밀번호가 올바르지 않습니다." });
}

const upload = multer({
  preservePath: true,
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
  storage: multer.diskStorage({
    destination(req, file, cb) {
      const full = safePath(Buffer.from(file.originalname, "latin1").toString("utf8"));
      if (!full) return cb(new Error("잘못된 파일 경로입니다."));
      fs.mkdirSync(path.dirname(full), { recursive: true });
      file.fullPath = full;
      cb(null, path.dirname(full));
    },
    filename(req, file, cb) {
      cb(null, path.basename(file.fullPath));
    },
  }),
});

function listFiles(dir, base = "") {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? `${base}/${entry.name}` : entry.name;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listFiles(full, rel));
    else {
      const st = fs.statSync(full);
      out.push({ path: rel, size: st.size, modified: st.mtimeMs });
    }
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

const app = express();

app.get("/healthz", (req, res) => res.send("ok"));
app.get("/api/config", (req, res) => res.json({ passwordRequired: Boolean(PASSWORD), maxFileMb: MAX_FILE_MB }));
app.get("/api/files", (req, res) => res.json(listFiles(UPLOAD_DIR)));

app.post("/api/upload", requirePassword, upload.array("files"), (req, res) => {
  res.json({ uploaded: (req.files || []).map((f) => path.relative(UPLOAD_DIR, f.fullPath).split(path.sep).join("/")) });
});

app.delete("/api/files", requirePassword, (req, res) => {
  const full = safePath(req.query.path);
  if (!full || !fs.existsSync(full)) return res.status(404).json({ error: "파일을 찾을 수 없습니다." });
  fs.rmSync(full, { recursive: true, force: true });
  res.json({ deleted: req.query.path });
});

// Uploaded files are served as-is, so HTML/JS/CSS run directly in the browser.
app.use("/files", express.static(UPLOAD_DIR, { index: ["index.html"], extensions: ["html"] }));
app.use(express.static(path.join(__dirname, "public")));

app.use((err, req, res, next) => {
  res.status(400).json({ error: err.message || "업로드 실패" });
});

app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
  if (!PASSWORD) console.warn("경고: UPLOAD_PASSWORD 가 설정되지 않아 누구나 파일을 올릴 수 있습니다.");
});
