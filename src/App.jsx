import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion'; // Add this
import './App.css';
import Album from './Album.jsx';
import epoyImg from './assets/epoy.jpg';
import elaiImg from './assets/elai.jpg';
import backgroundImg from './assets/background1.jpg';

function App() {
  const [isUnlocked, setIsUnlocked] = useState(false);
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
        {!isUnlocked ? (
          <motion.div 
            key="login"
            initial={{ opacity: 0, scale: 0.8 }} // Start small and faded
            animate={{ opacity: 1, scale: 1 }}    // Animate to full size
            exit={{ opacity: 0, y: -50 }}        // Slide up and out when unlocked
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="glass-card"
          >
            <motion.h1 
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="diary-title"
            >
              EPOY & ELAI
            </motion.h1>
            
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="diary-subtitle"
            >
              online diary
            </motion.p>
            
            <div className="avatar-section">
              <motion.img 
                whileHover={{ scale: 1.1, rotate: -5 }} // Pop on hover
                src={epoyImg} alt="Epoy" className="avatar" 
              />
              <motion.span 
                animate={{ scale: [1, 1.2, 1] }} // Heartbeat animation
                transition={{ repeat: Infinity, duration: 0.8 }}
                className="pixel-heart"
              >
                ❤️
              </motion.span>
              <motion.img 
                whileHover={{ scale: 1.1, rotate: 5 }} 
                src={elaiImg} alt="Elai" className="avatar" 
              />
            </div>

            <div className="auth-row">
              <span className="pass-label">PASSWORD:</span>
              <div className="input-group">
                <input 
                  type="date" 
                  className="password-field" 
                  onChange={(e) => setDateInput(e.target.value)}
                />
                <motion.button 
                  whileTap={{ scale: 0.9 }} // Button press effect
                  className="enter-btn" 
                  onClick={handleEnter}
                >
                  Enter
                </motion.button>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="album"
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Album />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;