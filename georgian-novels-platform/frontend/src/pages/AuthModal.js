import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';

const AuthModal = ({ onClose, onLoginSuccess }) => {
    const [tab, setTab] = useState('login'); // 'login' | 'register' | 'verify'
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [verificationCode, setVerificationCode] = useState('');
    const [error, setError] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const firstInputRef = useRef(null);

    useEffect(() => {
        firstInputRef.current?.focus();
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const clearMessages = () => { setError(''); setMessage(''); };

    const handleSubmit = async (e) => {
        e.preventDefault();
        clearMessages();
        setLoading(true);
        try {
            if (tab === 'register') {
                const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/register`, { username, email, password });
                setMessage(res.data.message || 'კოდი გაიგზავნა იმეილზე!');
                setTab('verify');
            } else {
                const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/login`, { username, password });
                onLoginSuccess(res.data.user, res.data.role, res.data.subscriptionStatus, res.data.subscriptionExpiresAt);
                onClose();
            }
        } catch (err) {
            setError(err.response?.data?.message || 'შეცდომა მოხდა. სცადეთ თავიდან.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        clearMessages();
        setLoading(true);
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/users/verify`, { email, code: verificationCode });
            if (res.data.success) {
                setMessage('');
                setTab('login');
                setVerificationCode('');
                setError('');
                // Show success inline instead of alert
                setMessage('✓ იმეილი დადასტურდა! შეგიძლიათ შეხვიდეთ.');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'არასწორი კოდი. სცადეთ თავიდან.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={s.overlay} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
            <div style={s.modal}>
                {/* Close */}
                <button onClick={onClose} style={s.closeBtn}>✕</button>

                {/* Logo mark */}
                <div style={s.logoMark}>
                    <span style={s.logoG}>G</span>
                </div>

                {tab === 'verify' ? (
                    <>
                        <h2 style={s.title}>იმეილის დადასტურება</h2>
                        <p style={s.sub}>6-ნიშნა კოდი გაიგზავნა:<br /><span style={{ color: 'var(--amber)' }}>{email}</span></p>

                        {error && <div style={s.errorBanner}>{error}</div>}
                        {message && <div style={s.successBanner}>{message}</div>}

                        <form onSubmit={handleVerify} style={s.form}>
                            <input
                                ref={firstInputRef}
                                type="text"
                                placeholder="· · · · · ·"
                                maxLength="6"
                                value={verificationCode}
                                onChange={e => setVerificationCode(e.target.value)}
                                style={{ ...s.input, letterSpacing: '10px', textAlign: 'center', fontSize: '1.4rem' }}
                                required
                            />
                            <button type="submit" disabled={loading} style={s.primaryBtn}>
                                {loading ? '...' : 'კოდის დადასტურება'}
                            </button>
                        </form>
                        <button onClick={() => { setTab('register'); clearMessages(); }} style={s.linkBtn}>← უკან</button>
                    </>
                ) : (
                    <>
                        {/* Tabs */}
                        <div style={s.tabs}>
                            <button onClick={() => { setTab('login'); clearMessages(); }} style={{ ...s.tabBtn, ...(tab === 'login' ? s.tabActive : {}) }}>შესვლა</button>
                            <button onClick={() => { setTab('register'); clearMessages(); }} style={{ ...s.tabBtn, ...(tab === 'register' ? s.tabActive : {}) }}>რეგისტრაცია</button>
                        </div>

                        {error && <div style={s.errorBanner}>{error}</div>}
                        {message && <div style={s.successBanner}>{message}</div>}

                        <form onSubmit={handleSubmit} style={s.form}>
                            <div style={s.fieldGroup}>
                                <label style={s.label}>მომხმარებელი</label>
                                <input
                                    ref={firstInputRef}
                                    type="text"
                                    value={username}
                                    onChange={e => setUsername(e.target.value)}
                                    style={s.input}
                                    placeholder="შეიყვანეთ მომხმარებელი"
                                    required
                                />
                            </div>

                            {tab === 'register' && (
                                <div style={s.fieldGroup}>
                                    <label style={s.label}>ელ-ფოსტა</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        style={s.input}
                                        placeholder="your@email.com"
                                        required
                                    />
                                </div>
                            )}

                            <div style={s.fieldGroup}>
                                <label style={s.label}>პაროლი</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={e => setPassword(e.target.value)}
                                    style={s.input}
                                    placeholder="••••••••"
                                    required
                                />
                            </div>

                            <button type="submit" disabled={loading} style={s.primaryBtn}>
                                {loading ? '...' : tab === 'login' ? 'შესვლა' : 'რეგისტრაცია'}
                            </button>
                        </form>

                        <p style={s.switchText}>
                            {tab === 'login' ? 'ანგარიში არ გაქვთ? ' : 'უკვე გაქვთ ანგარიში? '}
                            <button
                                onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); clearMessages(); }}
                                style={s.switchLink}
                            >
                                {tab === 'login' ? 'დარეგისტრირდით' : 'შედით'}
                            </button>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

const s = {
    overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000, padding: '20px' },
    modal: { background: 'var(--ink-card)', border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-xl)', padding: '40px 36px', width: '100%', maxWidth: '380px', position: 'relative' },
    closeBtn: { position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: 'var(--cream-fade)', fontSize: '14px', cursor: 'pointer', padding: '4px 8px', borderRadius: '4px' },
    logoMark: { textAlign: 'center', marginBottom: '20px' },
    logoG: { fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--amber)' },
    title: { fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 600, color: 'var(--cream)', textAlign: 'center', margin: '0 0 8px' },
    sub: { fontFamily: 'var(--font-ui)', fontSize: '0.85rem', color: 'var(--cream-fade)', textAlign: 'center', margin: '0 0 24px', lineHeight: 1.6 },
    tabs: { display: 'flex', marginBottom: '24px', background: 'var(--ink-raised)', borderRadius: '10px', padding: '3px' },
    tabBtn: { flex: 1, padding: '9px', border: 'none', background: 'none', color: 'var(--cream-fade)', fontFamily: 'var(--font-ui)', fontSize: '0.88rem', cursor: 'pointer', borderRadius: '8px', transition: 'all 0.15s' },
    tabActive: { background: 'var(--ink-card)', color: 'var(--cream)', fontWeight: 600, boxShadow: '0 1px 4px rgba(0,0,0,.3)' },
    errorBanner: { background: 'rgba(192,57,43,.15)', border: '1px solid rgba(192,57,43,.3)', color: '#e88', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontFamily: 'var(--font-ui)', fontSize: '0.85rem' },
    successBanner: { background: 'rgba(39,174,96,.15)', border: '1px solid rgba(39,174,96,.3)', color: '#6e9', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontFamily: 'var(--font-ui)', fontSize: '0.85rem' },
    form: { display: 'flex', flexDirection: 'column', gap: '16px' },
    fieldGroup: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontFamily: 'var(--font-ui)', fontSize: '0.78rem', fontWeight: 500, color: 'var(--cream-fade)', letterSpacing: '0.04em' },
    input: { padding: '11px 14px', background: 'var(--ink-raised)', border: '1px solid var(--ink-border)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-ui)', fontSize: '0.9rem', outline: 'none' },
    primaryBtn: { padding: '12px', background: 'var(--amber)', color: 'var(--ink)', border: 'none', borderRadius: '10px', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', marginTop: '4px' },
    switchText: { fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--cream-fade)', textAlign: 'center', margin: '16px 0 0' },
    switchLink: { background: 'none', border: 'none', color: 'var(--amber)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: '0.82rem', padding: 0 },
    linkBtn: { background: 'none', border: 'none', color: 'var(--amber)', cursor: 'pointer', fontFamily: 'var(--font-ui)', fontSize: '0.85rem', display: 'block', margin: '16px auto 0' },
};

export default AuthModal;
