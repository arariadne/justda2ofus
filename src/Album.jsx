import React, { useEffect, useState } from "react";
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
import "./Album.css";

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

async function uploadToCloudinary(file, onProgress) {
  if (!CLOUD_NAME || !UPLOAD_PRESET) {
    throw new Error("Missing Cloudinary env vars (cloud name / upload preset).");
  }

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/auto/upload`;

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", UPLOAD_PRESET);
  form.append("folder", "memories");

  if (onProgress) onProgress(15);

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

  if (onProgress) onProgress(100);
  return data;
}

const Album = () => {
  const [memories, setMemories] = useState([]);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [caption, setCaption] = useState("");
  const [category, setCategory] = useState("General");

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "images"), orderBy("timestamp", "desc"));
    const unsub = onSnapshot(q, (snap) => {
      setMemories(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const onPickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    setProgress(0);

    try {
      let uploadFile = file;

      if (file.type.startsWith("image/")) {
        uploadFile = await imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1080,
          useWebWorker: true,
        });
      }

      const cloud = await uploadToCloudinary(uploadFile, setProgress);

      await addDoc(collection(db, "images"), {
        imageUrl: cloud.secure_url,
        publicId: cloud.public_id,
        resourceType: cloud.resource_type,
        caption: caption.trim(),
        category,
        timestamp: serverTimestamp(),
      });

      setFile(null);
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);

      setCaption("");
      setCategory("General");
      setLoading(false);
      setProgress(0);
    } catch (err) {
      console.error(err);
      alert(err.message || "Upload failed");
      setLoading(false);
      setProgress(0);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete memory?")) return;
    await deleteDoc(doc(db, "images", id));
  };

  const renderPreview = () => {
    if (!previewUrl || !file) return (
      <div className="ig-dropzone">
        <div className="ig-dropzoneIcon">＋</div>
        <div className="ig-dropzoneText">Choose a photo or video</div>
        <div className="ig-dropzoneSub">Share a new memory ✨</div>
      </div>
    );

    const isVideo = file.type.startsWith("video/");
    return (
      <div className="ig-previewWrap">
        {isVideo ? (
          <video className="ig-previewMedia" src={previewUrl} controls />
        ) : (
          <img className="ig-previewMedia" src={previewUrl} alt="preview" />
        )}
      </div>
    );
  };

  const renderMedia = (m) => {
    const isVideo = m.resourceType === "video";
    return isVideo ? (
      <video className="ig-postMedia" src={m.imageUrl} controls />
    ) : (
      <img className="ig-postMedia" src={m.imageUrl} alt="memory" />
    );
  };

  return (
    <div className="ig-page">
      {/* Top Bar */}
      <div className="ig-topbar">
        <div className="ig-topbarInner">
          <div className="ig-logo">Memories</div>
          <div className="ig-search">
            <span className="ig-searchIcon">⌕</span>
            <input placeholder="Search (mock)" disabled />
          </div>
          <div className="ig-topActions">
            <button className="ig-iconBtn" title="Home">⌂</button>
            <button className="ig-iconBtn" title="Messages">✉</button>
            <button className="ig-iconBtn" title="Explore">✦</button>
            <div className="ig-avatarSm" title="You" />
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="ig-layout">
        {/* Feed */}
        <div className="ig-feed">
          {/* Composer */}
          <div className="ig-card ig-composer">
            <div className="ig-cardHeader">
              <div className="ig-avatar" />
              <div className="ig-userMeta">
                <div className="ig-username">justda2ofus</div>
                <div className="ig-sub">Create a new post</div>
              </div>
            </div>

            <label className="ig-filePick">
              <input type="file" accept="image/*,video/*" onChange={onPickFile} />
              <span className="ig-filePickBtn">Select</span>
              <span className="ig-filePickHint">
                {file ? file.name : "No file chosen"}
              </span>
            </label>

            {renderPreview()}

            <div className="ig-formRow">
              <input
                className="ig-input"
                type="text"
                placeholder="Write a caption..."
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
              />

              <select
                className="ig-select"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option>General</option>
                <option>Dates</option>
                <option>Travel</option>
                <option>Food</option>
                <option>Random</option>
              </select>
            </div>

            <button className="ig-primaryBtn" onClick={handleUpload} disabled={loading || !file}>
              {loading ? `Posting... ${progress}%` : "Share"}
            </button>

            {loading && (
              <div className="ig-progress">
                <div className="ig-progressBar" style={{ width: `${progress}%` }} />
              </div>
            )}
          </div>

          {/* Posts */}
          {memories.map((m) => (
            <div key={m.id} className="ig-card ig-post">
              <div className="ig-postHeader">
                <div className="ig-avatar" />
                <div className="ig-userMeta">
                  <div className="ig-username">justda2ofus</div>
                  <div className="ig-sub">
                    {m.category || "General"} •{" "}
                    {m.timestamp?.toDate ? m.timestamp.toDate().toLocaleString() : ""}
                  </div>
                </div>

                <button className="ig-moreBtn" onClick={() => handleDelete(m.id)} title="Delete">
                  ⋯
                </button>
              </div>

              <div className="ig-mediaFrame">{renderMedia(m)}</div>

              <div className="ig-postActions">
                <button className="ig-actionBtn" title="Like">♡</button>
                <button className="ig-actionBtn" title="Comment">💬</button>
                <button className="ig-actionBtn" title="Share">↗</button>
                <div className="ig-actionSpacer" />
                <button className="ig-actionBtn" title="Save">⌁</button>
              </div>

              <div className="ig-postBody">
                <div className="ig-captionLine">
                  <span className="ig-username">justda2ofus</span>
                  <span className="ig-captionText">
                    {m.caption || "—"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Right rail (optional IG-like sidebar) */}
        <div className="ig-rail">
          <div className="ig-railCard">
            <div className="ig-railTop">
              <div className="ig-avatarLg" />
              <div>
                <div className="ig-username">justda2ofus</div>
                <div className="ig-sub">Private diary feed</div>
              </div>
            </div>
            <div className="ig-railHint">
              Tip: Keep uploads private. Unsigned presets should restrict size and formats.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Album;