import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Profile = ({ darkMode }) => {
    const [profile, setProfile] = useState({ nickname: '', profilePicture: '', email: '', username: '' });
    const [loading, setLoading] = useState(true);
    const currentUser = localStorage.getItem('user');

    useEffect(() => {
        if (currentUser) {
            axios.get(`process.env.REACT_APP_API_URL/api/users/profile/${currentUser}`)
                .then(res => {
                    setProfile(res.data);
                    setLoading(false);
                });
        }
    }, [currentUser]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        try {
            await axios.put(`process.env.REACT_APP_API_URL/api/users/profile/${currentUser}`, {
                nickname: profile.nickname,
                profilePicture: profile.profilePicture
            });
            alert("პროფილი წარმატებით განახლდა!");
            window.location.reload(); 
        } catch (err) {
            // თუ სერვერი დააბრუნებს 400 შეცდომას, ვაჩვენებთ ტექსტს
            if (err.response && err.response.status === 400) {
                alert(err.response.data.message);
            } else {
                alert("შეცდომა განახლებისას");
            }
        }
    };

    if (loading) return <div style={{ textAlign: 'center', padding: '50px' }}>იტვირთება...</div>;

    const inputStyle = { 
        padding: '10px', 
        borderRadius: '5px', 
        border: '1px solid #ccc', 
        backgroundColor: darkMode ? '#333' : '#fff', 
        color: darkMode ? '#fff' : '#000',
        outline: 'none'
    };

    return (
        <div style={{ maxWidth: '500px', margin: '50px auto', padding: '30px', borderRadius: '15px', border: '1px solid #ddd', backgroundColor: darkMode ? '#2a2a2a' : '#fff' }}>
            <h2 style={{ textAlign: 'center' }}>პირადი პროფილი</h2>
            
            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                <img 
                    src={profile.profilePicture || 'https://via.placeholder.com/150'} 
                    alt="Avatar" 
                    style={{ width: '120px', height: '120px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #3498db' }} 
                />
            </div>

            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                <label>მომხმარებელი: <b>{profile.username}</b></label>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label>მეტსახელი (Nickname):</label>
                    <input 
                        type="text" 
                        value={profile.nickname} 
                        onChange={(e) => setProfile({...profile, nickname: e.target.value})} 
                        style={inputStyle}
                        required
                    />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                    <label>პროფილის სურათის URL:</label>
                    <input 
                        type="text" 
                        value={profile.profilePicture} 
                        onChange={(e) => setProfile({...profile, profilePicture: e.target.value})} 
                        style={inputStyle}
                        placeholder="ჩასვით სურათის ლინკი"
                    />
                </div>

                <button type="submit" style={{ padding: '12px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '5px', cursor: 'pointer', fontWeight: 'bold' }}>
                    შენახვა და განახლება
                </button>
            </form>
        </div>
    );
};

export default Profile;
