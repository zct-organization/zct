import React, { useState } from 'react';
import './EditProfileModal.css';

export default function EditProfileModal({ user, token, onSave, onClose }) {
  const [username, setUsername] = useState(user.username);
  const [avatar,   setAvatar]   = useState(user.avatarurl);
  const [saving,   setSaving]   = useState(false);
  const [error,    setError]    = useState('');

  const save = async () => {
    setSaving(true); setError('');
    try{
      await fetch(
        'https://zct-testbla-crgne6d4gcgkh0cj.northeurope-01.azurewebsites.net/users',
        {
          method:'PUT',
          headers:{
            'Content-Type':'application/json',
            Authorization:`Bearer ${token}`,
          },
          body: JSON.stringify({ username, avatarurl: avatar }),
        }
      );
      onSave({ username, avatarurl: avatar });
    }catch(e){ setError('Save failed'); }
    finally{ setSaving(false); }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={e=>e.stopPropagation()}>
        <h3>Edit profile</h3>

        <label>
          <span>Username</span>
          <input value={username} onChange={e=>setUsername(e.target.value)} />
        </label>

        <label>
          <span>Avatar URL</span>
          <input value={avatar} onChange={e=>setAvatar(e.target.value)} />
        </label>

        {error && <p className="modal-err">{error}</p>}

        <div className="modal-actions">
          <button className="pill" onClick={onClose}>Cancel</button>
          <button className="pill primary" disabled={saving} onClick={save}>
            {saving ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
}
