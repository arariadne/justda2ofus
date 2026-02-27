import React, { useEffect, useMemo, useState } from "react";
import imageCompression from "browser-image-compression";
import { db } from "./firebaseConfig";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  deleteDoc,
} from "firebase/firestore";
import Letter from "./Letter.jsx";
import Notebook from "./Notebook.jsx";
import "./Album.css";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

async function uploadToCloudinary(file) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Missing Cloudinary env vars (cloud name / upload preset).");
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);
  form.append("folder", "memories");

  const res = await fetch(endpoint, { method: "POST", body: form });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text };
  }

  if (!res.ok) {
    console.error("Cloudinary error:", data);
    throw new Error(data?.error?.message || "Cloudinary upload failed");
  }

  return data; // secure_url, public_id, resource_type
}

function kindFrom(mime, resourceType) {
  if (mime === "application/pdf") return "pdf";
  if (resourceType === "video") return "video";
  return "image";
}

function toAttachmentUrl(url) {
  if (!url.includes("/upload/")) return url;
  return url.replace("/upload/", "/upload/fl_attachment/");
}

async function downloadUrl(url, filename = "download") {
  const attachmentUrl = toAttachmentUrl(url);
  const res = await fetch(attachmentUrl);
  if (!res.ok) throw new Error("Failed to download");

  const blob = await res.blob();
  const blobUrl = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();

  URL.revokeObjectURL(blobUrl);
}

