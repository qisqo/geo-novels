import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const Navbar = ({ darkMode, setDarkMode, user, onLogout, onOpenLogin }) => {
    const [profile, setProfile] = useState(null);

    useEffect(() => {
        if (user) {
            axios.get(`${process.env.REACT_APP_API_URL}/api/users/profile/${user}`)
                .then(res => setProfile(res.data))
                .catch(err => console.log(err));
        }
    }, [user]);

    return (
        <nav style={{ ...navStyle, backgroundColor: darkMode ? '#222' : '#fff' }}>
            <Link to="/" style={{ textDecoration: 'none', color: darkMode ? '#fff' : '#333', fontSize: '1.5rem', fontWeight: 'bold' }}>
                GEO NOVELS
            </Link>

            <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <button onClick={() => setDarkMode(!darkMode)} style={btnStyle}>
                    {darkMode ? '☀️' : '🌙'}
                </button>

                {user ? (
                    <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                        <Link to="/profile" style={profileLinkStyle}>
                            <img 
                                src={profile?.profilePicture || 'https://via.placeholder.com/150'} 
                                alt="User" 
                                style={navAvatarStyle} 
                            />
                            <span style={{ fontWeight: 'bold', fontSize: '1rem', color: darkMode ? '#fff' : '#333' }}>
                                {profile?.nickname || user}
                            </span>
                        </Link>
                        <button onClick={onLogout} style={logoutBtn}>გამოსვლა</button>
                    </div>
                ) : (
                    <button onClick={onOpenLogin} style={loginBtn}>ავტორიზაცია</button>
                )}
            </div>
        </nav>
    );
};

const navStyle = { display: 'flex', justifyContent: 'space-between', padding: '10px 30px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)', position: 'sticky', top: 0, zIndex: 1000, alignItems: 'center' };
const btnStyle = { background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer' };
const profileLinkStyle = { display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' };
const navAvatarStyle = { width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #3498db' };
const loginBtn = { padding: '8px 20px', backgroundColor: '#3498db', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer' };
const logoutBtn = { padding: '8px 20px', backgroundColor: '#e74c3c', color: '#fff', border: 'none', borderRadius: '20px', cursor: 'pointer' };

export default Navbar;
