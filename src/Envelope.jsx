import React, { useState } from 'react';
import './Envelope.css';

const Envelope = ({ onComplete }) => {
  const [openStep, setOpenStep] = useState(0);

  const handleOpen = () => {
    if (openStep < 2) {
      setOpenStep(openStep + 1);
    }
  };

  return (
    <div className={`envelope-container step-${openStep}`}>
      <div className="envelope-wrapper" onClick={handleOpen}>
        <div className="envelope-flap"></div>
        <div className="envelope-front"></div>
        
        <div className="letter">
          <div className="letter-text">
            <h3>Hello Baby!</h3>
            <p>This is our home on the internet. It is a place to look back on how far we have come and to dream about where we are going next.</p>
            <p>Beyond just a diary, I have built this for both of us. It is a canvas for our letters, a gallery for our photos, and a vault for every document that marks our journey.</p>
            <p>I cannot wait to see this space grow as we both fill these pages together.</p>
            
            <button className="open-album-btn" onClick={(e) => {
              e.stopPropagation();
              onComplete();
            }}>
              Enter Our Vault
            </button>
          </div>
        </div>
      </div>
      
      <p className="hint-text">
        {openStep === 0 && "Click to open the flap"}
        {openStep === 1 && "Click to pull out the letter"}
        {openStep === 2 && "Click the button to enter"}
      </p>
    </div>
  );
};

export default Envelope;