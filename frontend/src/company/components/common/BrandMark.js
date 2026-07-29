import React from 'react';
import logo from '../../assets/arrow-data-tech-logo.png';

function BrandMark({ className = '', compact = false, showText = true }) {
  return (
    <span className={`brand-mark ${compact ? 'brand-mark--compact' : ''} ${className}`.trim()}>
      <img
        className="brand-mark__image"
        src={logo}
        alt="Arrow Data Tech"
        loading="eager"
        decoding="async"
      />
      {showText && (
        <span className="brand-mark__text">
          <span className="logo-color--arrow">ARROW </span>
          <span className="logo-color--data">DATA </span>
          <span className="logo-color--tech">TECH</span>
        </span>
      )}
    </span>
  );
}

export default BrandMark;
