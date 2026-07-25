import React, { useState, useEffect } from 'react';
import './MeetingsPage.css';
import { apiCall, getCurrentUser } from '../../utils/api';

const MeetingsPage = ({ meetings, setMeetings, projects }) => {
  const user = getCurrentUser();
  const isAdmin = user?.roles?.includes('Admin');
  const hasAccess = (perm) => isAdmin || (user?.permissions || []).includes(perm);

  const currentUser = getCurrentUser();
  const currentUserName = currentUser?.fullName || currentUser?.userCode || '';

  const [selectedMeeting, setSelectedMeeting] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingMeetingId, setEditingMeetingId] = useState(null);

  // Available attendees
  const [availableDevelopers, setAvailableDevelopers] = useState([]);
  
  const [attendeeRoles, setAttendeeRoles] = useState({});

  useEffect(() => {
    apiCall('/users')
      .then(data => {
        if (data && Array.isArray(data)) {
          const devUsers = data.filter(u => {
            const roleName = (u.role || '').toLowerCase();
            const rolesArr = (u.roles || []).map(r => r.toLowerCase());
            return roleName.startsWith('dev-') || roleName === 'admin' || rolesArr.some(r => r.startsWith('dev-') || r === 'admin');
          });
          const names = devUsers.map(u => u.fullName || u.name || 'Unknown');
          const rolesMap = {};
          data.forEach(u => {
            const name = u.fullName || u.name || 'Unknown';
            rolesMap[name] = u.role || 'Employee';
          });
          setAvailableDevelopers(names);
          setAttendeeRoles(rolesMap);
        }
      })
      .catch(err => console.warn('Failed to load real attendees:', err.message));
  }, []);

  const [meetingForm, setMeetingForm] = useState({
    title: '',
    project: projects.length > 0 ? projects[0].name : '',
    date: new Date().toISOString().split('T')[0],
    time: '10:00 AM - 10:30 AM',
    location: 'Google Meet / Online',
    attendees: [currentUserName],
    agenda: '',
    discussion: '',
    decisions: '',
    actionItems: ''
  });

  const handleActionToggle = (meetingId, actionId) => {
    apiCall(`/developer/meetings/action-item/${actionId}/toggle`, 'PATCH')
      .then(() => apiCall('/developer/meetings'))
      .then(res => {
        if (res) {
          setMeetings(res);
          setSelectedMeeting(prev => {
            if (!prev) return null;
            return res.find(m => m.id === meetingId) || prev;
          });
        }
      })
      .catch(err => alert('Error toggling action item: ' + err.message));
  };

  const handleOpenAddModal = () => {
    setModalMode('add');
    setEditingMeetingId(null);
    setMeetingForm({
      title: '',
      project: projects.length > 0 ? projects[0].name : '',
      date: new Date().toISOString().split('T')[0],
      time: '10:00 AM - 10:30 AM',
      location: 'Google Meet / Online',
      attendees: [currentUserName],
      agenda: '',
      discussion: '',
      decisions: '',
      actionItems: ''
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (m) => {
    setModalMode('edit');
    setEditingMeetingId(m.id);
    setMeetingForm({
      title: m.title,
      project: m.project,
      date: m.date,
      time: m.time,
      location: m.location || 'Google Meet / Online',
      attendees: m.attendees || [],
      agenda: m.agenda,
      discussion: m.discussion || '',
      decisions: m.decisions ? m.decisions.join('\n') : '',
      actionItems: m.actionItems ? m.actionItems.map(a => a.text).join('\n') : ''
    });
    setShowAddModal(true);
  };

  const handleAttendeeCheckboxChange = (dev) => {
    if (meetingForm.attendees.includes(dev)) {
      setMeetingForm({
        ...meetingForm,
        attendees: meetingForm.attendees.filter(a => a !== dev)
      });
    } else {
      setMeetingForm({
        ...meetingForm,
        attendees: [...meetingForm.attendees, dev]
      });
    }
  };

  const handleSaveMeeting = (e) => {
    e.preventDefault();
    if (!meetingForm.title.trim()) return;

    const payload = {
      title: meetingForm.title,
      project: meetingForm.project,
      date: meetingForm.date,
      time: meetingForm.time,
      location: meetingForm.location,
      attendees: meetingForm.attendees,
      agenda: meetingForm.agenda,
      discussion: meetingForm.discussion,
      decisions: meetingForm.decisions,
      actionItems: meetingForm.actionItems
    };

    if (modalMode === 'add') {
      apiCall('/developer/meetings', 'POST', payload)
        .then(() => apiCall('/developer/meetings'))
        .then(res => {
          if (res) setMeetings(res);
        })
        .catch(err => alert('Error saving meeting: ' + err.message));
    } else {
      apiCall(`/developer/meetings/${editingMeetingId}`, 'PUT', payload)
        .then(() => apiCall('/developer/meetings'))
        .then(res => {
          if (res) setMeetings(res);
        })
        .catch(err => alert('Error updating meeting: ' + err.message));
    }
    setShowAddModal(false);
  };

  const handleDeleteMeeting = (id) => {
    if (window.confirm("Are you sure you want to delete this meeting?")) {
      apiCall(`/developer/meetings/${id}`, 'DELETE')
        .then(() => apiCall('/developer/meetings'))
        .then(res => {
          if (res) setMeetings(res);
        })
        .catch(err => alert('Error deleting meeting: ' + err.message));
    }
  };

  return (
    <div className="dev-full-width-panel" style={{ marginTop: '0' }}>
      
      {/* HEADER BAR */}
      <div className="dev-panel-header" style={{ marginBottom: '20px' }}>
        <div className="dev-panel-title">
          <span>📅 Sprint Syncs & Meeting Records</span>
        </div>
        {hasAccess('developer_meetings.create') && (
          <button className="dev-btn dev-btn-primary" onClick={handleOpenAddModal}>
            + Record Meeting
          </button>
        )}
      </div>

      {/* MEETINGS GRID */}
      <div className="meetings-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '16px' }}>
        {meetings.filter(m => m.attendees && m.attendees.includes(currentUserName)).map(m => (
          <div key={m.id} className="dev-meeting-card" style={{ background: '#ffffff', border: '1px solid #cbd5e1', borderRadius: '12px', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <span className="dev-badge dev-badge-purple" style={{ marginBottom: '6px', display: 'inline-block' }}>{m.project}</span>
                <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#1e293b' }}>{m.title}</h3>
              </div>
              {(!m.createdBy || m.createdBy === currentUserName) && (
                <div style={{ display: 'flex', gap: '6px' }}>
                  {hasAccess('developer_meetings.update') && (
                    <button className="dev-btn dev-btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem' }} onClick={() => handleOpenEditModal(m)} title="Edit">✏️</button>
                  )}
                  {hasAccess('developer_meetings.delete') && (
                    <button className="dev-btn dev-btn-secondary" style={{ padding: '2px 8px', fontSize: '0.75rem', color: '#e53e3e' }} onClick={() => handleDeleteMeeting(m.id)} title="Delete">🗑️</button>
                  )}
                </div>
              )}
            </div>

            <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
              <div>🕒 {m.date} ({m.time})</div>
              <div>📍 {m.location || 'Google Meet / Online'}</div>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Agenda:</div>
              <p style={{ margin: 0, fontSize: '0.88rem', color: '#475569' }}>{m.agenda}</p>
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
              <div style={{ fontSize: '0.76rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Participants:</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {(m.attendees || []).map((att, idx) => (
                  <span key={idx} className="dev-badge dev-badge-blue" style={{ fontSize: '0.75rem' }}>
                    👤 {att} ({attendeeRoles[att] || 'Developer'})
                  </span>
                ))}
              </div>
            </div>

            {m.decisions && m.decisions.length > 0 && (
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Decisions Taken:</div>
                <ul style={{ margin: '0 0 0 16px', padding: 0, fontSize: '0.85rem', color: '#475569' }}>
                  {m.decisions.map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            )}

            {m.actionItems && m.actionItems.length > 0 && (
              <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px' }}>
                <div style={{ fontSize: '0.76rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Action Items Checklist:</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {m.actionItems.map(a => (
                    <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      <button 
                        className={`dev-checkbox ${a.completed ? 'checked' : ''}`}
                        onClick={() => hasAccess('developer_meetings.update') ? handleActionToggle(m.id, a.id) : alert("Access Denied")}
                        style={{ width: '14px', height: '14px', fontSize: '0.65rem', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        {a.completed && '✓'}
                      </button>
                      <span style={{ textDecoration: a.completed ? 'line-through' : 'none', color: a.completed ? '#a0aec0' : '#475569' }}>
                        {a.text}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '8px', marginTop: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                  {m.actionItems ? m.actionItems.filter(a => a.completed).length : 0} of {m.actionItems ? m.actionItems.length : 0} actions completed
                </span>
                <button className="dev-btn dev-btn-secondary" style={{ padding: '4px 10px', fontSize: '0.78rem' }} onClick={() => setSelectedMeeting(m)}>
                  View Minutes & Actions
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* MEETING DETAILS MODAL */}
      {selectedMeeting && (
        <div className="dev-modal-overlay">
          <div className="dev-modal" style={{ maxWidth: '600px' }}>
            <div className="dev-modal-header">
              <h3 className="dev-modal-title">📅 {selectedMeeting.title}</h3>
              <button className="dev-modal-close" onClick={() => setSelectedMeeting(null)}>✕</button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', fontSize: '0.9rem' }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: '#718096', fontWeight: '700', textTransform: 'uppercase' }}>Project & Time:</div>
                <div style={{ color: '#00a3ff', fontWeight: '600' }}>{selectedMeeting.project} • {selectedMeeting.date} ({selectedMeeting.time})</div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', color: '#718096', fontWeight: '700', textTransform: 'uppercase' }}>Attendees:</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '4px' }}>
                  {(selectedMeeting.attendees || []).map((att, idx) => (
                    <span key={idx} className="dev-badge dev-badge-blue">
                      👤 {att} ({attendeeRoles[att] || 'Developer'})
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: '0.78rem', color: '#718096', fontWeight: '700', textTransform: 'uppercase' }}>Discussion Summary:</div>
                <p style={{ margin: '4px 0 0 0', color: '#4a5568', lineHeight: '1.5' }}>{selectedMeeting.discussion || 'No discussion logged.'}</p>
              </div>

              {selectedMeeting.decisions && selectedMeeting.decisions.length > 0 && (
                <div>
                  <div style={{ fontSize: '0.78rem', color: '#718096', fontWeight: '700', textTransform: 'uppercase' }}>Decisions Taken:</div>
                  <ul style={{ margin: '4px 0 0 16px', color: '#2d3748' }}>
                    {selectedMeeting.decisions.map((d, i) => (
                      <li key={i}>{d}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div>
                <div style={{ fontSize: '0.78rem', color: '#718096', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>Action Items:</div>
                {selectedMeeting.actionItems && selectedMeeting.actionItems.map(a => (
                  <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <button 
                      className={`dev-checkbox ${a.completed ? 'checked' : ''}`}
                      onClick={() => hasAccess('developer_meetings.update') ? handleActionToggle(selectedMeeting.id, a.id) : alert("Access Denied")}
                    >
                      {a.completed && '✓'}
                    </button>
                    <span style={{ textDecoration: a.completed ? 'line-through' : 'none', color: a.completed ? '#a0aec0' : '#2d3748' }}>{a.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="dev-modal-actions">
              <button className="dev-btn dev-btn-secondary" onClick={() => setSelectedMeeting(null)}>Close</button>
              <button className="dev-btn dev-btn-primary" onClick={() => { alert('Opening Google Meet video call...'); setSelectedMeeting(null); }}>
                🎥 Join Google Meet
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RECORD/EDIT MEETING MODAL */}
      {showAddModal && (
        <div className="dev-modal-overlay">
          <div className="dev-modal">
            <div className="dev-modal-header">
              <h3 className="dev-modal-title">
                {modalMode === 'add' ? '➕ Record Meeting Details' : '✏️ Edit Meeting Details'}
              </h3>
              <button className="dev-modal-close" onClick={() => setShowAddModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveMeeting}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Meeting Title <span style={{ color: '#e53e3e' }}>*</span></label>
                  <input 
                    type="text"
                    className="dev-input"
                    placeholder="e.g. Sprint Planning Sync"
                    value={meetingForm.title}
                    onChange={e => setMeetingForm({...meetingForm, title: e.target.value})}
                    required
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Project <span style={{ color: '#e53e3e' }}>*</span></label>
                  <select 
                    className="dev-select"
                    value={meetingForm.project}
                    onChange={e => setMeetingForm({...meetingForm, project: e.target.value})}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.name}>{p.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '14px', marginBottom: '14px' }}>
                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Date <span style={{ color: '#e53e3e' }}>*</span></label>
                  <input 
                    type="date"
                    className="dev-input"
                    value={meetingForm.date}
                    onChange={e => setMeetingForm({...meetingForm, date: e.target.value})}
                    required
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Time Block <span style={{ color: '#e53e3e' }}>*</span></label>
                  <input 
                    type="text"
                    className="dev-input"
                    placeholder="e.g. 10:00 AM - 10:30 AM"
                    value={meetingForm.time}
                    onChange={e => setMeetingForm({...meetingForm, time: e.target.value})}
                    required
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
                <div className="dev-form-group" style={{ margin: 0 }}>
                  <label>Location / Meet link</label>
                  <input 
                    type="text"
                    className="dev-input"
                    value={meetingForm.location}
                    onChange={e => setMeetingForm({...meetingForm, location: e.target.value})}
                    style={{ width: '100%', boxSizing: 'border-box' }}
                  />
                </div>
              </div>

              <div className="dev-form-group" style={{ marginBottom: '14px' }}>
                <label>Select Attendees <span style={{ color: '#e53e3e' }}>*</span></label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  {availableDevelopers.map(dev => (
                    <label key={dev} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem', cursor: 'pointer' }}>
                      <input 
                        type="checkbox"
                        checked={meetingForm.attendees.includes(dev)}
                        onChange={() => handleAttendeeCheckboxChange(dev)}
                      />
                      {dev} ({attendeeRoles[dev] || 'Developer'})
                    </label>
                  ))}
                </div>
              </div>

              <div className="dev-form-group" style={{ marginBottom: '14px' }}>
                <label>Discussion Agenda <span style={{ color: '#e53e3e' }}>*</span></label>
                <input 
                  type="text"
                  className="dev-input"
                  placeholder="Focus topics, checklist review..."
                  value={meetingForm.agenda}
                  onChange={e => setMeetingForm({...meetingForm, agenda: e.target.value})}
                  required
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              </div>

              <div className="dev-form-group" style={{ marginBottom: '14px' }}>
                <label>Discussion Summary</label>
                <textarea 
                  className="dev-textarea"
                  placeholder="Summary of engineering topics discussed..."
                  value={meetingForm.discussion}
                  onChange={e => setMeetingForm({...meetingForm, discussion: e.target.value})}
                  style={{ width: '100%', boxSizing: 'border-box', minHeight: '60px' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="dev-form-group">
                  <label>Decisions Taken (One per line)</label>
                  <textarea 
                    className="dev-textarea"
                    placeholder="e.g. Target deployment tonight at 10 PM"
                    value={meetingForm.decisions}
                    onChange={e => setMeetingForm({...meetingForm, decisions: e.target.value})}
                    style={{ width: '100%', boxSizing: 'border-box', minHeight: '60px' }}
                  />
                </div>
                <div className="dev-form-group">
                  <label>Action Items (One per line)</label>
                  <textarea 
                    className="dev-textarea"
                    placeholder="e.g. Review PR #402 (Kumar)&#10;Update database schema (Sarah)"
                    value={meetingForm.actionItems}
                    onChange={e => setMeetingForm({...meetingForm, actionItems: e.target.value})}
                    style={{ width: '100%', boxSizing: 'border-box', minHeight: '60px' }}
                  />
                </div>
              </div>

              <div className="dev-modal-actions">
                <button type="button" className="dev-btn dev-btn-secondary" onClick={() => setShowAddModal(false)}>Cancel</button>
                <button type="submit" className="dev-btn dev-btn-primary">
                  {modalMode === 'add' ? 'Save Meeting Minutes' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default MeetingsPage;
