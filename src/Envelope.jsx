import React, { useState } from 'react';
import './Envelope.css';

const Envelope = ({ onComplete }) => {
  const [openStep, setOpenStep] = useState(0);

  const handleHeartClick = () => {
    if (openStep < 2) {
      setOpenStep(openStep + 1);
    }
  };

  return (
    <div className="envelope-main-container">
      <button className="skip-btn" onClick={onComplete} title="Skip to Album">
        ✕
      </button>

      <div className={`envelope-wrapper ${openStep >= 1 ? 'flap' : ''} ${openStep === 2 ? 'opened' : ''}`}>
        <div className="envelope">
          <div className="letter">
            <div className="text-content">
              <strong>Hello Baby!</strong>
              <p>This is our home on the internet. It is a place to look back on how far we have come and to dream about where we are going next.</p>
              <p>Beyond just a diary, I have built this for both of us. It is a canvas for our letters, a gallery for our photos, and a vault for every document that marks our journey.</p>
              <p>I cannot wait to see this space grow as we both fill these pages together.</p>
            </div>
          </div>
        </div>
        <div className="heart" onClick={handleHeartClick}></div>
      </div>
      
      <p className="hint-text">
        {openStep === 0 && "Click the heart to open"}
        {openStep === 1 && "Click the heart again to reveal our message"}
        {openStep === 2 && "Click the 'X' to explore our album"}
      </p>
    </div>
  );
};

export default Envelope;