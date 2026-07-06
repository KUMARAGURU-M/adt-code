import React, { useState, useEffect } from 'react';
import { FileText, FileCode, Upload, ArrowLeft, CheckCircle2, Play, Cpu, Sparkles, ShieldAlert } from 'lucide-react';
import { apiCall } from '../../utils/api';
import './DigiConvertor.css';

export default function DigiConvertor() {
  const [selectedTool, setSelectedTool] = useState(null); // 'epub' | 'xml' | null
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [converting, setConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);

  const [allowedTools, setAllowedTools] = useState([]);
  const [loadingAccess, setLoadingAccess] = useState(true);

  useEffect(() => {
    const fetchAccess = async () => {
      try {
        const data = await apiCall('/tools/my-access');
        setAllowedTools(data || []);
      } catch (err) {
        console.warn('Failed to load tool access:', err.message);
      } finally {
        setLoadingAccess(false);
      }
    };
    fetchAccess();
  }, []);

  const hasAccess = (tool) => {
    if (tool === 'epub') return allowedTools.includes('OCR');
    if (tool === 'xml') return allowedTools.includes('Digital Converter');
    return false;
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
      setResult(null);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setResult(null);
    }
  };

  const handleStartConversion = () => {
    if (!file) return;
    setConverting(true);
    setProgress(0);
    setResult(null);

    // Simulate conversion process with animation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setConverting(false);
          setResult({
            name: `converted_${file.name.split('.')[0]}.${selectedTool === 'epub' ? 'epub' : 'xml'}`,
            size: (file.size * 0.85 / 1024).toFixed(2) + ' KB'
          });
          return 100;
        }
        return prev + 5;
      });
    }, 150);
  };

  const resetTool = () => {
    setFile(null);
    setResult(null);
    setConverting(false);
    setProgress(0);
  };

  if (loadingAccess) {
    return (
      <div className="digi-convertor-container">
        <div className="digi-loading">
          <Cpu className="animate-spin" size={32} />
          <p style={{ marginTop: '12px' }}>Verifying engine permissions...</p>
        </div>
      </div>
    );
  }

  if (selectedTool && !hasAccess(selectedTool)) {
    return (
      <div className="digi-convertor-container">
        <div className="digi-convertor-workspace">
          <button className="back-to-home-btn" onClick={() => setSelectedTool(null)}>
            <ArrowLeft size={16} /> Back to Engines
          </button>

          <div className="workspace-card access-denied-card">
            <div className="workspace-body denied-body">
              <div className="denied-icon-circle">
                <ShieldAlert className="denied-lock-icon" size={48} />
              </div>
              <h3>Access Denied</h3>
              <p className="denied-message">You do not have permission to access the {selectedTool === 'epub' ? 'OCR' : 'XML Conversion'} Engine.</p>
              <p className="denied-hint">Please contact your administrator to request tool access.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="digi-convertor-container">
      {!selectedTool ? (
        <div className="digi-convertor-home">
          <div className="digi-header-section">
            <h2 className="digi-title">
              <span className="gradient-text">DigiConvertor</span>
            </h2>
            <p className="digi-subtitle">Select a processing engine to convert and process your documents</p>
          </div>

          <div className="digi-cards-container">
            {/* OCR Card */}
            <div className="digi-card epub-card" onClick={() => setSelectedTool('epub')}>
              {/* <div className="card-icon-wrapper">
                <FileText className="card-icon cyan-icon" size={36} />
              </div> */}
              <div className="card-content">
                <h3>OCR Convertor</h3>
                <p>Convert scanned PDF and image documents into clean, searchable formats with AI OCR technology.</p>
                <div className="card-features">
                  <span className="feature-badge">AI Powered</span>
                  <span className="feature-badge">PDF/Image</span>
                  <span className="feature-badge">Formatting Preserve</span>
                </div>
              </div>
              <button className="card-action-btn">
                Launch <img src="/ADTlogo - Copy.png" alt="ADT logo" className="launch-logo" />
              </button>
            </div>

            {/* XML Conversion Card */}
            <div className="digi-card xml-card" onClick={() => setSelectedTool('xml')}>
              {/* <div className="card-icon-wrapper">
                <FileCode className="card-icon pink-icon" size={36} />
              </div> */}
              <div className="card-content">
                <h3>XML Convertor</h3>
                <p>Process source text, manuscripts, or docx files into validated XML schemas conforming to publisher standards.</p>
                <div className="card-features">
                  <span className="feature-badge">Validation check</span>
                  <span className="feature-badge">Schema Conformity</span>
                  <span className="feature-badge">Auto Tagging</span>
                </div>
              </div>
              <button className="card-action-btn">
                Launch <img src="/ADTlogo - Copy.png" alt="ADT logo" className="launch-logo" />
              </button>
            </div>
          </div>
        </div>

      ) : (
        <div className="digi-convertor-workspace">
          <button className="back-to-home-btn" onClick={() => { setSelectedTool(null); resetTool(); }}>
            <ArrowLeft size={16} /> Back to Engines
          </button>

          <div className="workspace-card">
            <div className="workspace-header">
              <div className="workspace-title-group">
                {selectedTool === 'epub' ? (
                  <FileText className="workspace-icon cyan-icon" size={28} />
                ) : (
                  <FileCode className="workspace-icon pink-icon" size={28} />
                )}
                <div>
                  <h3>{selectedTool === 'epub' ? 'OCR Conversion' : 'XML Schema Conversion'}</h3>
                  <p>Upload a file to start processing</p>
                </div>
              </div>
              <div className="engine-status">
                <span className="status-indicator active"></span> Active Engine
              </div>
            </div>

            <div className="workspace-body">
              {!result && !converting && (
                <div
                  className={`upload-zone ${dragActive ? 'drag-active' : ''}`}
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="file-upload-input"
                    className="file-hidden-input"
                    onChange={handleFileChange}
                    accept={selectedTool === 'epub' ? '.pdf,image/*' : '.docx,.txt,.html,.xml'}
                  />
                  <label htmlFor="file-upload-input" className="upload-label">
                    <div className="upload-icon-circle">
                      <Upload size={28} className="upload-icon" />
                    </div>
                    {file ? (
                      <div className="selected-file-info">
                        <span className="selected-file-name">{file.name}</span>
                        <span className="selected-file-size">({(file.size / 1024).toFixed(2)} KB)</span>
                      </div>
                    ) : (
                      <>
                        <span className="upload-heading">Drag and drop file here</span>
                        <span className="upload-subheading">
                          or <span className="browse-link">browse from device</span>
                        </span>
                        <span className="upload-types">
                          {selectedTool === 'epub' ? 'Supports: PDF, PNG, JPG, TIFF' : 'Supports: DOCX, TXT, HTML, XML'}
                        </span>
                      </>
                    )}
                  </label>
                </div>
              )}

              {converting && (
                <div className="processing-zone">
                  <div className="processing-loader-wrapper">
                    <Cpu className="processing-cpu-icon animate-spin" size={40} />
                    <Sparkles className="processing-sparkle-icon" size={20} />
                  </div>
                  <h4>Processing document...</h4>
                  <p>AI Engine is analyzing structure, text zones and formatting rules.</p>

                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${progress}%` }}></div>
                    <span className="progress-percentage">{progress}%</span>
                  </div>
                </div>
              )}

              {result && (
                <div className="result-zone">
                  <CheckCircle2 className="success-icon" size={56} />
                  <h4>Conversion Successful!</h4>
                  <p>Document structure mapped and verified against standards.</p>

                  <div className="result-file-card">
                    <div className="result-file-details">
                      <div className="file-avatar">
                        {selectedTool === 'epub' ? <FileText size={20} /> : <FileCode size={20} />}
                      </div>
                      <div className="file-info-text">
                        <span className="res-name">{result.name}</span>
                        <span className="res-size">{result.size}</span>
                      </div>
                    </div>
                    <button className="download-btn" onClick={() => alert(`Downloading ${result.name}`)}>
                      Download File
                    </button>
                  </div>

                  <button className="convert-another-btn" onClick={resetTool}>
                    Convert Another Document
                  </button>
                </div>
              )}

              {file && !converting && !result && (
                <div className="action-row">
                  <button className="cancel-file-btn" onClick={() => setFile(null)}>
                    Remove File
                  </button>
                  <button className="start-btn" onClick={handleStartConversion}>
                    <Play size={14} fill="currentColor" /> Start Conversion
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
