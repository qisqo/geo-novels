import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CommentSection = ({ targetId, darkMode }) => {
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const user = localStorage.getItem('user');

    const fetchComments = () => {
        axios.get(`process.env.REACT_APP_API_URL/api/comments/${targetId}`)
            .then(res => setComments(res.data))
            .catch(err => console.log(err));
    };

    useEffect(() => {
        fetchComments();
    }, [targetId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return alert("კომენტარის დასაწერად გაიარეთ ავტორიზაცია");
        if (!newComment.trim()) return;

        try {
            await axios.post('process.env.REACT_APP_API_URL/api/comments', {
                targetId,
                username: user,
                text: newComment
            });
            setNewComment("");
            fetchComments();
        } catch (err) {
            alert("შეცდომა კომენტარის გაგზავნისას");
        }
    };

    return (
        <div style={{ marginTop: '40px', padding: '20px', borderTop: '1px solid #ddd', color: darkMode ? '#fff' : '#000' }}>
            <h3>💬 კომენტარები ({comments.length})</h3>
            
            {user ? (
                <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '30px' }}>
                    <input 
                        value={newComment} 
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder="დაწერე აზრი..." 
                        style={inputStyle(darkMode)}
                    />
                    <button type="submit" style={sendBtn}>გაგზავნა</button>
                </form>
            ) : <p style={{ opacity: 0.7 }}>კომენტარის დასატოვებლად შედით სისტემაში.</p>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {comments.length === 0 && <p style={{ opacity: 0.5 }}>ჯერ კომენტარები არ არის...</p>}
                {comments.map(c => (
                    <div key={c._id} style={commentCard(darkMode)}>
                        <img src={c.profilePicture || 'https://via.placeholder.com/150'} alt="Avatar" style={avatarStyle} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#3498db' }}>{c.nickname}</div>
                            <div style={{ marginTop: '5px', lineHeight: '1.4' }}>{c.text}</div>
                            <div style={{ fontSize: '0.7rem', opacity: 0.5, marginTop: '8px' }}>
                                {new Date(c.createdAt).toLocaleString('ka-GE')}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const inputStyle = (darkMode) => ({ flex: 1, padding: '12px 20px', borderRadius: '25px', border: '1px solid #ccc', outline: 'none', backgroundColor: darkMode ? '#333' : '#fff', color: darkMode ? '#fff' : '#000' });
const sendBtn = { padding: '10px 25px', background: '#3498db', color: '#fff', border: 'none', borderRadius: '25px', cursor: 'pointer', fontWeight: 'bold' };
const commentCard = (darkMode) => ({ display: 'flex', gap: '15px', padding: '15px', borderRadius: '15px', backgroundColor: darkMode ? '#333' : '#f9f9f9', border: darkMode ? '1px solid #444' : '1px solid #eee' });
const avatarStyle = { width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' };

export default CommentSection;
