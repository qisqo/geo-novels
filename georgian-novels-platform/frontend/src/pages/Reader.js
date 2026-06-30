import React, { useEffect, useState, useCallback } from 'react';
import axios from 'axios';
import { useParams, useNavigate, Link } from 'react-router-dom';
import CommentSection from '../components/CommentSection';

const Reader = ({ fontSize, setFontSize }) => {
    const { id, chapterIndex } = useParams();
    const [novel, setNovel] = useState(null);
    const [userSubscription, setUserSubscription] = useState('free');
    const [timeLeft, setTimeLeft] = useState('');
    const [scrollPct, setScrollPct] = useState(0);
    const [showUI, setShowUI] = useState(true);
    const [lastScroll, setLastScroll] = useState(0);
    const navigate = useNavigate();
    const idx = parseInt(chapterIndex);
    const username = localStorage.getItem('user');
    const userRole = localStorage.getItem('role');
    const safeFontSize = typeof fontSize === 'number' ? fontSize : 18;
    const safeSetFontSize = typeof setFontSize === 'function' ? setFontSize : () => {};

    useEffect(() => {
<<<<<<< HEAD
        axios.get(`http://localhost:5000/api/novels/${id}`).then(res => setNovel(res.data));
        window.scrollTo(0, 0);
        if (username) {
            axios.get(`http://localhost:5000/api/users/profile/${username}`)
                .then(res => setUserSubscription(res.data.subscriptionStatus || 'free'))
                .catch(() => {});
        }
    }, [id, chapterIndex, username]);
=======
        axios.get(`${process.env.REACT_APP_API_URL}/api/novels/${id}`).then(res => setNovel(res.data));
        window.scrollTo(0, 0); 
    }, [id, chapterIndex]);
