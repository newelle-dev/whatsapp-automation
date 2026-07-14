import React from 'react';

const StepIndicator = ({ step }) => {
  return (
    <div className="steps-indicator">
      <div className={`step-item-container ${step === 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>
        <div className="step-item">1</div>
        <div className="step-label">Upload Export</div>
      </div>
      <div className={`step-item-container ${step === 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>
        <div className="step-item">2</div>
        <div className="step-label">Review Queue</div>
      </div>
      <div className={`step-item-container ${step === 3 ? 'active' : ''} ${step > 3 ? 'completed' : ''}`}>
        <div className="step-item">3</div>
        <div className="step-label">Run Campaign</div>
      </div>
    </div>
  );
};

export default StepIndicator;
