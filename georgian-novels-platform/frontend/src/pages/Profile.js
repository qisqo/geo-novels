import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const Profile = () => {
    const [profile, setProfile] = useState({ nickname: '', profilePicture: '', email: '', username: '' });
    const [loading, setLoading] = useState(true);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState('');
    const [favoriteNovels, setFavoriteNovels] = useState([]);
    const currentUser = localStorage.getItem('user');
    const role = localStorage.getItem('role');

    useEffect(() => {
        if (!currentUser) return;
        Promise.all([
            axios.get(`http://localhost:5000/api/users/profile/${currentUser}`),
            axios.get(`http://localhost:5000/api/users/favorites/${currentUser}`)
                .then(res => {
                    // favorites returns IDs; fetch novel titles if any
                    return res.data;
                }).catch(() => [])
        ]).then(([profileRes, favIds]) => {
            setProfile(profileRes.data);
            // fetch novel details for each favorite
            if (favIds.length) {
                axios.get('http://localhost:5000/api/novels')
                    .then(r => setFavoriteNovels(r.data.filter(n => favIds.includes(n._id))))
                    .catch(() => {});
            }
            setLoading(false);
        }).catch(() => setLoading(false));
    }, [currentUser]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await axios.put(`http://localhost:5000/api/users/profile/${currentUser}`, {
                nickname: profile.nickname,
                profilePicture: profile.profilePicture
            });
            setSaved(true);
            setTimeout(() => setSaved(false), 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'შეცდომა განახლებისას');
        }
    };

    if (loading) return <div style={s.loading}>იტვირთება...</div>;
    if (!currentUser) return <div style={s.loading}>გთხოვთ გაიაროთ ავტორიზაცია</div>;

    const isPremium = profile.subscriptionStatus === 'premium' &&
        profile.subscriptionExpiresAt && new Date(profile.subscriptionExpiresAt) > new Date();
    const avatarSrc = profile.profilePicture ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.nickname || currentUser)}&size=200&background=7a5120&color=f0e8d8&bold=true`;

    return (
        <div style={s.page}>
            <div style={s.container}>
                {/* Left column: avatar + stats */}
                <div style={s.leftCol}>
                    <div style={s.avatarCard}>
                        <div style={s.avatarWrap}>
                            <img src={avatarSrc} alt={currentUser} style={s.avatar} />
                            {isPremium && <div style={s.premiumRing} />}
                        </div>
                        <h2 style={s.displayName}>{profile.nickname || currentUser}</h2>
                        <p style={s.usernameTag}>@{profile.username || currentUser}</p>
                        {isPremium ? (
                            <div style={s.premiumBadge}>✦ Premium</div>
                        ) : (
                            <Link to="/subscription" style={s.upgradeBadge}>Upgrade to Premium →</Link>
                        )}
                        {role === 'admin' && <div style={s.adminBadge}>⚙ Admin</div>}
                    </div>

                    {/* Favorites */}
                    {favoriteNovels.length > 0 && (
                        <div style={s.favCard}>
                            <h3 style={s.cardTitle}>♥ ფავორიტები</h3>
                            <div style={s.favList}>
                                {favoriteNovels.slice(0, 5).map(n => (
                                    <Link key={n._id} to={`/novel/${n._id}`} style={s.favItem}>
                                        <img
                                            src={n.coverImage || `https://ui-avatars.com/api/?name=${encodeURIComponent(n.title)}&size=60&background=2a2722&color=c9893a&bold=true&length=2`}
                                            alt={n.title}
                                            style={s.favCover}
                                        />
                                        <div style={s.favInfo}>
                                            <p style={s.favTitle}>{n.title}</p>
                                            <p style={s.favAuthor}>{n.author}</p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right column: edit form */}
                <div style={s.rightCol}>
                    <div style={s.formCard}>
                        <h2 style={s.sectionTitle}>პროფილის რედაქტირება</h2>
                        <p style={s.sectionSub}>სახელი და სურათი ჩანს კომენტარებსა და სარეიტინგო სიაში</p>

                        {error && <div style={s.errorBanner}>{error}</div>}
                        {saved && <div style={s.successBanner}>✓ პროფილი შენახულია</div>}

                        <form onSubmit={handleUpdate} style={s.form}>
                            <div style={s.field}>
                                <label style={s.label}>მომხმარებლის სახელი</label>
                                <div style={s.staticField}>@{profile.username || currentUser}</div>
                            </div>

                            {profile.email && (
                                <div style={s.field}>
                                    <label style={s.label}>ელ-ფოსტა</label>
                                    <div style={s.staticField}>{profile.email}</div>
                                </div>
                            )}

                            <div style={s.field}>
                                <label style={s.label}>მეტსახელი (Nickname)</label>
                                <input
                                    type="text"
                                    value={profile.nickname}
                                    onChange={e => setProfile({ ...profile, nickname: e.target.value })}
                                    style={s.input}
                                    placeholder="სახელი, რომელსაც სხვები ნახავენ"
                                    required
                                />
                            </div>

                            <div style={s.field}>
                                <label style={s.label}>პროფილის სურათის URL</label>
                                <input
                                    type="url"
                                    value={profile.profilePicture}
                                    onChange={e => setProfile({ ...profile, profilePicture: e.target.value })}
                                    style={s.input}
                                    placeholder="https://..."
                                />
                                {profile.profilePicture && (
                                    <div style={s.previewRow}>
                                        <img src={profile.profilePicture} alt="preview" style={s.previewImg} onError={e => e.target.style.display = 'none'} />
                                        <span style={s.previewLabel}>წინასწარი ხედვა</span>
                                    </div>
                                )}
                            </div>

                            <button type="submit" style={s.saveBtn}>
                                {saved ? '✓ შენახულია' : 'შენახვა'}
                            </button>
                        </form>
                    </div>

                    {isPremium && (
                        <div style={s.subCard}>
                            <div style={s.subCardLeft}>
                                <p style={s.subCardLabel}>Premium გამოწერა</p>
                                <p style={s.subCardExpiry}>
                                    ვადა: {new Date(profile.subscriptionExpiresAt).toLocaleDateString('ka-GE')}
                                </p>
                            </div>
                            <Link to="/subscription" style={s.subCardLink}>მართვა →</Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const s = {
    page: { minHeight: '100vh', padding: '48px 24px 80px' },
    loading: { textAlign: 'center', padding: '120px 0', color: 'var(--cream-fade)', fontFamily: 'var(--font-ui)' },
    container: { maxWidth: '960px', margin: '0 auto', display: 'flex', gap: '32px', flexWrap: 'wrap', alignItems: 'flex-start' },
    leftCol: { width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '16px' },
    rightCol: { flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '16px' },
    avatarCard: { background: 'var(--ink-card)', border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-lg)', padding: '28px 20px', textAlign: 'center' },
    avatarWrap: { position: 'relative', display: 'inline-block', marginBottom: '16px' },
    avatar: { width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', display: 'block' },
    premiumRing: { position: 'absolute', inset: '-3px', borderRadius: '50%', border: '2px solid var(--amber)', pointerEvents: 'none' },
    displayName: { fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--cream)', margin: '0 0 4px' },
    usernameTag: { fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--cream-fade)', margin: '0 0 14px' },
    premiumBadge: { display: 'inline-block', background: 'var(--amber-dim)', color: 'var(--amber-lt)', padding: '4px 14px', borderRadius: '16px', fontFamily: 'var(--font-ui)', fontSize: '0.78rem', fontWeight: 600, marginBottom: '8px' },
    upgradeBadge: { display: 'inline-block', color: 'var(--amber)', fontFamily: 'var(--font-ui)', fontSize: '0.78rem', textDecoration: 'none', marginBottom: '8px' },
    adminBadge: { display: 'inline-block', background: 'rgba(39,174,96,.15)', color: '#6e9', padding: '4px 14px', borderRadius: '16px', fontFamily: 'var(--font-ui)', fontSize: '0.75rem', marginTop: '6px' },
    favCard: { background: 'var(--ink-card)', border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-lg)', padding: '20px' },
    cardTitle: { fontFamily: 'var(--font-display)', fontSize: '0.95rem', color: 'var(--cream)', margin: '0 0 14px' },
    favList: { display: 'flex', flexDirection: 'column', gap: '10px' },
    favItem: { display: 'flex', gap: '10px', alignItems: 'center', textDecoration: 'none' },
    favCover: { width: '36px', height: '52px', borderRadius: '4px', objectFit: 'cover', flexShrink: 0 },
    favInfo: { minWidth: 0 },
    favTitle: { fontFamily: 'var(--font-ui)', fontSize: '0.82rem', fontWeight: 500, color: 'var(--cream)', margin: '0 0 2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    favAuthor: { fontFamily: 'var(--font-ui)', fontSize: '0.72rem', color: 'var(--cream-fade)', margin: 0 },
    formCard: { background: 'var(--ink-card)', border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-lg)', padding: '28px 28px' },
    sectionTitle: { fontFamily: 'var(--font-display)', fontSize: '1.2rem', fontWeight: 600, color: 'var(--cream)', margin: '0 0 6px' },
    sectionSub: { fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--cream-fade)', margin: '0 0 24px', lineHeight: 1.5 },
    errorBanner: { background: 'rgba(192,57,43,.15)', border: '1px solid rgba(192,57,43,.3)', color: '#e88', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontFamily: 'var(--font-ui)', fontSize: '0.85rem' },
    successBanner: { background: 'rgba(39,174,96,.15)', border: '1px solid rgba(39,174,96,.3)', color: '#6e9', borderRadius: '8px', padding: '10px 14px', marginBottom: '16px', fontFamily: 'var(--font-ui)', fontSize: '0.85rem' },
    form: { display: 'flex', flexDirection: 'column', gap: '18px' },
    field: { display: 'flex', flexDirection: 'column', gap: '6px' },
    label: { fontFamily: 'var(--font-ui)', fontSize: '0.78rem', fontWeight: 500, color: 'var(--cream-fade)', letterSpacing: '0.04em' },
    staticField: { padding: '11px 14px', background: 'var(--ink-raised)', borderRadius: '8px', fontFamily: 'var(--font-ui)', fontSize: '0.88rem', color: 'var(--cream-fade)', border: '1px solid var(--ink-border)' },
    input: { padding: '11px 14px', background: 'var(--ink-raised)', border: '1px solid var(--ink-border)', borderRadius: '8px', color: 'var(--cream)', fontFamily: 'var(--font-ui)', fontSize: '0.9rem', outline: 'none' },
    previewRow: { display: 'flex', alignItems: 'center', gap: '10px', marginTop: '8px' },
    previewImg: { width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--amber-dim)' },
    previewLabel: { fontFamily: 'var(--font-ui)', fontSize: '0.75rem', color: 'var(--cream-fade)' },
    saveBtn: { padding: '12px', background: 'var(--amber)', color: 'var(--ink)', border: 'none', borderRadius: '10px', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.95rem', cursor: 'pointer', marginTop: '4px' },
    subCard: { background: 'var(--ink-card)', border: '1px solid var(--amber-dim)', borderRadius: 'var(--radius-md)', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
    subCardLeft: { display: 'flex', flexDirection: 'column', gap: '3px' },
    subCardLabel: { fontFamily: 'var(--font-ui)', fontSize: '0.85rem', fontWeight: 500, color: 'var(--amber)', margin: 0 },
    subCardExpiry: { fontFamily: 'var(--font-ui)', fontSize: '0.78rem', color: 'var(--cream-fade)', margin: 0 },
    subCardLink: { fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--amber)', textDecoration: 'none' },
};

export default Profile;