const Album = () => {
  const [posts, setPosts] = useState([]);

  // Multi-file upload state
  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);

  // Album name (free text)
  const [albumName, setAlbumName] = useState("");
  const [activeAlbum, setActiveAlbum] = useState("All Albums");

  const [caption, setCaption] = useState("");

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  // Multi-download selection across time
  const [selected, setSelected] = useState({}); // url => true

  // Load posts
  useEffect(() => {
    const q = query(collection(db, "images"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setPosts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  // Cleanup preview URLs
  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previews.length]);

  const albums = useMemo(() => {
    const set = new Set();
    posts.forEach((p) => {
      const name = (p.albumName || "").trim();
      if (name) set.add(name);
    });
    return ["All Albums", ...Array.from(set).sort((a, b) => a.localeCompare(b))];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (activeAlbum === "All Albums") return posts;
    return posts.filter((p) => (p.albumName || "").trim() === activeAlbum);
  }, [posts, activeAlbum]);

  const selectedUrls = useMemo(() => Object.keys(selected), [selected]);

  const onPickFiles = (e) => {
    const list = Array.from(e.target.files || []);
    console.log("picked:", list.length);

    if (list.length === 0) return;

    previews.forEach((p) => URL.revokeObjectURL(p.url));

    setFiles(list);
    setPreviews(
      list.map((f) => ({
        name: f.name,
        type: f.type,
        url: URL.createObjectURL(f),
      }))
    );

    // allow picking same files again later
    e.target.value = "";
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    const name = albumName.trim();
    if (!name) {
      alert("Please type an Album name first.");
      return;
    }

    setLoading(true);
    setProgress(0);

    try {
      const media = [];

      for (let i = 0; i < files.length; i++) {
        const f = files[i];

        let uploadFile = f;
        if (f.type.startsWith("image/")) {
          uploadFile = await imageCompression(f, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1080,
            useWebWorker: true,
          });
        }

        setProgress(Math.round((i / files.length) * 100));

        const cloud = await uploadToCloudinary(uploadFile);

        media.push({
          url: cloud.secure_url,
          publicId: cloud.public_id,
          resourceType: cloud.resource_type,
          mimeType: f.type,
          kind: kindFrom(f.type, cloud.resource_type),
          originalName: f.name,
        });

        setProgress(Math.round(((i + 1) / files.length) * 100));
      }

      await addDoc(collection(db, "images"), {
        albumName: name,
        caption: caption.trim(),
        timestamp: serverTimestamp(),
        media,
      });

      // Reset composer
      previews.forEach((p) => URL.revokeObjectURL(p.url));
      setFiles([]);
      setPreviews([]);
      setCaption("");
      setLoading(false);
      setProgress(0);

      // Switch to that album in filter
      setActiveAlbum(name);
    } catch (err) {
      console.error(err);
      alert(err.message || "Upload failed");
      setLoading(false);
      setProgress(0);
    }
  };

  const toggleSelected = (url) => {
    setSelected((prev) => {
      const next = { ...prev };
      if (next[url]) delete next[url];
      else next[url] = true;
      return next;
    });
  };

  const clearSelected = () => setSelected({});

  const downloadSelected = async () => {
    if (selectedUrls.length === 0) {
      alert("No files selected for download.");
      return;
    }

    for (let i = 0; i < selectedUrls.length; i++) {
      const url = selectedUrls[i];
      try {
        await downloadUrl(url, `memory_${i + 1}`);
      } catch (e) {
        console.error("Download failed:", url, e);
      }
    }
  };

  const PreviewGrid = () => {
    if (previews.length === 0) {
      return (
        <div className="ig-dropzone">
          <div className="ig-dropzoneIcon">＋</div>
          <div className="ig-dropzoneText">Choose photos / videos / PDFs</div>
          <div className="ig-dropzoneSub">
            Tip: hold Ctrl (Windows) / ⌘ (Mac) to select multiple
          </div>
        </div>
      );
    }

    return (
      <div className="ig-previewGrid">
        {previews.map((p) => (
          <div key={p.url} className="ig-previewTile">
            {p.type.startsWith("video/") ? (
              <video src={p.url} />
            ) : p.type === "application/pdf" ? (
              <div className="ig-pdfTile">
                <div className="ig-pdfIcon">PDF</div>
                <div className="ig-pdfName">{p.name}</div>
              </div>
            ) : (
              <img src={p.url} alt={p.name} />
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="ig-page">
      {/* Top bar */}
      <div className="ig-topbar">
        <div className="ig-topbarInner">
          <div className="ig-logo">Albums</div>

          <div className="ig-albumFilter">
            <select
              className="ig-select"
              value={activeAlbum}
              onChange={(e) => setActiveAlbum(e.target.value)}
            >
              {albums.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>

          <div className="ig-downloadBar">
            <button
              className="ig-ghostBtn"
              onClick={clearSelected}
              disabled={selectedUrls.length === 0}
            >
              Clear ({selectedUrls.length})
            </button>
            <button
              className="ig-primaryBtn ig-primaryBtnSm"
              onClick={downloadSelected}
              disabled={selectedUrls.length === 0}
            >
              Download selected
            </button>
          </div>
        </div>
      </div>

      <div className="ig-layout">
        <div className="ig-feed">
          {/* Composer */}
          <div className="ig-card ig-composer">
            <div className="ig-cardHeader">
              <div className="ig-avatar" />
              <div className="ig-userMeta">
                <div className="ig-username">justda2ofus</div>
                <div className="ig-sub">Create an album post (Facebook style)</div>
              </div>
            </div>

            <input
              className="ig-input"
              type="text"
              placeholder="Album name (example: 'Our Anniversary 2025')"
              value={albumName}
              onChange={(e) => setAlbumName(e.target.value)}
            />

            {/* Reliable multi-picker: hidden input + button */}
            <div className="ig-filePick" style={{ marginTop: 10 }}>
              <input
                id="albumFiles"
                type="file"
                multiple
                accept="image/*,video/*,application/pdf"
                onChange={onPickFiles}
                className="ig-hiddenInput"
              />

              <button
                type="button"
                className="ig-filePickBtn"
                onClick={() => document.getElementById("albumFiles")?.click()}
              >
                Select files
              </button>

              <span className="ig-filePickHint">
                {files.length ? `${files.length} file(s) selected` : "No files chosen"}
              </span>
            </div>

            <PreviewGrid />

            <input
              className="ig-input"
              type="text"
              placeholder="Caption (optional)…"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              style={{ marginTop: 12 }}
            />

            <button
              className="ig-primaryBtn"
              onClick={handleUpload}
              disabled={loading || files.length === 0 || albumName.trim() === ""}
            >
              {loading ? `Posting... ${progress}%` : "Share to Album"}
            </button>

            {loading && (
              <div className="ig-progress">
                <div className="ig-progressBar" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>

          {/* Romantic letter */}
          <div className="ig-card ig-letterCard">
            <Letter albumName={activeAlbum === "All Albums" ? albumName.trim() : activeAlbum} />
          </div>

          {/* Notebook View (replaces posts list) */}
          <div className="ig-card" style={{ padding: 14 }}>
            <Notebook posts={filteredPosts} />
          </div>

          {/* Download selection section (still works even in notebook mode)
              In notebook mode, we show selection pills below notebook instead of each post. */}
          {filteredPosts.length > 0 && (
            <div className="ig-card" style={{ padding: 14, marginTop: 14 }}>
              <div style={{ fontWeight: 900, marginBottom: 10 }}>
                Select files to download (from this album filter)
              </div>

              <div className="ig-selectRow">
                {filteredPosts.flatMap((p) => (p.media || [])).map((m) => (
                  <label key={m.url} className="ig-check">
                    <input
                      type="checkbox"
                      checked={!!selected[m.url]}
                      onChange={() => toggleSelected(m.url)}
                    />
                    <span className="ig-checkLabel">
                      {m.kind.toUpperCase()}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="ig-rail">
          <div className="ig-railHint">
            <b>Multi-upload tip:</b>
            <br />Hold <b>Ctrl</b> (Windows) / <b>⌘</b> (Mac) while selecting files.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Album;