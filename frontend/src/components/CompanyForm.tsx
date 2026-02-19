import { useState } from 'react';
import { createPortal } from 'react-dom';
import axios from 'axios';
import { useMapStore } from '../store/mapStore';

interface Tag {
    tag: string;
    category: string;
}

const CATEGORIES = ['frontend', 'backend', 'cloud', 'devops'];
const PREDEFINED_TAGS = [
    'React', 'Vue', 'Angular', 'Svelte', 'Node.js', 'Python', 'Go', 'Rust', 'Java', 'C#', 'AWS', 'Azure', 'GCP', 'Kubernetes', 'Docker'
];

export default function CompanyForm({ onClose }: { onClose: () => void }) {
    const [formData, setFormData] = useState({
        name: '',
        website: '',
        city: '',
        lat: '',
        lng: '',
    });
    const [tags, setTags] = useState<Tag[]>([]);
    const [tagInput, setTagInput] = useState('');
    const [tagCategory, setTagCategory] = useState('frontend');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const { setCompanies, selectedTags } = useMapStore();

    const handleLookupCity = async () => {
        if (!formData.city) return;
        setLoading(true);
        setError('');
        try {
            const res = await axios.get(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.city)}&limit=1`);
            if (res.data && res.data.length > 0) {
                setFormData(prev => ({
                    ...prev,
                    lat: res.data[0].lat,
                    lng: res.data[0].lon
                }));
            } else {
                setError('City not found. Please enter coordinates manually.');
            }
        } catch (e) {
            setError('Geocoding service unavailable.');
        } finally {
            setLoading(false);
        }
    };

    const addTag = (tagName: string) => {
        const cleaned = tagName.trim();
        if (!cleaned) return;
        if (tags.some(t => t.tag.toLowerCase() === cleaned.toLowerCase())) {
            // setError('Tag already added');
            return;
        }
        setTags([...tags, { tag: cleaned, category: tagCategory }]);
        setTagInput('');
        setError('');
    };

    const removeTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t.tag !== tagToRemove));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.name) return setError('Company Name is required');
        if (!formData.lat || !formData.lng) return setError('Location (Lat/Lng) is required.');

        setLoading(true);
        try {
            await axios.post('/api/companies', {
                ...formData,
                lat: parseFloat(formData.lat),
                lng: parseFloat(formData.lng),
                tags
            });

            // Refresh map data
            const params = selectedTags.length > 0 ? { tag: selectedTags[0] } : {};
            const res = await axios.get('/api/companies', { params });
            setCompanies(res.data);

            onClose();
        } catch (e) {
            console.error(e);
            setError('Failed to save company.');
        } finally {
            setLoading(false);
        }
    };

    const modalContent = (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content">
                <div className="modal-header">
                    <h3>Add New Company</h3>
                    <button className="close-btn" onClick={onClose}>×</button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label>Company Name*</label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            placeholder="e.g. Swisstech AG"
                            className="form-input"
                            autoFocus
                        />
                    </div>

                    <div className="form-group">
                        <label>Website</label>
                        <input
                            type="url"
                            value={formData.website}
                            onChange={e => setFormData({ ...formData, website: e.target.value })}
                            placeholder="https://..."
                            className="form-input"
                        />
                    </div>

                    <div className="form-group">
                        <label>City*</label>
                        <div className="input-group">
                            <input
                                type="text"
                                value={formData.city}
                                onChange={e => setFormData({ ...formData, city: e.target.value })}
                                placeholder="e.g. Zürich"
                                className="form-input"
                            />
                            <button
                                type="button"
                                onClick={handleLookupCity}
                                disabled={loading || !formData.city}
                                className="btn-secondary"
                            >
                                📍 Lookup
                            </button>
                        </div>
                    </div>

                    <div className="row-group">
                        <div className="form-group half">
                            <label>Latitude*</label>
                            <input
                                type="number"
                                step="any"
                                value={formData.lat}
                                onChange={e => setFormData({ ...formData, lat: e.target.value })}
                                className="form-input"
                            />
                        </div>
                        <div className="form-group half">
                            <label>Longitude*</label>
                            <input
                                type="number"
                                step="any"
                                value={formData.lng}
                                onChange={e => setFormData({ ...formData, lng: e.target.value })}
                                className="form-input"
                            />
                        </div>
                    </div>

                    <div className="form-group">
                        <label>Tech Stack</label>
                        <div className="tag-input-wrapper">
                            <select
                                value={tagCategory}
                                onChange={e => setTagCategory(e.target.value)}
                                className="category-select"
                            >
                                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                            <input
                                type="text"
                                list="tech-suggestions"
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={e => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        addTag(tagInput);
                                    }
                                }}
                                placeholder="Select or type technology..."
                                className="tag-input"
                            />
                            <datalist id="tech-suggestions">
                                {PREDEFINED_TAGS.map(t => <option key={t} value={t} />)}
                            </datalist>
                            <button
                                type="button"
                                onClick={() => addTag(tagInput)}
                                className="btn-add"
                                disabled={!tagInput}
                            >
                                +
                            </button>
                        </div>

                        <div className="tags-container">
                            {tags.length === 0 && <div className="no-tags">No technologies added yet</div>}
                            {tags.map((t, i) => (
                                <span key={i} className={`tag-chip cat-${t.category}`}>
                                    {t.tag}
                                    <button type="button" onClick={() => removeTag(t.tag)} className="tag-remove">×</button>
                                </span>
                            ))}
                        </div>
                    </div>

                    {error && <div className="error-msg">{error}</div>}

                    <div className="form-actions">
                        <button type="button" onClick={onClose} className="btn-text">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary">
                            {loading ? 'Saving...' : 'Add Company'}
                        </button>
                    </div>
                </form>
            </div>

            <style>{`
        .modal-overlay {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999; /* Ensure it's on top of everything */
        }
        .modal-content {
          background: #0d1521;
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 24px;
          width: 90%;
          max-width: 480px;
          box-shadow: 0 24px 64px rgba(0,0,0,0.7);
          animation: modalIn 0.2s ease-out;
        }
        @keyframes modalIn {
            from { transform: scale(0.95); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
        }
        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          color: #e8edf5;
        }
        .close-btn {
          background: none; border: none; color: #8a9ab5; font-size: 24px; cursor: pointer;
        }
        .form-group { margin-bottom: 16px; }
        .form-group label { display: block; font-size: 12px; color: #8a9ab5; margin-bottom: 6px; }
        .form-input {
          width: 100%;
          background: #1a2230;
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 6px;
          padding: 10px 12px;
          color: #e8edf5;
          font-size: 14px;
          transition: border-color 0.2s;
        }
        .form-input:focus { border-color: #3b82f6; outline: none; }
        
        .row-group { display: flex; gap: 12px; }
        .half { flex: 1; }
        .input-group { display: flex; gap: 8px; }

        /* Tag Input Styling */
        .tag-input-wrapper {
            display: flex;
            background: #1a2230;
            border: 1px solid rgba(255,255,255,0.08);
            border-radius: 6px;
            padding: 2px;
        }
        .category-select {
            background: transparent;
            color: #8a9ab5;
            border: none;
            border-right: 1px solid rgba(255,255,255,0.1);
            padding: 0 8px;
            font-size: 12px;
            outline: none;
            cursor: pointer;
        }
        .tag-input {
            flex: 1;
            background: transparent;
            border: none;
            padding: 8px 10px;
            color: #e8edf5;
            outline: none;
        }
        .btn-add {
            background: rgba(59, 130, 246, 0.1);
            color: #3b82f6;
            border: none;
            padding: 0 12px;
            font-size: 18px;
            cursor: pointer;
        }
        .btn-add:hover { background: rgba(59, 130, 246, 0.2); }
        .btn-add:disabled { opacity: 0.5; cursor: default; }

        .tags-container {
            display: flex;
            flex-wrap: wrap;
            gap: 6px;
            margin-top: 10px;
            min-height: 32px;
        }
        .no-tags { font-size: 12px; color: #4a5568; font-style: italic; }

        .btn-primary { background: #3b82f6; color: white; border: none; border-radius: 6px; padding: 10px 20px; font-weight: 500; cursor: pointer; }
        .btn-primary:active { transform: translateY(1px); }
        .btn-secondary { background: #1a2230; border: 1px solid rgba(255,255,255,0.1); color: #e8edf5; padding: 0 12px; border-radius: 6px; cursor: pointer; }
        .btn-text { background: none; border: none; color: #8a9ab5; cursor: pointer; padding: 10px 16px; }
        .form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 24px; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 16px; }
        .error-msg { color: #f87171; font-size: 13px; margin-top: 12px; }
      `}</style>
        </div>
    );

    return createPortal(modalContent, document.body);
}
