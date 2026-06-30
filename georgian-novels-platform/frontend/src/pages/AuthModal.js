import React, { useState } from 'react';
import axios from 'axios';

const AuthModal = ({ onClose, onLoginSuccess }) => {
    const [isRegistering, setIsRegistering] = useState(false);
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        const endpoint = isRegistering ? 'register' : 'login';
        
        try {
            const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/${endpoint}`, { 
                username, 
                email: isRegistering ? email : undefined, 
                password 
            });
            if (isRegistering) {
                alert("რეგისტრაცია წარმატებულია!");
                setIsRegistering(false);
            } else {
                // res.data.user is the username string from our backend
                // res.data.role is the role string
                onLoginSuccess(res.data.user, res.data.role);
            }
        } catch (err) {
            setError(err.response?.data?.message || "შეცდომა მოხდა");
        }
    };

    return (
        <div style={modalOverlay}>
            <div style={modalContent}>
                <h2>{isRegistering ? 'რეგისტრაცია' : 'შესვლა'}</h2>
                {error && <p style={{ color: 'red', fontSize: '0.8rem' }}>{error}</p>}
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <input type="text" placeholder="მომხმარებელი" required value={username} onChange={(e) => setUsername(e.target.value)} style={inputStyle} />
                    {isRegistering && <input type="email" placeholder="ელ-ფოსტა" required value={email} onChange={(e) => setEmail(e.target.value)} style={inputStyle} />}
                    <input type="password" placeholder="პაროლი" required value={password} onChange={(e) => setPassword(e.target.value)} style={inputStyle} />
                    <button type="submit" style={btnStyle}>{isRegistering ? 'რეგისტრაცია' : 'შესვლა'}</button>
                </form>
                <p style={{ cursor: 'pointer', color: '#3498db', marginTop: '15px', fontSize: '0.9rem' }} onClick={() => setIsRegistering(!isRegistering)}>
                    {isRegistering ? 'შესვლაზე გადასვლა' : 'არ გაქვთ ანგარიში?'}
                </p>
                <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'gray', cursor: 'pointer', marginTop: '10px' }}>დახურვა</button>
            </div>
        </div>
    );
};

const modalOverlay = { position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 };
const modalContent = { backgroundColor: 'white', padding: '30px', borderRadius: '15px', textAlign: 'center', width: '320px' };
const inputStyle = { padding: '10px', borderRadius: '5px', border: '1px solid #ddd' };
const btnStyle = { padding: '10px', backgroundColor: '#2c3e50', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' };

export default AuthModal;
