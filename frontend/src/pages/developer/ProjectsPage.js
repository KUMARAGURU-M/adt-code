// src/pages/developer/ProjectsPage.js
import React, { useState } from 'react';
import './ProjectsPage.css';
import { apiCall, API_BASE, getCurrentUser, getAccessToken } from '../../utils/api';

const ProjectsPage = ({ projects, setProjects, tasks, setTasks }) => {
  const user = getCurrentUser();
  const isAdmin = user?.roles?.includes('Admin');
  const hasAccess = (perm) => isAdmin || (user?.permissions || []).includes(perm);

  const [selectedProject, setSelectedProject] = useState(null);
  const [detailTab, setDetailTab] = useState('overview');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const [newProj, setNewProj] = useState({
    name: '',
    client: '',
    lead: '',
    description: '',
    techStack: ''
  });

  // Edit mode states
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState('');

  const [isEditingTech, setIsEditingTech] = useState(false);
  const [editedTech, setEditedTech] = useState('');

  // Updates CRUD state
  const [newUpdateText, setNewUpdateText] = useState('');
  const [editingUpdateId, setEditingUpdateId] = useState(null);
  const [editedUpdateText, setEditedUpdateText] = useState('');

  // Core Card Editing State
  const [editingProject, setEditingProject] = useState(null);
  const [showEditCoreModal, setShowEditCoreModal] = useState(false);
  const [editProjForm, setEditProjForm] = useState({
    name: '',
    client: '',
    lead: '',
    progress: 0,
    repo: ''
  });

  const handleOpenEditCore = (proj) => {
    setEditingProject(proj);
    setEditProjForm({
      name: proj.name,
      client: proj.client,
      lead: proj.lead,
      progress: proj.progress,
      repo: proj.repo
    });
    setShowEditCoreModal(true);
  };
  const augmentProjects = (projectsList, tasksList) => {
    if (!projectsList) return [];
    return projectsList.map(p => {
      const techStack = p.technologies
        ? p.technologies.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const projectTasks = (tasksList || []).filter(t => t.project === p.name);
      const completedTasks = projectTasks.filter(t => t.status === 'Completed' || t.completed);
      const progress = projectTasks.length > 0
        ? Math.round((completedTasks.length / projectTasks.length) * 100)
        : 0;

      // Dynamically calculate assigned members who worked on tasks in this project
      const membersMap = {};
      projectTasks.forEach(t => {
        const name = t.assignedTo || 'Unassigned';
        if (name === 'Unassigned') return;

        if (!membersMap[name]) {
          membersMap[name] = {
            name: name,
            role: t.assignedToRole || 'Employee',
            taskCount: 0,
            completedCount: 0
          };
        }

        membersMap[name].taskCount += 1;
        if (t.completed || t.status === 'Completed') {
          membersMap[name].completedCount += 1;
        }
      });

      let team = Object.values(membersMap).map(m => ({
        name: m.name,
        role: m.role,
        hours: `${m.completedCount}/${m.taskCount} tasks completed`
      }));

      if (team.length === 0) {
        team = [];
      }

      return {
        ...p,
        client: p.client || '',
        lead: p.lead || '',
        progress: progress,
        repo: p.repositoryUrl || '',
        techStack: techStack,
        team: team,
        updates: p.updates || [],
        documents: p.documents || []
      };
    });
  };
  const handleSaveEditCore = (e) => {
    e.preventDefault();
    if (!editProjForm.name.trim()) return;

    const payload = {
      name: editProjForm.name,
      description: editingProject.description,
      technologies: editingProject.technologies || editingProject.techStack.join(', '),
      repositoryUrl: editProjForm.repo,
      status: Number(editProjForm.progress) === 100 ? 'Completed' : 'Active'
    };

    apiCall(`/developer/projects/${editingProject.id}`, 'PUT', payload)
      .then(() => apiCall('/developer/projects'))
      .then(res => {
        if (res) {
          const augmented = augmentProjects(res, tasks);
          setProjects(augmented);
          const updated = augmented.find(p => p.id === editingProject.id);
          if (updated) setSelectedProject(updated);
        }
      })
      .catch(err => alert('Error updating project: ' + err.message));

    setShowEditCoreModal(false);
    setEditingProject(null);
  };

  // Documents CRUD state
  const [newDoc, setNewDoc] = useState({ name: '', type: 'PDF Document', size: '1.5 MB', fileUrl: '', mediaFileId: null });
  const [showAddDocForm, setShowAddDocForm] = useState(false);
  const [editingDocIdx, setEditingDocIdx] = useState(null);
  const [editedDocName, setEditedDocName] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('entityType', 'project_document');
    formData.append('entityId', selectedProject.id);

    fetch(`${API_BASE}/media/upload`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getAccessToken()}`
      },
      body: formData
    })
      .then(res => res.json())
      .then(json => {
        setIsUploading(false);
        if (json.success) {
          const data = json.data;
          setNewDoc({
            name: data.originalName,
            type: file.type.includes('pdf') 
              ? 'PDF Document' 
              : file.type.includes('markdown') || file.name.endsWith('.md') 
                ? 'Markdown Spec' 
                : file.type.includes('image') 
                  ? 'Image' 
                  : file.type.includes('sheet') || file.type.includes('excel') 
                    ? 'Excel Spreadsheet' 
                    : 'Document',
            size: (data.fileSize / 1024 / 1024).toFixed(2) + ' MB',
            fileUrl: data.url,
            mediaFileId: data.id
          });
        } else {
          alert('Upload failed: ' + json.error);
        }
      })
      .catch(err => {
        setIsUploading(false);
        alert('Upload failed: ' + err.message);
      });
  };

  const handleSelectProject = (proj) => {
    setSelectedProject(proj);
    setEditedDescription(proj.description);
    setEditedTech(proj.techStack.join(', '));
    setIsEditingDescription(false);
    setIsEditingTech(false);
    setEditingUpdateId(null);
    setEditingDocIdx(null);
    setShowAddDocForm(false);
  };

  const handleSaveDescription = () => {
    const payload = {
      name: selectedProject.name,
      description: editedDescription,
      technologies: selectedProject.technologies || selectedProject.techStack.join(', '),
      repositoryUrl: selectedProject.repositoryUrl || selectedProject.repo,
      status: selectedProject.status
    };

    apiCall(`/developer/projects/${selectedProject.id}`, 'PUT', payload)
      .then(() => apiCall('/developer/projects'))
      .then(res => {
        if (res) {
          const augmented = augmentProjects(res, tasks);
          setProjects(augmented);
          const updated = augmented.find(p => p.id === selectedProject.id);
          if (updated) setSelectedProject(updated);
        }
      })
      .catch(err => alert('Error saving description: ' + err.message));

    setIsEditingDescription(false);
  };

  const handleSaveTech = () => {
    const payload = {
      name: selectedProject.name,
      description: selectedProject.description,
      technologies: editedTech,
      repositoryUrl: selectedProject.repositoryUrl || selectedProject.repo,
      status: selectedProject.status
    };

    apiCall(`/developer/projects/${selectedProject.id}`, 'PUT', payload)
      .then(() => apiCall('/developer/projects'))
      .then(res => {
        if (res) {
          const augmented = augmentProjects(res, tasks);
          setProjects(augmented);
          const updated = augmented.find(p => p.id === selectedProject.id);
          if (updated) setSelectedProject(updated);
        }
      })
      .catch(err => alert('Error saving tech stack: ' + err.message));

    setIsEditingTech(false);
  };

  const handleAddUpdate = (e) => {
    e.preventDefault();
    if (!newUpdateText.trim()) return;

    const currentUser = getCurrentUser();
    const authorName = currentUser?.fullName || currentUser?.userCode || 'Kumar';

    apiCall(`/developer/projects/${selectedProject.id}/updates`, 'POST', {
      author: authorName,
      text: newUpdateText
    })
      .then(newUpdate => {
        if (newUpdate) {
          const updatedUpdates = [newUpdate, ...selectedProject.updates];
          const updatedProjects = projects.map(p => 
            p.id === selectedProject.id ? { ...p, updates: updatedUpdates } : p
          );
          setProjects(updatedProjects);
          setSelectedProject({ ...selectedProject, updates: updatedUpdates });
        }
        setNewUpdateText('');
      })
      .catch(err => alert('Error adding update: ' + err.message));
  };

  const handleSaveEditedUpdate = (updateId) => {
    const currentUser = getCurrentUser();
    const authorName = currentUser?.fullName || currentUser?.userCode || 'Kumar';

    apiCall(`/developer/projects/updates/${updateId}`, 'PUT', {
      author: authorName,
      text: editedUpdateText
    })
      .then(updatedUpdate => {
        if (updatedUpdate) {
          const updatedUpdates = selectedProject.updates.map(u => 
            u.id === updateId ? updatedUpdate : u
          );
          const updatedProjects = projects.map(p => 
            p.id === selectedProject.id ? { ...p, updates: updatedUpdates } : p
          );
          setProjects(updatedProjects);
          setSelectedProject({ ...selectedProject, updates: updatedUpdates });
        }
        setEditingUpdateId(null);
      })
      .catch(err => alert('Error updating update: ' + err.message));
  };

  const handleDeleteUpdate = (updateId) => {
    if (window.confirm("Are you sure you want to delete this update?")) {
      apiCall(`/developer/projects/updates/${updateId}`, 'DELETE')
        .then(() => {
          const updatedUpdates = selectedProject.updates.filter(u => u.id !== updateId);
          const updatedProjects = projects.map(p =>
            p.id === selectedProject.id ? { ...p, updates: updatedUpdates } : p
          );
          setProjects(updatedProjects);
          setSelectedProject({ ...selectedProject, updates: updatedUpdates });
        })
        .catch(err => alert('Error deleting update: ' + err.message));
    }
  };

  const handleAddDocument = (e) => {
    e.preventDefault();
    if (!newDoc.name.trim()) return;

    apiCall(`/developer/projects/${selectedProject.id}/documents`, 'POST', {
      name: newDoc.name,
      type: newDoc.type,
      size: newDoc.size || '1.0 MB',
      fileUrl: newDoc.fileUrl || '',
      mediaFileId: newDoc.mediaFileId || null
    })
      .then(newDocument => {
        if (newDocument) {
          const updatedDocs = [...selectedProject.documents, newDocument];
          const updatedProjects = projects.map(p => 
            p.id === selectedProject.id ? { ...p, documents: updatedDocs } : p
          );
          setProjects(updatedProjects);
          setSelectedProject({ ...selectedProject, documents: updatedDocs });
        }
        setNewDoc({ name: '', type: 'PDF Document', size: '1.5 MB', fileUrl: '', mediaFileId: null });
        setShowAddDocForm(false);
      })
      .catch(err => alert('Error adding document: ' + err.message));
  };

  const handleSaveEditedDoc = (idx) => {
    const docToEdit = selectedProject.documents[idx];
    if (!docToEdit) return;

    apiCall(`/developer/projects/documents/${docToEdit.id}`, 'PUT', {
      name: editedDocName,
      type: docToEdit.type,
      size: docToEdit.size,
      fileUrl: docToEdit.fileUrl || '',
      mediaFileId: docToEdit.mediaFileId || null
    })
      .then(updatedDoc => {
        if (updatedDoc) {
          const updatedDocs = selectedProject.documents.map((d, i) =>
            i === idx ? updatedDoc : d
          );
          const updatedProjects = projects.map(p =>
            p.id === selectedProject.id ? { ...p, documents: updatedDocs } : p
          );
          setProjects(updatedProjects);
          setSelectedProject({ ...selectedProject, documents: updatedDocs });
        }
        setEditingDocIdx(null);
      })
      .catch(err => alert('Error editing document: ' + err.message));
  };

  const handleDeleteDoc = (idx) => {
    const docToDelete = selectedProject.documents[idx];
    if (!docToDelete) return;

    if (window.confirm("Are you sure you want to delete this document?")) {
      apiCall(`/developer/projects/documents/${docToDelete.id}`, 'DELETE')
        .then(() => {
          const updatedDocs = selectedProject.documents.filter((d, i) => i !== idx);
          const updatedProjects = projects.map(p =>
            p.id === selectedProject.id ? { ...p, documents: updatedDocs } : p
          );
          setProjects(updatedProjects);
          setSelectedProject({ ...selectedProject, documents: updatedDocs });
        })
        .catch(err => alert('Error deleting document: ' + err.message));
    }
  };

  const handleDeleteProject = (projectId) => {
    if (window.confirm("Are you sure you want to delete this project? This will permanently delete all associated tasks, corrections, and references.")) {
      apiCall(`/developer/projects/${projectId}`, 'DELETE')
        .then(() => apiCall('/developer/projects'))
        .then(res => {
          if (res) {
            setProjects(augmentProjects(res, tasks));
          } else {
            setProjects(prev => prev.filter(p => p.id !== projectId));
          }
          setSelectedProject(null);
          alert('Project deleted successfully.');
        })
        .catch(err => alert('Error deleting project: ' + err.message));
    }
  };

  const handleCreateProject = (e) => {
    e.preventDefault();
    if (!newProj.name.trim()) return;

    const payload = {
      name: newProj.name,
      description: newProj.description,
      technologies: newProj.techStack,
      repositoryUrl: 'https://github.com/company/' + newProj.name.toLowerCase().replace(/\s+/g, '-'),
      status: 'Active'
    };

    apiCall('/developer/projects', 'POST', payload)
      .then(() => apiCall('/developer/projects'))
      .then(res => {
        if (res) {
          setProjects(augmentProjects(res, tasks));
        }
      })
      .catch(err => alert('Error creating project: ' + err.message));

    setShowCreateModal(false);
    setNewProj({ name: '', client: '', lead: '', description: '', techStack: '' });
  };

  return (
    <div className="dev-full-width-panel" style={{ marginTop: '0' }}>

      {/* HEADER BAR */}
      <div className="dev-panel-header">
        <div className="dev-panel-title">
          <span>📁 Software Project Management</span>
          {selectedProject && (
            <span className="dev-badge dev-badge-blue">
              Selected: {selectedProject.name}
            </span>
          )}
        </div>
        <div className="dev-panel-actions">
          {selectedProject ? (
            <button className="dev-btn dev-btn-secondary" onClick={() => setSelectedProject(null)}>
              ← Back to All Projects
            </button>
          ) : (
            hasAccess('developer_projects.create') && (
              <button className="dev-btn dev-btn-primary" onClick={() => setShowCreateModal(true)}>
                + Create New Project
              </button>
            )
          )}
        </div>
      </div>

      {/* MASTER LIST VIEW */}
      {!selectedProject ? (
        <div className="dev-stats-grid">
          {projects.map(proj => (
            <div key={proj.id} className="dev-stat-card" style={{ borderTop: `4px solid ${proj.status === 'Completed' ? '#38a169' : '#00a3ff'}`, cursor: 'pointer' }} onClick={() => handleSelectProject(proj)}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#1a202c' }}>{proj.name}</h3>
                <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                  <span className={`dev-badge ${proj.status === 'Completed' ? 'dev-badge-success' : 'dev-badge-blue'}`}>
                    {proj.status}
                  </span>
                </div>
              </div>
              <div style={{ fontSize: '0.82rem', color: '#718096', marginBottom: '10px' }}>
                Client: <strong>{proj.client}</strong> • Lead: <strong>{proj.lead}</strong>
              </div>
              <p style={{ fontSize: '0.85rem', color: '#4a5568', lineHeight: '1.45', marginBottom: '12px' }}>
                {proj.description.length > 110 ? proj.description.substring(0, 110) + '...' : proj.description}
              </p>

              {/* Tech Stack Tags */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginBottom: '14px' }}>
                {proj.techStack.map((tech, i) => (
                  <span key={i} style={{ fontSize: '0.72rem', background: '#f1f5f9', color: '#475569', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                    {tech}
                  </span>
                ))}
              </div>

              {/* Progress Bar */}
              <div style={{ marginTop: 'auto' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#718096', marginBottom: '4px' }}>
                  <span>Completion Progress</span>
                  <strong>{proj.progress}%</strong>
                </div>
                <div style={{ height: '6px', width: '100%', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${proj.progress}%`, background: proj.progress === 100 ? '#22c55e' : 'linear-gradient(90deg, #00a3ff, #3182ce)', borderRadius: '4px' }} />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (

        /* DEEP PROJECT DETAIL VIEW */
        <div style={{ marginTop: '10px' }}>

          {/* Sub Navigation Tabs */}
          <div className="dev-filter-pills" style={{ marginBottom: '16px', borderBottom: '1px solid #edf2f7', paddingBottom: '10px' }}>
            {[
              { id: 'overview', label: '📌 Overview & Stack' },
              { id: 'work', label: `✅ Tasks (${tasks.filter(t => t.project === selectedProject.name).length})` },
              { id: 'updates', label: `⚡ Activity Updates (${selectedProject.updates.length})` },
              { id: 'docs', label: `📄 Documents (${selectedProject.documents.length})` }
            ].map(tab => (
              <button
                key={tab.id}
                className={`dev-pill ${detailTab === tab.id ? 'active' : ''}`}
                onClick={() => setDetailTab(tab.id)}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* TAB 1: OVERVIEW */}
          {detailTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

              {/* Description Box */}
              {isEditingDescription ? (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#1a202c' }}>Edit Project Description</h4>
                  <textarea
                    className="dev-textarea"
                    value={editedDescription}
                    onChange={(e) => setEditedDescription(e.target.value)}
                    style={{ width: '100%', minHeight: '80px', marginBottom: '8px', padding: '8px' }}
                  />
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="dev-btn dev-btn-primary" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={handleSaveDescription}>Save</button>
                    <button className="dev-btn dev-btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => setIsEditingDescription(false)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <h4 style={{ margin: 0, color: '#1a202c' }}>Project Description</h4>
                    {hasAccess('developer_projects.update') && (
                      <button className="dev-btn dev-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => { setEditedDescription(selectedProject.description); setIsEditingDescription(true); }} title="Edit">✏️</button>
                    )}
                  </div>
                  <p style={{ margin: 0, color: '#4a5568', lineHeight: '1.6', fontSize: '0.92rem' }}>{selectedProject.description}</p>
                </div>
              )}

              <div className="dev-two-col">
                {/* Tech Stack Box */}
                {isEditingTech ? (
                  <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ margin: '0 0 10px 0', color: '#1a202c' }}>Edit Technology Stack</h4>
                    <input
                      type="text"
                      className="dev-input"
                      value={editedTech}
                      onChange={(e) => setEditedTech(e.target.value)}
                      style={{ width: '100%', marginBottom: '8px', padding: '6px' }}
                      placeholder="Comma separated: React, Node.js"
                    />
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="dev-btn dev-btn-primary" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={handleSaveTech}>Save</button>
                      <button className="dev-btn dev-btn-secondary" style={{ padding: '4px 12px', fontSize: '0.8rem' }} onClick={() => setIsEditingTech(false)}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <h4 style={{ margin: 0, color: '#1a202c' }}>Technology Stack</h4>
                      {hasAccess('developer_projects.update') && (
                        <button className="dev-btn dev-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => { setEditedTech(selectedProject.techStack.join(', ')); setIsEditingTech(true); }} title="Edit">✏️</button>
                      )}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {selectedProject.techStack.map((tech, idx) => (
                        <span key={idx} className="dev-badge dev-badge-blue">{tech}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Project Details & Repo Box */}
                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <h4 style={{ margin: 0, color: '#1a202c' }}>Project Details</h4>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {hasAccess('developer_projects.update') && (
                        <button className="dev-btn dev-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => handleOpenEditCore(selectedProject)} title="Edit Details">✏️</button>
                      )}
                      {hasAccess('developer_projects.delete') && (
                        <button className="dev-btn dev-btn-danger" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => handleDeleteProject(selectedProject.id)} title="Delete Project">🗑️</button>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '0.86rem' }}>
                    <div><strong>Client Name:</strong> <span style={{ color: '#4a5568' }}>{selectedProject.client}</span></div>
                    <div><strong>Team Lead:</strong> <span style={{ color: '#4a5568' }}>{selectedProject.lead}</span></div>
                    <div><strong>Repository:</strong> <a href={selectedProject.repo} target="_blank" rel="noreferrer" style={{ color: '#00a3ff', wordBreak: 'break-all' }}>{selectedProject.repo}</a></div>
                    <div>
                      <strong>Completion Progress:</strong> <span style={{ color: '#2d3748', fontWeight: 'bold' }}>{selectedProject.progress}%</span>
                      <div style={{ height: '6px', width: '100%', background: '#e2e8f0', borderRadius: '4px', overflow: 'hidden', marginTop: '4px' }}>
                        <div style={{ height: '100%', width: `${selectedProject.progress}%`, background: 'linear-gradient(90deg, #00a3ff, #3182ce)', borderRadius: '4px' }} />
                      </div>
                    </div>
                  </div>
                </div>

                <div style={{ background: '#ffffff', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <h4 style={{ margin: '0 0 10px 0', color: '#1a202c' }}>Assigned Team Members</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {selectedProject.team.map((m, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', borderBottom: '1px solid #f1f5f9', paddingBottom: '4px' }}>
                        <span>👤 <strong>{m.name}</strong> ({m.role})</span>
                        <span style={{ color: '#718096' }}>{m.hours} logged</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TASKS & WORK BREAKDOWN */}
          {detailTab === 'work' && (
            <div className="dev-table-wrapper">
              <table className="dev-table" style={{ tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                  <col style={{ width: '35%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '10%' }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left' }}>Task Title</th>
                    <th style={{ textAlign: 'center' }}>Assigned Developer</th>
                    <th style={{ textAlign: 'center' }}>Priority</th>
                    <th style={{ textAlign: 'center' }}>Assigned Date</th>
                    <th style={{ textAlign: 'center' }}>Completed Date</th>
                    <th style={{ textAlign: 'center' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.filter(t => t.project === selectedProject.name).map(t => (
                    <tr key={t.id}>
                      <td style={{ textAlign: 'left', fontWeight: '600', wordBreak: 'break-word' }}>
                        {t.title}
                        {t.correction && (
                          <div style={{ marginTop: '4px', padding: '4px 6px', background: '#fff5f5', border: '1px solid #fed7d7', borderRadius: '4px', color: '#c53030', fontWeight: 'normal', fontSize: '0.8rem' }}>
                            <strong>Correction:</strong> {t.correction}
                            {t.feedback && <div style={{ color: '#9b2c2c', fontStyle: 'italic', marginTop: '2px' }}>Feedback: "{t.feedback}"</div>}
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: 'center' }}>👤 {t.assignedTo}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`dev-badge ${t.priority === 'High' ? 'dev-badge-rose' : t.priority === 'Medium' ? 'dev-badge-amber' : 'dev-badge-blue'}`}>
                          {t.priority}
                        </span>
                      </td>
                      <td style={{ textAlign: 'center' }}>{(() => { try { if (!t.assignedDate) return '—'; const cleanDate = t.assignedDate.includes('T') ? t.assignedDate.split('T')[0] : t.assignedDate; const parts = cleanDate.split('-'); if (parts.length === 3) { const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)); return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'); } const d = new Date(t.assignedDate); return !isNaN(d) ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : t.assignedDate || '—'; } catch { return t.assignedDate || '—'; } })()}</td>
                      <td style={{ textAlign: 'center' }}>{(() => { try { if (!t.completedDate) return '—'; const cleanDate = t.completedDate.includes('T') ? t.completedDate.split('T')[0] : t.completedDate; const parts = cleanDate.split('-'); if (parts.length === 3) { const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)); return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-'); } const d = new Date(t.completedDate); return !isNaN(d) ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).replace(/ /g, '-') : t.completedDate || '—'; } catch { return t.completedDate || '—'; } })()}</td>
                      <td style={{ textAlign: 'center' }}>
                        <span className={`dev-badge ${t.status === 'Completed' ? 'dev-badge-success' : t.status === 'Review' ? 'dev-badge-purple' : t.status === 'In Progress' ? 'dev-badge-blue' : t.status === 'Correction' ? 'dev-badge-rose' : 'dev-badge-amber'}`}>
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* TAB 3: UPDATES & ACTIVITY */}
          {detailTab === 'updates' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {hasAccess('developer_projects.update') && (
                <form onSubmit={handleAddUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                  <textarea
                    className="dev-textarea"
                    placeholder="Type a daily development update, requirement change, or announcement..."
                    value={newUpdateText}
                    onChange={(e) => setNewUpdateText(e.target.value)}
                    required
                    style={{ width: '100%', minHeight: '80px', padding: '8px' }}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="submit" className="dev-btn dev-btn-primary">+ Add Update</button>
                  </div>
                </form>
              )}

              {/* Updates List */}
              {selectedProject.updates.map(u => (
                <div key={u.id}>
                  {editingUpdateId === u.id ? (
                    <div className="dev-task-item" style={{ borderLeft: '4px solid var(--dev-accent-purple)' }}>
                      <textarea
                        className="dev-textarea"
                        value={editedUpdateText}
                        onChange={(e) => setEditedUpdateText(e.target.value)}
                        style={{ width: '100%', minHeight: '60px', marginBottom: '8px', padding: '6px' }}
                      />
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="dev-btn dev-btn-primary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => handleSaveEditedUpdate(u.id)}>Save</button>
                        <button className="dev-btn dev-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => setEditingUpdateId(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="dev-task-item">
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontSize: '0.8rem', color: '#718096' }}>
                        <span>By <strong>{u.author}</strong></span>
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                          <span>{u.date}</span>
                          {hasAccess('developer_projects.update') && (
                            <button style={{ background: 'none', border: 'none', color: '#3182ce', cursor: 'pointer', fontSize: '0.75rem' }} onClick={() => { setEditingUpdateId(u.id); setEditedUpdateText(u.text); }} title="Edit">✏️</button>
                          )}
                          {hasAccess('developer_projects.delete') && (
                            <button style={{ background: 'none', border: 'none', color: '#e53e3e', cursor: 'pointer', fontSize: '0.75rem' }} onClick={() => handleDeleteUpdate(u.id)} title="Delete">🗑️</button>
                          )}
                        </div>
                      </div>
                      <p style={{ margin: 0, color: '#2d3748', fontSize: '0.9rem' }}>{u.text}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: DOCUMENTS */}
          {detailTab === 'docs' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {/* Add Document Form */}
              <div style={{ marginBottom: '16px' }}>
                {hasAccess('developer_projects.update') && (
                  !showAddDocForm ? (
                    <button className="dev-btn dev-btn-primary" onClick={() => setShowAddDocForm(true)}>+ Add Document</button>
                  ) : (
                    <form onSubmit={handleAddDocument} style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <h4 style={{ margin: 0, color: '#2d3748' }}>Add New Document</h4>
                      
                      <div className="dev-form-group" style={{ marginBottom: '8px' }}>
                        <label style={{ fontSize: '0.8rem', fontWeight: 'bold', color: '#4a5568' }}>Select File to Upload</label>
                        <input 
                          type="file" 
                          onChange={handleFileUpload} 
                          style={{ fontSize: '0.85rem', marginTop: '4px' }} 
                        />
                        {isUploading && <span style={{ fontSize: '0.75rem', color: '#3182ce', marginLeft: '8px' }}>Uploading file...</span>}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <input
                          type="text"
                          className="dev-input"
                          placeholder="Document Name (e.g. Architecture RFC.pdf)"
                          value={newDoc.name}
                          onChange={(e) => setNewDoc({ ...newDoc, name: e.target.value })}
                          required
                          style={{ flex: 2, minWidth: '200px' }}
                        />
                        <select
                          className="dev-input"
                          value={newDoc.type}
                          onChange={(e) => setNewDoc({ ...newDoc, type: e.target.value })}
                          style={{ flex: 1, minWidth: '120px' }}
                        >
                          <option value="PDF Document">PDF Document</option>
                          <option value="Markdown Spec">Markdown Spec</option>
                          <option value="Image">Image</option>
                          <option value="Excel Spreadsheet">Excel Spreadsheet</option>
                        </select>
                        <input
                          type="text"
                          className="dev-input"
                          placeholder="Size (e.g. 1.2 MB)"
                          value={newDoc.size}
                          onChange={(e) => setNewDoc({ ...newDoc, size: e.target.value })}
                          style={{ flex: 1, minWidth: '80px' }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="submit" className="dev-btn dev-btn-primary" style={{ padding: '4px 12px' }} disabled={isUploading}>Add</button>
                        <button type="button" className="dev-btn dev-btn-secondary" style={{ padding: '4px 12px' }} onClick={() => setShowAddDocForm(false)}>Cancel</button>
                      </div>
                    </form>
                  )
                )}
              </div>

              {/* Documents List */}
              {selectedProject.documents.map((doc, idx) => (
                <div key={idx}>
                  {editingDocIdx === idx ? (
                    <div className="dev-meeting-item" style={{ borderLeft: '4px solid var(--dev-accent-purple)' }}>
                      <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
                        <input
                          type="text"
                          className="dev-input"
                          value={editedDocName}
                          onChange={(e) => setEditedDocName(e.target.value)}
                          style={{ flex: 1 }}
                        />
                      </div>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="dev-btn dev-btn-primary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => handleSaveEditedDoc(idx)}>Save</button>
                        <button className="dev-btn dev-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => setEditingDocIdx(null)}>Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <div className="dev-meeting-item">
                      <div>
                        <h4 className="dev-meeting-title">📄 {doc.name}</h4>
                        <span style={{ fontSize: '0.78rem', color: '#718096' }}>{doc.type} • {doc.size}</span>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        {doc.fileUrl ? (
                          <>
                            <button className="dev-btn dev-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => window.open(`${API_BASE}${doc.fileUrl}`, '_blank')}>
                              👁️ View
                            </button>
                            <a href={`${API_BASE}${doc.fileUrl}`} download={doc.name} target="_blank" rel="noreferrer" className="dev-btn dev-btn-secondary" style={{ textDecoration: 'none', padding: '4px 10px', fontSize: '0.78rem' }}>
                              ⬇ Download
                            </a>
                          </>
                        ) : (
                          <button className="dev-btn dev-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => alert(`Downloading mock document: ${doc.name}`)}>
                            ⬇ Download
                          </button>
                        )}
                        {hasAccess('developer_projects.update') && (
                          <button className="dev-btn dev-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => { setEditingDocIdx(idx); setEditedDocName(doc.name); }} title="Edit">
                            ✏️
                          </button>
                        )}
                        {hasAccess('developer_projects.delete') && (
                          <button className="dev-btn dev-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem', color: '#e53e3e' }} onClick={() => handleDeleteDoc(idx)} title="Delete">
                            🗑️
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* CREATE PROJECT MODAL */}
      {showCreateModal && (
        <div className="dev-modal-overlay">
          <div className="dev-modal">
            <div className="dev-modal-header">
              <h3 className="dev-modal-title">+ Create Software Project</h3>
              <button className="dev-modal-close" onClick={() => setShowCreateModal(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateProject}>
              <div className="dev-form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  className="dev-input"
                  placeholder="e.g. AI Workflow Automator"
                  value={newProj.name}
                  onChange={e => setNewProj({ ...newProj, name: e.target.value })}
                  required
                />
              </div>
              <div className="dev-form-group">
                <label>Client Name</label>
                <input
                  type="text"
                  className="dev-input"
                  placeholder="e.g. Acme Corp"
                  value={newProj.client}
                  onChange={e => setNewProj({ ...newProj, client: e.target.value })}
                />
              </div>
              <div className="dev-form-group">
                <label>Tech Stack (Comma Separated)</label>
                <input
                  type="text"
                  className="dev-input"
                  value={newProj.techStack}
                  onChange={e => setNewProj({ ...newProj, techStack: e.target.value })}
                  required
                />
              </div>
              <div className="dev-form-group">
                <label>Project Description</label>
                <textarea
                  className="dev-textarea"
                  placeholder="Describe the software solution..."
                  value={newProj.description}
                  onChange={e => setNewProj({ ...newProj, description: e.target.value })}
                  required
                />
              </div>
              <div className="dev-modal-actions">
                <button type="button" className="dev-btn dev-btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
                <button type="submit" className="dev-btn dev-btn-primary">Create Project</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT PROJECT CORE DETAILS MODAL */}
      {showEditCoreModal && (
        <div className="dev-modal-overlay">
          <div className="dev-modal">
            <div className="dev-modal-header">
              <h3 className="dev-modal-title">✏️ Edit Project Details</h3>
              <button className="dev-modal-close" onClick={() => setShowEditCoreModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveEditCore}>
              <div className="dev-form-group">
                <label>Project Name</label>
                <input
                  type="text"
                  className="dev-input"
                  value={editProjForm.name}
                  onChange={e => setEditProjForm({ ...editProjForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="dev-form-group">
                <label>Client Name</label>
                <input
                  type="text"
                  className="dev-input"
                  value={editProjForm.client}
                  onChange={e => setEditProjForm({ ...editProjForm, client: e.target.value })}
                />
              </div>
              <div className="dev-form-group">
                <label>Team Lead</label>
                <input
                  type="text"
                  className="dev-input"
                  value={editProjForm.lead}
                  onChange={e => setEditProjForm({ ...editProjForm, lead: e.target.value })}
                  required
                />
              </div>
              <div className="dev-form-group">
                <label>Completion Progress (%)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  className="dev-input"
                  value={editProjForm.progress}
                  onChange={e => setEditProjForm({ ...editProjForm, progress: e.target.value })}
                  required
                />
              </div>
              <div className="dev-form-group">
                <label>Repository Link</label>
                <input
                  type="text"
                  className="dev-input"
                  value={editProjForm.repo}
                  onChange={e => setEditProjForm({ ...editProjForm, repo: e.target.value })}
                  required
                />
              </div>
              <div className="dev-modal-actions">
                <button type="button" className="dev-btn dev-btn-secondary" onClick={() => setShowEditCoreModal(false)}>Cancel</button>
                <button type="submit" className="dev-btn dev-btn-primary">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ProjectsPage;
