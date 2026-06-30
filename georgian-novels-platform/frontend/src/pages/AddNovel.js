import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const AddNovel = () => {
    const [title, setTitle]             = useState('');
    const [author, setAuthor]           = useState('');
    const [description, setDescription] = useState('');
    const [coverImage, setCoverImage]   = useState('');
    const [chapters, setChapters]       = useState([{ title: '', content: '' }]);
    const [submitting, setSubmitting]   = useState(false);
    const navigate = useNavigate();
    const user = localStorage.getItem('user');

    const handleChapterChange = (i, field, val) => {
        const c = [...chapters]; c[i] = { ...c[i], [field]: val }; setChapters(c);
    };
    const addChapter    = () => setChapters([...chapters, { title: '', content: '' }]);
    const removeChapter = (i) => { if (chapters.length > 1) setChapters(chapters.filter((_, j) => j !== i)); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/novels`,
                { title, author, description, coverImage, chapters },
                { headers: { adminusername: user } }
            );
            navigate('/');
        } catch {
            alert('შეცდომა. დარწმუნდით, რომ ადმინი ხართ.');
            setSubmitting(false);
        }
    };

    return (
        <div style={s.page}>
            <div style={s.container}>
                <div style={s.pageHeader}>
                    <Link to="/" style={s.backLink}>← მთავარი</Link>
                    <h1 style={s.pageTitle}>ახალი ნოველის დამატება</h1>
                </div>

                <form onSubmit={handleSubmit} style={s.form}>
                    <div style={s.twoCol}>
                        {/* Left: metadata */}
                        <div style={s.metaPanel}>
                            <h2 style={s.panelTitle}>ძირითადი ინფო</h2>

                            <FormField label="სათაური">
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                                    style={s.input} placeholder="ნოველის სათაური" required />
                            </FormField>

                            <FormField label="ავტორი">
                                <input type="text" value={author} onChange={e => setAuthor(e.target.value)}
                                    style={s.input} placeholder="ავტორის სახელი" required />
                            </FormField>

                            <FormField label="ყდის სურათის URL">
                                <input type="url" value={coverImage} onChange={e => setCoverImage(e.target.value)}
                                    style={s.input} placeholder="https://..." />
                                {coverImage && (
                                    <div style={s.coverPreview}>
                                        <img src={coverImage} alt="preview" style={s.coverPreviewImg} onError={e => e.target.style.opacity='.3'} />
                                    </div>
                                )}
                            </FormField>

                            <FormField label="აღწერა">
                                <textarea value={description} onChange={e => setDescription(e.target.value)}
                                    style={{ ...s.input, height: '120px', resize: 'vertical' }}
                                    placeholder="ნოველის სიუჟეტის მოკლე აღწერა..." required />
                            </FormField>
                        </div>

                        {/* Right: chapters */}
                        <div style={s.chaptersPanel}>
                            <div style={s.chaptersPanelHeader}>
                                <h2 style={s.panelTitle}>თავები ({chapters.length})</h2>
                                <button type="button" onClick={addChapter} style={s.addChBtn}>+ დამატება</button>
                            </div>

                            <div style={s.chaptersList}>
                                {chapters.map((ch, i) => (
                                    <ChapterBlock key={i} ch={ch} index={i}
                                        onChange={(f, v) => handleChapterChange(i, f, v)}
                                        onRemove={() => removeChapter(i)}
                                        canRemove={chapters.length > 1}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    <div style={s.submitRow}>
                        <button type="submit" disabled={submitting} style={s.submitBtn}>
                            {submitting ? 'ინახება...' : 'ნოველის გამოქვეყნება →'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const ChapterBlock = ({ ch, index, onChange, onRemove, canRemove }) => {
    const [open, setOpen] = useState(index === 0);
    return (
        <div style={cb.wrap}>
            <div style={cb.header} onClick={() => setOpen(o => !o)}>
                <div style={cb.headerLeft}>
                    <span style={cb.num}>{String(index + 1).padStart(2, '0')}</span>
                    <span style={cb.chTitle}>{ch.title || `თავი ${index + 1}`}</span>
                </div>
                <div style={cb.headerRight}>
                    {canRemove && (
                        <button type="button" onClick={e => { e.stopPropagation(); onRemove(); }} style={cb.removeBtn}>✕</button>
                    )}
                    <span style={{ color: 'var(--cream-fade)', fontSize: '12px' }}>{open ? '▲' : '▼'}</span>
                </div>
            </div>
            {open && (
                <div style={cb.body}>
                    <input type="text" value={ch.title} onChange={e => onChange('title', e.target.value)}
                        style={s.input} placeholder="თავის სათაური" required />
                    <textarea value={ch.content} onChange={e => onChange('content', e.target.value)}
                        style={{ ...s.input, height: '220px', resize: 'vertical', marginTop: '10px' }}
                        placeholder="თავის ტექსტი..." required />
                </div>
            )}
        </div>
    );
};

const FormField = ({ label, children }) => (
    <div style={s.field}>
        <label style={s.label}>{label}</label>
        {children}
    </div>
);

const cb = {
    wrap: { border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-md)', overflow: 'hidden', marginBottom: '8px' },
    header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--ink-raised)', cursor: 'pointer' },
    headerLeft: { display: 'flex', alignItems: 'center', gap: '12px' },
    num: { fontFamily: 'var(--font-ui)', fontSize: '0.72rem', fontWeight: 600, color: 'var(--amber)', minWidth: '20px' },
    chTitle: { fontFamily: 'var(--font-ui)', fontSize: '0.88rem', color: 'var(--cream)', fontWeight: 500 },
    headerRight: { display: 'flex', alignItems: 'center', gap: '10px' },
    removeBtn: { background: 'none', border: 'none', color: '#e88', cursor: 'pointer', fontSize: '12px', padding: '2px 6px' },
    body: { padding: '16px', background: 'var(--ink-card)' },
};

const s = {
    page: { minHeight: '100vh', padding: '48px 24px 80px' },
    container: { maxWidth: '1100px', margin: '0 auto' },
    pageHeader: { marginBottom: '32px' },
    backLink: { fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--cream-fade)', display: 'block', marginBottom: '12px' },
    pageTitle: { fontFamily: 'var(--font-display)', fontSize: 'clamp(1.4rem, 3vw, 2rem)', fontWeight: 700, color: 'var(--cream)', margin: 0 },
    form: { display: 'flex', flexDirection: 'column', gap: '32px' },
    twoCol: { display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' },
    metaPanel: { flex: '0 0 340px', display: 'flex', flexDirection: 'column', gap: '0' },
    chaptersPanel: { flex: 1, minWidth: '280px' },
    panelTitle: { fontFamily: 'var(--font-display)', fontSize: '1rem', fontWeight: 600, color: 'var(--cream)', margin: '0 0 20px' },
    chaptersPanelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' },
    addChBtn: { background: 'var(--amber)', color: 'var(--ink)', border: 'none', padding: '7px 16px', borderRadius: '16px', fontFamily: 'var(--font-ui)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer' },
    chaptersList: { display: 'flex', flexDirection: 'column' },
    field: { display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '16px' },
    label: { fontFamily: 'var(--font-ui)', fontSize: '0.78rem', fontWeight: 500, color: 'var(--cream-fade)', letterSpacing: '0.04em' },
    input: { padding: '11px 14px', background: 'var(--ink-raised)', border: '1px solid var(--ink-border)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-ui)', fontSize: '0.9rem', outline: 'none', width: '100%', boxSizing: 'border-box' },
    coverPreview: { marginTop: '10px', display: 'flex', justifyContent: 'flex-start' },
    coverPreviewImg: { width: '100px', borderRadius: '8px', objectFit: 'cover', aspectRatio: '2/3' },
    submitRow: { display: 'flex', justifyContent: 'flex-end' },
    submitBtn: { background: 'var(--amber)', color: 'var(--ink)', border: 'none', padding: '13px 32px', borderRadius: '24px', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer' },
};

<<<<<<< HEAD
export default AddNovel;
=======
export default AddNovel;
>>>>>>> 4c5c1b4bb8c0ba309470d412ccbc2be105ad23c2
