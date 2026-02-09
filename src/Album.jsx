import React, { useState, useEffect } from 'react';
import { db, storage } from './firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

const Album = () => {
  const [memories, setMemories] = useState([]);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "memories"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMemories(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
    });
    return () => unsubscribe();
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setLoading(true);

    const storageRef = ref(storage, `memories/${Date.now()}_${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on("state_changed", null, (error) => console.log(error), 
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        await addDoc(collection(db, "memories"), {
          url,
          caption,
          type: file.type,
          createdAt: serverTimestamp()
        });
        setFile(null);
        setCaption("");
        setLoading(false);
      }
    );
  };

  return (
    <div className="album-container">
      <header style={{textAlign: 'center', padding: '40px'}}>
        <h1>💌 Our Digital Time Capsule</h1>
      </header>

      <div className="upload-section" style={{maxWidth: '500px', margin: '0 auto 40px', background: '#fff', padding: '20px', borderRadius: '15px'}}>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} />
        <input 
          type="text" 
          placeholder="Add a sweet memory..." 
          value={caption} 
          onChange={(e) => setCaption(e.target.value)} 
          style={{width: '100%', margin: '10px 0', padding: '10px'}}
        />
        <button onClick={handleUpload} disabled={loading} className="unlock-btn">
          {loading ? "Saving Memory..." : "Store Memory"}
        </button>
      </div>

      <div className="memory-grid">
        {memories.map(m => (
          <div key={m.id} className="memory-card">
            {m.type?.includes("video") ? (
              <video src={m.url} controls />
            ) : m.type?.includes("image") ? (
              <img src={m.url} alt="memory" />
            ) : (
              <div style={{padding: '20px'}}><a href={m.url}>📄 Document</a></div>
            )}
            <p style={{padding: '15px'}}>{m.caption}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Album;