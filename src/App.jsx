import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Add this
import './App.css';
import Album from './Album.jsx';
import epoyImg from './assets/epoy.jpg';
import elaiImg from './assets/elai.jpg';
import backgroundImg from './assets/background1.jpg';
import Envelope from './Envelope.jsx';

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [showAlbum, setShowAlbum] = useState(false); // Controls the final transition
  const [dateInput, setDateInput] = useState("");
  
  const ANNIVERSARY_DATE = "2025-01-29"; 

  const handleEnter = () => {
    if (dateInput === ANNIVERSARY_DATE) {
      setIsUnlocked(true);
    } else {
      alert("PAG SURE ARA OYYYY!!!");
    }
  };

  return (
    <div className="main-wrapper" style={{ backgroundImage: `url(${backgroundImg})` }}>
      <AnimatePresence mode="wait">
        {/* STEP 1: LOGIN */}
        {!isUnlocked && (
          <motion.div 
            key="login"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, y: -50 }}
            transition={{ duration: 0.8 }}
            className="glass-card"
          >
            <h1 className="diary-title">EPOY & ELAI</h1>
            <p className="diary-subtitle">digital diary</p>
            <div className="avatar-section">
              <img src={epoyImg} alt="Epoy" className="avatar" />
              <span className="pixel-heart">❤️</span>
              <img src={elaiImg} alt="Elai" className="avatar" />
            </div>
            <div className="auth-row">
              <span className="pass-label">PASSWORD:</span>
              <div className="input-group">
                <input type="date" className="password-field" onChange={(e) => setDateInput(e.target.value)} />
                <button className="enter-btn" onClick={handleEnter}>Enter</button>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: ENVELOPE (Shown after password) */}
        {isUnlocked && !showAlbum && (
          <motion.div 
            key="envelope"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.5 } }}
          >
            <Envelope onComplete={() => setShowAlbum(true)} />
          </motion.div>
        )}

        {/* STEP 3: ALBUM (Shown after clicking message) */}
        {showAlbum && (
          <motion.div
            key="album"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Album />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;