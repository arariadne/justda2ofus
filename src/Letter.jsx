import React, { useEffect, useState } from "react";
import { db } from "./firebaseConfig";
import {
  addDoc,
  collection,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  limit,
} from "firebase/firestore";
import "./Letter.css";

const Letter = ({ albumName }) => {
  const safeAlbum = (albumName || "").trim() || "General";

  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [latest, setLatest] = useState(null);

  // 👉 letters live under albums/{albumName}/letters
  const lettersCol = collection(db, "albums", safeAlbum, "letters");

  useEffect(() => {
    const q = query(lettersCol, orderBy("timestamp", "desc"), limit(1));
    const unsub = onSnapshot(
      q,
      (snap) => {
        if (snap.docs.length > 0) setLatest({ id: snap.docs[0].id, ...snap.docs[0].data() });
        else setLatest(null);
      },
      (err) => {
        console.error("Load letter error:", err);
      }
    );
    return () => unsub();
  }, [safeAlbum]); // safeAlbum changes album path

  const saveLetter = async () => {
    if (!text.trim()) {
      alert("Write something first 🥺");
      return;
    }

    setSaving(true);
    try {
      await addDoc(lettersCol, {
        body: text.trim(),
        timestamp: serverTimestamp(),
      });
      setText("");
      setSaving(false);
      alert("Saved 💌");
    } catch (e) {
      console.error("Save letter error:", e);
      alert(e?.message || "Failed to save letter");
      setSaving(false);
    }
  };

  return (
    <div className="letter-wrap">
      <div className="letter-head">
        <div>
          <div className="letter-title">💌 Love Letter</div>
          <div className="letter-sub">
            Album: <b>{safeAlbum}</b>
          </div>
        </div>

        <button className="letter-openBtn" onClick={() => setOpen((v) => !v)}>
          {open ? "Close" : "Open"}
        </button>
      </div>

      <div className={`envelope ${open ? "open" : ""}`} onClick={() => setOpen(true)}>
        <div className="env-back" />
        <div className="env-front" />
        <div className="env-flap" />
        <div className="env-heart">♥</div>

        <div className="paper" onClick={(e) => e.stopPropagation()}>
          <div className="paper-top">
            <div className="paper-to">To: My Love</div>
            <div className="paper-album">({safeAlbum})</div>
          </div>

          <textarea
            className="paper-text"
            placeholder="Write a long sweet message here…"
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="paper-actions">
            <button className="paper-save" onClick={saveLetter} disabled={saving}>
              {saving ? "Saving..." : "Save Letter"}
            </button>
          </div>
        </div>
      </div>

      <div className="latest">
        <div className="latest-title">Latest saved letter</div>
        {latest?.body ? (
          <div className="latest-body">{latest.body}</div>
        ) : (
          <div className="latest-empty">No letters yet for this album.</div>
        )}
      </div>
    </div>
  );
};

export default Letter;