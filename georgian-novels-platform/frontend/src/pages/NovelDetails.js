import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import CommentSection from '../components/CommentSection';

const NovelDetails = () => {
    const { id } = useParams();
    const [novel, setNovel] = useState(null);
    const [newChapterTitle, setNewChapterTitle] = useState('');
    const [newChapterContent, setNewChapterContent] = useState('');
    const [earlyAccessHours, setEarlyAccessHours] = useState(24);
    const [hoveredRating, setHoveredRating] = useState(null);

    const user = localStorage.getItem('user');
    const role = localStorage.getItem('role');

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_API_URL}/api/novels/${id}`).then(res => setNovel(res.data));
    }, [id]);

    const handleRate = async (score) => {
        if (!user) return alert('შეფასებისთვის გაიარეთ ავტორიზაცია');
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/novels/${id}/rate`, { rating: score, username: user });
            setNovel({ ...novel, ratings: res.data.ratings });
        } catch { alert('შეფასება ვერ მოხერხდა'); }
    };

    const handleAddChapter = async (e) => {
        e.preventDefault();
        if (!newChapterTitle || !newChapterContent) return alert('გთხოვთ შეავსოთ ყველა ველი');
        try {
            await axios.post(`${process.env.REACT_APP_API_URL}/api/novels/${id}/chapters`, {
                title: newChapterTitle, content: newChapterContent,
                earlyAccessHours: Number(earlyAccessHours)
            });
            const updated = await axios.get(`${process.env.REACT_APP_API_URL}/api/novels/${id}`);
            setNovel(updated.data);
            setNewChapterTitle(''); setNewChapterContent('');
            alert('თავი წარმატებით დაემატა! 🎉');
        } catch (err) { alert(err.response?.data?.message || 'შეცდომა'); }
    };

    const calculateAvg = () => {
        if (!novel?.ratings?.length) return null;
        const sum = novel.ratings.reduce((a, b) => a + b.score, 0);
        return (sum / novel.ratings.length).toFixed(1);
    };

    if (!novel) return (
        <div style={{ textAlign: 'center', padding: '120px 0', color: 'var(--cream-fade)', fontFamily: 'var(--font-ui)' }}>
            იტვირთება...
        </div>
    );

    const avg = calculateAvg();
    const userRating = novel.ratings?.find(r => r.username === user)?.score;

    return (
        <div style={s.page}>
            {/* Backdrop blurred cover */}
            <div style={{ ...s.backdrop, backgroundImage: `url(${novel.coverImage})` }} />
            <div style={s.backdropOverlay} />

            <div style={s.container}>
                {/* Top section */}
                <div style={s.top}>
                    <div style={s.coverCol}>
                        <img
                            src={novel.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(novel.title)}&size=400&background=2a2722&color=c9893a&bold=true&length=2`}
                            alt={novel.title}
                            style={s.cover}
                        />
                        {role === 'admin' && (
                            <Link to={`/edit/${id}`} style={s.editBtn}>✎ რედაქტირება</Link>
                        )}
                    </div>

                    <div style={s.infoCol}>
                        <p style={s.eyebrow}>ნოველა</p>
                        <h1 style={s.title}>{novel.title}</h1>
                        <p style={s.author}>{novel.author}</p>

                        {/* Rating display */}
                        <div style={s.ratingRow}>
                            {avg ? (
                                <span style={s.avgScore}>
                                    <span style={{ color: 'var(--amber-lt)' }}>★</span> {avg}
                                    <span style={s.ratingCount}> ({novel.ratings.length} შეფასება)</span>
                                </span>
                            ) : (
                                <span style={s.ratingCount}>შეფასება არ არის</span>
                            )}
                        </div>

                        {/* Star/number rating input */}
                        <div style={s.rateSection}>
                            <p style={s.rateLabel}>შეაფასე:</p>
                            <div style={s.rateRow}>
                                {[1,2,3,4,5,6,7,8,9,10].map(n => (
                                    <button
                                        key={n}
                                        onClick={() => handleRate(n)}
                                        onMouseEnter={() => setHoveredRating(n)}
                                        onMouseLeave={() => setHoveredRating(null)}
                                        style={{
                                            ...s.rateBtn,
                                            background: (hoveredRating >= n || userRating >= n) ? 'var(--amber)' : 'var(--ink-raised)',
                                            color: (hoveredRating >= n || userRating >= n) ? 'var(--ink)' : 'var(--cream-fade)',
                                            borderColor: (hoveredRating >= n || userRating >= n) ? 'var(--amber)' : 'var(--ink-border)',
                                        }}
                                    >
                                        {n}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <p style={s.description}>{novel.description}</p>

                        <div style={s.statRow}>
                            <div style={s.stat}>
                                <span style={s.statNum}>{novel.chapters?.length || 0}</span>
                                <span style={s.statLabel}>თავი</span>
                            </div>
                            <div style={s.stat}>
                                <span style={s.statNum}>{novel.ratings?.length || 0}</span>
                                <span style={s.statLabel}>შეფასება</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Chapters */}
                <div style={s.section}>
                    <h2 style={s.sectionTitle}>სარჩევი</h2>
                    {novel.chapters?.length > 0 ? (
                        <div style={s.chapterList}>
                            {novel.chapters.map((ch, idx) => {
                                const isLocked = ch.availableAt && new Date(ch.availableAt) > new Date();
                                return (
                                    <Link key={idx} to={`/novel/${id}/reader/${idx}`} style={s.chapterRow}>
                                        <div style={s.chapterLeft}>
                                            <span style={s.chapterNum}>{String(idx + 1).padStart(2, '0')}</span>
                                            <div>
                                                <p style={s.chapterTitle}>{ch.title}</p>
                                                {isLocked && (
                                                    <p style={s.chapterLocked}>🔒 Premium · ადრეული წვდომა</p>
                                                )}
                                            </div>
                                        </div>
                                        <span style={s.chapterArrow}>→</span>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <p style={{ color: 'var(--cream-fade)', fontFamily: 'var(--font-ui)', fontSize: '0.9rem' }}>
                            თავები ჯერ არ დამატებულა
                        </p>
                    )}
                </div>

                {/* Admin: add chapter */}
                {role === 'admin' && (
                    <div style={s.adminPanel}>
                        <h3 style={s.adminPanelTitle}>➕ ახალი თავის დამატება</h3>
                        <form onSubmit={handleAddChapter} style={s.adminForm}>
                            <input
                                type="text"
                                placeholder="თავის სათაური"
                                value={newChapterTitle}
                                onChange={e => setNewChapterTitle(e.target.value)}
                                style={s.input}
                            />
                            <textarea
                                placeholder="თავის ტექსტი..."
                                value={newChapterContent}
                                onChange={e => setNewChapterContent(e.target.value)}
                                style={{ ...s.input, height: '200px', resize: 'vertical' }}
                                rows={10}
                            />
                            <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                                <label style={s.inputLabel}>ადრეული წვდომა (სთ):</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={earlyAccessHours}
                                    onChange={e => setEarlyAccessHours(e.target.value)}
                                    style={{ ...s.input, width: '90px', padding: '10px 12px' }}
                                />
                            </div>
                            <button type="submit" style={s.publishBtn}>გამოქვეყნება 🚀</button>
                        </form>
                    </div>
                )}

                <CommentSection targetId={id} />
            </div>
        </div>
    );
};

const s = {
    page: { minHeight: '100vh', position: 'relative' },
    backdrop: { position: 'fixed', inset: 0, backgroundSize: 'cover', backgroundPosition: 'center', filter: 'blur(40px) saturate(0.4)', transform: 'scale(1.1)', zIndex: 0 },
    backdropOverlay: { position: 'fixed', inset: 0, background: 'rgba(15,14,12,.85)', zIndex: 1 },
    container: { position: 'relative', zIndex: 2, maxWidth: '1000px', margin: '0 auto', padding: '48px 24px 80px' },
    top: { display: 'flex', gap: '48px', flexWrap: 'wrap', marginBottom: '56px' },
    coverCol: { flexShrink: 0, width: '240px', display: 'flex', flexDirection: 'column', gap: '12px' },
    cover: { width: '100%', aspectRatio: '2/3', objectFit: 'cover', borderRadius: 'var(--radius-lg)', boxShadow: 'var(--shadow-lg)' },
    editBtn: { display: 'block', textAlign: 'center', padding: '8px', background: 'var(--ink-raised)', border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-sm)', color: 'var(--cream-dim)', fontFamily: 'var(--font-ui)', fontSize: '0.85rem', textDecoration: 'none' },
    infoCol: { flex: 1, minWidth: '280px' },
    eyebrow: { fontFamily: 'var(--font-ui)', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--amber)', margin: '0 0 10px' },
    title: { fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, color: 'var(--cream)', margin: '0 0 8px', lineHeight: 1.15 },
    author: { fontFamily: 'var(--font-ui)', fontSize: '1rem', color: 'var(--amber)', margin: '0 0 20px', fontWeight: 500 },
    ratingRow: { marginBottom: '16px' },
    avgScore: { fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--cream)' },
    ratingCount: { fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--cream-fade)' },
    rateSection: { marginBottom: '24px' },
    rateLabel: { fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: 'var(--cream-fade)', margin: '0 0 8px' },
    rateRow: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
    rateBtn: { width: '34px', height: '34px', border: '1px solid', borderRadius: 'var(--radius-sm)', fontFamily: 'var(--font-ui)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', transition: 'all 0.1s' },
    description: { fontFamily: 'var(--font-body)', fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--cream-dim)', margin: '0 0 28px' },
    statRow: { display: 'flex', gap: '24px' },
    stat: { display: 'flex', flexDirection: 'column' },
    statNum: { fontFamily: 'var(--font-display)', fontSize: '1.6rem', fontWeight: 700, color: 'var(--amber)', lineHeight: 1 },
    statLabel: { fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: 'var(--cream-fade)', marginTop: '2px' },
    section: { marginBottom: '48px' },
    sectionTitle: { fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 600, color: 'var(--cream)', margin: '0 0 20px', paddingBottom: '12px', borderBottom: '1px solid var(--ink-border)' },
    chapterList: { display: 'flex', flexDirection: 'column', gap: '4px' },
    chapterRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', background: 'var(--ink-card)', border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-md)', textDecoration: 'none', color: 'inherit', transition: 'border-color 0.15s' },
    chapterLeft: { display: 'flex', gap: '16px', alignItems: 'flex-start' },
    chapterNum: { fontFamily: 'var(--font-ui)', fontSize: '0.78rem', fontWeight: 600, color: 'var(--amber)', opacity: 0.7, minWidth: '24px', marginTop: '2px' },
    chapterTitle: { fontFamily: 'var(--font-ui)', fontWeight: 500, fontSize: '0.95rem', color: 'var(--cream)', margin: 0 },
    chapterLocked: { fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: 'var(--amber)', margin: '3px 0 0' },
    chapterArrow: { color: 'var(--cream-fade)', fontSize: '1rem' },
    adminPanel: { background: 'var(--ink-card)', border: '1px dashed var(--amber-dim)', borderRadius: 'var(--radius-lg)', padding: '28px', marginBottom: '48px' },
    adminPanelTitle: { fontFamily: 'var(--font-display)', fontSize: '1.1rem', color: 'var(--amber)', margin: '0 0 20px' },
    adminForm: { display: 'flex', flexDirection: 'column', gap: '12px' },
    input: { padding: '12px 16px', background: 'var(--ink-raised)', border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-sm)', color: 'var(--cream)', fontSize: '0.95rem', fontFamily: 'var(--font-ui)', outline: 'none', width: '100%', boxSizing: 'border-box' },
    inputLabel: { fontFamily: 'var(--font-ui)', fontSize: '0.85rem', color: 'var(--cream-fade)', whiteSpace: 'nowrap' },
    publishBtn: { alignSelf: 'flex-start', background: 'var(--amber)', color: 'var(--ink)', border: 'none', padding: '11px 28px', borderRadius: '20px', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.92rem', cursor: 'pointer' },
};

export default NovelDetails;