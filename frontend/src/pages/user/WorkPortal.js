import React from 'react';
import './WorkPortal.css';
import { useNavigate } from 'react-router-dom';

const WorkPortal = () => {

  const navigate = useNavigate();

  return (
    <div className="wp-page">

      {/* HEADER */}
      <header className="wp-header">

        <div className="wp-header-left">
          <div className="wp-title-group">
            <span className="wp-title-icon">📄</span>
            <h1 className="wp-title">Tagging Work Portal</h1>
          </div>

          <p className="wp-subtitle">
            XML / EPUB Document Tagging
          </p>
        </div>

        <div className="wp-header-right">

          {/* BACK BUTTON */}
          <button
            className="wp-back-btn"
            onClick={() => navigate('/employee/dashboard')}
          >
            ⬅ Back to WorkWise
          </button>

          <span className="wp-user-greeting">
            Welcome, Employee
          </span>

        </div>

      </header>

      {/* MAIN CONTAINER */}
      <main className="wp-container">

        {/* CARD 1: SELECTION */}
        <div className="wp-card">

          <h2 className="wp-card-title">
            Project & Process Selection
          </h2>

          <div className="wp-selection-row">

            <div className="wp-form-group">
              <label className="wp-label">📁 Project</label>

              <div className="wp-select-wrapper">
                <select className="wp-select">
                  <option>Select Project</option>
                </select>

                <span className="wp-select-arrow">▾</span>
              </div>
            </div>

            <div className="wp-form-group">
              <label className="wp-label">⚙️ Process</label>

              <div className="wp-select-wrapper">
                <select className="wp-select">
                  <option>Select Process</option>
                </select>

                <span className="wp-select-arrow">▾</span>
              </div>
            </div>

          </div>

        </div>

        {/* CARD 2: UPLOAD */}
        <div className="wp-card">

          <h2 className="wp-card-title">
            📄 Document Upload
          </h2>

          <div className="wp-upload-area">
            <input
              type="file"
              className="wp-file-input"
            />
          </div>

        </div>

        {/* CARD 3: EMPTY STATE */}
        <div className="wp-card wp-empty-card">

          <div className="wp-empty-content">

            <div className="wp-empty-icon">📄</div>

            <h3 className="wp-empty-title">
              No Document Loaded
            </h3>

            <p className="wp-empty-text">
              Please select a project, process, and upload a
              document to begin tagging
            </p>

          </div>

        </div>

      </main>

    </div>
  );
};

export default WorkPortal;