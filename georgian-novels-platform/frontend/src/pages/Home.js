import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';

const SORT_OPTIONS = [
    { key: 'newest_chapter', label: 'ახალი თავი', icon: '📖' },
    { key: 'rating',         label: 'შეფასება',   icon: '★' },
    { key: 'most_chapters',  label: 'თავების რ.',  icon: '#' },
    { key: 'alpha',          label: 'ანბანი',      icon: 'A' },
    { key: 'added',          label: 'დამატების თ.',icon: '⊕' },
];

const getNewestChapterDate = (novel) => {
    if (!novel.chapters?.length) return 0;
    const dates = novel.chapters
        .map(c => c.createdAt ? new Date(c.createdAt).getTime() : 0)
        .filter(Boolean);
    return dates.length ? Math.max(...dates) : 0;
};

const getAvg = (ratings) => {
    if (!ratings?.length) return 0;
    const valid = ratings.filter(r => r?.score !== undefined);
    if (!valid.length) return 0;
    return valid.reduce((a, b) => a + b.score, 0) / valid.length;
};

const Home = ({ onOpenLogin }) => {
    const [novels, setNovels]               = useState([]);
    const [searchTerm, setSearchTerm]       = useState('');
    const [userFavorites, setUserFavorites] = useState([]);
    const [loading, setLoading]             = useState(true);
    const [hoveredId, setHoveredId]         = useState(null);
    const [panelOpen, setPanelOpen]         = useState(false);

    // Filter & sort state
    const [sortBy, setSortBy]               = useState('newest_chapter');
    const [minRating, setMinRating]         = useState(0);
    const [minChapters, setMinChapters]     = useState(0);
    const [onlyFavorites, setOnlyFavorites] = useState(false);
    const [onlyWithChapters, setOnlyWithChapters] = useState(false);

    const panelRef = useRef(null);
    const user = localStorage.getItem('user');
    const role = localStorage.getItem('role');
    const navigate = useNavigate();

    const fetchNovels = () => {
        axios.get('http://localhost:5000/api/novels')
            .then(res => { setNovels(res.data); setLoading(false); })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchNovels();
        if (user) {
            axios.get(`http://localhost:5000/api/users/favorites/${user}`)
                .then(res => setUserFavorites(res.data))
                .catch(() => {});
        }
    }, [user]);

    // Close panel on outside click
    useEffect(() => {
        const handler = (e) => {
            if (panelRef.current && !panelRef.current.contains(e.target)) setPanelOpen(false);
        };
        if (panelOpen) document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [panelOpen]);

    const handleReadClick = (id) => {
        if (user) navigate(`/novel/${id}`);
        else if (typeof onOpenLogin === 'function') onOpenLogin();
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('წაიშალოს ნოველა?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/novels/${id}`, { headers: { adminusername: user } });
            fetchNovels();
        } catch { alert('წაშლა ვერ მოხერხდა.'); }
    };

    const toggleFavorite = async (e, novelId) => {
        e.stopPropagation();
        if (!user) return typeof onOpenLogin === 'function' ? onOpenLogin() : null;
        try {
            const res = await axios.post('http://localhost:5000/api/users/favorite', { username: user, novelId });
            setUserFavorites(res.data.favorites || []);
        } catch {}
    };

    const resetFilters = () => {
        setSortBy('newest_chapter');
        setMinRating(0);
        setMinChapters(0);
        setOnlyFavorites(false);
        setOnlyWithChapters(false);
    };

    const hasActiveFilters = sortBy !== 'newest_chapter' || minRating > 0 || minChapters > 0 || onlyFavorites || onlyWithChapters;

    // Filter then sort
    const processed = novels
        .filter(n => {
            const q = searchTerm.toLowerCase();
            if (q && !n.title.toLowerCase().includes(q) && !n.author.toLowerCase().includes(q)) return false;
            if (onlyFavorites && !userFavorites.includes(n._id)) return false;
            if (onlyWithChapters && !(n.chapters?.length > 0)) return false;
            if (minRating > 0 && getAvg(n.ratings) < minRating) return false;
            if (minChapters > 0 && (n.chapters?.length || 0) < minChapters) return false;
            return true;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'rating':        return getAvg(b.ratings) - getAvg(a.ratings);
                case 'most_chapters': return (b.chapters?.length || 0) - (a.chapters?.length || 0);
                case 'alpha':         return a.title.localeCompare(b.title, 'ka');
                case 'added':         return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
                case 'newest_chapter':
                default:              return getNewestChapterDate(b) - getNewestChapterDate(a);
            }
        });

    return (
        <div style={s.page}>
            {/* Hero */}
            <div style={s.hero}>
                <p style={s.eyebrow}>ქართული ლიტერატურა</p>
                <h1 style={s.heroTitle}>ნოველების ბიბლიოთეკა</h1>
                <p style={s.heroSub}>წაიკითხე, შეაფასე და გაუზიარე საუკეთესო ნაწარმოებები</p>

                <div style={s.searchRow}>
                    <div style={s.searchWrap}>
                        <span style={s.searchIcon}>⌕</span>
                        <input
                            type="text"
                            placeholder="მოძებნე ნოველა ან ავტორი..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={s.searchInput}
                        />
                    </div>

                    <button
                        onClick={() => setPanelOpen(o => !o)}
                        style={{ ...s.filterToggle, ...(hasActiveFilters ? s.filterToggleActive : {}) }}
                    >
                        <span style={{ fontSize: '15px' }}>⚙</span>
                        <span>ფილტრი</span>
                        {hasActiveFilters && <span style={s.filterDot} />}
                    </button>
                </div>

                {role === 'admin' && (
                    <div style={{ marginTop: '16px' }}>
                        <Link to="/add" style={s.addBtn}>+ ნოველის დამატება</Link>
                    </div>
                )}
            </div>

            {/* Main: sidebar + grid */}
            <div style={s.body}>
                {/* Filter panel */}
                <div
                    ref={panelRef}
                    style={{
                        ...s.panel,
                        opacity: panelOpen ? 1 : 0,
                        transform: panelOpen ? 'translateX(0)' : 'translateX(-12px)',
                        pointerEvents: panelOpen ? 'all' : 'none',
                        visibility: panelOpen ? 'visible' : 'hidden',
                    }}
                >
                    <div style={s.panelHeader}>
                        <span style={s.panelTitle}>ფილტრი და დახარისხება</span>
                        {hasActiveFilters && (
                            <button onClick={resetFilters} style={s.resetBtn}>გასუფთავება</button>
                        )}
                    </div>

                    {/* Sort */}
                    <div style={s.filterSection}>
                        <p style={s.filterLabel}>დახარისხება</p>
                        <div style={s.sortGrid}>
                            {SORT_OPTIONS.map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => setSortBy(opt.key)}
                                    style={{ ...s.sortChip, ...(sortBy === opt.key ? s.sortChipActive : {}) }}
                                >
                                    <span style={{ fontSize: '12px' }}>{opt.icon}</span>
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={s.divider} />

                    {/* Min rating slider */}
                    <div style={s.filterSection}>
                        <div style={s.sliderLabelRow}>
                            <p style={s.filterLabel}>მინ. შეფასება</p>
                            <span style={s.sliderVal}>{minRating > 0 ? `${minRating}+` : 'ყველა'}</span>
                        </div>
                        <input
                            type="range" min="0" max="9" step="1"
                            value={minRating}
                            onChange={e => setMinRating(Number(e.target.value))}
                            style={s.slider}
                        />
                        <div style={s.sliderTicks}>
                            {[0,1,2,3,4,5,6,7,8,9].map(n => (
                                <span key={n} style={{ ...s.tick, color: n <= minRating ? 'var(--amber)' : 'var(--cream-fade)', fontWeight: n === minRating ? 600 : 400 }}>{n === 0 ? '—' : n}</span>
                            ))}
                        </div>
                    </div>

                    <div style={s.divider} />

                    {/* Min chapters slider */}
                    <div style={s.filterSection}>
                        <div style={s.sliderLabelRow}>
                            <p style={s.filterLabel}>მინ. თავები</p>
                            <span style={s.sliderVal}>{minChapters > 0 ? `${minChapters}+` : 'ყველა'}</span>
                        </div>
                        <input
                            type="range" min="0" max="20" step="1"
                            value={minChapters}
                            onChange={e => setMinChapters(Number(e.target.value))}
                            style={s.slider}
                        />
                    </div>

                    <div style={s.divider} />

                    {/* Toggles */}
                    <div style={s.filterSection}>
                        <p style={s.filterLabel}>სხვა</p>
                        <div style={s.toggleList}>
                            {user && (
                                <button
                                    onClick={() => setOnlyFavorites(f => !f)}
                                    style={{ ...s.toggleRow, ...(onlyFavorites ? s.toggleRowActive : {}) }}
                                >
                                    <span style={s.toggleIcon}>{onlyFavorites ? '♥' : '♡'}</span>
                                    <span style={s.toggleText}>მხოლოდ ფავორიტები</span>
                                    <span style={{ ...s.togglePip, background: onlyFavorites ? 'var(--amber)' : 'var(--ink-border)' }} />
                                </button>
                            )}
                            <button
                                onClick={() => setOnlyWithChapters(f => !f)}
                                style={{ ...s.toggleRow, ...(onlyWithChapters ? s.toggleRowActive : {}) }}
                            >
                                <span style={s.toggleIcon}>📖</span>
                                <span style={s.toggleText}>თავებიანი მხოლოდ</span>
                                <span style={{ ...s.togglePip, background: onlyWithChapters ? 'var(--amber)' : 'var(--ink-border)' }} />
                            </button>
                        </div>
                    </div>

                    <div style={s.panelFooter}>
                        <span style={s.resultCount}>{processed.length} ნოველა</span>
                    </div>
                </div>

                {/* Grid area */}
                <div style={s.gridArea}>
                    {/* Sort pills strip (always visible) */}
                    <div style={s.sortStrip}>
                        <span style={s.sortStripLabel}>
                            {processed.length} ნოველა
                        </span>
                        <div style={s.sortPills}>
                            {SORT_OPTIONS.map(opt => (
                                <button
                                    key={opt.key}
                                    onClick={() => setSortBy(opt.key)}
                                    style={{ ...s.sortPill, ...(sortBy === opt.key ? s.sortPillActive : {}) }}
                                >
                                    {opt.icon} {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div style={s.loadingWrap}>
                            <div style={s.spinner} />
                            <span style={{ color: 'var(--cream-fade)', fontFamily: 'var(--font-ui)', fontSize: '0.9rem' }}>იტვირთება...</span>
                        </div>
                    ) : processed.length === 0 ? (
                        <div style={s.empty}>
                            <p style={{ color: 'var(--cream-fade)', fontFamily: 'var(--font-ui)', fontSize: '1rem' }}>ნოველები ვერ მოიძებნა</p>
                            {hasActiveFilters && (
                                <button onClick={resetFilters} style={{ ...s.resetBtn, marginTop: '12px', padding: '8px 20px' }}>ფილტრის გასუფთავება</button>
                            )}
                        </div>
                    ) : (
                        <div style={s.grid}>
                            {processed.map(novel => {
                                const avg = getAvg(novel.ratings);
                                const isFav = userFavorites.includes(novel._id);
                                const isHovered = hoveredId === novel._id;
                                const newestChapter = novel.chapters?.length
                                    ? novel.chapters[novel.chapters.length - 1]
                                    : null;
                                return (
                                    <div
                                        key={novel._id}
                                        style={{
                                            ...s.card,
                                            transform: isHovered ? 'translateY(-6px)' : 'none',
                                            boxShadow: isHovered ? 'var(--shadow-lg)' : 'var(--shadow-sm)',
                                        }}
                                        onClick={() => handleReadClick(novel._id)}
                                        onMouseEnter={() => setHoveredId(novel._id)}
                                        onMouseLeave={() => setHoveredId(null)}
                                    >
                                        <div style={s.coverWrap}>
                                            <img
                                                src={novel.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(novel.title)}&size=400&background=2a2722&color=c9893a&bold=true&length=2`}
                                                alt={novel.title}
                                                style={{ ...s.cover, transform: isHovered ? 'scale(1.04)' : 'scale(1)' }}
                                            />
                                            <div style={s.coverOverlay} />

                                            {avg > 0 && (
                                                <div style={s.ratingPill}>
                                                    <span style={{ color: 'var(--amber-lt)' }}>★</span> {avg.toFixed(1)}
                                                </div>
                                            )}

                                            <button
                                                onClick={e => toggleFavorite(e, novel._id)}
                                                style={{ ...s.heartBtn, color: isFav ? '#e88055' : 'var(--cream-dim)' }}
                                            >
                                                {isFav ? '♥' : '♡'}
                                            </button>

                                            {role === 'admin' && (
                                                <div style={s.adminBtns}>
                                                    <Link to={`/edit/${novel._id}`} onClick={e => e.stopPropagation()} style={s.adminIconBtn}>✎</Link>
                                                    <button onClick={e => handleDelete(e, novel._id)} style={s.adminIconBtnDanger}>✕</button>
                                                </div>
                                            )}

                                            <div style={s.cardBottom}>
                                                <p style={s.cardTitle}>{novel.title}</p>
                                                <p style={s.cardAuthor}>{novel.author}</p>
                                            </div>
                                        </div>

                                        <div style={s.cardMeta}>
                                            <div style={s.cardMetaLeft}>
                                                <span style={s.chapterCount}>{novel.chapters?.length || 0} თავი</span>
                                                {newestChapter && (
                                                    <span style={s.newestChapter} title={newestChapter.title}>
                                                        ახალი: {newestChapter.title?.slice(0, 18)}{newestChapter.title?.length > 18 ? '…' : ''}
                                                    </span>
                                                )}
                                            </div>
                                            <button
                                                style={s.readBtn}
                                                onClick={e => { e.stopPropagation(); handleReadClick(novel._id); }}
                                            >
                                                წაკითხვა →
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const s = {
    page: { minHeight: '100vh', padding: '0 0 80px' },

    hero: {
        textAlign: 'center',
        padding: '64px 24px 48px',
        borderBottom: '1px solid var(--ink-border)',
        background: 'linear-gradient(180deg, var(--ink-soft) 0%, var(--ink) 100%)',
    },
    eyebrow: {
        fontFamily: 'var(--font-ui)', fontSize: '0.72rem', fontWeight: 500,
        letterSpacing: '0.18em', textTransform: 'uppercase',
        color: 'var(--amber)', margin: '0 0 14px',
    },
    heroTitle: {
        fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 5vw, 3rem)',
        fontWeight: 700, color: 'var(--cream)', margin: '0 0 12px', lineHeight: 1.15,
    },
    heroSub: {
        fontFamily: 'var(--font-ui)', fontSize: '0.95rem',
        color: 'var(--cream-fade)', margin: '0 0 32px',
    },
    searchRow: {
        display: 'flex', gap: '10px', maxWidth: '580px', margin: '0 auto 16px', alignItems: 'center',
    },
    searchWrap: { position: 'relative', flex: 1 },
    searchIcon: {
        position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)',
        fontSize: '18px', color: 'var(--cream-fade)', pointerEvents: 'none',
    },
    searchInput: {
        width: '100%', padding: '13px 18px 13px 44px',
        background: 'var(--ink-card)', border: '1px solid var(--ink-border)',
        borderRadius: '28px', color: 'var(--cream)', fontSize: '0.9rem',
        fontFamily: 'var(--font-ui)', outline: 'none', boxSizing: 'border-box',
    },
    filterToggle: {
        display: 'flex', alignItems: 'center', gap: '7px', position: 'relative',
        padding: '12px 18px', background: 'var(--ink-card)',
        border: '1px solid var(--ink-border)', borderRadius: '28px',
        color: 'var(--cream-dim)', fontFamily: 'var(--font-ui)', fontSize: '0.85rem',
        cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0,
    },
    filterToggleActive: {
        border: '1px solid var(--amber)', color: 'var(--amber-lt)',
    },
    filterDot: {
        position: 'absolute', top: '9px', right: '9px',
        width: '7px', height: '7px', borderRadius: '50%', background: 'var(--amber)',
    },
    addBtn: {
        background: 'var(--amber)', color: 'var(--ink)',
        padding: '8px 20px', borderRadius: '20px',
        fontFamily: 'var(--font-ui)', fontSize: '0.85rem', fontWeight: 600,
        textDecoration: 'none', display: 'inline-block',
    },

    body: {
        display: 'flex', gap: '0', maxWidth: '1320px', margin: '0 auto', padding: '0 28px',
    },

    // Floating filter panel
    panel: {
        position: 'sticky', top: '80px', alignSelf: 'flex-start',
        width: '240px', flexShrink: 0,
        background: 'var(--ink-card)', border: '1px solid var(--ink-border)',
        borderRadius: 'var(--radius-lg)', marginTop: '32px',
        transition: 'opacity 0.2s ease, transform 0.2s ease, visibility 0.2s',
        overflow: 'hidden',
    },
    panelHeader: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '16px 16px 12px', borderBottom: '1px solid var(--ink-border)',
    },
    panelTitle: {
        fontFamily: 'var(--font-ui)', fontWeight: 600,
        fontSize: '0.82rem', color: 'var(--cream-dim)', letterSpacing: '0.04em',
    },
    resetBtn: {
        background: 'none', border: 'none', color: 'var(--amber)',
        fontFamily: 'var(--font-ui)', fontSize: '0.75rem',
        cursor: 'pointer', padding: '2px 0',
    },
    filterSection: { padding: '14px 16px' },
    filterLabel: {
        fontFamily: 'var(--font-ui)', fontSize: '0.72rem', fontWeight: 600,
        letterSpacing: '0.1em', textTransform: 'uppercase',
        color: 'var(--cream-fade)', margin: '0 0 10px',
    },
    sortGrid: { display: 'flex', flexDirection: 'column', gap: '4px' },
    sortChip: {
        display: 'flex', alignItems: 'center', gap: '8px',
        padding: '8px 12px', borderRadius: 'var(--radius-sm)',
        background: 'none', border: '1px solid transparent',
        color: 'var(--cream-dim)', fontFamily: 'var(--font-ui)',
        fontSize: '0.85rem', cursor: 'pointer', textAlign: 'left',
        transition: 'all 0.12s',
    },
    sortChipActive: {
        background: 'var(--amber-dim)', border: '1px solid var(--amber)',
        color: 'var(--amber-lt)', fontWeight: 600,
    },
    divider: { height: '1px', background: 'var(--ink-border)', margin: '0 16px' },
    sliderLabelRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '8px' },
    sliderVal: { fontFamily: 'var(--font-ui)', fontSize: '0.82rem', fontWeight: 600, color: 'var(--amber)' },
    slider: { width: '100%', accentColor: 'var(--amber)', cursor: 'pointer' },
    sliderTicks: { display: 'flex', justifyContent: 'space-between', marginTop: '4px' },
    tick: { fontFamily: 'var(--font-ui)', fontSize: '0.7rem', transition: 'color 0.1s' },
    toggleList: { display: 'flex', flexDirection: 'column', gap: '4px' },
    toggleRow: {
        display: 'flex', alignItems: 'center', gap: '10px',
        padding: '9px 12px', borderRadius: 'var(--radius-sm)',
        background: 'none', border: '1px solid transparent',
        cursor: 'pointer', width: '100%', textAlign: 'left',
        transition: 'all 0.12s',
    },
    toggleRowActive: { background: 'var(--amber-dim)', border: '1px solid var(--amber)' },
    toggleIcon: { fontSize: '14px', color: 'var(--cream-fade)', flexShrink: 0 },
    toggleText: { flex: 1, fontFamily: 'var(--font-ui)', fontSize: '0.83rem', color: 'var(--cream-dim)' },
    togglePip: { width: '10px', height: '10px', borderRadius: '50%', flexShrink: 0, transition: 'background 0.15s' },
    panelFooter: {
        padding: '12px 16px', borderTop: '1px solid var(--ink-border)',
        background: 'var(--ink-raised)',
    },
    resultCount: { fontFamily: 'var(--font-ui)', fontSize: '0.78rem', color: 'var(--amber)', fontWeight: 600 },

    gridArea: { flex: 1, minWidth: 0, paddingLeft: '28px' },
    sortStrip: {
        display: 'flex', alignItems: 'center', gap: '12px',
        padding: '28px 0 20px', flexWrap: 'wrap',
    },
    sortStripLabel: {
        fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--cream-fade)',
        marginRight: 'auto',
    },
    sortPills: { display: 'flex', gap: '6px', flexWrap: 'wrap' },
    sortPill: {
        padding: '5px 13px', borderRadius: '16px',
        background: 'var(--ink-card)', border: '1px solid var(--ink-border)',
        color: 'var(--cream-fade)', fontFamily: 'var(--font-ui)', fontSize: '0.78rem',
        cursor: 'pointer', transition: 'all 0.12s',
    },
    sortPillActive: {
        background: 'var(--amber-dim)', border: '1px solid var(--amber)',
        color: 'var(--amber-lt)', fontWeight: 600,
    },

    loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '100px 0' },
    spinner: { width: '32px', height: '32px', borderRadius: '50%', border: '2px solid var(--ink-border)', borderTopColor: 'var(--amber)' },
    empty: { textAlign: 'center', padding: '80px 0', display: 'flex', flexDirection: 'column', alignItems: 'center' },

    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
        gap: '24px',
    },
    card: {
        background: 'var(--ink-card)', borderRadius: 'var(--radius-lg)',
        overflow: 'hidden', border: '1px solid var(--ink-border)',
        cursor: 'pointer', transition: 'transform 0.2s ease, box-shadow 0.2s ease',
    },
    coverWrap: { position: 'relative', aspectRatio: '2/3', overflow: 'hidden' },
    cover: { width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.35s ease' },
    coverOverlay: { position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,.92) 0%, rgba(0,0,0,.1) 55%, transparent 100%)' },
    ratingPill: {
        position: 'absolute', top: '10px', left: '10px',
        background: 'rgba(0,0,0,.65)', color: 'var(--cream)',
        padding: '3px 9px', borderRadius: '10px',
        fontSize: '0.78rem', fontFamily: 'var(--font-ui)', fontWeight: 600,
        backdropFilter: 'blur(4px)',
    },
    heartBtn: {
        position: 'absolute', top: '8px', right: '8px',
        background: 'rgba(0,0,0,.5)', border: 'none',
        borderRadius: '50%', width: '30px', height: '30px',
        fontSize: '15px', cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    adminBtns: { position: 'absolute', top: '8px', left: '8px', display: 'flex', flexDirection: 'column', gap: '5px' },
    adminIconBtn: { background: 'rgba(0,0,0,.6)', color: 'var(--cream)', border: 'none', borderRadius: '6px', padding: '4px 7px', fontSize: '13px', cursor: 'pointer', textDecoration: 'none', display: 'block' },
    adminIconBtnDanger: { background: 'rgba(180,40,40,.7)', color: '#fff', border: 'none', borderRadius: '6px', padding: '4px 7px', fontSize: '13px', cursor: 'pointer' },
    cardBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, padding: '14px' },
    cardTitle: { fontFamily: 'var(--font-display)', fontWeight: 600, fontSize: '0.95rem', color: '#fff', margin: '0 0 3px', lineHeight: 1.3 },
    cardAuthor: { fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: 'rgba(255,255,255,0.6)', margin: 0 },
    cardMeta: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', gap: '8px' },
    cardMetaLeft: { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0 },
    chapterCount: { fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: 'var(--cream-fade)' },
    newestChapter: { fontFamily: 'var(--font-ui)', fontSize: '0.68rem', color: 'var(--amber)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    readBtn: {
        background: 'var(--amber)', color: 'var(--ink)', border: 'none',
        padding: '6px 14px', borderRadius: '14px',
        fontFamily: 'var(--font-ui)', fontSize: '0.78rem', fontWeight: 600,
        cursor: 'pointer', flexShrink: 0,
    },
};

export default Home;