>>>>>>> 4c5c1b4bb8c0ba309470d412ccbc2be105ad23c2

    useEffect(() => {
        const onScroll = () => {
            const el = document.documentElement;
            const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
            setScrollPct(Math.min(100, pct));
            const dir = el.scrollTop > lastScroll ? 'down' : 'up';
            setShowUI(dir === 'up' || el.scrollTop < 80);
            setLastScroll(el.scrollTop);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, [lastScroll]);

    // Keyboard navigation
    const handleKey = useCallback((e) => {
        if (!novel) return;
        if (e.key === 'ArrowRight' && idx < novel.chapters.length - 1) navigate(`/novel/${id}/reader/${idx + 1}`);
        if (e.key === 'ArrowLeft' && idx > 0) navigate(`/novel/${id}/reader/${idx - 1}`);
    }, [novel, idx, id, navigate]);

    useEffect(() => {
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [handleKey]);

    useEffect(() => {
        if (!novel?.chapters?.[idx]) return;
        const chapter = novel.chapters[idx];
        const unlockTime = chapter.availableAt ? new Date(chapter.availableAt).getTime() : 0;
        if (unlockTime <= Date.now()) { setTimeLeft(''); return; }
        const iv = setInterval(() => {
            const diff = unlockTime - Date.now();
            if (diff <= 0) { setTimeLeft(''); clearInterval(iv); return; }
            const h = Math.floor(diff / 3600000);
            const m = Math.floor((diff % 3600000) / 60000);
            const s = Math.floor((diff % 60000) / 1000);
            setTimeLeft(`${h}სთ ${m}წთ ${s}წმ`);
        }, 1000);
        return () => clearInterval(iv);
    }, [novel, idx]);

    if (!novel) return <div style={s.loading}>იტვირთება...</div>;
    const chapter = novel.chapters?.[idx];
    if (!chapter) return <div style={s.loading}>თავი ვერ მოიძებნა</div>;

    const isPremium = userSubscription === 'premium';
    const isAdmin = userRole === 'admin';
    const chapterLocked = chapter.availableAt && new Date(chapter.availableAt) > new Date();
    const hasAccess = !chapterLocked || isPremium || isAdmin;

    const wordCount = chapter.content?.split(/\s+/).length || 0;
    const readingMins = Math.max(1, Math.ceil(wordCount / 200));

    return (
        <div style={s.page}>
            {/* Reading progress bar */}
            <div style={{ ...s.progressBar, width: `${scrollPct}%` }} />

            {/* Floating top bar — auto-hides on scroll down */}
            <div style={{ ...s.topBar, opacity: showUI ? 1 : 0, transform: showUI ? 'translateY(0)' : 'translateY(-100%)' }}>
                <Link to={`/novel/${id}`} style={s.backLink}>← {novel.title}</Link>
                <div style={s.topBarCenter}>
                    <span style={s.chapterLabel}>თავი {idx + 1} / {novel.chapters.length}</span>
                </div>
                <div style={s.fontControls}>
                    <button onClick={() => safeSetFontSize(p => Math.max(14, p - 2))} style={s.fontBtn}>A−</button>
                    <span style={s.fontVal}>{safeFontSize}</span>
                    <button onClick={() => safeSetFontSize(p => Math.min(28, p + 2))} style={s.fontBtn}>A+</button>
                </div>
            </div>

            <div style={s.container}>
                {/* Chapter header */}
                <div style={s.chapterHeader}>
                    <p style={s.chapterEyebrow}>თავი {idx + 1}</p>
                    <h1 style={s.chapterTitle}>{chapter.title}</h1>
                    <div style={s.chapterMeta}>
                        <span style={s.metaItem}>~{readingMins} წთ წასაკითხი</span>
                        <span style={s.metaDot}>·</span>
                        <span style={s.metaItem}>{wordCount.toLocaleString()} სიტყვა</span>
                        {chapter.availableAt && (isPremium || isAdmin) && (
                            <>
                                <span style={s.metaDot}>·</span>
                                <span style={{ ...s.metaItem, color: 'var(--amber)' }}>✦ ადრეული წვდომა</span>
                            </>
                        )}
                    </div>
                    <div style={s.chapterDivider} />
                </div>

                {/* Content or lock */}
                {hasAccess ? (
                    <div style={{ ...s.content, fontSize: `${safeFontSize}px` }}>
                        {chapter.content}
                    </div>
                ) : (
                    <div style={s.lockBox}>
                        <div style={s.lockIcon}>🔒</div>
                        <h2 style={s.lockTitle}>პრემიუმ კონტენტი</h2>
                        <p style={s.lockSub}>ეს თავი ხელმისაწვდომია პრემიუმ მომხმარებლებისთვის</p>
                        {timeLeft && (
                            <div style={s.countdown}>
                                <p style={s.countdownLabel}>უფასო წვდომა გაიხსნება</p>
                                <div style={s.countdownTime}>{timeLeft}</div>
                            </div>
                        )}
                        <p style={s.lockNote}>არ გსურს ლოდინი? გახდი პრემიუმი — ახალ თავებზე 1 დღით ადრე წვდომა.</p>
                        <Link to="/subscription" style={s.lockBtn}>✦ პრემიუმის გამოწერა</Link>
                    </div>
                )}

                {/* Chapter nav */}
                <div style={s.navRow}>
                    <button
                        onClick={() => navigate(`/novel/${id}/reader/${idx - 1}`)}
                        disabled={idx === 0}
                        style={{ ...s.navBtn, opacity: idx === 0 ? 0.3 : 1 }}
                    >
                        ← წინა თავი
                    </button>
                    <div style={s.navProgress}>
                        {novel.chapters.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => navigate(`/novel/${id}/reader/${i}`)}
                                style={{ ...s.navDot, background: i === idx ? 'var(--amber)' : i < idx ? 'var(--amber-dim)' : 'var(--ink-border)' }}
                                title={`თავი ${i + 1}`}
                            />
                        ))}
                    </div>
                    <button
                        onClick={() => navigate(`/novel/${id}/reader/${idx + 1}`)}
                        disabled={idx === novel.chapters.length - 1}
                        style={{ ...s.navBtn, opacity: idx === novel.chapters.length - 1 ? 0.3 : 1 }}
                    >
                        შემდეგი თავი →
                    </button>
                </div>

                <p style={s.keyboardHint}>← → კლავიშებით ნავიგაცია</p>

                <CommentSection targetId={`${id}-chapter-${idx}`} />
            </div>
        </div>
    );
};

