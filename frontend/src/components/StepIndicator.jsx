import React from 'react';

const StepIndicator = ({ step }) => {
  return (
    <div className="steps-indicator">
      <div className={`step-item ${step >= 1 ? 'active' : ''} ${step > 1 ? 'completed' : ''}`}>1</div>
      <div className={`step-item ${step >= 2 ? 'active' : ''} ${step > 2 ? 'completed' : ''}`}>2</div>
      <div className={`step-item ${step >= 3 ? 'active' : ''}`}>3</div>
    </div>
  );
};

export default StepIndicator;
