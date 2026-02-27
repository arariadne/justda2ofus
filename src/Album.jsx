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
  // Optional: keep uploads organized in Cloudinary
  form.append("folder", "memories");

  if (onProgress) onProgress(15);

  const res = await fetch(endpoint, { method: "POST", body: form });

  // Read the real error message if it fails
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

  return data; // secure_url, public_id, resource_type, etc.
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

  // Clean up object URL to avoid memory leaks
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

      // Compress images (not videos)
      if (file.type.startsWith("image/")) {
        uploadFile = await imageCompression(file, {
          maxSizeMB: 0.5,
          maxWidthOrHeight: 1024,
          useWebWorker: true,
        });
      }

      // Upload to Cloudinary
      const cloud = await uploadToCloudinary(uploadFile, setProgress);

      // Save Cloudinary URL + info to Firestore
      await addDoc(collection(db, "images"), {
        imageUrl: cloud.secure_url,
        publicId: cloud.public_id, // store this if you later add server-side delete
        resourceType: cloud.resource_type, // "image" | "video" | "raw"
        caption: caption.trim(),
        category,
        timestamp: serverTimestamp(),
      });

      // Reset UI
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

    // NOTE:
    // This deletes from Firestore only.
    // To delete from Cloudinary too, you need a backend (Firebase Function),
    // because Cloudinary delete requires your API secret (never in frontend).
  };

  const renderPreview = () => {
    if (!previewUrl || !file) return null;

    const isVideo = file.type.startsWith("video/");
    return (
      <div className="preview-box">
        {isVideo ? (
          <video src={previewUrl} controls />
        ) : (
          <img src={previewUrl} alt="preview" />
        )}
      </div>
    );
  };

  const renderMedia = (m) => {
    const isVideo = m.resourceType === "video";
    return (
      <div className="media-box">
        {isVideo ? (
          <video src={m.imageUrl} controls />
        ) : (
          <img src={m.imageUrl} alt="memory" />
        )}
      </div>
    );
  };

  return (
    <div className="album-container">
      <h2 className="album-header">📸 Our Memories</h2>

      <div className="upload-card">
        {renderPreview()}

        <input type="file" accept="image/*,video/*" onChange={onPickFile} />

        <input
          className="caption-input"
          type="text"
          placeholder="Caption..."
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
        />

        <select
          className="category-select"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
        >
          <option>General</option>
          <option>Dates</option>
          <option>Travel</option>
          <option>Food</option>
          <option>Random</option>
        </select>

        <button className="save-btn" onClick={handleUpload} disabled={loading}>
          {loading ? `Storing... ${progress}%` : "Save Memory"}
        </button>
      </div>

      <div className="memory-grid">
        {memories.map((m) => (
          <div key={m.id} className="memory-card">
            {renderMedia(m)}

            <div className="memory-details">
              <div className="memory-top">
                <span className="category-tag">{m.category || "General"}</span>
                <div className="admin-actions">
                  <button
                    title="Delete"
                    onClick={() => handleDelete(m.id)}
                    aria-label="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </div>

              <p className="caption">{m.caption}</p>

              {/* Optional date display */}
              <p className="date">
                {m.timestamp?.toDate
                  ? m.timestamp.toDate().toLocaleString()
                  : ""}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Album;