const s = {
    page: { minHeight: '100vh', background: 'var(--ink)' },
    loading: { textAlign: 'center', padding: '120px 0', color: 'var(--cream-fade)', fontFamily: 'var(--font-ui)' },
    progressBar: { position: 'fixed', top: 0, left: 0, height: '2px', background: 'var(--amber)', zIndex: 1001, transition: 'width 0.1s linear' },
    topBar: {
        position: 'fixed', top: 0, left: 0, right: 0, height: '56px',
        background: 'rgba(15,14,12,.92)', borderBottom: '1px solid var(--ink-border)',
        backdropFilter: 'blur(12px)', display: 'flex', alignItems: 'center',
        padding: '0 24px', gap: '16px', zIndex: 1000,
        transition: 'opacity 0.25s ease, transform 0.25s ease',
    },
    backLink: { color: 'var(--cream-fade)', fontFamily: 'var(--font-ui)', fontSize: '0.82rem', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0 },
    topBarCenter: { flex: 1, textAlign: 'center' },
    chapterLabel: { fontFamily: 'var(--font-ui)', fontSize: '0.78rem', color: 'var(--cream-fade)' },
    fontControls: { display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 },
    fontBtn: { background: 'var(--ink-raised)', border: '1px solid var(--ink-border)', color: 'var(--cream-dim)', borderRadius: '6px', padding: '4px 9px', fontFamily: 'var(--font-ui)', fontSize: '0.8rem', cursor: 'pointer' },
    fontVal: { fontFamily: 'var(--font-ui)', fontSize: '0.78rem', color: 'var(--cream-fade)', minWidth: '22px', textAlign: 'center' },
    container: { maxWidth: '680px', margin: '0 auto', padding: '88px 24px 80px' },
    chapterHeader: { textAlign: 'center', marginBottom: '48px' },
    chapterEyebrow: { fontFamily: 'var(--font-ui)', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--amber)', margin: '0 0 12px' },
    chapterTitle: { fontFamily: 'var(--font-display)', fontSize: 'clamp(1.6rem, 4vw, 2.4rem)', fontWeight: 700, color: 'var(--cream)', margin: '0 0 16px', lineHeight: 1.2 },
    chapterMeta: { display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', marginBottom: '32px' },
    metaItem: { fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: 'var(--cream-fade)' },
    metaDot: { color: 'var(--ink-border)', fontSize: '0.7rem' },
    chapterDivider: { width: '48px', height: '2px', background: 'var(--amber-dim)', margin: '0 auto' },
    content: {
        fontFamily: 'var(--font-body)', lineHeight: 2, color: 'var(--cream-dim)',
        whiteSpace: 'pre-wrap', textAlign: 'justify', letterSpacing: '0.01em',
        marginBottom: '64px',
    },
    lockBox: { background: 'var(--ink-card)', border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-xl)', padding: '56px 40px', textAlign: 'center', marginBottom: '64px' },
    lockIcon: { fontSize: '2.5rem', marginBottom: '20px' },
    lockTitle: { fontFamily: 'var(--font-display)', fontSize: '1.5rem', color: 'var(--cream)', margin: '0 0 12px' },
    lockSub: { fontFamily: 'var(--font-ui)', fontSize: '0.9rem', color: 'var(--cream-fade)', margin: '0 0 32px' },
    countdown: { background: 'var(--ink-raised)', borderRadius: 'var(--radius-md)', padding: '20px', marginBottom: '24px', display: 'inline-block' },
    countdownLabel: { fontFamily: 'var(--font-ui)', fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--cream-fade)', margin: '0 0 8px' },
    countdownTime: { fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700, color: 'var(--amber)', letterSpacing: '0.04em' },
    lockNote: { fontFamily: 'var(--font-ui)', fontSize: '0.85rem', color: 'var(--cream-fade)', margin: '0 0 24px', lineHeight: 1.6 },
    lockBtn: { display: 'inline-block', background: 'var(--amber)', color: 'var(--ink)', padding: '12px 32px', borderRadius: '24px', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.92rem', textDecoration: 'none' },
    navRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', paddingTop: '32px', borderTop: '1px solid var(--ink-border)', marginBottom: '8px' },
    navBtn: { background: 'var(--ink-card)', border: '1px solid var(--ink-border)', color: 'var(--cream-dim)', padding: '10px 20px', borderRadius: '20px', fontFamily: 'var(--font-ui)', fontSize: '0.85rem', cursor: 'pointer', transition: 'border-color 0.15s', flexShrink: 0 },
    navProgress: { display: 'flex', gap: '5px', flexWrap: 'wrap', justifyContent: 'center', flex: 1 },
    navDot: { width: '7px', height: '7px', borderRadius: '50%', border: 'none', cursor: 'pointer', padding: 0, transition: 'background 0.15s' },
    keyboardHint: { textAlign: 'center', fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: 'var(--ink-border)', marginBottom: '48px' },
};

export default Reader;
