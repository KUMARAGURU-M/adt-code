import React, { useState, useEffect, useRef } from 'react';

const MultiSelectDropdown = ({ options, value, onChange, label, placeholder = "All", className = "filter-group" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = e => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const toggle = (opt) => {
    if (value.includes(opt)) {
      onChange(value.filter(v => v !== opt));
    } else {
      onChange([...value, opt]);
    }
  };

  const displayText = value.length === 0 ? placeholder : (value.length <= 2 ? value.join(', ') : `${value.length} selected`);

  return (
    <div className={`${className} multi-select-container`} ref={dropdownRef} style={{ position: 'relative', display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
      <label>{label}</label>
      <div
        className="multi-select-header"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '7px 12px',
          border: '1.5px solid #cbd5e1',
          borderRadius: '6px',
          background: '#fff',
          cursor: 'pointer',
          minHeight: '38px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.82rem',
          color: '#334155',
          textAlign: 'left'
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1, textAlign: 'left' }}>{displayText}</span>
        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>▼</span>
      </div>
      {isOpen && (
        <div
          className="multi-select-options"
          style={{
            position: 'absolute',
            top: 'calc(100% + 4px)',
            left: 0,
            right: 0,
            background: '#fff',
            border: '1px solid #cbd5e1',
            borderRadius: '6px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
            zIndex: 100,
            maxHeight: '220px',
            overflowY: 'auto',
            padding: '4px'
          }}
        >
          {options.map(opt => (
            <div
              key={opt}
              onClick={() => toggle(opt)}
              style={{
                padding: '6px 8px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'flex-start',
                gap: '8px',
                borderRadius: '4px',
                fontSize: '0.82rem',
                textAlign: 'left'
              }}
              onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f1f5f9'}
              onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            >
              <input
                type="checkbox"
                checked={value.includes(opt)}
                onChange={() => { }}
                style={{ cursor: 'pointer', margin: 0, width: 'auto', flexShrink: 0 }}
              />
              <span>{opt}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;