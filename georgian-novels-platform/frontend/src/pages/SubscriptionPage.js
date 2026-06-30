import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const PLANS = [
    { months: 1,  price: '₾9.99',  label: '1 თვე',  per: null,         saving: null },
    { months: 3,  price: '₾24.99', label: '3 თვე',  per: '₾8.33/თვე', saving: '17% დაზოგვა', featured: true },
    { months: 12, price: '₾79.99', label: '1 წელი', per: '₾6.67/თვე', saving: '33% დაზოგვა' },
];

const PERKS = [
    { icon: '⚡', title: 'ადრეული წვდომა', desc: 'ახალ თავებს კითხულობ 1 დღით ადრე' },
    { icon: '✦', title: 'Premium ნიშანი', desc: 'სპეციალური ნიშანი ნავიგაციაში და კომენტარებში' },
    { icon: '∞', title: 'შეუზღუდავი კითხვა', desc: 'ყველა ნოველა, ყველა თავი' },
];

const SubscriptionPage = ({ user: userProp }) => {
    const user = userProp || localStorage.getItem('user');
    const [profile, setProfile] = useState(null);
    const [profileLoading, setProfileLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [message, setMessage] = useState({ text: '', type: '' });

    useEffect(() => {
        if (!user) { setProfileLoading(false); return; }
        axios.get(`http://localhost:5000/api/users/profile/${user}`)
            .then(res => setProfile(res.data))
            .catch(() => {})
            .finally(() => setProfileLoading(false));
    }, [user]);

    const isPremium = profile?.subscriptionStatus === 'premium' &&
        profile?.subscriptionExpiresAt && new Date(profile.subscriptionExpiresAt) > new Date();
    const expiresAt = profile?.subscriptionExpiresAt
        ? new Date(profile.subscriptionExpiresAt).toLocaleDateString('ka-GE') : null;

    const handleUpgrade = async (months) => {
        setActionLoading(true);
        setMessage({ text: '', type: '' });
        try {
            const res = await axios.post('http://localhost:5000/api/subscription/upgrade', { username: user, months });
            setMessage({ text: res.data.message, type: 'success' });
            const updated = await axios.get(`http://localhost:5000/api/users/profile/${user}`);
            setProfile(updated.data);
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'შეცდომა მოხდა', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!window.confirm('გამოწერის გაუქმება?')) return;
        setActionLoading(true);
        try {
            const res = await axios.post('http://localhost:5000/api/subscription/cancel', { username: user });
            setMessage({ text: res.data.message, type: 'success' });
            const updated = await axios.get(`http://localhost:5000/api/users/profile/${user}`);
            setProfile(updated.data);
        } catch (err) {
            setMessage({ text: err.response?.data?.message || 'შეცდომა', type: 'error' });
        } finally {
            setActionLoading(false);
        }
    };

    if (!user) return (
        <div style={s.page}>
            <div style={s.emptyState}>
                <p style={s.emptyTitle}>შესვლა საჭიროა</p>
                <p style={s.emptySub}>პრემიუმ გამოწერისთვის გაიარეთ ავტორიზაცია</p>
            </div>
        </div>
    );

    if (profileLoading) return <div style={s.loadingWrap}>იტვირთება...</div>;

    return (
        <div style={s.page}>
            <div style={s.container}>
                {/* Header */}
                <div style={s.header}>
                    <p style={s.eyebrow}>Geo Novels Premium</p>
                    <h1 style={s.title}>{isPremium ? 'შენი Premium გამოწერა' : 'გახდი Premium წევრი'}</h1>
                    <p style={s.sub}>{isPremium ? `გამოწერა აქტიურია ${expiresAt}-მდე` : 'ახალ თავებზე ადრე, სხვებზე ადრე'}</p>
                </div>

                {/* Status banner for active premium */}
                {isPremium && (
                    <div style={s.activeBanner}>
                        <div style={s.activeBannerLeft}>
                            <span style={s.activeDot} />
                            <div>
                                <p style={s.activeBannerTitle}>✦ Premium აქტიურია</p>
                                <p style={s.activeBannerSub}>ვადა იწურება: {expiresAt}</p>
                            </div>
                        </div>
                        <div style={s.activeBannerActions}>
                            <button onClick={() => handleUpgrade(1)} disabled={actionLoading} style={s.extendBtn}>
                                {actionLoading ? '...' : '+1 თვე · ₾9.99'}
                            </button>
                            <button onClick={handleCancel} disabled={actionLoading} style={s.cancelBtn}>
                                გაუქმება
                            </button>
                        </div>
                    </div>
                )}

                {/* Perks */}
                <div style={s.perksRow}>
                    {PERKS.map(p => (
                        <div key={p.title} style={s.perkCard}>
                            <span style={s.perkIcon}>{p.icon}</span>
                            <div>
                                <p style={s.perkTitle}>{p.title}</p>
                                <p style={s.perkDesc}>{p.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Plans (only for free users) */}
                {!isPremium && (
                    <>
                        <h2 style={s.plansTitle}>აირჩიე გეგმა</h2>
                        <div style={s.plansGrid}>
                            {PLANS.map(plan => (
                                <div key={plan.months} style={{ ...s.planCard, ...(plan.featured ? s.planCardFeatured : {}) }}>
                                    {plan.featured && <div style={s.featuredTag}>ყველაზე პოპულარული</div>}
                                    <div style={s.planHeader}>
                                        <p style={s.planLabel}>{plan.label}</p>
                                        {plan.saving && <span style={s.savingBadge}>{plan.saving}</span>}
                                    </div>
                                    <p style={s.planPrice}>{plan.price}</p>
                                    {plan.per && <p style={s.planPer}>{plan.per}</p>}
                                    <button
                                        onClick={() => handleUpgrade(plan.months)}
                                        disabled={actionLoading}
                                        style={{ ...s.planBtn, ...(plan.featured ? s.planBtnFeatured : {}) }}
                                    >
                                        {actionLoading ? '...' : 'გამოწერა'}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </>
                )}

                {/* Message */}
                {message.text && (
                    <div style={message.type === 'success' ? s.successBanner : s.errorBanner}>
                        {message.text}
                    </div>
                )}

                <p style={s.disclaimer}>
                    * გადახდის სისტემა მალე დაემატება. ამჟამად ადმინი ხელით ააქტიურებს პრემიუმს.
                </p>
            </div>
        </div>
    );
};

const s = {
    page: { minHeight: '100vh', padding: '0 0 80px' },
    loadingWrap: { textAlign: 'center', padding: '120px 0', color: 'var(--cream-fade)', fontFamily: 'var(--font-ui)' },
    container: { maxWidth: '820px', margin: '0 auto', padding: '56px 24px 0' },
    header: { textAlign: 'center', marginBottom: '48px' },
    eyebrow: { fontFamily: 'var(--font-ui)', fontSize: '0.72rem', fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'var(--amber)', margin: '0 0 12px' },
    title: { fontFamily: 'var(--font-display)', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 700, color: 'var(--cream)', margin: '0 0 12px', lineHeight: 1.15 },
    sub: { fontFamily: 'var(--font-ui)', fontSize: '1rem', color: 'var(--cream-fade)', margin: 0 },
    activeBanner: { background: 'var(--ink-card)', border: '1px solid var(--amber-dim)', borderRadius: 'var(--radius-lg)', padding: '20px 24px', marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', flexWrap: 'wrap' },
    activeBannerLeft: { display: 'flex', alignItems: 'center', gap: '14px' },
    activeDot: { width: '10px', height: '10px', borderRadius: '50%', background: 'var(--amber)', flexShrink: 0 },
    activeBannerTitle: { fontFamily: 'var(--font-ui)', fontWeight: 600, color: 'var(--amber)', margin: '0 0 3px', fontSize: '0.95rem' },
    activeBannerSub: { fontFamily: 'var(--font-ui)', fontSize: '0.82rem', color: 'var(--cream-fade)', margin: 0 },
    activeBannerActions: { display: 'flex', gap: '10px', flexWrap: 'wrap' },
    extendBtn: { padding: '9px 18px', background: 'var(--amber)', color: 'var(--ink)', border: 'none', borderRadius: '20px', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.85rem', cursor: 'pointer' },
    cancelBtn: { padding: '9px 18px', background: 'none', color: '#e88', border: '1px solid rgba(200,80,80,.3)', borderRadius: '20px', fontFamily: 'var(--font-ui)', fontSize: '0.85rem', cursor: 'pointer' },
    perksRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '52px' },
    perkCard: { background: 'var(--ink-card)', border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-lg)', padding: '20px', display: 'flex', gap: '16px', alignItems: 'flex-start' },
    perkIcon: { fontSize: '1.4rem', flexShrink: 0, marginTop: '2px' },
    perkTitle: { fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--cream)', margin: '0 0 4px' },
    perkDesc: { fontFamily: 'var(--font-ui)', fontSize: '0.8rem', color: 'var(--cream-fade)', margin: 0, lineHeight: 1.5 },
    plansTitle: { fontFamily: 'var(--font-display)', fontSize: '1.3rem', color: 'var(--cream)', margin: '0 0 20px', textAlign: 'center' },
    plansGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' },
    planCard: { background: 'var(--ink-card)', border: '1px solid var(--ink-border)', borderRadius: 'var(--radius-lg)', padding: '28px 20px', textAlign: 'center', position: 'relative' },
    planCardFeatured: { border: '1px solid var(--amber)' },
    featuredTag: { position: 'absolute', top: '-12px', left: '50%', transform: 'translateX(-50%)', background: 'var(--amber)', color: 'var(--ink)', fontSize: '0.7rem', fontWeight: 700, padding: '3px 14px', borderRadius: '12px', whiteSpace: 'nowrap', fontFamily: 'var(--font-ui)' },
    planHeader: { display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', marginBottom: '12px' },
    planLabel: { fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.9rem', color: 'var(--cream)', margin: 0 },
    savingBadge: { background: 'rgba(39,174,96,.15)', color: '#6e9', padding: '2px 8px', borderRadius: '8px', fontSize: '0.68rem', fontFamily: 'var(--font-ui)', fontWeight: 600 },
    planPrice: { fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 700, color: 'var(--cream)', margin: '0 0 4px' },
    planPer: { fontFamily: 'var(--font-ui)', fontSize: '0.78rem', color: 'var(--cream-fade)', margin: '0 0 20px' },
    planBtn: { width: '100%', padding: '11px', background: 'var(--ink-raised)', color: 'var(--cream)', border: '1px solid var(--ink-border)', borderRadius: '10px', fontFamily: 'var(--font-ui)', fontWeight: 600, fontSize: '0.88rem', cursor: 'pointer' },
    planBtnFeatured: { background: 'var(--amber)', color: 'var(--ink)', border: 'none' },
    successBanner: { background: 'rgba(39,174,96,.12)', border: '1px solid rgba(39,174,96,.3)', color: '#6e9', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', fontFamily: 'var(--font-ui)', fontSize: '0.9rem' },
    errorBanner: { background: 'rgba(192,57,43,.12)', border: '1px solid rgba(192,57,43,.3)', color: '#e88', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', fontFamily: 'var(--font-ui)', fontSize: '0.9rem' },
    disclaimer: { fontFamily: 'var(--font-ui)', fontSize: '0.78rem', color: 'var(--cream-fade)', textAlign: 'center', fontStyle: 'italic', lineHeight: 1.6 },
    emptyState: { textAlign: 'center', padding: '120px 24px' },
    emptyTitle: { fontFamily: 'var(--font-display)', fontSize: '1.4rem', color: 'var(--cream)', marginBottom: '8px' },
    emptySub: { fontFamily: 'var(--font-ui)', fontSize: '0.9rem', color: 'var(--cream-fade)' },
};

export default SubscriptionPage;