import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CommentSection = ({ targetId, darkMode }) => {
    const [comments, setComments] = useState([]);
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);

    const user = localStorage.getItem('user');
    const role = localStorage.getItem('role');

    useEffect(() => {
        if (!targetId) return;
        axios.get(`process.env.REACT_APP_API_URL/api/comments/${targetId}`)
            .then(res => setComments(res.data))
            .catch(err => console.error('Comments fetch error:', err));
    }, [targetId]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!text.trim()) return;
        if (!user) return alert('კომენტარის დასაწერად გაიარეთ ავტორიზაცია');

        setLoading(true);
        try {
            const res = await axios.post(`process.env.REACT_APP_API_URL/api/comments`, {
                targetId,
                username: user,
                text: text.trim()
            });
            setComments(prev => [res.data, ...prev]);
            setText('');
        } catch (err) {
            alert(err.response?.data?.message || 'კომენტარის გაგზავნა ვერ მოხერხდა');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (commentId) => {
        if (!window.confirm('წაიშალოს კომენტარი?')) return;
        try {
            await axios.delete(`http://localhost:5000/api/comments/${targetId}/${commentId}`, {
                data: { role }
            });
            setComments(prev => prev.filter(c => c._id !== commentId));
        } catch (err) {
            alert(err.response?.data?.message || 'წაშლა ვერ მოხერხდა');
        }
    };

    const bg = darkMode ? '#1e1e1e' : '#fff';
    const inputBg = darkMode ? '#2a2a2a' : '#f9f9f9';
    const border = darkMode ? '#333' : '#e0e0e0';
    const textColor = darkMode ? '#ddd' : '#333';
    const subText = darkMode ? '#888' : '#999';

    return (
        <div style={{ marginTop: '50px', paddingTop: '30px', borderTop: `2px solid ${border}` }}>
            <h3 style={{ color: textColor, marginBottom: '20px', fontSize: '1.2rem' }}>
                💬 კომენტარები ({comments.length})
            </h3>

            {user && (
                <form onSubmit={handleSubmit} style={{ marginBottom: '30px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        placeholder="დაწერეთ კომენტარი..."
                        rows={3}
                        style={{
                            padding: '12px',
                            borderRadius: '10px',
                            border: `1px solid ${border}`,
                            backgroundColor: inputBg,
                            color: textColor,
                            fontSize: '0.95rem',
                            resize: 'vertical',
                            outline: 'none',
                            fontFamily: 'inherit'
                        }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            type="submit"
                            disabled={loading || !text.trim()}
                            style={{
                                padding: '10px 25px',
                                backgroundColor: loading ? '#888' : '#3498db',
                                color: '#fff',
                                border: 'none',
                                borderRadius: '20px',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontWeight: 'bold',
                                fontSize: '0.9rem'
                            }}
                        >
                            {loading ? '...' : 'გაგზავნა'}
                        </button>
                    </div>
                </form>
            )}

            {comments.length === 0 && (
                <p style={{ color: subText, textAlign: 'center', padding: '20px 0' }}>
                    კომენტარები არ არის. პირველი იყავი!
                </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {comments.map(comment => (
                    <div key={comment._id} style={{
                        backgroundColor: bg,
                        border: `1px solid ${border}`,
                        borderRadius: '12px',
                        padding: '16px',
                        display: 'flex',
                        gap: '14px',
                        alignItems: 'flex-start'
                    }}>
                        <img
                            src={comment.profilePicture || 'https://via.placeholder.com/40'}
                            alt={comment.username}
                            style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                <span style={{ fontWeight: 'bold', color: textColor, fontSize: '0.95rem' }}>
                                    {comment.nickname || comment.username}
                                </span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span style={{ fontSize: '0.78rem', color: subText }}>
                                        {new Date(comment.createdAt).toLocaleDateString('ka-GE')}
                                    </span>
                                    {role === 'admin' && (
                                        <button
                                            onClick={() => handleDelete(comment._id)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#e74c3c',
                                                cursor: 'pointer',
                                                fontSize: '0.85rem',
                                                padding: '2px 6px',
                                                borderRadius: '4px'
                                            }}
                                        >
                                            წაშლა
                                        </button>
                                    )}
                                </div>
                            </div>
                            <p style={{ margin: 0, color: textColor, lineHeight: '1.6', fontSize: '0.95rem', wordBreak: 'break-word' }}>
                                {comment.text}
                            </p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CommentSection;