import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Navbar = ({ darkMode, setDarkMode, user, onLogout, onOpenLogin }) => {
    const [profile, setProfile] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        if (user) {
            axios.get(`${process.env.REACT_APP_API_URL}/api/users/profile/${user}`)
                .then(res => setProfile(res.data))
                .catch(() => {});
        } else {
            setProfile(null);
        }
    }, [user]);

    const isPremium =
        profile?.subscriptionStatus === 'premium' &&
        profile?.subscriptionExpiresAt &&
        new Date(profile.subscriptionExpiresAt) > new Date();

    const role = localStorage.getItem('role');

    return (
        <nav style={styles.nav}>
            <Link to="/" style={styles.logo}>
                <span style={styles.logoG}>G</span>EO NOVELS
            </Link>

            <div style={styles.right}>
                <button
                    onClick={() => setDarkMode(!darkMode)}
                    style={styles.iconBtn}
                    title={darkMode ? 'Light mode' : 'Dark mode'}
                >
                    {darkMode ? '☀' : '☾'}
                </button>

                {user ? (
                    <>
                        <Link to="/subscription" style={isPremium ? styles.premiumBadge : styles.upgradeBadge}>
                            {isPremium ? '✦ Premium' : 'Upgrade'}
                        </Link>

                        <div style={styles.avatarWrap} onClick={() => setMenuOpen(o => !o)}>
                            <img
                                src={profile?.profilePicture || `https://ui-avatars.com/api/?name=${user}&background=7a5120&color=f0e8d8&bold=true`}
                                alt={user}
                                style={styles.avatar}
                            />
                            <span style={styles.username}>{profile?.nickname || user}</span>
                            <span style={{ color: 'var(--cream-fade)', fontSize: '10px' }}>▾</span>
                        </div>

                        {menuOpen && (
                            <div style={styles.dropdown}>
                                <Link to="/profile" style={styles.dropItem} onClick={() => setMenuOpen(false)}>
                                    პირადი გვერდი
                                </Link>
                                {role === 'admin' && (
                                    <Link to="/add" style={styles.dropItem} onClick={() => setMenuOpen(false)}>
                                        + ნოველის დამატება
                                    </Link>
                                )}
                                <hr style={styles.dropDivider} />
                                <button style={styles.dropLogout} onClick={() => { setMenuOpen(false); onLogout(); }}>
                                    გამოსვლა
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <button onClick={onOpenLogin} style={styles.loginBtn}>შესვლა</button>
                )}
            </div>
        </nav>
    );
};

const styles = {
    nav: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '0 32px',
        height: '64px',
        background: 'var(--ink-soft)',
        borderBottom: '1px solid var(--ink-border)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        backdropFilter: 'blur(8px)',
    },
    logo: {
        fontFamily: 'var(--font-display)',
        fontSize: '1.4rem',
        fontWeight: 700,
        color: 'var(--cream)',
        letterSpacing: '0.05em',
        textDecoration: 'none',
    },
    logoG: {
        color: 'var(--amber)',
    },
    right: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        position: 'relative',
    },
    iconBtn: {
        background: 'none',
        border: 'none',
        fontSize: '18px',
        color: 'var(--cream-dim)',
        cursor: 'pointer',
        padding: '6px',
        borderRadius: '50%',
        lineHeight: 1,
    },
    premiumBadge: {
        background: 'var(--amber-dim)',
        color: 'var(--amber-lt)',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.78rem',
        fontFamily: 'var(--font-ui)',
        fontWeight: 600,
        letterSpacing: '0.02em',
        textDecoration: 'none',
        border: '1px solid var(--amber-dim)',
    },
    upgradeBadge: {
        color: 'var(--cream-dim)',
        padding: '4px 12px',
        borderRadius: '20px',
        fontSize: '0.78rem',
        fontFamily: 'var(--font-ui)',
        border: '1px solid var(--ink-border)',
        textDecoration: 'none',
    },
    avatarWrap: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        cursor: 'pointer',
        padding: '4px 8px',
        borderRadius: '20px',
        transition: 'background 0.15s',
    },
    avatar: {
        width: '34px',
        height: '34px',
        borderRadius: '50%',
        objectFit: 'cover',
        border: '2px solid var(--amber-dim)',
    },
    username: {
        fontFamily: 'var(--font-ui)',
        fontSize: '0.88rem',
        fontWeight: 500,
        color: 'var(--cream-dim)',
    },
    dropdown: {
        position: 'absolute',
        top: 'calc(100% + 12px)',
        right: 0,
        background: 'var(--ink-card)',
        border: '1px solid var(--ink-border)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        minWidth: '180px',
        padding: '6px',
        display: 'flex',
        flexDirection: 'column',
        gap: '2px',
    },
    dropItem: {
        display: 'block',
        padding: '9px 14px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.88rem',
        fontFamily: 'var(--font-ui)',
        color: 'var(--cream-dim)',
        textDecoration: 'none',
        transition: 'background 0.1s',
    },
    dropDivider: {
        border: 'none',
        borderTop: '1px solid var(--ink-border)',
        margin: '4px 0',
    },
    dropLogout: {
        display: 'block',
        padding: '9px 14px',
        borderRadius: 'var(--radius-sm)',
        fontSize: '0.88rem',
        fontFamily: 'var(--font-ui)',
        color: '#e88',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        width: '100%',
    },
    loginBtn: {
        background: 'var(--amber)',
        color: 'var(--ink)',
        border: 'none',
        padding: '8px 20px',
        borderRadius: '20px',
        fontFamily: 'var(--font-ui)',
        fontSize: '0.88rem',
        fontWeight: 600,
        cursor: 'pointer',
        letterSpacing: '0.02em',
    },
};

export default Navbar;
